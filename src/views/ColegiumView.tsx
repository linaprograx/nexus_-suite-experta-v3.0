import React from 'react';
import { doc, onSnapshot, Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { generateText } from '../services/ai/textService';
import { Recipe, PizarronTask, QuizQuestion, ColegiumResult, UserProfile } from '../../types';
import { addXP, calculateLevelInfo, XP_SOURCES } from '../services/progression/xpService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { GameModeSelector } from '../components/colegium/GameModeSelector';
import { QuizSetup } from '../components/colegium/QuizSetup';
import { QuizInProgress } from '../components/colegium/QuizInProgress';
import { QuizResult } from '../components/colegium/QuizResult';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import ColegiumProfileSidebar from '../components/colegium/ColegiumProfileSidebar';
import ColegiumContextSidebar from '../components/colegium/ColegiumContextSidebar';
import { ICONS } from '../components/ui/icons';
import { Icon } from '../components/ui/Icon';
import { AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { ChartContainer } from '../components/ui/ChartContainer';
import { useApp } from '../context/AppContext';
import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';
import { motion, AnimatePresence } from 'framer-motion';

interface ColegiumViewProps {
    // Props removed
}

const AcademyCard: React.FC<{
    title: string;
    subtitle: string;
    icon?: string;
    color?: string;
    bgClass?: string;
    textClass?: string;
    stats?: string;
    onClick: () => void;
    span?: string;
    delay?: number;
}> = React.memo(({ title, subtitle, icon, color = "text-indigo-600", bgClass = "bg-white", textClass = "text-slate-900", stats, onClick, span = "col-span-1", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "backOut" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${span} group relative overflow-hidden rounded-[24px] ${bgClass} border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full min-h-[180px]`}
    >
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-white/20 border border-white/20 backdrop-blur-sm ${bgClass === 'bg-white' ? 'bg-indigo-50 border-indigo-100' : ''} ${color}`}>
                    <Icon svg={icon} className="w-6 h-6" />
                </div>
                {stats && <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm ${bgClass === 'bg-white' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-black/20 text-white/90'}`}>{stats}</span>}
            </div>

            <div className="mt-6">
                <h4 className={`text-xl font-serif mb-2 leading-tight ${textClass === 'text-slate-900' && bgClass !== 'bg-white' ? 'text-white' : textClass}`}>{title}</h4>
                <p className={`text-xs font-medium leading-relaxed ${bgClass === 'bg-white' ? 'text-slate-500' : 'text-white/80'}`}>{subtitle}</p>
            </div>
        </div>
    </motion.div>
));

const ColegiumView: React.FC<ColegiumViewProps> = () => {
    const { db, userId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();

    const [quizPhase, setQuizPhase] = React.useState<'menu' | 'setup' | 'quiz' | 'result'>('menu');
    const [quizSettings, setQuizSettings] = React.useState({ topic: 'Fundamentos', difficulty: 'Normal', numQuestions: 5 });
    const [profile, setProfile] = React.useState<Partial<UserProfile>>({});
    const [quizData, setQuizData] = React.useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [answerFeedback, setAnswerFeedback] = React.useState<number | null>(null);
    const [timer, setTimer] = React.useState(30);

    // Fetch Profile
    React.useEffect(() => {
        if (!userId) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            }
        });
        return () => unsubscribe();
    }, [userId, db]);

    // Timer Logic
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (quizPhase === 'quiz' && (quizSettings.topic === 'Speed Run')) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setQuizPhase('result');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [quizPhase, quizSettings.topic]);

    const handleSaveResult = async () => {
        // 1. Calculate Base XP (Just for finishing? Or per correct answer?)
        // Let's say: (Score * CorrectAnswerBonus) + CompletionBonus
        let xpGained = (score * XP_SOURCES.CORRECT_ANSWER) + XP_SOURCES.QUIZ_COMPLETION;

        // 2. Apply Difficulty Multiplier
        const multiplier = XP_SOURCES.DIFFICULTY_MULTIPLIER[quizSettings.difficulty as keyof typeof XP_SOURCES.DIFFICULTY_MULTIPLIER] || 1;
        xpGained = Math.round(xpGained * multiplier);

        // 3. Perfect Score Bonus
        if (score === quizData.length) {
            xpGained += XP_SOURCES.PERFECT_SCORE_BONUS;
        }

        const resultData: Omit<ColegiumResult, 'id'> = {
            score,
            total: quizData.length,
            topic: quizSettings.topic,
            difficulty: quizSettings.difficulty,
            createdAt: serverTimestamp(),
            xpEarned: xpGained // Optional: Tracking specific run XP
        };

        // Parallel: Save Result & Add XP to Profile
        if (db) {
            await Promise.all([
                addDoc(collection(db, `users/${userId}/colegium-results`), resultData),
                addXP(db, userId, xpGained, `Quiz: ${quizSettings.topic} (${quizSettings.difficulty})`)
            ]);
        }
    };

    const handleStartQuiz = async (topicOverride?: string, difficultyOverride?: string) => {
        setLoading(true);
        setError(null);

        const topic = topicOverride || quizSettings.topic;
        const difficulty = difficultyOverride || quizSettings.difficulty;

        // Context Preparation
        let dataContext = "";
        if (topic === 'Recetas' || topic === 'Flavor Pairing') {
            dataContext = JSON.stringify(allRecipes.slice(0, 15).map(r => ({ nombre: r.nombre, categoria: r.categorias, ingredientes: r.ingredientes?.map(i => i.nombre) })));
        } else if (topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.slice(0, 15).map(t => ({ content: t.texto, category: t.category, status: t.status })));
        }

        const systemPrompt = "Eres un educador y maestro de coctelería de élite del Nexus. Tu misión es evaluar con precisión técnica. Reglas CRÍTICAS: 1. Cada pregunta debe tener UNA ÚNICA respuesta correcta indiscutible. 2. Las opciones incorrectas deben ser plausibles pero claramente falsas para un experto. 3. NUNCA uses placeholders como 'Opción A' o 'Respuesta B', todas las opciones deben ser texto real. 4. Tu respuesta debe ser estrictamente un array JSON válido.";
        let userQuery = "";

        // Game Mode Prompts
        switch (topic) {
            case 'Speed Run':
                userQuery = `Modo Speed Run. Genera ${quizSettings.numQuestions} preguntas de respuesta rápida sobre coctelería clásica (ej. medidas exactas, años de creación, licor base). Dificultad: ${difficulty}. Formato JSON: [{question, type='multiple-choice', options=[4 strings], correctAnswerIndex=int}].`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Modo Cata a Ciegas. Genera ${quizSettings.numQuestions} escenarios donde describes el perfil sensorial (aroma, gusto, apariencia) de un cóctel clásico SIN nombrarlo. El usuario debe adivinar el cóctel. Las opciones deben ser 4 nombres de cócteles reales.`;
                break;
            case 'Flavor Pairing':
                userQuery = `Modo Flavor Pairing. Contexto: ${dataContext}. Genera ${quizSettings.numQuestions} preguntas sobre química de sabor y maridaje. Ejemplo: "¿Qué hierba puentea mejor entre Gin y Pepino?". Opciones: 4 ingredientes reales. Evita la subjetividad.`;
                break;
            case 'Examen Final':
                userQuery = `Modo Examen Final (Hardcore). Genera ${quizSettings.numQuestions} preguntas complejas sobre historia de la coctelería, técnica molecular o proporciones clásicas avanzadas. NADA de preguntas básicas. Asegura que la respuesta correcta sea un dato técnico verificable.`;
                break;
            default: // Fundamentos, Recetas
                userQuery = `Quiz sobre: ${topic}. Contexto opcional: ${dataContext}. Genera ${quizSettings.numQuestions} preguntas de dificultad ${difficulty}. Asegura que haya UNA sola respuesta correcta clara.`;
                break;
        }

        try {
            // Updated to use Secure AI Gateway
            // Note: Schema validation is currently prompt-based in the simple gateway client
            const response = await generateText(userQuery, systemPrompt);

            // formatting cleanup in case the model adds markdown code blocks
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log("Raw AI Response:", cleanText); // Debugging

            let parsedData = JSON.parse(cleanText);

            // Handle Object Envelope (e.g. { "questions": [...] })
            // Strategy: Find the first array value in the object
            if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
                const possibleKeys = ['questions', 'preguntas', 'quiz', 'data', 'items'];
                const foundKey = possibleKeys.find(k => Array.isArray(parsedData[k]));

                if (foundKey) {
                    parsedData = parsedData[foundKey];
                } else {
                    // Deep search: find ANY array value
                    const arrayValue = Object.values(parsedData).find(val => Array.isArray(val));
                    if (arrayValue) parsedData = arrayValue;
                }
            }

            // Validate and Sanitize Data
            if (!Array.isArray(parsedData)) {
                console.error("Invalid Data Structure:", parsedData);
                throw new Error("La respuesta no tiene el formato correcto (Array esperado).");
            }

            parsedData = parsedData.map((q: any) => {
                // 1. Normalize Keys (Handle Case Sensitivity)
                const questionText = q.question || q.Question || q.pregunta || "Pregunta sin texto";
                const rawOptions = q.options || q.Options || q.opciones || ["Opción A", "Opción B", "Opción C", "Opción D"];
                let correctIndex = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex :
                    typeof q.correctIndex === 'number' ? q.correctIndex : 0;

                // 2. Randomize Options
                // Create an array of objects { text, isCorrect }
                const optionsWithcorrect = rawOptions.map((opt: string, idx: number) => ({
                    text: opt,
                    isCorrect: idx === correctIndex
                }));

                // Shuffle
                for (let i = optionsWithcorrect.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [optionsWithcorrect[i], optionsWithcorrect[j]] = [optionsWithcorrect[j], optionsWithcorrect[i]];
                }

                // Reconstruct
                const shuffledOptions = optionsWithcorrect.map((o: any) => o.text);
                const newCorrectIndex = optionsWithcorrect.findIndex((o: any) => o.isCorrect);

                return {
                    question: questionText,
                    options: shuffledOptions,
                    correctAnswerIndex: newCorrectIndex,
                    type: q.type || 'multiple-choice'
                };
            });

            setQuizData(parsedData);
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimer(30);
            setQuizSettings(prev => ({ ...prev, topic, difficulty }));
            setQuizPhase('quiz');
        } catch (e: any) {
            console.error("Quiz generation error:", e);
            setError(e.message || 'Error generando el quiz. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (answerFeedback !== null) return;

        if (selectedIndex === quizData[currentQuestionIndex].correctAnswerIndex) {
            setScore(s => s + 1);
        }
        setAnswerFeedback(selectedIndex);

        setTimeout(() => {
            setAnswerFeedback(null);
            if (currentQuestionIndex < quizData.length - 1) {
                setCurrentQuestionIndex(i => i + 1);
            } else {
                setQuizPhase('result');
                handleSaveResult();
            }
        }, 1200);
    };

    // Academy Menu Content - Memoized to prevent re-renders (Flickering Fix)
    const academyDashboard = React.useMemo(() => {
        // Calculate Real Level Info
        const levelInfo = calculateLevelInfo(profile.experience || 0);

        return (
            <div className="h-full relative overflow-hidden bg-transparent">

                <div className="relative z-10 h-full overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* Header */}
                        <div className="flex items-end justify-between border-b border-white/10 pb-8">
                            <div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Nexus Colegium</p>
                                <h2 className="text-6xl font-serif text-white tracking-wide drop-shadow-lg">Academia</h2>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-sm text-indigo-100">Sesión de Entrenamiento</p>
                                <p className="text-xs text-indigo-200/60 font-mono mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Stats Card - Dark Indigo/Slate (Restored Style) */}
                            <div className="lg:col-span-2 rounded-[32px] p-8 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-indigo-500/25 transition-colors duration-700" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                            <Icon svg={ICONS.trendingUp} className="w-5 h-5 text-indigo-300" />
                                        </div>
                                        <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Nivel de Dominio</span>
                                    </div>

                                    <div className="mt-8 flex items-end justify-between">
                                        <div className="flex-1 mr-8">
                                            <div className="text-7xl font-serif text-white mb-2">{levelInfo.level}</div>
                                            <div className="inline-flex flex-col gap-2 w-full max-w-[200px]">
                                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    <span>Progreso</span>
                                                    <span>{Math.round(levelInfo.progress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${levelInfo.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-500 text-right mt-1">
                                                    {Math.round(levelInfo.nextLevelXP - levelInfo.currentXP)} XP para sig. nivel
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-48 h-24 opacity-60 min-h-[96px] min-w-[192px]">
                                            <ChartContainer height="100%" minHeight="50px">
                                                <AreaChart data={[{ v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 55 }, { v: 80 }, { v: 75 }]}>
                                                    <defs>
                                                        <linearGradient id="chartDesktop" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={2} fill="url(#chartDesktop)" />
                                                </AreaChart>
                                            </ChartContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Start Cards */}
                            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                                <AcademyCard
                                    title="Fundamentos"
                                    subtitle="Quiz Clásico"
                                    icon={ICONS.book}
                                    color="text-indigo-600"
                                    bgClass="bg-white"
                                    textClass="text-slate-900"
                                    stats="5/5"
                                    onClick={() => { setQuizSettings({ topic: 'Fundamentos', difficulty: 'Normal', numQuestions: 5 }); setQuizPhase('setup'); }}
                                />
                                <AcademyCard
                                    title="Speed Run"
                                    subtitle="30 Segundos"
                                    icon={ICONS.clock}
                                    color="text-white"
                                    bgClass="bg-emerald-500"
                                    textClass="text-white"
                                    delay={0.1}
                                    onClick={() => handleStartQuiz('Speed Run', 'Normal')}
                                />
                            </div>
                        </div>

                        {/* Specialized Tracks */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Especialización</span>
                                <span className="h-px flex-1 bg-slate-300" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AcademyCard
                                    title="Cata Ciega"
                                    subtitle="Entrenamiento Sensorial"
                                    icon={ICONS.eye}
                                    color="text-white"
                                    bgClass="bg-red-300" // Mobile match
                                    textClass="text-white"
                                    delay={0.2}
                                    onClick={() => handleStartQuiz('Cata a Ciegas', 'Normal')}
                                />
                                <AcademyCard
                                    title="Alquimia"
                                    subtitle="Flavor Pairing"
                                    icon={ICONS.wand}
                                    color="text-white"
                                    bgClass="bg-slate-400" // Mobile match
                                    textClass="text-white"
                                    delay={0.3}
                                    onClick={() => handleStartQuiz('Flavor Pairing', 'Difícil')}
                                />
                                <AcademyCard
                                    title="Examen Final"
                                    subtitle="Certificación"
                                    icon={ICONS.star}
                                    color="text-white"
                                    bgClass="bg-red-500" // Mobile match (Rojo)
                                    textClass="text-white"
                                    delay={0.4}
                                    onClick={() => handleStartQuiz('Examen Final', 'Experto')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [profile.experience]); // Re-render only when XP changes

    return (
        <PremiumLayout
            gradientTheme="colegium"
            layoutMode="colegium"
            leftSidebar={
                <ColegiumProfileSidebar
                    level="Mixólogo Senior"
                    totalScore={1250}
                    gamesPlayed={42}
                    userName={profile.displayName || 'Usuario Nexus'}
                    userPhoto={profile.photoURL}
                />
            }
            mainContent={
                <div className="premium-panel relative h-full overflow-hidden bg-transparent font-sans text-white">
                    {/* Desktop Atmosphere - Handled by PremiumLayout global gradient */}
                    {loading && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                            <div className="w-16 h-16 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4" />
                            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest animate-pulse">Sincronizando Nexus</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                            <div className="bg-rose-950/90 border border-rose-500/30 p-8 rounded-3xl text-center max-w-md shadow-2xl">
                                <p className="text-rose-200 mb-6">{error}</p>
                                <button onClick={() => setError(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Cerrar</button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={quizPhase}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full"
                            >
                                {quizPhase === 'menu' && academyDashboard}
                                {quizPhase === 'setup' && (
                                    <QuizSetup
                                        quizSettings={quizSettings}
                                        setQuizSettings={setQuizSettings}
                                        handleStartQuiz={() => handleStartQuiz()}
                                        onBack={() => setQuizPhase('menu')}
                                    />
                                )}
                                {quizPhase === 'quiz' && quizData.length > 0 && (
                                    <QuizInProgress
                                        quizData={quizData}
                                        currentQuestionIndex={currentQuestionIndex}
                                        quizSettings={quizSettings}
                                        timer={timer}
                                        answerFeedback={answerFeedback}
                                        handleAnswer={handleAnswer}
                                    />
                                )}
                                {quizPhase === 'result' && (
                                    <QuizResult
                                        score={score}
                                        total={quizData.length}
                                        onBack={() => setQuizPhase('menu')}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            }
        />
    );
};

export default ColegiumView;

import React, { useState, useEffect } from 'react';
import { PageName } from '../types';
import { QuizQuestion, ColegiumResult, Recipe, PizarronTask } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { useRecipes } from '../../../hooks/useRecipes';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { generateText } from '../../../services/ai/textService';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ICONS } from '../../../components/ui/icons';
import { addXP, calculateLevelInfo, XP_SOURCES } from '../../../services/progression/xpService';

interface Props {
    onNavigate: (page: PageName) => void;
}

const Icon: React.FC<{ svg: string | undefined; className?: string }> = ({ svg, className = "w-6 h-6" }) => {
    if (!svg) return null;
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

const AcademyCard: React.FC<{
    title: string;
    subtitle: string;
    icon?: string;
    color?: string; // Icon bg color
    bgClass?: string; // Card background
    textClass?: string; // Text color override
    stats?: string;
    onClick: () => void;
    span?: string;
    delay?: number;
}> = ({ title, subtitle, icon, color = "text-indigo-600", bgClass = "bg-white", textClass = "text-slate-900", stats, onClick, span = "col-span-1", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "backOut" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${span} group relative overflow-hidden rounded-[24px] ${bgClass} border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer`}
    >
        {/* Subtle Hover Gradient/Sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 p-5 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl bg-white/20 border border-white/20 backdrop-blur-sm ${bgClass === 'bg-white' ? 'bg-indigo-50 border-indigo-100' : ''} ${color}`}>
                    <Icon svg={icon} className="w-5 h-5" />
                </div>
                {stats && <span className={`text-[9px] font-bold px-2 py-1 rounded-full border border-white/20 backdrop-blur-sm ${bgClass === 'bg-white' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-black/20 text-white/90'}`}>{stats}</span>}
            </div>

            <div className="mt-4">
                <h4 className={`text-lg font-serif mb-1 leading-tight ${textClass === 'text-slate-900' && bgClass !== 'bg-white' ? 'text-white' : textClass}`}>{title}</h4>
                <p className={`text-[11px] font-medium leading-relaxed ${bgClass === 'bg-white' ? 'text-slate-500' : 'text-white/80'}`}>{subtitle}</p>
            </div>
        </div>
    </motion.div>
);

const Colegium: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();
    const [userProfile, setUserProfile] = useState<any>({});

    useEffect(() => {
        if (db && userId) {
            const unsub = onSnapshot(doc(db, `users/${userId}/profile`, 'main'), (snap) => {
                if (snap.exists()) setUserProfile(snap.data());
            });
            return () => unsub();
        }
    }, [db, userId]);

    // Calculate Level Info
    const levelInfo = calculateLevelInfo(userProfile.experience || 0);

    const [phase, setPhase] = useState<'menu' | 'setup' | 'quiz' | 'result'>('menu');
    const [settings, setSettings] = useState({ topic: 'Quiz Clásico', difficulty: 'Normal', numQuestions: 5 });
    const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<number | null>(null);
    const [timer, setTimer] = useState(30);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (phase === 'quiz' && (settings.topic === 'Speed Run')) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setPhase('result');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [phase, settings.topic]);

    const handleStartQuiz = async (topicOverride?: string, difficultyOverride?: string) => {
        setLoading(true);
        setError(null);
        const topic = topicOverride || settings.topic;
        const difficulty = difficultyOverride || settings.difficulty;

        let dataContext = "";
        if (topic === 'Recetas' || topic === 'Flavor Pairing') {
            dataContext = JSON.stringify(allRecipes.slice(0, 10).map(r => ({ nombre: r.nombre, ingredientes: r.ingredientes?.map((i: any) => i.nombre) })));
        } else if (topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.slice(0, 10).map(t => ({ content: t.texto || t.content, status: t.status })));
        }

        const systemPrompt = "Eres un educador y maestro de coctelería de élite del Nexus. Reglas CRÍTICAS: 1. Cada pregunta debe tener UNA ÚNICA respuesta correcta indiscutible. 2. NUNCA uses placeholders como 'Opción A'. 3. Tu respuesta debe ser estrictamente un array JSON válido.";
        let userQuery = "";

        switch (topic) {
            case 'Speed Run':
                userQuery = `Modo Speed Run. Genera 5 preguntas de respuesta rápida sobre coctelería clásica (medidas, años, creadores). Dificultad: ${difficulty}. Formato JSON: [{question, type='multiple-choice', options=[4 strings], correctAnswerIndex=int}].`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Modo Cata a Ciegas. Genera 5 escenarios donde describes el perfil sensorial de un cóctel clásico SIN nombrarlo. Opciones: 4 nombres de cócteles reales.`;
                break;
            case 'Flavor Pairing':
                userQuery = `Modo Flavor Pairing. Contexto: ${dataContext}. Genera 5 preguntas sobre maridaje molecular. Ejemplo: "¿Qué combina con X?". Opciones: 4 ingredientes reales.`;
                break;
            case 'Examen Final':
                userQuery = `Modo Examen Final. Genera ${settings.numQuestions} preguntas complejas de alto nivel técnico. Asegura que la respuesta correcta sea un dato verificable.`;
                break;
            default:
                userQuery = `Quiz sobre: ${topic}. Contexto: ${dataContext}. Genera ${settings.numQuestions} preguntas de dificultad ${difficulty}. Asegura que haya UNA sola respuesta correcta clara.`;
                break;
        }

        try {
            const response = await generateText(userQuery, systemPrompt);
            // formatting cleanup
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            console.log("Mobile AI Response:", cleanText);

            let parsedData = JSON.parse(cleanText);

            // Handle Object Envelope (Deep Search)
            if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
                const possibleKeys = ['questions', 'preguntas', 'quiz', 'data', 'items'];
                const foundKey = possibleKeys.find(k => Array.isArray(parsedData[k]));

                if (foundKey) {
                    parsedData = parsedData[foundKey];
                } else {
                    const arrayValue = Object.values(parsedData).find(val => Array.isArray(val));
                    if (arrayValue) parsedData = arrayValue;
                }
            }

            if (!Array.isArray(parsedData)) {
                throw new Error("Formato inválido. Se esperaba un array.");
            }

            parsedData = parsedData.map((q: any) => {
                // 1. Normalize Keys
                const questionText = q.question || q.Question || q.pregunta || "Pregunta sin texto";
                const rawOptions = q.options || q.Options || q.opciones || ["A", "B", "C", "D"];
                let correctIndex = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex :
                    typeof q.correctIndex === 'number' ? q.correctIndex : 0;

                // 2. Randomize Options
                const optionsWithcorrect = rawOptions.map((opt: string, idx: number) => ({
                    text: opt,
                    isCorrect: idx === correctIndex
                }));

                // Fisher-Yates Shuffle
                for (let i = optionsWithcorrect.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [optionsWithcorrect[i], optionsWithcorrect[j]] = [optionsWithcorrect[j], optionsWithcorrect[i]];
                }

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
            setCurrentIndex(0);
            setScore(0);
            setTimer(30);
            setPhase('quiz');
        } catch (err: any) {
            console.error("Mobile Quiz Error:", err);
            setError(err.message || 'Error al conectar con el Nexus Colegium.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (idx: number) => {
        if (feedback !== null) return;
        setFeedback(idx);

        let newScore = score;
        if (idx === quizData[currentIndex].correctAnswerIndex) {
            newScore = score + 1;
            setScore(newScore);
        }

        setTimeout(async () => {
            setFeedback(null);
            if (currentIndex < quizData.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                setPhase('result');
                if (db && userId) {
                    // XP Calculation Logic
                    let xpGained = (newScore * XP_SOURCES.CORRECT_ANSWER) + XP_SOURCES.QUIZ_COMPLETION;

                    // Difficulty Multiplier
                    const multiplier = XP_SOURCES.DIFFICULTY_MULTIPLIER[settings.difficulty as keyof typeof XP_SOURCES.DIFFICULTY_MULTIPLIER] || 1;
                    xpGained = Math.round(xpGained * multiplier);

                    // Perfect Score Bonus
                    if (newScore === quizData.length) {
                        xpGained += XP_SOURCES.PERFECT_SCORE_BONUS;
                    }

                    await Promise.all([
                        addDoc(collection(db, `users/${userId}/colegium-results`), {
                            score: newScore,
                            total: quizData.length,
                            topic: settings.topic,
                            difficulty: settings.difficulty,
                            createdAt: serverTimestamp(),
                            xpEarned: xpGained
                        }),
                        addXP(db, userId, xpGained, `Mobile Quiz: ${settings.topic}`)
                    ]);
                }
            }
        }, 1000);
    };

    return (
        <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col font-sans text-slate-900 h-full">
            {/* Header Gradient - Strong Royal Blue - Changed to ABSOLUTE to respect container width */}
            <div className="absolute top-0 left-0 w-full h-[42vh] bg-gradient-to-b from-blue-900 from-10% via-indigo-800 to-transparent pointer-events-none z-0" />

            {/* Decorative Blob - Changed to ABSOLUTE */}
            <div className="absolute top-[40%] right-0 w-64 h-64 bg-indigo-100/40 blur-[80px] rounded-full pointer-events-none z-0" />

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 pb-32 z-10 no-scrollbar">
                {/* Header - Moved inside Scroll View */}
                <header className="pt-10 pb-8 flex items-center justify-between z-10 transition-all">
                    <button onClick={() => {
                        if (phase === 'menu') onNavigate(PageName.Dashboard);
                        else setPhase('menu');
                    }} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 shadow-sm">
                        <span className="material-symbols-outlined text-xl">{phase === 'menu' ? 'arrow_back' : 'close'}</span>
                    </button>

                    <div className="text-center">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.25em] mb-2 drop-shadow-sm">Nexus Colegium</p>
                        <h1 className="text-3xl font-serif text-white tracking-wide drop-shadow-lg">
                            {phase === 'menu' ? 'Academia' : settings.topic}
                        </h1>
                    </div>

                    <div className="w-12 h-12 flex items-center justify-center">
                        {phase === 'quiz' && settings.topic === 'Speed Run' && (
                            <span className="text-white font-mono font-bold text-xl animate-pulse drop-shadow-md">{timer}</span>
                        )}
                    </div>
                </header>
                <AnimatePresence mode="wait">
                    {phase === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            {/* Hero Stats Card - Kept Dark/Premium for Contrast on Light BG */}
                            <div className="w-full relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 shadow-xl p-8 group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[60px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-indigo-500/25 transition-colors duration-700" />

                                <div className="relative z-10 flex justify-between items-end">
                                    <div className="flex-1 mr-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Nivel de Dominio</p>
                                        </div>
                                        <h3 className="text-5xl font-serif text-white mb-4">{levelInfo.level}</h3>

                                        {/* Progress Bar */}
                                        <div className="w-full max-w-[160px] space-y-2">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Progreso</span>
                                                <span>{Math.round(levelInfo.progress)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                    style={{ width: `${levelInfo.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-slate-500 text-right">
                                                {Math.round(levelInfo.nextLevelXP - levelInfo.currentXP)} XP restantes
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-24 h-16 opacity-60">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[{ v: 30 }, { v: 40 }, { v: 35 }, { v: 50 }, { v: 70 }, { v: 65 }, { v: 80 }]}>
                                                <defs>
                                                    <linearGradient id="chartStat" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={2} fill="url(#chartStat)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            {/* Section Title */}
                            <div className="flex items-center gap-3 pl-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pistas de Entrenamiento</span>
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>

                            {/* Academy Grid - Specific Printed Colors */}
                            <div className="grid grid-cols-2 gap-5">
                                <AcademyCard
                                    title="Fundamentos"
                                    subtitle="Quiz Clásico"
                                    icon={ICONS.book}
                                    color="text-indigo-600"
                                    bgClass="bg-white"
                                    textClass="text-slate-900"
                                    stats="5/5"
                                    span="col-span-2"
                                    onClick={() => { setSettings({ topic: 'Fundamentos', difficulty: 'Normal', numQuestions: 5 }); setPhase('setup'); }}
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
                                <AcademyCard
                                    title="Cata Ciega"
                                    subtitle="Percepción"
                                    icon={ICONS.eye}
                                    color="text-white"
                                    bgClass="bg-red-300" // "Rosa salmon claro opaco" -> heavy pastel salmon/red
                                    textClass="text-white"
                                    delay={0.2}
                                    onClick={() => handleStartQuiz('Cata a Ciegas', 'Normal')}
                                />
                                <AcademyCard
                                    title="Alquimia"
                                    subtitle="Flavor Pairing"
                                    icon={ICONS.wand}
                                    color="text-white"
                                    bgClass="bg-slate-400" // "Gris claro" (but visible white text)
                                    textClass="text-white"
                                    span="col-span-2"
                                    delay={0.3}
                                    onClick={() => handleStartQuiz('Flavor Pairing', 'Difícil')}
                                />
                                <AcademyCard
                                    title="Examen Final"
                                    subtitle="Certificación XP x2"
                                    icon={ICONS.star}
                                    color="text-white"
                                    bgClass="bg-red-500" // "Rojo opaco"
                                    textClass="text-white"
                                    span="col-span-2"
                                    delay={0.4}
                                    onClick={() => handleStartQuiz('Examen Final', 'Experto')}
                                />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8 pt-4"
                        >
                            <div className="text-center space-y-3 mb-8">
                                <div className="w-24 h-24 rounded-full bg-white shadow-xl border border-indigo-100 mx-auto flex items-center justify-center mb-4 relative z-10">
                                    <Icon svg={ICONS.settings} className="w-10 h-10 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-serif text-slate-800">Configuración</h2>
                                <p className="text-xs text-slate-500 font-medium max-w-[200px] mx-auto">
                                    Ajusta los parámetros de tu simulación.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Difficulty Selector */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dificultad</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Normal', 'Difícil', 'Experto'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setSettings(s => ({ ...s, difficulty: level }))}
                                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all ${settings.difficulty === level
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Length Selector */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Longitud</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[5, 10, 15].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setSettings(s => ({ ...s, numQuestions: num }))}
                                                className={`py-3 rounded-xl text-[11px] font-bold transition-all border ${settings.numQuestions === num
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartQuiz()}
                                disabled={loading}
                                className="w-full py-5 mt-8 bg-indigo-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sincronizando...' : 'Iniciar Simulación'}
                                {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                            </button>
                        </motion.div>
                    )}

                    {phase === 'quiz' && quizData.length > 0 && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8 pt-4"
                        >
                            {/* Question Progress */}
                            <div className="flex items-end justify-between px-2 opacity-60">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pregunta {currentIndex + 1}</span>
                                <span className="text-[10px] font-bold text-slate-500">de {quizData.length}</span>
                            </div>

                            {/* Question Card */}
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20, rotate: 1 }}
                                animate={{ opacity: 1, x: 0, rotate: 0 }}
                                className="bg-white border border-slate-200 rounded-[32px] p-8 min-h-[220px] flex items-center justify-center text-center shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-[50px] rounded-full" />
                                <h3 className="text-xl font-serif text-slate-900 leading-relaxed relative z-10">
                                    {quizData[currentIndex].question}
                                </h3>
                            </motion.div>

                            {/* Options */}
                            <div className="space-y-3">
                                {quizData[currentIndex].options.map((opt: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={feedback !== null}
                                        className={`w-full p-5 rounded-2xl text-sm font-medium text-left transition-all border relative overflow-hidden shadow-sm ${feedback === null
                                            ? 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                            : i === quizData[currentIndex].correctAnswerIndex
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : feedback === i
                                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                    : 'bg-slate-50 border-transparent text-slate-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center relative z-10">
                                            <span>{opt}</span>
                                            {feedback !== null && i === quizData[currentIndex].correctAnswerIndex && (
                                                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pt-12 text-center flex flex-col items-center"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full" />
                                <div className="w-40 h-40 rounded-full border border-slate-100 bg-white flex flex-col items-center justify-center relative z-10 shadow-2xl">
                                    <span className="text-5xl font-serif text-slate-900 mb-1">{Math.round((score / quizData.length) * 100)}%</span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Precisión</span>
                                </div>
                            </div>

                            <h2 className="text-3xl font-serif text-slate-900 mb-2">Simulación Completa</h2>
                            <p className="text-sm text-slate-500 mb-8 max-w-[240px]">
                                Has demostrado un conocimiento sólido en esta materia.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aciertos</p>
                                    <p className="text-xl font-serif text-slate-900">{score} <span className="text-slate-400 text-sm">/ {quizData.length}</span></p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Ganado</p>
                                    <p className="text-xl font-serif text-emerald-500">+{score * 15}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setPhase('menu')}
                                className="w-full py-5 bg-indigo-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-xl"
                            >
                                Continuar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Grid Overlay */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-slate-50/90 backdrop-blur-xl flex flex-col items-center justify-center"
                        >
                            <div className="w-16 h-16 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest animate-pulse">Sincronizando Nexus</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="fixed bottom-6 left-6 right-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl z-50 text-center shadow-2xl"
                        >
                            <p className="text-xs text-rose-700 font-medium mb-3">{error}</p>
                            <button onClick={() => setPhase('menu')} className="text-[10px] font-black text-rose-800 uppercase tracking-widest underline decoration-rose-500">Reiniciar</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Colegium;

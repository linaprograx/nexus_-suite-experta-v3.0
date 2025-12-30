import React from 'react';
import { doc, onSnapshot, Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Type } from "@google/genai";
import { callGeminiApi } from '../utils/gemini';
import { Recipe, PizarronTask, QuizQuestion, ColegiumResult, UserProfile } from '../../types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { GameModeSelector } from '../components/colegium/GameModeSelector';
import { QuizSetup } from '../components/colegium/QuizSetup';
import { QuizInProgress } from '../components/colegium/QuizInProgress';
import { QuizResult } from '../components/colegium/QuizResult';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import ColegiumProfileSidebar from '../components/colegium/ColegiumProfileSidebar';
import ColegiumContextSidebar from '../components/colegium/ColegiumContextSidebar';
import { GameCard } from '../components/colegium/GameCard';
import { ICONS } from '../components/ui/icons';
import { Icon } from '../components/ui/Icon';
import { AreaChart, Area, XAxis, Tooltip } from 'recharts'; // For Stats Card
import { ChartContainer } from '../components/ui/ChartContainer';
import { useApp } from '../context/AppContext';
import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';

interface ColegiumViewProps {
    // Props removed
}

const ColegiumView: React.FC<ColegiumViewProps> = () => {
    const { db, userId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();

    // Phases: 'menu' (Bento Grid) -> 'selection' (Old selector, maybe skip?) -> 'setup' -> 'quiz' -> 'result'
    // Let's map Bento Cards directly to 'setup' or 'quiz' depending on game.
    const [quizPhase, setQuizPhase] = React.useState<'menu' | 'selection' | 'setup' | 'quiz' | 'result'>('menu');
    const [quizSettings, setQuizSettings] = React.useState({ topic: 'Quiz Clásico', difficulty: 'Normal', numQuestions: 5 });
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
        if (quizPhase === 'quiz' && (quizSettings.topic === 'Speed Round' || quizSettings.topic === 'Mixology Speed Run')) {
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
        const resultData: Omit<ColegiumResult, 'id'> = {
            score,
            total: quizData.length,
            topic: quizSettings.topic,
            difficulty: quizSettings.difficulty,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, `users/${userId}/colegium-results`), resultData);
    };

    const handleStartQuiz = async (topicOverride?: string, difficultyOverride?: string) => {
        setLoading(true);
        setError(null);

        const topic = topicOverride || quizSettings.topic;
        const difficulty = difficultyOverride || quizSettings.difficulty;

        // Context Preparation
        let dataContext = "";
        if (topic === 'Recetas' || topic === 'Flavor Pairing') {
            dataContext = JSON.stringify(allRecipes.map(r => ({ nombre: r.nombre, categoria: r.categorias, ingredientes: r.ingredientes?.map(i => i.nombre) })));
        } else if (topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.map(t => ({ content: t.texto, category: t.category, status: t.status })));
        }

        const systemPrompt = "Eres un educador y maestro de coctelería de élite. Tu respuesta debe ser estrictamente un array JSON válido.";
        let userQuery = "";

        // Game Mode Prompts
        switch (topic) {
            case 'Speed Round':
            case 'Mixology Speed Run':
                userQuery = `Modo Speed Run. Genera ${quizSettings.numQuestions} preguntas rápidas y directas sobre coctelería clásica. Dificultad: ${difficulty}. Formato JSON: [{question, type='multiple-choice', options=[4 strings], correctAnswerIndex=int}].`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Modo Cata a Ciegas. Genera ${quizSettings.numQuestions} preguntas donde describes el sabor, aroma y apariencia de un cóctel clásico SIN decir su nombre. Las opciones deben ser 4 nombres de cócteles. Formato JSON estándar.`;
                break;
            case 'Flavor Pairing':
                userQuery = `Modo Flavor Pairing. Contexto: ${dataContext}. Genera ${quizSettings.numQuestions} preguntas sobre maridaje o combinación de ingredientes. Ejemplo: "¿Qué ingrediente combina mejor con Ginebra y Pepino?". Opciones: 4 ingredientes. Formato JSON estándar.`;
                break;
            case 'Verdadero o Falso':
                userQuery = `Modo Verdadero/Falso. Genera ${quizSettings.numQuestions} afirmaciones sobre coctelería. Formato JSON: options=['Verdadero', 'Falso'], correctAnswerIndex=0 o 1.`;
                break;
            default: // Clásico, Recetas, Pizarrón
                userQuery = `Quiz sobre: ${topic}. Contexto opcional: ${dataContext}. Genera ${quizSettings.numQuestions} preguntas de dificultad ${difficulty}. Formato JSON estándar.`;
                break;
        }

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswerIndex: { type: Type.INTEGER },
                        type: { type: Type.STRING }
                    },
                }
            }
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            setQuizData(JSON.parse(response.text));
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimer(30);
            setQuizSettings(prev => ({ ...prev, topic, difficulty })); // Update state to match running game
            setQuizPhase('quiz');
        } catch (e: any) {
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

    // Bento Menu Component
    const BentoMenu = () => (
        <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-2">
                        Nexus Colegium
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Escoge tu desafío de hoy</p>
                </div>

                {/* Grid - Adjusted for better spacing: 3 Columns max */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[220px]">

                    {/* 1. Statistics / Progress (Tall Card - Left) - Anonymous Stats now */}
                    <div className="row-span-2 col-span-1 rounded-3xl p-6 bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 opacity-80">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Icon svg={ICONS.trendingUp} className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest">Tu Progreso</span>
                            </div>

                            <div className="mt-2 text-center">
                                <h3 className="text-lg font-bold opacity-90 mb-1">Nivel Actual</h3>
                                <div className="text-6xl font-bold mb-2 tracking-tighter">12</div>
                                <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold border border-white/30">
                                    Mixólogo Senior
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 w-full h-32 mt-6">
                            <ChartContainer>
                                <AreaChart data={[{ v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 55 }, { v: 80 }, { v: 75 }]}>
                                    <defs>
                                        <linearGradient id="chartG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={3} fill="url(#chartG)" />
                                </AreaChart>
                            </ChartContainer>
                            <p className="text-center text-xs opacity-60 mt-2">Actividad últimos 7 días</p>
                        </div>
                    </div>

                    {/* 2. Main Game (Wide - Top Right) */}
                    <div className="col-span-1 lg:col-span-2 row-span-1">
                        <GameCard
                            title="Quiz Clásico"
                            description="Modo estándar para subir de nivel. 5 Preguntas diarias."
                            icon={ICONS.book}
                            color="from-indigo-500 to-purple-500"
                            stats="Diario: 5/5"
                            onPlay={() => { setQuizSettings({ topic: 'Quiz Clásico', difficulty: 'Normal', numQuestions: 5 }); setQuizPhase('setup'); }}
                            delay={100}
                        />
                    </div>

                    {/* 3. Speed Run */}
                    <div className="col-span-1 row-span-1">
                        <GameCard
                            title="Speed Run"
                            description="30 segs. ¿Cuántas aciertas?"
                            icon={ICONS.clock}
                            color="from-rose-400 to-red-500"
                            onPlay={() => handleStartQuiz('Speed Round', 'Normal')}
                            delay={200}
                        />
                    </div>

                    {/* 4. Cata a Ciegas */}
                    <div className="col-span-1 row-span-1">
                        <GameCard
                            title="Cata a Ciegas"
                            description="Adivina el cóctel."
                            icon={ICONS.eye}
                            color="from-sky-400 to-blue-500"
                            onPlay={() => handleStartQuiz('Cata a Ciegas', 'Normal')}
                            delay={250}
                        />
                    </div>

                    {/* 5. Flavor Pairing (Wide Bottom) */}
                    <div className="col-span-1 lg:col-span-2 row-span-1">
                        <GameCard
                            title="Flavor Pairing"
                            description="Combina sabores y domina el arte del maridaje molecular."
                            icon={ICONS.wand}
                            color="from-emerald-400 to-teal-500"
                            onPlay={() => handleStartQuiz('Flavor Pairing', 'Difícil')}
                            delay={300}
                        />
                    </div>

                    {/* 6. Desafío (Small) */}
                    <div className="col-span-1 row-span-1">
                        <GameCard
                            title="Desafío Diario"
                            description="XP x2 Hoy."
                            icon={ICONS.star}
                            color="from-amber-400 to-orange-500"
                            onPlay={() => handleStartQuiz('Quiz Clásico', 'Difícil')}
                            delay={350}
                        />
                    </div>

                </div>
            </div>
        </div>
    );

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
            rightSidebar={
                <ColegiumContextSidebar
                    phase={quizPhase === 'menu' ? 'dashboard' : quizPhase}
                    timer={timer}
                    currentQuestion={currentQuestionIndex}
                    totalQuestions={quizData.length}
                    score={score}
                />
            }
            mainContent={
                <div className="h-full w-full relative">
                    {loading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <Spinner className="w-12 h-12 text-indigo-500" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                            <Alert variant="destructive" title="Error" description={error} className="w-full max-w-lg shadow-2xl" />
                            <button onClick={() => setError(null)} className="absolute top-4 right-4 text-slate-500">✕</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {quizPhase === 'menu' && <BentoMenu />}
                            {quizPhase === 'selection' && <GameModeSelector onSelectMode={(m) => { setQuizSettings(s => ({ ...s, topic: m })); setQuizPhase('setup'); }} />}
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
                        </>
                    )}
                </div>
            }
        />
    );
};

export default ColegiumView;

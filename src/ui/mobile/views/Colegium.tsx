import React, { useState, useEffect } from 'react';
import { PageName } from '../types';
import { QuizQuestion, ColegiumResult, Recipe, PizarronTask } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { useRecipes } from '../../../hooks/useRecipes';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ICONS } from '../../../components/ui/icons';

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

const BentoCard: React.FC<{
    title: string;
    description: string;
    icon?: string;
    color: string;
    stats?: string;
    onClick: () => void;
    span?: string;
    delay?: number;
}> = ({ title, description, icon, color, stats, onClick, span = "col-span-1", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${span} rounded-[2rem] p-6 relative overflow-hidden group cursor-pointer bg-slate-900/40 border border-white/5 shadow-xl`}
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>

        <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                    <Icon svg={icon} className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">{title}</h4>
                <p className="text-[10px] text-white/40 leading-tight line-clamp-2">{description}</p>
            </div>

            {stats && (
                <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-8 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${color} w-2/3`}></div>
                    </div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{stats}</span>
                </div>
            )}
        </div>
    </motion.div>
);

const Colegium: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { tasks: allPizarronTasks } = usePizarronData();

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

        const systemPrompt = "Eres un educador y maestro de coctelería de élite. Tu respuesta debe ser estrictamente un array JSON válido.";
        let userQuery = "";

        switch (topic) {
            case 'Speed Run':
                userQuery = `Modo Speed Run. Genera 5 preguntas rápidas y directas sobre coctelería clásica. Dificultad: ${difficulty}. Formato JSON: [{question, type='multiple-choice', options=[4 strings], correctAnswerIndex=int}].`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Modo Cata a Ciegas. Genera 5 preguntas donde describes el sabor, aroma y apariencia de un cóctel clásico SIN decir su nombre. Las opciones deben ser 4 nombres de cócteles. Formato JSON estándar.`;
                break;
            case 'Flavor Pairing':
                userQuery = `Modo Flavor Pairing. Contexto: ${dataContext}. Genera 5 preguntas sobre maridaje molecular de ingredientes. Formato JSON estándar.`;
                break;
            default:
                userQuery = `Quiz sobre: ${topic}. Contexto: ${dataContext}. Genera ${settings.numQuestions} preguntas de dificultad ${difficulty}. Formato JSON estándar.`;
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
                    required: ["question", "options", "correctAnswerIndex"]
                }
            }
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            setQuizData(JSON.parse(response.text));
            setCurrentIndex(0);
            setScore(0);
            setTimer(30);
            setPhase('quiz');
        } catch (err: any) {
            setError(err.message || 'Error al conectar con el Nexus Colegium.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (idx: number) => {
        if (feedback !== null) return;
        setFeedback(idx);
        if (idx === quizData[currentIndex].correctAnswerIndex) setScore(s => s + 1);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < quizData.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                setPhase('result');
                if (db && userId) {
                    addDoc(collection(db, `users/${userId}/colegium-results`), {
                        score,
                        total: quizData.length,
                        topic: settings.topic,
                        difficulty: settings.difficulty,
                        createdAt: serverTimestamp()
                    });
                }
            }
        }, 1000);
    };

    return (
        <div className="flex-1 bg-transparent relative overflow-hidden flex flex-col">
            {/* Immersive Background Header */}
            <div className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-600/20 to-transparent -z-10`}></div>

            <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10">
                <button onClick={() => {
                    if (phase === 'menu') onNavigate(PageName.Dashboard);
                    else setPhase('menu');
                }} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-lg">{phase === 'menu' ? 'arrow_back' : 'close'}</span>
                </button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-orange-600 uppercase tracking-[0.4em] mb-1">Nexus Colegium</p>
                    <h1 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
                        {phase === 'menu' ? 'Desafío de Dominio' : settings.topic}
                    </h1>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <span className="material-symbols-outlined text-lg">school</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 pb-32 z-10 no-scrollbar">
                <AnimatePresence mode="wait">
                    {phase === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Hero Card - Progress Stats */}
                            <div className="w-full bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Nivel Actual</p>
                                        <h3 className="text-4xl font-black text-white">12</h3>
                                        <div className="mt-2 text-[8px] font-black text-white/60 bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest inline-block border border-white/10">
                                            Mixólogo Senior
                                        </div>
                                    </div>
                                    <div className="w-20 h-20">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[{ v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 55 }]}>
                                                <Area type="monotone" dataKey="v" stroke="#fff" fill="rgba(255,255,255,0.1)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="relative z-10 h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 bg-white/60 rounded-full"></div>
                                </div>
                            </div>

                            {/* Bento Grid */}
                            <div className="grid grid-cols-2 gap-4 auto-rows-min">
                                <BentoCard
                                    title="Clásico"
                                    description="Pon a prueba tus fundamentos clásicos."
                                    icon={ICONS.book}
                                    color="from-blue-500 to-indigo-600"
                                    stats="Diario: 5/5"
                                    span="col-span-2"
                                    onClick={() => { setSettings({ topic: 'Quiz Clásico', difficulty: 'Normal', numQuestions: 5 }); setPhase('setup'); }}
                                />
                                <BentoCard
                                    title="Speed Run"
                                    description="30 segs. Acierta todas."
                                    icon={ICONS.clock}
                                    color="from-rose-500 to-red-600"
                                    delay={0.1}
                                    onClick={() => handleStartQuiz('Speed Run', 'Normal')}
                                />
                                <BentoCard
                                    title="Cata Ciega"
                                    description="Adivina por descripción."
                                    icon={ICONS.eye}
                                    color="from-cyan-500 to-blue-600"
                                    delay={0.2}
                                    onClick={() => handleStartQuiz('Cata a Ciegas', 'Normal')}
                                />
                                <BentoCard
                                    title="Flavor pairing"
                                    description="Domina el maridaje molecular."
                                    icon={ICONS.wand}
                                    color="from-emerald-500 to-teal-600"
                                    span="col-span-2"
                                    delay={0.3}
                                    onClick={() => handleStartQuiz('Flavor Pairing', 'Difícil')}
                                />
                                <BentoCard
                                    title="Desafío"
                                    description="Reto de alto impacto XP x2."
                                    icon={ICONS.star}
                                    color="from-amber-500 to-orange-600"
                                    delay={0.4}
                                    onClick={() => handleStartQuiz('Desafío Diario', 'Difícil')}
                                />
                                <BentoCard
                                    title="Análisis"
                                    description="Tendencias gráficas."
                                    icon={ICONS.trendingUp}
                                    color="from-fuchsia-500 to-purple-600"
                                    delay={0.5}
                                    onClick={() => handleStartQuiz('Análisis de Tendencias', 'Experto')}
                                />
                            </div>
                        </motion.div>
                    )}

                    {phase === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8 pt-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-20 h-20 bg-orange-600/20 rounded-3xl flex items-center justify-center text-orange-400 mx-auto mb-6 shadow-glow border border-orange-500/20">
                                    <span className="material-symbols-outlined text-4xl">tune</span>
                                </div>
                                <h3 className="text-2xl font-black text-white">Configurar Desafío</h3>
                                <p className="text-sm text-slate-900 font-bold">Personaliza tu sesión de entrenamiento</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest pl-2">Dificultad</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Normal', 'Avanzado', 'Crítico'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setSettings(s => ({ ...s, difficulty: d }))}
                                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.difficulty === d ? 'bg-orange-600 text-white shadow-glow' : 'bg-white/60 text-slate-900 border border-black/5'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-2">Questions</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[5, 10, 15].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setSettings(s => ({ ...s, numQuestions: n }))}
                                                className={`py-4 rounded-2xl text-[10px] font-black transition-all ${settings.numQuestions === n ? 'bg-orange-600 text-white shadow-lg' : 'bg-white/60 text-slate-900 border border-black/5'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartQuiz()}
                                disabled={loading}
                                className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                            >
                                {loading ? 'Sincronizando Nexus...' : 'INICIAR TRANSMISIÓN'}
                            </button>
                        </motion.div>
                    )}

                    {phase === 'quiz' && quizData.length > 0 && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Quiz Header Stats */}
                            <div className="flex justify-between items-center px-2">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Progreso</p>
                                    <p className="text-xl font-black text-slate-950">{currentIndex + 1} <span className="text-black/30">/ {quizData.length}</span></p>
                                </div>
                                {settings.topic === 'Speed Run' && (
                                    <div className="w-14 h-14 rounded-full border-4 border-rose-500/20 flex items-center justify-center relative bg-white/40 backdrop-blur-md">
                                        <div className="absolute inset-0 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" style={{ animationDuration: `${timer}s` }}></div>
                                        <span className="text-xl font-black text-rose-600">{timer}</span>
                                    </div>
                                )}
                                <div className="text-right space-y-1">
                                    <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Aciertos</p>
                                    <p className="text-xl font-black text-emerald-600">{score}</p>
                                </div>
                            </div>

                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 min-h-[200px] flex items-center justify-center text-center shadow-2xl backdrop-blur-2xl"
                            >
                                <h3 className="text-xl font-black text-white leading-tight">{quizData[currentIndex].question}</h3>
                            </motion.div>

                            <div className="space-y-3">
                                {quizData[currentIndex].options.map((opt: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={feedback !== null}
                                        className={`w-full p-6 rounded-3xl text-sm font-black text-left transition-all border ${feedback === null
                                            ? 'bg-white/90 border-white text-slate-900 shadow-xl'
                                            : i === quizData[currentIndex].correctAnswerIndex
                                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-glow-emerald'
                                                : feedback === i
                                                    ? 'bg-rose-500 border-rose-400 text-white'
                                                    : 'bg-white/30 border-white/10 text-slate-950/40'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center text-slate-950">
                                            <span className={feedback === null ? 'text-slate-950' : (i === quizData[currentIndex].correctAnswerIndex || feedback === i ? 'text-white' : 'text-slate-950/40')}>{opt}</span>
                                            {feedback !== null && i === quizData[currentIndex].correctAnswerIndex && (
                                                <span className="material-symbols-outlined text-sm text-white">check_circle</span>
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
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="pt-10 text-center space-y-10"
                        >
                            <div className="relative inline-block">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl shadow-glow-emerald"
                                ></motion.div>
                                <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center text-white text-5xl font-black relative z-10 mx-auto border-8 border-emerald-400/20 shadow-2xl">
                                    {Math.round((score / quizData.length) * 100)}%
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Misión Completada</h3>
                                <p className="text-sm text-slate-900 font-bold">Has desbloqueado <span className="text-emerald-600">+{score * 10} XP</span> para tu avatar.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 px-4">
                                <div className="bg-white/80 rounded-3xl p-6 border border-white shadow-lg">
                                    <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-1">Aciertos</p>
                                    <p className="text-2xl font-black text-slate-950">{score} / {quizData.length}</p>
                                </div>
                                <div className="bg-white/80 rounded-3xl p-6 border border-white shadow-lg">
                                    <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-1">Precisión</p>
                                    <p className="text-2xl font-black text-slate-950">{Math.round((score / quizData.length) * 100)}%</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setPhase('menu')}
                                className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-glow"
                            >
                                CONTINUAR ENTRENAMIENTO
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading && (
                    <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-center animate-pulse">
                            <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Sincronizando Nexus</p>
                            <p className="text-[10px] text-slate-900 font-bold mt-1">Generando desafíos dinámicos...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-6 text-center space-y-4">
                        <p className="text-sm text-rose-600 font-black">{error}</p>
                        <button onClick={() => setPhase('menu')} className="text-xs font-black text-slate-900 uppercase tracking-widest underline underline-offset-4">Volver al Menú</button>
                    </div>
                )}
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .shadow-glow { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
                .shadow-glow-emerald { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
            `}</style>
        </div>
    );
};

export default Colegium;

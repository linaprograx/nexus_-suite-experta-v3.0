import React from 'react';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { generateText } from '../services/ai/textService';
import { QuizQuestion, ColegiumResult, UserProfile } from '../types';
import { addXP, calculateLevelInfo, XP_SOURCES } from '../services/progression/xpService';
import { useColegiumStats, getRankTitle, getProgressiveDifficulty } from '../hooks/useColegiumStats';
import { getFallbackQuiz } from '../data/colegiumQuestionBank';
import { playSound, isSoundMuted, setSoundMuted } from '../utils/feedbackFx';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { QuizSetup } from '../components/colegium/QuizSetup';
import { QuizInProgress } from '../components/colegium/QuizInProgress';
import { QuizResult } from '../components/colegium/QuizResult';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import ColegiumProfileSidebar from '../components/colegium/ColegiumProfileSidebar';
import { ICONS } from '../components/ui/icons';
import { Icon } from '../components/ui/Icon';
import { AreaChart, Area, Tooltip } from 'recharts';
import { ChartContainer } from '../components/ui/ChartContainer';
import { useApp } from '../context/AppContext';
import { useRecipes } from '../hooks/useRecipes';
import { usePizarronData } from '../hooks/usePizarronData';
import { motion, AnimatePresence } from 'framer-motion';

interface ColegiumViewProps {
    // Props removed
}

interface Certification {
    id: string;
    title: string;
    tier: 'merito' | 'honor';
    score: number;
    total: number;
    date: number;
    level: number;
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
                    <Icon svg={icon || ''} className="w-6 h-6" />
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
    const stats = useColegiumStats(db, userId);

    const [quizPhase, setQuizPhase] = React.useState<'menu' | 'setup' | 'quiz' | 'result'>('menu');
    const [quizSettings, setQuizSettings] = React.useState({ topic: 'Fundamentos', difficulty: 'Normal', numQuestions: 5 });
    const [profile, setProfile] = React.useState<Partial<UserProfile>>({});
    const currentLevel = calculateLevelInfo(profile.experience || 0).level;
    const [quizData, setQuizData] = React.useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [answerFeedback, setAnswerFeedback] = React.useState<number | null>(null);
    const [timer, setTimer] = React.useState(30);
    // Real XP/level tracking for the result screen
    const [lastResult, setLastResult] = React.useState<{ xpEarned: number; leveledUp: boolean; newLevel: number }>({ xpEarned: 0, leveledUp: false, newLevel: 1 });
    // Learning loop: saved wrong answers for spaced review
    const [missedBank, setMissedBank] = React.useState<QuizQuestion[]>([]);
    const [isReviewMode, setIsReviewMode] = React.useState(false);
    const [offlineNotice, setOfflineNotice] = React.useState(false); // shown when AI gateway is down & we used the local bank
    const missedThisRun = React.useRef<QuizQuestion[]>([]);   // wrong answers collected this run
    const masteredThisRun = React.useRef<string[]>([]);        // review questions answered right (to remove from bank)
    const [soundMuted, setSoundMutedState] = React.useState(isSoundMuted());
    // Certifications earned by passing the Examen Final
    const [certifications, setCertifications] = React.useState<Certification[]>([]);
    const [newCertEarned, setNewCertEarned] = React.useState<Certification | null>(null);

    // Fetch Profile
    React.useEffect(() => {
        if (!userId || !db) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            }
        });
        return () => unsubscribe();
    }, [userId, db]);

    // Load the user's "missed questions" bank for review mode
    React.useEffect(() => {
        if (!userId || !db) return;
        const ref = doc(db, `users/${userId}/colegium-meta`, 'missed');
        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.data();
            setMissedBank(Array.isArray(data?.questions) ? data!.questions : []);
        });
        return () => unsub();
    }, [userId, db]);

    // Load earned certifications
    React.useEffect(() => {
        if (!userId || !db) return;
        const ref = doc(db, `users/${userId}/colegium-meta`, 'certifications');
        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.data();
            setCertifications(Array.isArray(data?.list) ? data!.list : []);
        });
        return () => unsub();
    }, [userId, db]);

    const isSpeedRun = quizSettings.topic === 'Speed Run';

    // Per-question countdown for Speed Run. On timeout, mark as wrong & advance.
    React.useEffect(() => {
        if (quizPhase !== 'quiz' || !isSpeedRun || answerFeedback !== null) return;
        if (timer <= 0) {
            // Time's up for this question — counts as missed
            if (!isReviewMode) missedThisRun.current.push(quizData[currentQuestionIndex]);
            setAnswerFeedback(-1); // -1 = timed out, nothing selected
            setTimeout(() => {
                setAnswerFeedback(null);
                if (currentQuestionIndex < quizData.length - 1) {
                    setCurrentQuestionIndex(i => i + 1);
                    setTimer(15);
                } else {
                    setQuizPhase('result');
                    handleSaveResult();
                }
            }, 1200);
            return;
        }
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [quizPhase, isSpeedRun, timer, answerFeedback, currentQuestionIndex, quizData.length]);

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

        // 4. Streak bonus — rewards consistency (capped)
        if (stats.currentStreak > 0) {
            xpGained += Math.min(stats.currentStreak * XP_SOURCES.STREAK_BONUS_PER_DAY, XP_SOURCES.STREAK_BONUS_CAP);
        }

        const resultData: Omit<ColegiumResult, 'id'> = {
            score,
            total: quizData.length,
            topic: quizSettings.topic,
            difficulty: quizSettings.difficulty,
            createdAt: serverTimestamp(),
            xpEarned: xpGained
        };

        // Detect level-up: compare level before & after the XP gain
        const prevXP = profile.experience || 0;
        const prevLevel = calculateLevelInfo(prevXP).level;
        const newInfo = calculateLevelInfo(prevXP + xpGained);
        setLastResult({
            xpEarned: xpGained,
            leveledUp: newInfo.level > prevLevel,
            newLevel: newInfo.level,
        });

        // Recompute the missed-questions bank:
        //  - remove questions the user just mastered (answered right in review)
        //  - add newly-missed questions (dedupe by question text)
        //  - cap to the 40 most recent
        const masteredSet = new Set(masteredThisRun.current);
        const dedupe = new Map<string, QuizQuestion>();
        for (const q of missedBank) {
            if (!masteredSet.has(q.question)) dedupe.set(q.question, q);
        }
        for (const q of missedThisRun.current) {
            dedupe.set(q.question, q); // newest version wins
        }
        const newBank = Array.from(dedupe.values()).slice(-40);

        // Certification: passing the Examen Final with ≥80% earns a credential
        let certToSave: Certification | null = null;
        const accuracyPct = quizData.length > 0 ? score / quizData.length : 0;
        if (quizSettings.topic === 'Examen Final' && accuracyPct >= 0.8) {
            const tier: Certification['tier'] = score === quizData.length ? 'honor' : 'merito';
            const alreadyHasTier = certifications.some(c => c.tier === tier);
            if (!alreadyHasTier) {
                certToSave = {
                    id: `${tier}-${Date.now()}`,
                    title: tier === 'honor' ? 'Certificación de Honor' : 'Certificado de Mérito',
                    tier,
                    score,
                    total: quizData.length,
                    date: Date.now(),
                    level: currentLevel,
                };
                setNewCertEarned(certToSave);
            }
        }

        // Parallel: Save Result, Add XP, Persist missed bank, Persist new cert
        if (db && userId) {
            const writes: Promise<any>[] = [
                addDoc(collection(db, `users/${userId}/colegium-results`), resultData),
                addXP(db, userId, xpGained, `Quiz: ${quizSettings.topic} (${quizSettings.difficulty})`),
                setDoc(doc(db, `users/${userId}/colegium-meta`, 'missed'), { questions: newBank, updatedAt: serverTimestamp() }),
            ];
            if (certToSave) {
                writes.push(setDoc(
                    doc(db, `users/${userId}/colegium-meta`, 'certifications'),
                    { list: [...certifications, certToSave], updatedAt: serverTimestamp() }
                ));
            }
            await Promise.all(writes);
        }

        // Reset run trackers
        missedThisRun.current = [];
        masteredThisRun.current = [];
    };

    // Review mode: replay the saved missed questions (no AI call, instant)
    const startReviewQuiz = () => {
        if (missedBank.length === 0) return;
        setError(null);
        setOfflineNotice(false);
        setNewCertEarned(null);
        missedThisRun.current = [];
        masteredThisRun.current = [];
        setIsReviewMode(true);
        // Shuffle a copy so order varies between sessions
        const shuffled = [...missedBank].sort(() => Math.random() - 0.5);
        setQuizData(shuffled);
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimer(30);
        setQuizSettings({ topic: 'Repaso de Errores', difficulty: 'Normal', numQuestions: shuffled.length });
        setQuizPhase('quiz');
    };

    const handleStartQuiz = async (topicOverride?: string, difficultyOverride?: string) => {
        setLoading(true);
        setError(null);
        setIsReviewMode(false);
        setNewCertEarned(null);
        missedThisRun.current = [];
        masteredThisRun.current = [];

        const topic = topicOverride || quizSettings.topic;
        const difficulty = difficultyOverride || quizSettings.difficulty;

        // Visual mode (glassware) is inherently image-based → always use the local
        // visual bank (the text AI can't render glassware SVGs).
        if (topic === 'Cristalería') {
            const visualQuiz = getFallbackQuiz('Cristalería', quizSettings.numQuestions);
            setOfflineNotice(false);
            setQuizData(visualQuiz);
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimer(30);
            setQuizSettings(prev => ({ ...prev, topic, difficulty }));
            setQuizPhase('quiz');
            setLoading(false);
            return;
        }

        // Context Preparation
        let dataContext = "";
        if (topic === 'Recetas' || topic === 'Flavor Pairing') {
            dataContext = JSON.stringify(allRecipes.slice(0, 15).map(r => ({ nombre: r.nombre, categoria: r.categorias, ingredientes: r.ingredientes?.map(i => i.nombre) })));
        } else if (topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.slice(0, 15).map(t => ({ content: t.texto, category: t.category, status: t.status })));
        }

        // Difficulty calibration tied to the player's progression
        const difficultyGuide: Record<string, string> = {
            'Fácil': 'Nivel principiante: conceptos básicos, cócteles muy conocidos, respuestas evidentes para cualquier aficionado.',
            'Normal': 'Nivel intermedio: requiere conocimiento sólido de recetas clásicas, técnicas y proporciones estándar.',
            'Difícil': 'Nivel avanzado: detalles técnicos finos, variaciones de clásicos, historia y química básica. Distractores muy plausibles.',
            'Experto': 'Nivel maestro/competición: datos técnicos verificables, mixología molecular, historia profunda y proporciones exactas. SIN preguntas básicas.',
        };
        const calibration = difficultyGuide[difficulty] || difficultyGuide['Normal'];
        const systemPrompt = `Eres un educador y maestro de coctelería de élite del Nexus. El alumno está en NIVEL ${currentLevel} y la dificultad solicitada es "${difficulty}". CALIBRACIÓN: ${calibration} Reglas CRÍTICAS: 1. Cada pregunta debe tener UNA ÚNICA respuesta correcta indiscutible. 2. Las opciones incorrectas deben ser plausibles pero claramente falsas para un experto. 3. NUNCA uses placeholders como 'Opción A' o 'Respuesta B', todas las opciones deben ser texto real. 4. CADA pregunta DEBE incluir un campo 'explanation' con una explicación breve (1-2 frases) y didáctica de por qué la respuesta correcta es correcta. 5. Ajusta la complejidad ESTRICTAMENTE al nivel de calibración indicado. 6. Tu respuesta debe ser estrictamente un array JSON válido con la forma [{question, options:[4 strings], correctAnswerIndex:int, explanation}].`;
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
                    type: q.type || 'multiple-choice',
                    explanation: q.explanation || q.Explanation || q.explicacion || q.rationale || ''
                };
            });

            if (parsedData.length === 0) throw new Error("Quiz vacío");

            setOfflineNotice(false);
            setQuizData(parsedData);
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimer(topic === 'Speed Run' ? 15 : 30);
            setQuizSettings(prev => ({ ...prev, topic, difficulty }));
            setQuizPhase('quiz');
        } catch (e: any) {
            console.warn("AI quiz generation failed — using offline question bank.", e?.message);
            // Graceful degradation: fall back to the curated local bank so the
            // academy is always playable, even with the AI gateway down.
            const fallback = getFallbackQuiz(topic, quizSettings.numQuestions);
            if (fallback.length > 0) {
                setOfflineNotice(true);
                setQuizData(fallback);
                setCurrentQuestionIndex(0);
                setScore(0);
                setTimer(topic === 'Speed Run' ? 15 : 30);
                setQuizSettings(prev => ({ ...prev, topic, difficulty }));
                setQuizPhase('quiz');
            } else {
                setError('No se pudo generar el quiz. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const goToNextQuestion = () => {
        setAnswerFeedback(null);
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            if (isSpeedRun) setTimer(15);
        } else {
            setQuizPhase('result');
            handleSaveResult();
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (answerFeedback !== null) return;

        const q = quizData[currentQuestionIndex];
        const isCorrect = selectedIndex === q.correctAnswerIndex;
        playSound(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) {
            setScore(s => s + 1);
            // In review mode, a correct answer means the question is mastered → remove from bank
            if (isReviewMode) masteredThisRun.current.push(q.question);
        } else {
            // Collect the missed question for later review (skip if already reviewing it)
            if (!isReviewMode) missedThisRun.current.push(q);
        }
        setAnswerFeedback(selectedIndex);

        // Speed Run: auto-advance fast. Normal modes: wait for the user to read
        // the explanation and click "Siguiente".
        if (isSpeedRun) {
            setTimeout(goToNextQuestion, 1200);
        }
    };

    // Academy Menu Content - Memoized to prevent re-renders (Flickering Fix)
    const academyDashboard = React.useMemo(() => {
        // Calculate Real Level Info
        const levelInfo = calculateLevelInfo(profile.experience || 0);

        return (
            <div className="min-h-full lg:h-full relative lg:overflow-hidden bg-transparent">

                <div className="relative z-10 lg:h-full lg:overflow-y-auto custom-scrollbar p-3 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-5 lg:space-y-10">
                        {/* Header */}
                        <div className="flex items-end justify-between border-b border-white/10 pb-8">
                            <div>
                                <p className="text-xs font-bold text-blue-200 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Nexus Colegium</p>
                                <h2 className="text-6xl font-serif text-white tracking-wide drop-shadow-lg">Academia</h2>
                            </div>
                            {/* Real KPI chips */}
                            <div className="hidden md:flex items-center gap-3">
                                <button
                                    onClick={() => { const m = !soundMuted; setSoundMuted(m); setSoundMutedState(m); if (!m) playSound('click'); }}
                                    title={soundMuted ? 'Activar sonido' : 'Silenciar'}
                                    className="w-10 h-10 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm flex items-center justify-center text-lg hover:bg-white dark:hover:bg-white/10 transition-colors"
                                >
                                    {soundMuted ? '🔇' : '🔊'}
                                </button>
                                <div className={`text-center px-4 py-2 rounded-2xl backdrop-blur-sm shadow-sm border ${stats.currentStreak > 0 ? 'bg-orange-100/80 dark:bg-orange-500/10 border-orange-300 dark:border-orange-500/20' : 'bg-white/70 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                    <p className={`text-2xl font-serif leading-none flex items-center justify-center gap-1 ${stats.currentStreak > 0 ? 'text-orange-600 dark:text-orange-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {stats.currentStreak > 0 && <span className="text-lg">🔥</span>}{stats.currentStreak}
                                    </p>
                                    <p className="text-[9px] text-slate-500 dark:text-indigo-200/60 uppercase tracking-widest mt-1">Racha</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <p className="text-2xl font-serif text-slate-800 dark:text-white leading-none">{stats.gamesPlayed}</p>
                                    <p className="text-[9px] text-slate-500 dark:text-indigo-200/60 uppercase tracking-widest mt-1">Partidas</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <p className="text-2xl font-serif text-slate-800 dark:text-white leading-none">{stats.avgAccuracy}%</p>
                                    <p className="text-[9px] text-slate-500 dark:text-indigo-200/60 uppercase tracking-widest mt-1">Precisión</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-2xl bg-amber-100/80 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 backdrop-blur-sm shadow-sm">
                                    <p className="text-2xl font-serif text-amber-600 dark:text-amber-300 leading-none">{stats.perfectGames}</p>
                                    <p className="text-[9px] text-amber-600/70 dark:text-amber-200/60 uppercase tracking-widest mt-1">Perfectos</p>
                                </div>
                            </div>
                        </div>

                        {/* Smart recommendation banner — guides the next training action */}
                        {(() => {
                            const weakest = stats.masteryByTopic
                                .filter(t => t.games >= 2 && t.accuracy < 70)
                                .sort((a, b) => a.accuracy - b.accuracy)[0];

                            let rec: { icon: string; label: string; title: string; cta: string; action: () => void; accent: string } | null = null;
                            if (missedBank.length >= 3) {
                                rec = {
                                    icon: ICONS.refresh, accent: 'rose',
                                    label: 'Repaso recomendado',
                                    title: `Tienes ${missedBank.length} preguntas falladas listas para repasar`,
                                    cta: 'Repasar errores',
                                    action: startReviewQuiz,
                                };
                            } else if (weakest) {
                                rec = {
                                    icon: ICONS.trendingUp, accent: 'amber',
                                    label: 'Tu punto débil',
                                    title: `${weakest.topic} — ${weakest.accuracy}% de aciertos. ¡Refuérzalo!`,
                                    cta: `Practicar ${weakest.topic}`,
                                    action: () => handleStartQuiz(weakest.topic, getProgressiveDifficulty(currentLevel, stats.recentAccuracy, stats.gamesPlayed)),
                                };
                            } else if (stats.gamesPlayed === 0) {
                                rec = {
                                    icon: ICONS.book, accent: 'indigo',
                                    label: 'Empieza aquí',
                                    title: 'Haz tu primer quiz de Fundamentos para calibrar tu nivel',
                                    cta: 'Comenzar Fundamentos',
                                    action: () => { setQuizSettings({ topic: 'Fundamentos', difficulty: 'Normal', numQuestions: 5 }); setQuizPhase('setup'); },
                                };
                            }
                            if (!rec) return null;

                            const accentMap: Record<string, string> = {
                                rose: 'from-rose-500/20 to-rose-600/5 border-rose-400/30 dark:border-rose-500/20',
                                amber: 'from-amber-500/20 to-amber-600/5 border-amber-400/30 dark:border-amber-500/20',
                                indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-400/30 dark:border-indigo-500/20',
                            };
                            const btnMap: Record<string, string> = {
                                rose: 'bg-rose-600 hover:bg-rose-500',
                                amber: 'bg-amber-600 hover:bg-amber-500',
                                indigo: 'bg-indigo-600 hover:bg-indigo-500',
                            };
                            return (
                                <div className={`rounded-[24px] p-5 bg-gradient-to-r ${accentMap[rec.accent]} border backdrop-blur-sm flex items-center justify-between gap-4 shadow-sm`}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/10 flex-shrink-0">
                                            <Icon svg={rec.icon} className="w-5 h-5 text-slate-700 dark:text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60 mb-0.5">{rec.label}</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{rec.title}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={rec.action}
                                        className={`flex-shrink-0 px-5 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5 ${btnMap[rec.accent]}`}
                                    >
                                        {rec.cta}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
                            {/* Stats Card - Dark Indigo/Slate (Restored Style) */}
                            <div className="lg:col-span-2 rounded-[32px] p-5 lg:p-8 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-indigo-500/25 transition-colors duration-700" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                <Icon svg={ICONS.trendingUp} className="w-5 h-5 text-indigo-300" />
                                            </div>
                                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Nivel de Dominio</span>
                                        </div>
                                        {/* Active difficulty tier — shows the progression is real */}
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-100">
                                            Reto: {getProgressiveDifficulty(levelInfo.level, stats.recentAccuracy, stats.gamesPlayed)}
                                        </span>
                                    </div>

                                    <div className="mt-8 flex items-end justify-between">
                                        <div className="flex-1 mr-8">
                                            <div className="text-7xl font-serif text-white mb-1 leading-none">{levelInfo.level}</div>
                                            <p className="text-sm font-bold text-indigo-300 mb-3">{getRankTitle(levelInfo.level)}</p>
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
                                        <div className="w-48 h-24 opacity-80 min-h-[96px] min-w-[192px]">
                                            {stats.lastScores.length > 0 ? (
                                                <ChartContainer height="100%" minHeight="50px">
                                                    <AreaChart data={stats.lastScores.map(s => ({ v: s.accuracy }))}>
                                                        <defs>
                                                            <linearGradient id="chartDesktop" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Tooltip
                                                            contentStyle={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 8, fontSize: 11 }}
                                                            labelStyle={{ display: 'none' }}
                                                            formatter={(v: any) => [`${v}%`, 'Precisión']}
                                                        />
                                                        <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={2} fill="url(#chartDesktop)" />
                                                    </AreaChart>
                                                </ChartContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-[10px] text-slate-500 text-center px-2">
                                                    Juega tu primer quiz para ver tu progreso
                                                </div>
                                            )}
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
                                    stats={(() => { const m = stats.masteryByTopic.find(t => t.topic === 'Fundamentos'); return m ? `${m.accuracy}%` : 'Nuevo'; })()}
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
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Especialización</span>
                                <span className="h-px flex-1 bg-slate-300 dark:bg-white/10" />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
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
                                    title="Cristalería"
                                    subtitle="Reconocimiento Visual"
                                    icon={ICONS.wine || ICONS.eye}
                                    color="text-white"
                                    bgClass="bg-indigo-500"
                                    textClass="text-white"
                                    delay={0.35}
                                    onClick={() => handleStartQuiz('Cristalería', 'Normal')}
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

                        {/* Mastery + History — REAL DATA */}
                        {stats.gamesPlayed > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 pb-8">
                                {/* Mastery by topic */}
                                <div className="lg:col-span-3 rounded-[28px] p-4 lg:p-7 bg-white/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <div className="flex items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Icon svg={ICONS.trendingUp} className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-200">Dominio por Categoría</h3>
                                        </div>
                                        {missedBank.length > 0 && (
                                            <button
                                                onClick={startReviewQuiz}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <Icon svg={ICONS.refresh} className="w-3 h-3" />
                                                Repasar {missedBank.length} errores
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 -mt-3">Haz clic en una categoría para reentrenarla</p>
                                    <div className="space-y-4">
                                        {stats.masteryByTopic.slice(0, 6).map((m) => (
                                            <button
                                                key={m.topic}
                                                onClick={() => handleStartQuiz(m.topic, getProgressiveDifficulty(currentLevel, stats.recentAccuracy, stats.gamesPlayed))}
                                                className="w-full text-left group/topic"
                                                title={`Practicar ${m.topic}`}
                                            >
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm text-slate-700 dark:text-white/90 font-medium group-hover/topic:text-indigo-600 dark:group-hover/topic:text-indigo-300 transition-colors flex items-center gap-1.5">
                                                        {m.topic}
                                                        <Icon svg={ICONS.play} className="w-3 h-3 opacity-0 group-hover/topic:opacity-100 transition-opacity" />
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{m.correct}/{m.total} · {m.accuracy}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${m.accuracy >= 80 ? 'bg-emerald-500' : m.accuracy >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${m.accuracy}%` }}
                                                    />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent history */}
                                <div className="lg:col-span-2 rounded-[28px] p-4 lg:p-7 bg-white/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Icon svg={ICONS.clock} className="w-4 h-4 text-indigo-500 dark:text-indigo-300" />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-200">Historial Reciente</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {stats.results.slice(0, 5).map((r, i) => {
                                            const acc = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                                            return (
                                                <div key={r.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-700 dark:text-white/90 font-medium truncate">{r.topic}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{r.difficulty}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        {r.xpEarned != null && <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold">+{r.xpEarned} XP</span>}
                                                        <span className={`text-sm font-bold ${acc >= 80 ? 'text-emerald-500 dark:text-emerald-400' : acc >= 50 ? 'text-indigo-500 dark:text-indigo-300' : 'text-rose-500 dark:text-rose-400'}`}>{r.score}/{r.total}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Certifications */}
                        <div className="rounded-[28px] p-4 lg:p-7 bg-white/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🎖️</span>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-300">Certificaciones</h3>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{certifications.length}/2</span>
                            </div>
                            {certifications.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {certifications.map((c) => (
                                        <div key={c.id} className={`relative overflow-hidden p-5 rounded-2xl border ${c.tier === 'honor' ? 'border-amber-400/50 bg-gradient-to-br from-amber-400/15 to-yellow-300/5' : 'border-indigo-400/40 bg-gradient-to-br from-indigo-400/10 to-indigo-500/5'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-3xl">{c.tier === 'honor' ? '🏆' : '🎖️'}</span>
                                                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{new Date(c.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white font-serif">{c.title}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Examen Final · {c.score}/{c.total} · Nivel {c.level}</p>
                                            <p className="text-[9px] uppercase tracking-widest font-black mt-3 text-amber-600 dark:text-amber-400">Nexus Colegium</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Aprueba el <strong className="text-slate-700 dark:text-white">Examen Final</strong> con ≥80% para obtener tu primera certificación oficial.
                                    </p>
                                    <button
                                        onClick={() => handleStartQuiz('Examen Final', 'Experto')}
                                        className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5"
                                    >
                                        Presentar examen
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [profile.experience, stats, missedBank, certifications, soundMuted]); // Re-render when XP, stats, missed bank, certs or sound toggle change

    return (
        <PremiumLayout
            gradientTheme="colegium"
            layoutMode="colegium"
            leftSidebar={
                <ColegiumProfileSidebar
                    level={getRankTitle(calculateLevelInfo(profile.experience || 0).level)}
                    totalScore={stats.totalCorrect}
                    gamesPlayed={stats.gamesPlayed}
                    perfectGames={stats.perfectGames}
                    avgAccuracy={stats.avgAccuracy}
                    bestAccuracy={stats.bestAccuracy}
                    currentStreak={stats.currentStreak}
                    masteredTopics={stats.masteryByTopic.filter(t => t.accuracy >= 80 && t.games >= 2).length}
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
                                        isSpeedRun={isSpeedRun}
                                        answerFeedback={answerFeedback}
                                        handleAnswer={handleAnswer}
                                        onNext={goToNextQuestion}
                                        offlineNotice={offlineNotice}
                                    />
                                )}
                                {quizPhase === 'result' && (
                                    <QuizResult
                                        score={score}
                                        total={quizData.length}
                                        xpEarned={lastResult.xpEarned}
                                        leveledUp={lastResult.leveledUp}
                                        newLevel={lastResult.newLevel}
                                        certificationTitle={newCertEarned?.title}
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

import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Type } from "@google/genai";
import { callGeminiApi } from '../utils/gemini';
import { Recipe, PizarronTask, QuizQuestion, ColegiumResult } from '../../types';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ProgressDashboard } from '../components/colegium/ProgressDashboard';
import { GameModeSelector } from '../components/colegium/GameModeSelector';
import { QuizSetup } from '../components/colegium/QuizSetup';
import { QuizInProgress } from '../components/colegium/QuizInProgress';
import { QuizResult } from '../components/colegium/QuizResult';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import ColegiumProfileSidebar from '../components/colegium/ColegiumProfileSidebar';
import ColegiumContextSidebar from '../components/colegium/ColegiumContextSidebar';

interface ColegiumViewProps {
    db: Firestore;
    userId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

const ColegiumView: React.FC<ColegiumViewProps> = ({ db, userId, allRecipes, allPizarronTasks }) => {
    const [quizPhase, setQuizPhase] = React.useState<'dashboard' | 'selection' | 'setup' | 'quiz' | 'result'>('dashboard');
    const [quizSettings, setQuizSettings] = React.useState({ topic: 'Quiz Clásico', difficulty: 'Fácil', numQuestions: 5 });
    const [quizData, setQuizData] = React.useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [answerFeedback, setAnswerFeedback] = React.useState<number | null>(null);
    const [timer, setTimer] = React.useState(30);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (quizPhase === 'quiz' && quizSettings.topic === 'Speed Round') {
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

    const handleStartQuiz = async () => {
        setLoading(true);
        setError(null);

        let dataContext = "";
        if (quizSettings.topic === 'Recetas') {
            dataContext = JSON.stringify(allRecipes.map(r => ({ nombre: r.nombre, categoria: r.categorias, ingredientes: r.ingredientes?.map(i => i.nombre) })));
        } else if (quizSettings.topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.map(t => ({ content: t.texto, category: t.category, status: t.status })));
        }

        const systemPrompt = "Eres un educador y maestro de coctelería de élite. Tu respuesta debe ser estrictamente un array JSON válido.";

        let userQuery = "";

        switch (quizSettings.topic) {
            case 'Speed Round':
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de dificultad ${quizSettings.difficulty}. Devuelve un array JSON de objetos. Cada objeto debe tener: 'question', 'type' ('multiple-choice' o 'true-false'), 'options' (array de 4 strings para 'multiple-choice', o 2 para 'true-false'), 'correctAnswerIndex' (número 0-3 o 0-1). Incluye al menos un 'true-false'.`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Genera ${quizSettings.numQuestions} preguntas para una 'Cata a Ciegas'. Cada pregunta debe ser la descripción del sabor y aroma de un cóctel clásico, sin revelar su nombre. Las opciones deben ser nombres de cócteles. Formato: array JSON de objetos con 'question', 'options' (4 nombres de cócteles, uno correcto), y 'correctAnswerIndex'.`;
                break;
            case 'Verdadero o Falso':
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de tipo 'Verdadero o Falso' sobre coctelería, con dificultad ${quizSettings.difficulty}. Formato: array JSON de objetos con 'question', 'options' (siempre ['Verdadero', 'Falso']), y 'correctAnswerIndex' (0 para Verdadero, 1 para Falso).`;
                break;
            default: // Quiz Clásico
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de dificultad ${quizSettings.difficulty}. Devuelve un array JSON de objetos. Cada objeto debe tener: 'question', 'type' ('multiple-choice' o 'true-false'), 'options' (array de 4 strings para 'multiple-choice', o 2 para 'true-false'), 'correctAnswerIndex' (número 0-3 o 0-1). Incluye al menos un 'true-false'.`;
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
            setTimer(30); // Reset timer
            setQuizPhase('quiz');
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred');
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

    const handleSelectMode = (mode: string) => {
        setQuizSettings(s => ({ ...s, topic: mode }));
        setQuizPhase('setup');
    };

    return (
        <PremiumLayout
            gradientTheme="colegium"
            leftSidebar={
                <ColegiumProfileSidebar
                    level="Mixólogo Senior" // Placeholder, logic to be added
                    totalScore={1250} // Placeholder
                    gamesPlayed={42} // Placeholder
                />
            }
            rightSidebar={
                <ColegiumContextSidebar
                    phase={quizPhase}
                    timer={timer}
                    currentQuestion={currentQuestionIndex}
                    totalQuestions={quizData.length}
                    score={score}
                />
            }
            mainContent={
                <div className="h-full flex items-center justify-center relative">
                    {loading && <Spinner className="w-12 h-12 text-blue-500 absolute z-50" />}
                    {!loading && error && <Alert variant="destructive" title="Error" description={error} className="w-full max-w-lg" />}

                    {!loading && !error && (
                        <>
                            {quizPhase === 'dashboard' && <ProgressDashboard onStart={() => setQuizPhase('selection')} />}
                            {quizPhase === 'selection' && <GameModeSelector onSelectMode={handleSelectMode} />}
                            {quizPhase === 'setup' && (
                                <QuizSetup
                                    quizSettings={quizSettings}
                                    setQuizSettings={setQuizSettings}
                                    handleStartQuiz={handleStartQuiz}
                                    onBack={() => setQuizPhase('selection')}
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
                                    onBack={() => setQuizPhase('dashboard')}
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

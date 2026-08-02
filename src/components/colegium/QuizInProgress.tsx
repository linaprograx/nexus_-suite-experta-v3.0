import React from 'react';
import { QuizQuestion } from '../../types';
import { getPremiumGlassware } from './glasswarePremium';

interface QuizInProgressProps {
    quizData: QuizQuestion[];
    currentQuestionIndex: number;
    quizSettings: { topic: string };
    timer: number;
    isSpeedRun?: boolean;
    answerFeedback: number | null;
    handleAnswer: (index: number) => void;
    onNext?: () => void;
    offlineNotice?: boolean;
}

export const QuizInProgress: React.FC<QuizInProgressProps> = ({
    quizData,
    currentQuestionIndex,
    quizSettings,
    timer,
    isSpeedRun = false,
    answerFeedback,
    handleAnswer,
    onNext,
    offlineNotice = false
}) => {
    const currentQ = quizData[currentQuestionIndex];
    if (!currentQ) return null;

    const showFeedback = answerFeedback !== null;
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    const isLast = currentQuestionIndex >= quizData.length - 1;

    return (
        <div className="h-full flex items-center justify-center p-8">
            {/* Premium Quiz Card */}
            <div className="w-full max-w-3xl backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-white/20 rounded-3xl p-10 shadow-2xl">
                {/* Offline indicator — compact pill */}
                {offlineNotice && (
                    <div className="flex justify-end mb-2">
                        <span
                            title="La IA no está disponible — usando el banco curado del Nexus"
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase tracking-widest"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Modo IA-off
                        </span>
                    </div>
                )}

                {/* Top progress bar */}
                <div className="mb-6">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-6 gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300">
                                {quizSettings.topic}
                            </span>
                            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Pregunta {currentQuestionIndex + 1} / {quizData.length}
                            </p>
                        </div>
                        <h2 className="text-2xl font-serif text-slate-900 dark:text-white leading-snug">
                            {currentQ.question}
                        </h2>
                    </div>
                    {isSpeedRun && (
                        <div className="flex flex-col items-center flex-shrink-0">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tiempo</p>
                            <div className={`text-4xl font-black tabular-nums transition-colors ${timer <= 5 ? 'text-rose-500 animate-pulse' : 'text-purple-600 dark:text-purple-400'}`}>{timer}s</div>
                        </div>
                    )}
                </div>

                {/* Visual prompt (glassware identification) */}
                {currentQ.visualGlass && (
                    <div className="flex justify-center mb-8">
                        <div
                            className="w-44 h-52 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200 dark:border-white/10 shadow-inner p-4 flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: getPremiumGlassware(currentQ.visualGlass) }}
                        />
                    </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((option, index) => {
                        const isCorrect = index === currentQ.correctAnswerIndex;
                        const isSelected = index === answerFeedback;

                        let buttonClasses = "w-full p-6 rounded-2xl text-left transition-all duration-300 border ";

                        if (showFeedback) {
                            if (isCorrect) {
                                buttonClasses += "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50 border-emerald-400";
                            } else if (isSelected) {
                                buttonClasses += "bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/50 border-rose-400";
                            } else {
                                buttonClasses += "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent";
                            }
                        } else {
                            buttonClasses += "bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 text-slate-900 dark:text-white hover:scale-[1.02] hover:shadow-xl";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={showFeedback}
                                className={buttonClasses}
                            >
                                <span className="text-base font-medium leading-relaxed flex items-center gap-3">
                                    {showFeedback && isCorrect && <span className="text-lg">✓</span>}
                                    {showFeedback && isSelected && !isCorrect && <span className="text-lg">✕</span>}
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Explanation (educational) — appears after answering */}
                {showFeedback && currentQ.explanation && (
                    <div className="mt-6 p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-300 mb-1.5">¿Por qué?</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{currentQ.explanation}</p>
                    </div>
                )}

                {/* Manual advance (non-speed-run modes) */}
                {showFeedback && !isSpeedRun && onNext && (
                    <button
                        onClick={onNext}
                        className="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 animate-in fade-in duration-300"
                    >
                        {isLast ? 'Ver Resultados' : 'Siguiente Pregunta'} →
                    </button>
                )}
            </div>
        </div>
    );
};

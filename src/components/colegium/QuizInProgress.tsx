import React from 'react';
import { QuizQuestion } from '../../../types';

interface QuizInProgressProps {
    quizData: QuizQuestion[];
    currentQuestionIndex: number;
    quizSettings: { topic: string };
    timer: number;
    answerFeedback: number | null;
    handleAnswer: (index: number) => void;
}

export const QuizInProgress: React.FC<QuizInProgressProps> = ({
    quizData,
    currentQuestionIndex,
    quizSettings,
    timer,
    answerFeedback,
    handleAnswer
}) => {
    const currentQ = quizData[currentQuestionIndex];
    if (!currentQ) return null;

    return (
        <div className="h-full flex items-center justify-center p-8">
            {/* Premium Quiz Card */}
            <div className="w-full max-w-3xl backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-white/20 rounded-3xl p-10 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                            Pregunta {currentQuestionIndex + 1} / {quizData.length}
                        </p>
                        <h2 className="text-2xl font-serif text-slate-900 dark:text-white">
                            {currentQ.question}
                        </h2>
                    </div>
                    {quizSettings.topic === 'Speed Round' && (
                        <div className="flex flex-col items-center">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Tiempo</p>
                            <div className="text-4xl font-bold text-purple-600">{timer}s</div>
                        </div>
                    )}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((option, index) => {
                        const isCorrect = index === currentQ.correctAnswerIndex;
                        const isSelected = index === answerFeedback;
                        const showFeedback = answerFeedback !== null;

                        let buttonClasses = "w-full p-6 rounded-2xl text-left transition-all duration-300 ";

                        if (showFeedback) {
                            if (isCorrect) {
                                buttonClasses += "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50";
                            } else if (isSelected) {
                                buttonClasses += "bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/50";
                            } else {
                                buttonClasses += "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500";
                            }
                        } else {
                            buttonClasses += "bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 text-slate-900 dark:text-white hover:scale-[1.02] hover:shadow-xl";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={showFeedback}
                                className={buttonClasses}
                            >
                                <span className="text-base font-medium leading-relaxed">{option}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

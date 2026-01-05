import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface QuizSettings {
    topic: string;
    difficulty: string;
    numQuestions: number;
}

interface QuizSetupProps {
    quizSettings: QuizSettings;
    setQuizSettings: React.Dispatch<React.SetStateAction<QuizSettings>>;
    handleStartQuiz: () => void;
    onBack: () => void;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({ quizSettings, setQuizSettings, handleStartQuiz, onBack }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Invisible Backdrop - Click to close only */}
            <div className="absolute inset-0 z-0" onClick={onBack} />

            {/* Premium floating panel with LIGHT glassmorphism */}
            <div className="relative max-w-md w-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-3xl p-8 shadow-[0_20px_80px_-12px_rgba(255,255,255,0.3)] dark:shadow-[0_20px_80px_-12px_rgba(147,51,234,0.3)] animate-in zoom-in-95 fade-in duration-300">
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-transparent rounded-3xl pointer-events-none" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-serif text-slate-800 dark:text-white mb-2 tracking-tight">Configurar Desafío</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">{quizSettings.topic}</p>
                    </div>

                    {/* Difficulty selector */}
                    <div className="mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                            Dificultad
                        </label>
                        <div className="relative group">
                            <select
                                value={quizSettings.difficulty}
                                onChange={e => setQuizSettings(s => ({ ...s, difficulty: e.target.value }))}
                                className="appearance-none w-full bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 text-slate-700 dark:text-white font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm group-hover:bg-white/60"
                            >
                                <option value="Fácil" className="bg-white text-slate-800">Fácil</option>
                                <option value="Normal" className="bg-white text-slate-800">Normal</option>
                                <option value="Difícil" className="bg-white text-slate-800">Difícil</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Icon svg={ICONS.chevronDown} className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Questions selector */}
                    <div className="mb-6">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                            Nº Preguntas
                        </label>
                        <div className="relative group">
                            <select
                                value={quizSettings.numQuestions}
                                onChange={e => setQuizSettings(s => ({ ...s, numQuestions: parseInt(e.target.value) }))}
                                className="appearance-none w-full bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 text-slate-700 dark:text-white font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm group-hover:bg-white/60"
                            >
                                <option value={5} className="bg-white text-slate-800">5</option>
                                <option value={10} className="bg-white text-slate-800">10</option>
                                <option value={20} className="bg-white text-slate-800">20</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Icon svg={ICONS.chevronDown} className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={onBack}
                            className="flex-1 py-4 rounded-xl bg-white/50 hover:bg-white/80 border border-slate-200 text-slate-600 font-semibold transition-all hover:shadow-md"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleStartQuiz}
                            className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold tracking-wide transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                        >
                            Comenzar Desafío
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface ColegiumContextSidebarProps {
    phase: 'dashboard' | 'selection' | 'setup' | 'quiz' | 'result';
    timer: number;
    currentQuestion: number;
    totalQuestions: number;
    score: number;
}

const ColegiumContextSidebar: React.FC<ColegiumContextSidebarProps> = ({ phase, timer, currentQuestion, totalQuestions, score }) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col p-6 gap-6 transition-all shadow-sm">
            {phase === 'quiz' ? (
                // QUIZ MODE CONTEXT
                <>
                    <div className="text-center pb-6 border-b border-white/10 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiempo Restante</p>
                        <div className={`text-5xl font-black tabular-nums transition-colors ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                            {timer}s
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Progreso</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{currentQuestion + 1} / {totalQuestions}</span>
                            </div>
                            <div className="h-2 w-full bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <Icon svg={ICONS.star} className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Puntaje Actual</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{score} pts</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto p-4 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                        <div className="flex gap-3">
                            <Icon svg={ICONS.info} className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium leading-relaxed">
                                Mantén la calma. Lee cada pregunta cuidadosamente antes de responder.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                // DASHBOARD/OTHER MODE CONTEXT
                <>
                    <div className="flex flex-col items-center text-center space-y-4 py-6 border-b border-white/10 dark:border-white/5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Icon svg={ICONS.zap} className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Sabías que...</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Curiosidades de coctelería</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5 italic text-slate-600 dark:text-slate-300 text-sm leading-relaxed relative">
                        <Icon svg={ICONS.wine} className="absolute top-4 right-4 w-12 h-12 text-slate-200 dark:text-slate-700/50 -rotate-12" />
                        "El primer cóctel documentado como tal apareció en una publicación de 1806, definido como una mezcla estimulante de licores, azúcar, agua y amargos."
                    </div>

                    <div className="space-y-3 mt-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tips de Estudio</h4>
                        <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors cursor-help">
                            <Icon svg={ICONS.book} className="w-4 h-4 text-blue-500 mt-0.5" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">Repasa las familias de cócteles clásicos.</p>
                        </div>
                        <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors cursor-help">
                            <Icon svg={ICONS.filter} className="w-4 h-4 text-blue-500 mt-0.5" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">Prueba el modo 'Cata a Ciegas' para entrenar tu nariz.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ColegiumContextSidebar;

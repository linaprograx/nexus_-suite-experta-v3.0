import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PizarronTask } from '../../../types';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface TodayBoardProps {
    ideas: any[];
    inProgress: any[];
    urgent: any[];
}

export const TodayBoard: React.FC<TodayBoardProps> = ({ ideas, inProgress, urgent }) => {
    const navigate = useNavigate();
    // Combine for display, prioritize Urgent > InProgress > Ideas
    // Show max 4 items total to keep it compact
    const displayItems: any[] = [
        ...urgent.map(t => ({ ...t, status: 'urgent' })),
        ...inProgress.map(t => ({ ...t, status: 'progress' })),
        ...ideas.map(t => ({ ...t, status: 'idea' }))
    ].slice(0, 4);

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 min-h-[200px] relative overflow-hidden group">
            {/* Glass Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Pizarrón Hoy
                </h3>
                <button className="text-[10px] text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-wider transition-colors">
                    Ver Todo
                </button>
            </div>

            <div className="space-y-3">
                {displayItems.length > 0 ? (
                    displayItems.map((task) => (
                        <div key={task.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'urgent' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                task.status === 'progress' ? 'bg-amber-500' :
                                    'bg-indigo-400'
                                }`} />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-indigo-500 transition-colors">
                                    {task.title || task.texto || 'Tarea sin título'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                        {task.category || 'General'}
                                    </span>
                                    {task.status === 'urgent' && (
                                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Icon svg={ICONS.alertCircle} className="w-3 h-3" /> Prioridad
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                        <Icon svg={ICONS.check} className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Todo despejado por hoy</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/pizarron')}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-xs font-bold uppercase tracking-wider group"
            >
                <Icon svg={ICONS.plus} className="w-4 h-4" /> Nueva Tarea Rápida
            </button>
        </div>
    );
};

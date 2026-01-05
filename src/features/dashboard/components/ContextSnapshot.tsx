import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface ContextSnapshotProps {
    stats: {
        totalRecipes: number;
        totalTasks: number;
        tiempoAhorrado: number;
        creativeRate: number;
    };
}

export const ContextSnapshot: React.FC<ContextSnapshotProps> = ({ stats }) => {
    return (

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 relative overflow-hidden group">
            {/* Glass Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Snapshot Operativo
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {/* 1. Recetas */}
                <div className="flex flex-col">
                    <span className="text-2xl font-serif text-gray-800 dark:text-white leading-none mb-1">
                        {stats.totalRecipes}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon svg={ICONS.book} className="w-3 h-3 text-indigo-500" />
                        <span>Recetas</span>
                    </div>
                </div>

                {/* 2. Ideas */}
                <div className="flex flex-col">
                    <span className="text-2xl font-serif text-gray-800 dark:text-white leading-none mb-1">
                        {stats.totalTasks}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Icon svg={ICONS.lightbulb} className="w-3 h-3 text-amber-500" />
                        <span>Ideas</span>
                    </div>
                </div>

                {/* 3. Eficiencia */}
                <div className="flex flex-col pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className="text-lg font-mono text-gray-800 dark:text-gray-200 leading-none mb-1">
                        {stats.tiempoAhorrado.toFixed(0)}h
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Ahorro Tiempo</span>
                </div>

                {/* 4. Ritmo */}
                <div className="flex flex-col pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className="text-lg font-mono text-gray-800 dark:text-gray-200 leading-none mb-1">
                        {stats.creativeRate}%
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Ritmo Creativo</span>
                </div>
            </div>
        </div>
    );
};

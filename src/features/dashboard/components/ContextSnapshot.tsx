import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { dashboardPanel, panelHighlight } from '../cardStyles';

interface ContextSnapshotProps {
    stats: {
        totalRecipes: number;
        totalTasks: number;
        inventoryValue: number;
        avgMargin: number;
        costedRate: number;
        productsWithoutPrice: number;
    };
}

export const ContextSnapshot: React.FC<ContextSnapshotProps> = ({ stats }) => {
    return (

        <div className={dashboardPanel}>
            <div className={panelHighlight} />
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

                {/* 3. Valor de inventario (real) */}
                <div className="flex flex-col pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-1 tabular-nums">
                        €{stats.inventoryValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Valor Almacén</span>
                </div>

                {/* 4. Margen medio (real, color-coded) */}
                <div className="flex flex-col pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className={`text-lg font-bold leading-none mb-1 tabular-nums ${stats.avgMargin <= 0 ? 'text-gray-400' : stats.avgMargin >= 70 ? 'text-emerald-600 dark:text-emerald-400' : stats.avgMargin >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {stats.avgMargin > 0 ? `${stats.avgMargin.toFixed(0)}%` : '—'}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Margen Medio</span>
                </div>
            </div>
        </div>
    );
};

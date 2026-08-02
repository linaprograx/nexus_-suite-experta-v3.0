import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface BusinessPulseProps {
    metrics: {
        inventoryValue: number;
        lowStockCount: number;
        productsWithoutPrice: number;
        avgMargin: number;
        bestRecipe: { name: string; margin: number } | null;
        worstRecipe: { name: string; margin: number } | null;
    };
}

const fmtEuro = (n: number) => `€${(n || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;

export const BusinessPulse: React.FC<BusinessPulseProps> = ({ metrics }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-emerald-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.3),_0_20px_50px_-12px_rgba(0,0,0,0.6)] transition-all duration-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        <Icon svg={ICONS.book} className="w-3 h-3" />
                    </span>
                    Pulso del Negocio
                </h3>
                <button
                    onClick={() => navigate('/grimorium')}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold uppercase tracking-wider transition-colors"
                >
                    Abrir Grimorio
                </button>
            </div>

            {/* Hero: inventory value */}
            <div className="mb-5">
                <span className="text-3xl font-serif text-gray-800 dark:text-white leading-none tabular-nums">
                    {fmtEuro(metrics.inventoryValue)}
                </span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Valor de Almacén</p>
            </div>

            {/* Actionable alerts */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                    onClick={() => navigate('/grimorium')}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${metrics.lowStockCount > 0
                        ? 'bg-rose-50 dark:bg-rose-900/15 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/25'
                        : 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/30'}`}
                >
                    <span className={`text-xl font-black tabular-nums leading-none ${metrics.lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {metrics.lowStockCount}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1 flex items-center gap-1">
                        <Icon svg={ICONS.alertCircle} className="w-3 h-3" /> Stock bajo
                    </span>
                </button>

                <button
                    onClick={() => navigate('/grimorium')}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${metrics.productsWithoutPrice > 0
                        ? 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/25'
                        : 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/30'}`}
                >
                    <span className={`text-xl font-black tabular-nums leading-none ${metrics.productsWithoutPrice > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {metrics.productsWithoutPrice}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1 flex items-center gap-1">
                        <Icon svg={ICONS.tag || ICONS.info} className="w-3 h-3" /> Sin precio
                    </span>
                </button>
            </div>

            {/* Recipe profitability */}
            {(metrics.bestRecipe || metrics.worstRecipe) && (
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-white/5">
                    {metrics.bestRecipe && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                <Icon svg={ICONS.trendingUp} className="w-3 h-3 text-emerald-500 shrink-0" />
                                {metrics.bestRecipe.name}
                            </span>
                            <span className="text-xs font-bold text-emerald-500 shrink-0 tabular-nums">{metrics.bestRecipe.margin.toFixed(0)}%</span>
                        </div>
                    )}
                    {metrics.worstRecipe && metrics.worstRecipe.name !== metrics.bestRecipe?.name && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                <Icon svg={ICONS.trendingUp} className="w-3 h-3 text-rose-500 shrink-0 rotate-180" />
                                {metrics.worstRecipe.name}
                            </span>
                            <span className={`text-xs font-bold shrink-0 tabular-nums ${metrics.worstRecipe.margin < 50 ? 'text-rose-500' : 'text-amber-500'}`}>
                                {metrics.worstRecipe.margin.toFixed(0)}%
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

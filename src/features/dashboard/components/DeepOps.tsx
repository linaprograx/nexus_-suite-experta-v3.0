import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { dashboardPanel } from '../cardStyles';

interface TimelineEvent {
    label: string;
    date: Date;
    type: 'idea' | 'recipe' | 'system';
}

interface DeepOpsMetrics {
    inventoryValue: number;
    distinctItems: number;
    productsWithoutPrice: number;
    avgMargin: number;
    costedCount: number;
    costedRate: number;
    totalRecipes: number;
    bestRecipe: { name: string; margin: number } | null;
    worstRecipe: { name: string; margin: number } | null;
    timeline: TimelineEvent[];
}

interface DeepOpsProps {
    metrics: DeepOpsMetrics;
}

const card = dashboardPanel;

const fmtEuro = (n: number) => `€${(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const relativeTime = (d: Date): string => {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const DeepOps: React.FC<DeepOpsProps> = ({ metrics }) => {
    const marginColor = metrics.avgMargin >= 70 ? 'text-emerald-500' : metrics.avgMargin >= 50 ? 'text-amber-500' : 'text-rose-500';
    const marginStatus = metrics.avgMargin >= 70 ? 'Óptimo' : metrics.avgMargin >= 50 ? 'Aceptable' : metrics.avgMargin > 0 ? 'Bajo' : 'Sin datos';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {/* 1. Business Metrics (REAL) */}
            <div className={card}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.activity} className="w-3 h-3 text-indigo-500" /> Métricas de Negocio
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Valor Inventario</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">{fmtEuro(metrics.inventoryValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Margen Medio</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${marginColor}`}>{marginStatus}</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">{metrics.avgMargin.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Recetas Costeadas</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-500">{metrics.costedRate.toFixed(0)}%</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">{metrics.costedCount}/{metrics.totalRecipes}</span>
                        </div>
                    </div>
                    {metrics.bestRecipe && (
                        <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex justify-between items-center gap-2">
                            <span className="text-[11px] text-gray-400 truncate">★ {metrics.bestRecipe.name}</span>
                            <span className="text-xs font-bold text-emerald-500 shrink-0">{metrics.bestRecipe.margin.toFixed(0)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. System Status (REAL) */}
            <div className={card}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.cpu} className="w-3 h-3 text-rose-500" /> Estado del Sistema
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Recetas', status: `${metrics.totalRecipes}`, color: 'bg-indigo-500' },
                        { label: 'Productos', status: `${metrics.distinctItems} stock`, color: 'bg-emerald-500' },
                        {
                            label: 'Sin Precio',
                            status: metrics.productsWithoutPrice > 0 ? `${metrics.productsWithoutPrice} ⚠` : 'OK',
                            color: metrics.productsWithoutPrice > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                        },
                        {
                            label: 'Rentabilidad',
                            status: marginStatus,
                            color: metrics.avgMargin >= 70 ? 'bg-emerald-500' : metrics.avgMargin >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color} mb-2 shadow-[0_0_8px_currentColor]`} />
                            <span className="text-[10px] uppercase text-gray-400 tracking-wider mb-0.5">{item.label}</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Activity Timeline (REAL) */}
            <div className={card}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icon svg={ICONS.clock} className="w-3 h-3 text-amber-500" /> Actividad Reciente
                </h3>
                {metrics.timeline.length > 0 ? (
                    <div className="relative space-y-4 pl-2">
                        <div className="absolute top-2 bottom-2 left-3.5 w-[1px] bg-gray-200 dark:bg-slate-700" />
                        {metrics.timeline.map((item, idx) => (
                            <div key={idx} className="relative flex items-center gap-3">
                                <div className={`relative z-10 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 flex-shrink-0
                                    ${item.type === 'idea' ? 'bg-indigo-500' : item.type === 'recipe' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                <div className="flex-1 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 rounded-lg px-3 py-2 gap-2 min-w-0">
                                    <span className="text-xs text-gray-800 dark:text-gray-300 font-medium truncate">{item.label}</span>
                                    <span className="text-[10px] text-gray-400 font-mono shrink-0">{relativeTime(item.date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                        <Icon svg={ICONS.clock} className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Sin actividad reciente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

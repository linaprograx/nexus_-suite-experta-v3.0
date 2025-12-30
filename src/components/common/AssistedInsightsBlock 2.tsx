
import React from 'react';
import { AssistedInsight } from '../../core/assisted/assisted.types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface AssistedInsightsBlockProps {
    insights: AssistedInsight[];
}

import { generateActionSurfaces } from '../../core/actionsurfaces/actionSurface.engine';
import { useCapabilities } from '../../context/AppContext';
import { ProductMetrics } from '../../core/product/product.metrics';

export const AssistedInsightsBlock: React.FC<AssistedInsightsBlockProps> = ({ insights }) => {
    const { hasLayer, currentPlan } = useCapabilities();
    const hasAccess = hasLayer('assisted_intelligence');

    if (!hasAccess) {
        // Gated View for FREE plan
        return (
            <div className="mb-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                    <Icon svg={ICONS.lock} className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Insights Asistidos</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-3">
                    Obtén análisis automáticos de riesgo y oportunidad con el plan {currentPlan.id === 'FREE' ? 'PRO' : 'Superior'}.
                </p>
                <button
                    onClick={() => ProductMetrics.trackGateHit('assisted_insights', currentPlan.id)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors"
                >
                    Ver Planes
                </button>
            </div>
        );
    }

    if (!insights || insights.length === 0) return null;

    // Show top 1 insight max (Tuned Phase 2.3.1)
    const displayInsights = insights.slice(0, 1);
    const surfaces = generateActionSurfaces(displayInsights);
    const primarySurface = surfaces.length > 0 ? surfaces[0] : null;

    return (
        <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {displayInsights.map(insight => (
                <div
                    key={insight.id}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all ${insight.severity === 'critical' ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' :
                        insight.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' :
                            insight.severity === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                                'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30'
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${insight.severity === 'critical' ? 'bg-rose-100 text-rose-600' :
                            insight.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                                insight.severity === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-indigo-100 text-indigo-600'
                            } dark:bg-white/10`}>
                            <Icon svg={insight.severity === 'success' ? ICONS.check : ICONS.sparkles} className="w-5 h-5" />
                        </div>
                        <h4 className={`text-base font-bold ${insight.severity === 'critical' ? 'text-rose-900 dark:text-rose-100' :
                            insight.severity === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                                insight.severity === 'success' ? 'text-emerald-900 dark:text-emerald-100' :
                                    'text-indigo-900 dark:text-indigo-100'
                            }`}>
                            {insight.title}
                        </h4>
                    </div>

                    {/* Summary & Why */}
                    <p className={`text-sm mb-3 ${insight.severity === 'critical' ? 'text-rose-800 dark:text-rose-200' :
                        insight.severity === 'warning' ? 'text-amber-800 dark:text-amber-200' :
                            insight.severity === 'success' ? 'text-emerald-800 dark:text-emerald-200' :
                                'text-indigo-800 dark:text-indigo-200'
                        }`}>
                        {insight.summary} <span className="opacity-80 block mt-1 text-xs">{insight.why}</span>
                    </p>

                    {/* Evidence Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {insight.evidence.map((ev, idx) => (
                            <div key={idx} className="bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-black/5 dark:border-white/5 flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-0.5">{ev.label}</span>
                                <span className="text-sm font-semibold">{ev.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Checklist (Optional) */}
                    {insight.checklist && (
                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                            <span className="text-[10px] uppercase font-bold opacity-50 mb-2 block">Sugerencias</span>
                            <ul className="space-y-1">
                                {insight.checklist.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs opacity-80">
                                        <div className="w-1 h-1 rounded-full bg-current" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Phase 2.4: ACTION SURFACE */}
                    {primarySurface && (
                        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end">
                            <div className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30 transition-colors cursor-help border border-transparent hover:border-black/5 dark:hover:border-white/10">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {primarySurface.label}
                                </span>
                                <Icon svg={ICONS.arrowRight} className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

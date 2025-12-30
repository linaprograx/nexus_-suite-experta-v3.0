
import React, { useState } from 'react';
import { AssistedInsight } from '../../core/assisted/assisted.types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

interface AssistedInsightsInlineProps {
    insights: AssistedInsight[];
}

import { generateActionSurfaces } from '../../core/actionsurfaces/actionSurface.engine';

export const AssistedInsightsInline: React.FC<AssistedInsightsInlineProps> = ({ insights }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    if (!insights || insights.length === 0) return null;

    // Phase 2.4: Action Surfaces
    // We only generate for the visible set (which is already sliced to 1)
    const visibleInsights = insights.slice(0, 1);
    const surfaces = generateActionSurfaces(visibleInsights);
    const primarySurface = surfaces.length > 0 ? surfaces[0] : null;

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    return (
        <div className="space-y-3 mb-4">
            {visibleInsights.map(insight => {
                const isExpanded = expandedIds.has(insight.id);
                // Color mapping based on severity
                const colorClass = insight.severity === 'critical' ? 'rose' :
                    insight.severity === 'warning' ? 'amber' :
                        insight.severity === 'success' ? 'emerald' : 'indigo';

                return (
                    <div
                        key={insight.id}
                        className={`rounded-xl border p-3 transition-all ${insight.severity === 'critical' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' :
                            insight.severity === 'warning' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' :
                                insight.severity === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                                    'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full ${insight.severity === 'critical' ? 'bg-rose-100 text-rose-600' :
                                insight.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                                    insight.severity === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-indigo-100 text-indigo-600'
                                } dark:bg-opacity-20`}>
                                <Icon svg={insight.severity === 'success' ? ICONS.check : ICONS.sparkles} className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold mb-0.5 ${insight.severity === 'critical' ? 'text-rose-900 dark:text-rose-100' :
                                    insight.severity === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                                        insight.severity === 'success' ? 'text-emerald-900 dark:text-emerald-100' :
                                            'text-indigo-900 dark:text-indigo-100'
                                    }`}>
                                    {insight.title}
                                </h4>
                                <p className={`text-xs leading-relaxed ${insight.severity === 'critical' ? 'text-rose-700 dark:text-rose-300' :
                                    insight.severity === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                                        insight.severity === 'success' ? 'text-emerald-700 dark:text-emerald-300' :
                                            'text-indigo-700 dark:text-indigo-300'
                                    }`}>
                                    {insight.summary}
                                </p>
                            </div>
                        </div>
                        {/* Expandable Details */}
                        <div className="mt-2 pl-[34px]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(insight.id)}
                                className="h-6 text-[10px] px-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            >
                                {isExpanded ? 'Ocultar detalles' : 'Ver análisis y sugerencias'}
                                <Icon svg={isExpanded ? ICONS.chevronDown : ICONS.chevronRight} className={`w-3 h-3 ml-1 ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>

                            {isExpanded && (
                                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {/* Why */}
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        <span className="font-medium text-slate-900 dark:text-slate-200 block mb-1">Análisis:</span>
                                        {insight.why}
                                    </div>

                                    {/* Evidence */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {insight.evidence.map((ev, idx) => (
                                            <div key={idx} className="bg-white/50 dark:bg-black/20 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{ev.label}</div>
                                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{ev.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Checklist */}
                                    {insight.checklist && (
                                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <span className="font-medium text-[11px] text-slate-900 dark:text-slate-200 block mb-2 uppercase tracking-wide">
                                                Sugerencias
                                            </span>
                                            <ul className="space-y-1">
                                                {insight.checklist.map((item, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                        <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Phase 2.4: PASSIVE ACTION SURFACE */}
                            {/* Render ONLY if expanded is FALSE to avoid clutter, or maybe always? 
                                User spec says "Action Surface" is a subtle hint.
                                Let's put it below the expand button if not expanded, or at bottom if expanded.
                            */}
                            {primarySurface && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-help group" title={primarySurface.description}>
                                        <Icon svg={ICONS.arrowRight || ICONS.chevronRight} className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                                        <span className="font-medium">{primarySurface.label}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div >
    );
};

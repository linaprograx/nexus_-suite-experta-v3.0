import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardPanel, panelHighlight } from '../cardStyles';

interface InsightsProps {
    insights: any[];
}

export const IntelligenceWidget: React.FC<InsightsProps> = ({ insights }) => {
    const navigate = useNavigate();
    const hasInsights = insights && insights.length > 0;
    const displayInsights = hasInsights ? insights.slice(0, 3) : [];

    return (
        <div className="space-y-6">
            <div className={dashboardPanel}>
                <div className={panelHighlight} />
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Icon svg={ICONS.star} className="w-3 h-3 text-indigo-500" /> Insights Rápidos
                </h3>
                {hasInsights ? (
                    <>
                        <div className="space-y-3">
                            {displayInsights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate('/cerebrity')}
                                    className="flex items-center justify-between text-xs group/i cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${insight.type === 'alert' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{insight.title}</span>
                                    </div>
                                    <Icon svg={ICONS.chevronRight} className="w-3 h-3 text-gray-400 opacity-0 group-hover/i:opacity-100 transition-opacity shrink-0" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/cerebrity')}
                            className="w-full mt-4 text-[10px] text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-widest text-center"
                        >
                            Ver Informe Completo
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Icon svg={ICONS.sparkles} className="w-7 h-7 text-indigo-300 dark:text-indigo-500/50 mb-2" />
                        <p className="text-xs text-gray-400 dark:text-slate-500">Aún sin insights</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">Genera actividad para recibir análisis</p>
                    </div>
                )}
            </div>

            {/* Micro Widget: Collegium */}
            <div
                onClick={() => navigate('/colegium')}
                className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>

                <h3 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Colegium</h3>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-lg font-serif mb-1">Reto Diario</p>
                        <p className="text-xs text-indigo-200 opacity-80">Gana +50XP hoy</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Icon svg={ICONS.play} className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

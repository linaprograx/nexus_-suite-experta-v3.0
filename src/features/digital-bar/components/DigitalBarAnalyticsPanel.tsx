import React from 'react';
import { useDigitalBar } from '../web/useDigitalBar';
import { KpiCard } from '../ui/KpiCard';
import { ActivityChart } from '../ui/ActivityChart';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { Spinner } from '../../../components/ui/Spinner';

const AvatarColumn = ({ title, children, accentColor = "bg-cyan-500" }: { title: string, children?: React.ReactNode, accentColor?: string }) => (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold text-cyan-800 dark:text-cyan-200 tracking-wide text-xs uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_rgba(34,211,238,0.5)]`}></span>
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {children}
        </div>
    </div>
);

export const DigitalBarAnalyticsPanel: React.FC = () => {
    const { metrics, insights, period, setPeriod, isLoading } = useDigitalBar();

    if (isLoading) {
        return (
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-full bg-white/20 dark:bg-slate-900/20 rounded-2xl border border-white/10" />
                ))}
            </div>
        );
    }

    const lastMetric = metrics[metrics.length - 1] || { tickets: 0, efficiency: 0, stress: 0 };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900 dark:text-slate-100 p-4">

            {/* Column 1: Metricas en Tiempo Real */}
            <AvatarColumn title="Métricas en Vivo">
                <div className="grid grid-cols-1 gap-4">
                    <KpiCard
                        title="Eficiencia Actual"
                        value={`${lastMetric.efficiency.toFixed(1)}%`}
                        icon={<Icon svg={ICONS.activity} className="w-4 h-4" />}
                        color="text-emerald-500"
                    />
                    <KpiCard
                        title="Nivel de Estrés"
                        value={`${lastMetric.stress.toFixed(0)}%`}
                        icon={<Icon svg={ICONS.alertCircle} className="w-4 h-4" />}
                        color="text-amber-500"
                    />
                    <KpiCard
                        title="Tickets / Hora"
                        value={lastMetric.tickets}
                        icon={<Icon svg={ICONS.fileText} className="w-4 h-4" />}
                        color="text-cyan-500"
                    />
                </div>

                <div className="mt-6 flex flex-col h-[200px] w-full min-h-[200px] relative">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Actividad Reciente</h4>
                    <div className="flex-1 w-full min-h-0 bg-white/5 dark:bg-slate-800/20 rounded-xl overflow-hidden">
                        <ActivityChart data={metrics} dataKey="tickets" height={180} color="#06b6d4" />
                    </div>
                </div>
            </AvatarColumn>

            {/* Column 2: Insights & IA */}
            <AvatarColumn title="IA Insights & Predicciones" accentColor="bg-fuchsia-500">
                {insights && (
                    <div className="space-y-4">
                        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-4 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800">
                            <div className="flex items-center gap-2 mb-2 text-fuchsia-600 font-bold text-xs uppercase">
                                <Icon svg={ICONS.cpu} className="w-4 h-4" /> Análisis
                            </div>
                            <p className="text-sm font-medium">{insights.summary}</p>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase">
                                <Icon svg={ICONS.zap} className="w-4 h-4" /> Recomendación
                            </div>
                            <p className="text-sm font-medium">{insights.recommendation}</p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-bold text-amber-600 uppercase">Hora Pico Estimada</div>
                                <div className="text-xl font-black text-amber-800 dark:text-amber-200">{insights.peakHour}</div>
                            </div>
                            <Icon svg={ICONS.trendingUp} className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>
                )}
            </AvatarColumn>

            {/* Column 3: Controles & Simulación */}
            <AvatarColumn title="Controles Operativos" accentColor="bg-slate-500">
                <div className="space-y-4">
                    <div className="bg-white/50 p-4 rounded-xl border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Periodo de Análisis</label>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            {['day', 'week', 'month'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p as any)}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${period === p ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                            <Icon svg={ICONS.settings} className="w-4 h-4" />
                            Configuración Avanzada
                        </button>
                    </div>
                </div>
            </AvatarColumn>

        </div>
    );
};

import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { dashboardPanel, panelHighlight } from '../cardStyles';

interface MomentumChartProps {
    data: { date: string; recipes: number; tasks: number; total: number }[];
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ data }) => {
    // Real trend: last 3 days vs the previous 3 days
    const trend = React.useMemo(() => {
        if (!data || data.length < 6) return null;
        const recent = data.slice(-3).reduce((s, d) => s + (d.total || 0), 0);
        const prev = data.slice(-6, -3).reduce((s, d) => s + (d.total || 0), 0);
        if (prev === 0 && recent === 0) return { pct: 0, dir: 'flat' as const };
        if (prev === 0) return { pct: 100, dir: 'up' as const };
        const pct = Math.round(((recent - prev) / prev) * 100);
        return { pct, dir: pct > 5 ? 'up' as const : pct < -5 ? 'down' as const : 'flat' as const };
    }, [data]);

    const trendStyle =
        trend?.dir === 'up' ? 'text-emerald-500 bg-emerald-500/10'
            : trend?.dir === 'down' ? 'text-rose-500 bg-rose-500/10'
                : 'text-slate-400 bg-slate-400/10';

    return (
        <div className={`${dashboardPanel} min-h-[320px] h-[320px] flex flex-col w-full`}>
            <div className={panelHighlight} />
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Momentum Operativo</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Actividad últimos 7 días</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendStyle}`}>
                    <Icon svg={ICONS.trendingUp} className={`w-3 h-3 ${trend?.dir === 'down' ? 'rotate-180' : ''}`} />
                    <span>{trend ? `${trend.pct > 0 ? '+' : ''}${trend.pct}%` : 'Estable'}</span>
                </div>
            </div>

            <div className="w-full h-[220px]">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradRecipes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(val) => {
                                    try {
                                        return new Date(val).toLocaleDateString('es-ES', { weekday: 'narrow' });
                                    } catch (e) {
                                        return '';
                                    }
                                }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                formatter={(value: any, name: any) => [value, name === 'recipes' ? 'Recetas' : 'Ideas']}
                                labelFormatter={(val) => { try { return new Date(val).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }); } catch { return ''; } }}
                            />
                            <Legend
                                verticalAlign="top" align="right" iconType="circle" iconSize={8}
                                formatter={(value) => <span className="text-[10px] text-slate-400">{value === 'recipes' ? 'Recetas' : 'Ideas'}</span>}
                            />
                            <Area type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gradTasks)" />
                            <Area type="monotone" dataKey="recipes" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRecipes)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                        Recopilando datos de actividad...
                    </div>
                )}
            </div>
        </div>
    );
};

import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface MomentumChartProps {
    data: any[];
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ data }) => {
    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25),_0_20px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_25px_-5px_rgba(99,102,241,0.4),_0_20px_50px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4),_0_25px_60px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6),_0_25px_60px_-12px_rgba(0,0,0,0.7)] transition-all duration-500 min-h-[320px] h-[320px] flex flex-col w-full relative overflow-hidden group">
            {/* Glass Highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 px-1">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Momentum Operativo</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Actividad últimos 7 días</p>
                </div>
                {/* Simple Trend Indicator */}
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                    <Icon svg={ICONS.trendingUp} className="w-3 h-3" />
                    <span>Estable</span>
                </div>
            </div>

            <div className="flex-1 w-full -ml-4">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorSlope" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { weekday: 'narrow' })}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="tasks"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSlope)"
                            />
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

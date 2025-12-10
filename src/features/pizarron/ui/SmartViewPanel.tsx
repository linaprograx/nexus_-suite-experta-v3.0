import React, { useMemo } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { PizarronTask } from '../../../../types';
import { getBoardAnalytics } from '../data/analytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { ChartContainer } from '../../../components/ui/ChartContainer';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface SmartViewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: PizarronTask[];
    columns: string[];
}

export const SmartViewPanel: React.FC<SmartViewPanelProps> = ({ isOpen, onClose, tasks, columns }) => {
    const analytics = useMemo(() => getBoardAnalytics(tasks, columns), [tasks, columns]);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F'];

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Vista Inteligente" side="right" className="max-w-xl">
            <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-700/30">
                        <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">Total Tareas</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{analytics.totalTasks}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-700/30">
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">Equilibrio Creativo</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{analytics.creativeBalance}%</p>
                        <p className="text-xs text-slate-500">Ideas vs Operativo</p>
                    </div>
                </div>

                {/* Tasks by Status Chart */}
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/30 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Icon svg={ICONS.layout} className="w-4 h-4 text-slate-500" /> Distribución por Estado
                    </h3>
                    <div className="h-48 w-full">
                        {analytics.tasksByStatus.length > 0 ? (
                            <ChartContainer>
                                <BarChart data={analytics.tasksByStatus}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {analytics.tasksByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sin datos</div>
                        )}
                    </div>
                </div>

                {/* Ranking of Top Columns */}
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/30 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Icon svg={ICONS.trendingUp} className="w-4 h-4 text-slate-500" /> Top Columnas Activas
                    </h3>
                    <div className="space-y-3">
                        {analytics.topColumns.slice(0, 3).map((col, idx) => (
                            <div key={col.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`flex justify-center items-center w-5 h-5 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-slate-300">{col.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{col.count} tareas</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tasks Per Day (Simple Line/Bar representation or text for now if chart is too complex for small space) */}
                {analytics.tasksPerDay.length > 0 && (
                    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/30 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Icon svg={ICONS.calendar} className="w-4 h-4 text-slate-500" /> Actividad Reciente
                        </h3>
                        <div className="h-40 w-full">
                            <ChartContainer>
                                <BarChart data={analytics.tasksPerDay.slice(-7)}>
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </div>
                )}

            </div>
        </Drawer>
    );
};

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartContainer } from '../ui/ChartContainer';
import { PizarronTask } from '../../types';

// Since I don't know if date-fns is installed (package.json didn't show it, but it's common), I'll use native JS Date
const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

interface AnalyticsPanelProps {
    tasks: PizarronTask[];
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ tasks }) => {

    const tasksByColumn = React.useMemo(() => {
        const counts = { ideas: 0, pruebas: 0, aprobado: 0 };
        tasks.forEach(t => {
            if (counts[t.status] !== undefined) counts[t.status]++;
        });
        return [
            { name: 'Ideas', value: counts.ideas },
            { name: 'Pruebas', value: counts.pruebas },
            { name: 'Aprobado', value: counts.aprobado },
        ];
    }, [tasks]);

    const completionRate = React.useMemo(() => {
        const total = tasks.length;
        if (total === 0) return 0;
        const completed = tasks.filter(t => t.status === 'aprobado').length;
        return Math.round((completed / total) * 100);
    }, [tasks]);

    const dailyActivity = React.useMemo(() => {
        // Last 7 days
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = formatDate(d);

            const count = tasks.filter(t => {
                if (!t.createdAt) return false;
                const taskDate = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                return taskDate.getDate() === d.getDate() && taskDate.getMonth() === d.getMonth() && taskDate.getFullYear() === d.getFullYear();
            }).length;

            data.push({ date: dateStr, tasks: count });
        }
        return data;
    }, [tasks]);

    // Tasks by Category
    const tasksByCategory = React.useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach(t => {
            const cat = t.category || 'Sin categoría';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    return (
        <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">Tasa de Finalización</h3>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{completionRate}%</div>
                    <p className="text-xs text-slate-400">Tareas aprobadas vs totales</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">Total Tareas</h3>
                    <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">{tasks.length}</div>
                    <p className="text-xs text-slate-400">En el tablero actual</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Estado de Tareas</h3>
                <div className="h-64">
                    <ChartContainer>
                        <BarChart data={tasksByColumn}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                            />
                            <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Actividad Diaria (Últimos 7 días)</h3>
                <div className="h-64">
                    <ChartContainer>
                        <LineChart data={dailyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="tasks" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ChartContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Distribución por Categoría</h3>
                <div className="h-64">
                    <ChartContainer>
                        <PieChart>
                            <Pie
                                data={tasksByCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {tasksByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                        </PieChart>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};

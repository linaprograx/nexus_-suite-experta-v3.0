import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../../components/ui/Card';

interface WeekChartProps {
  tasksByDay?: Record<string, number>;
}

export const WeekChart: React.FC<WeekChartProps> = ({ tasksByDay }) => {
  if (!tasksByDay) return null;

  // Transform data for chart: sort by date and format
  const data = Object.entries(tasksByDay)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
      fullDate: date,
      count
    }))
    // Take last 7 days if more exist, or just show what we have
    .slice(-7);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {payload[0].value} tarea{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 shadow-sm h-[300px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Actividad Diaria</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3B82F6" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

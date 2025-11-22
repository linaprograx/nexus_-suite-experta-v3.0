import React from 'react';
import { Card } from '../../../components/ui/Card';
import { CreativeWeekResult } from '../creativeWeekService';

interface CreativeWeekPanelProps {
  data: CreativeWeekResult;
}

export const CreativeWeekPanel: React.FC<CreativeWeekPanelProps> = ({ data }) => {
  const { days, summary } = data;
  const maxTasks = Math.max(...days.map(d => d.tasksCount), 1); // Avoid division by zero

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Semana Creativa</h2>
      
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tareas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalWeekTasks}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Promedio Diario</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.avgPerDay.toFixed(1)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Mejor Día</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.bestDay ? (
              <>
                {summary.bestDay.dateLabel} 
                <span className="text-sm font-normal ml-2 text-gray-500">
                  ({summary.bestDay.tasksCount})
                </span>
              </>
            ) : '-'}
          </p>
        </div>
      </div>

      {/* Gráfico de Barras Simple */}
      <div className="h-48 flex items-end justify-between gap-2 mt-4">
        {days.map((day) => {
          const heightPercentage = (day.tasksCount / maxTasks) * 100;
          return (
            <div key={day.isoDate} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex items-end justify-center h-40 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                <div 
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-500 ease-out rounded-t-md mx-1"
                  style={{ height: `${heightPercentage}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap z-10">
                    {day.tasksCount} tareas
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
                {day.dateLabel}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

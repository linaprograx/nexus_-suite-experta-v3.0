import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface SummaryCardsProps {
  stats?: {
    totalTasks: number;
    operationalRatio: string;
    creationPeaks: string;
    mostUsedCategory: string;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  if (!stats) return null;

  const operationalRatioVal = parseFloat(stats.operationalRatio || '0');
  const creativeDensity = Math.round((1 - operationalRatioVal) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4 flex items-center space-x-4 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300">
          <Icon svg={ICONS.check} className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tareas Totales</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</h3>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full text-purple-600 dark:text-purple-300">
          <Icon svg={ICONS.sparkles} className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Densidad Creativa</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{creativeDensity}%</h3>
        </div>
      </Card>

      <Card className="p-4 flex items-center space-x-4 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full text-green-600 dark:text-green-300">
          <Icon svg={ICONS.calendar} className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Mejor Día</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[120px]" title={stats.creationPeaks}>
            {stats.creationPeaks !== 'N/A' ? new Date(stats.creationPeaks).toLocaleDateString('es-ES', { weekday: 'long' }) : 'N/A'}
          </h3>
        </div>
      </Card>
    </div>
  );
};

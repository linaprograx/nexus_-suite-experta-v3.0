import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface WeeklySummaryProps {
  summary: string;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ summary }) => {
  return (
    <Card className="p-6 backdrop-blur-md bg-white/40 dark:bg-slate-900/20 ring-1 ring-white/30 dark:ring-slate-800/40 rounded-xl border-l-4 border-purple-500 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <Icon svg={ICONS.brain} className="w-5 h-5 mr-2 text-purple-600" />
          Resumen Semanal
      </h3>
      <p className="text-gray-700 dark:text-gray-300 italic">"{summary}"</p>
    </Card>
  );
};

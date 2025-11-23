import React from 'react';
import { Card } from '../../../components/ui/Card';

interface KeyInsightsProps {
  insights: string[];
}

export const KeyInsights: React.FC<KeyInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="p-6 backdrop-blur-md bg-white/40 dark:bg-slate-900/20 ring-1 ring-white/30 dark:ring-slate-800/40 rounded-xl h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Insights Clave</h3>
        <ul className="space-y-3">
        {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
            </li>
        ))}
        </ul>
    </Card>
  );
};

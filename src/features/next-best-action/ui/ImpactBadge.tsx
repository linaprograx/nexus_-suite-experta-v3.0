import React from 'react';
import { NextBestActionData } from '../nextBestActionService';

export const ImpactBadge: React.FC<{ impact: NextBestActionData['impact'] }> = ({ impact }) => {
  const colors = {
    high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', // #16a34a is green-600, using green-700 for better contrast on light bg
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', // #fbbf24 is amber-400
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'     // #6b7280 is gray-500
  };

  const labels = {
    high: 'Alto Impacto',
    medium: 'Impacto Medio',
    low: 'Bajo Impacto'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[impact] || colors.medium}`}>
      {labels[impact] || 'Impacto'}
    </span>
  );
};

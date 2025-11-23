import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface Recommendation {
    title: string;
    description: string;
    impact: 'bajo' | 'medio' | 'alto';
    difficulty: 'baja' | 'media' | 'alta';
}

interface RecommendedActionProps {
  recommendation: Recommendation;
}

const ImpactBadge: React.FC<{ value: string }> = ({ value }) => {
  const colors = {
    alto: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medio: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    bajo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  const colorClass = colors[value.toLowerCase() as keyof typeof colors] || colors.bajo;
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>{value.toUpperCase()}</span>;
};

const DifficultyBadge: React.FC<{ value: string }> = ({ value }) => {
     const colors = {
        alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        media: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        baja: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    const colorClass = colors[value.toLowerCase() as keyof typeof colors] || colors.baja;
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>{value.toUpperCase()}</span>;
}

export const RecommendedAction: React.FC<RecommendedActionProps> = ({ recommendation }) => {
  if (!recommendation) return null;

  return (
    <Card className="p-6 backdrop-blur-md bg-white/40 dark:bg-slate-900/20 ring-1 ring-white/30 dark:ring-slate-800/40 rounded-xl h-full flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:shadow-slate-900/60">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Icon svg={ICONS.sparkles} className="w-5 h-5 mr-2 text-yellow-500" />
            Próxima Acción Recomendada
        </h3>
        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-2">{recommendation.title}</h4>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">{recommendation.description}</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 text-sm mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
         <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Impacto:</span>
            <ImpactBadge value={recommendation.impact} />
         </div>
         <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Dificultad:</span>
            <DifficultyBadge value={recommendation.difficulty} />
         </div>
      </div>
    </Card>
  );
};

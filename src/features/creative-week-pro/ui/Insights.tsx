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

interface InsightsProps {
  summary: string;
  insights: string[];
  recommendation?: Recommendation;
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


export const Insights: React.FC<InsightsProps> = ({ summary, insights, recommendation }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 border-l-4 border-purple-500">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Icon svg={ICONS.brain} className="w-5 h-5 mr-2 text-purple-600" />
            Resumen Semanal
        </h3>
        <p className="text-gray-700 dark:text-gray-300 italic">"{summary}"</p>
      </Card>

      {insights && insights.length > 0 && (
        <Card className="p-6 bg-white dark:bg-gray-800">
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
      )}

      {recommendation && (
        <Card className="p-6 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800/30">
          <div className="flex items-start justify-between">
             <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center">
                    <Icon svg={ICONS.sparkles} className="w-5 h-5 mr-2 text-yellow-500" />
                    Próxima Acción Recomendada
                </h3>
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-2">{recommendation.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{recommendation.description}</p>
             </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
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
      )}
    </div>
  );
};

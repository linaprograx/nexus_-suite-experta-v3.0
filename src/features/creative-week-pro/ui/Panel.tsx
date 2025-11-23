import React from 'react';
import { useCreativeWeekPro } from '../useCreativeWeekPro';
import { SummaryCards } from './SummaryCards';
import { WeekChart } from './WeekChart';
import { WeeklySummary } from './WeeklySummary';
import { KeyInsights } from './KeyInsights';
import { RecommendedAction } from './RecommendedAction';
import { PizarronTask } from '../../../../types';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';
import { useUI } from '../../../context/UIContext';

interface CreativeWeekPanelProps {
  tasks: PizarronTask[];
  userName: string;
}

export const CreativeWeekPanel: React.FC<CreativeWeekPanelProps> = ({ tasks, userName }) => {
  const { summary, insights, recommendation, stats, loading, error } = useCreativeWeekPro(tasks, userName);
  const { compactMode } = useUI();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Error" description={error} />
    );
  }

  return (
    <div className={compactMode ? 'space-y-3' : 'space-y-6'}>
      <div className={`flex items-center justify-between ${compactMode ? 'mb-1' : 'mb-2'}`}>
        <h2 className={`${compactMode ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}>Semana Creativa</h2>
      </div>

      <SummaryCards stats={stats} />

      {/* Main Content Layout */}
      <div className={`flex flex-col ${compactMode ? 'gap-3' : 'gap-6'}`}>
        {/* Full width chart */}
        <div className="w-full">
           <WeekChart tasksByDay={stats?.tasksByDay} />
        </div>

        {/* Analysis Columns */}
        <div className={`grid grid-cols-1 xl:grid-cols-2 ${compactMode ? 'gap-3' : 'gap-6'}`}>
            {/* Left Column: Summary + Insights */}
            <div className={`flex flex-col ${compactMode ? 'space-y-3' : 'space-y-6'}`}>
                <WeeklySummary summary={summary} />
                <div className="flex-grow">
                     <KeyInsights insights={insights} />
                </div>
            </div>

            {/* Right Column: Recommendation */}
            <div className="h-full">
               {recommendation && <RecommendedAction recommendation={recommendation} />}
            </div>
        </div>
      </div>
    </div>
  );
};

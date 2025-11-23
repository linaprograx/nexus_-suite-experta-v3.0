import React from 'react';
import { useCreativeWeekPro } from '../useCreativeWeekPro';
import { SummaryCards } from './SummaryCards';
import { WeekChart } from './WeekChart';
import { Insights } from './Insights';
import { PizarronTask } from '../../../../types';
import { Spinner } from '../../../components/ui/Spinner';
import { Alert } from '../../../components/ui/Alert';

interface CreativeWeekPanelProps {
  tasks: PizarronTask[];
  userName: string;
}

export const CreativeWeekPanel: React.FC<CreativeWeekPanelProps> = ({ tasks, userName }) => {
  const { summary, insights, recommendation, stats, loading, error } = useCreativeWeekPro(tasks, userName);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Semana Creativa</h2>
        {/* Optional: Add refresh button or date range here if needed */}
      </div>

      <SummaryCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <WeekChart tasksByDay={stats?.tasksByDay} />
        </div>
        <div>
           <Insights 
              summary={summary}
              insights={insights}
              recommendation={recommendation}
           />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { FormattedTask } from '../todayService';
import Column from './Column';

interface PanelProps {
  ideas: FormattedTask[];
  inProgress: FormattedTask[];
  urgent: FormattedTask[];
}

const Panel: React.FC<PanelProps> = ({ ideas, inProgress, urgent }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lo que debes hacer hoy</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Tu roadmap diario priorizado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="Ideas" items={ideas} />
        <Column title="En Progreso" items={inProgress} />
        <Column title="Urgente" items={urgent} />
      </div>
    </div>
  );
};

export default Panel;

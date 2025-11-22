import React from 'react';
import { FormattedTask } from '../todayService';
import ProgressBar from './ProgressBar';

interface CardProps {
  item: FormattedTask;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Urgente': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'Ideas': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Desarrollo': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'Marketing': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

const Card: React.FC<CardProps> = ({ item }) => {
  return (
    <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(item.category)}`}>
          {item.category}
        </span>
      </div>
      
      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 line-clamp-2">
        {item.title}
      </h4>

      <div className="space-y-3">
        <ProgressBar progress={item.progress} />
        
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>{item.progress}% completado</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
              {item.author.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;

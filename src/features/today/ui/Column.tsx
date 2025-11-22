import React from 'react';
import { FormattedTask } from '../todayService';
import Card from './Card';

interface ColumnProps {
  title: string;
  items: FormattedTask[];
}

const Column: React.FC<ColumnProps> = ({ title, items }) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
        {items.map(item => <Card key={item.id} item={item} />)}
        {items.length === 0 && (
           <p className="text-xs text-slate-400 italic">No hay tareas</p>
        )}
      </div>
    </div>
  );
};

export default Column;

import React from 'react';
import { PizarronTask } from '../../../../types';
import { getCategoryColor } from '../../../components/pizarron/helpers';

interface TimelineViewProps {
  tasks: PizarronTask[];
  onTaskClick: (task: PizarronTask) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onTaskClick }) => {
    // Basic implementation: 30 days view starting from today - 5 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 5);

    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };
    
    // Sort tasks by date
    const sortedTasks = [...tasks].sort((a, b) => {
        const dateA = a.dueDate ? a.dueDate.toDate().getTime() : 0;
        const dateB = b.dueDate ? b.dueDate.toDate().getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="w-full h-full overflow-hidden flex flex-col px-4 pb-4">
            <div className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg rounded-2xl h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex border-b border-white/10 overflow-hidden">
                    <div className="w-[250px] flex-shrink-0 p-4 font-semibold text-slate-700 dark:text-slate-200 border-r border-white/10 bg-white/20 dark:bg-white/5">
                        Tarea
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar flex-1">
                        {days.map(day => (
                            <div key={day.toISOString()} className="flex-shrink-0 w-12 text-center py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border-r border-white/10 last:border-r-0 bg-white/20 dark:bg-white/5">
                                <div className={isSameDay(day, today) ? "text-indigo-500 font-bold" : ""}>{day.getDate()}</div>
                                <div className="text-[10px] opacity-70">{day.toLocaleString('default', { weekday: 'short' })}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Body */}
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                     <div className="min-w-fit">
                        {sortedTasks.map(task => {
                             const hasDate = !!task.dueDate;
                             return (
                                 <div key={task.id} className="flex hover:bg-white/5 transition-colors border-b border-white/5 group">
                                     {/* Task Name Column (sticky) */}
                                     <div className="sticky left-0 w-[250px] flex-shrink-0 p-3 text-sm font-medium text-slate-700 dark:text-slate-200 truncate border-r border-white/10 bg-white/40 dark:bg-slate-900/80 backdrop-blur-md z-10 flex items-center gap-2">
                                         <div className={`w-2 h-2 rounded-full ${getCategoryColor(task.category).replace('border-l-4', '').replace('border-', 'bg-')}`}></div>
                                         <span className="truncate">{task.texto}</span>
                                     </div>
                                     
                                     {/* Timeline Bars */}
                                     <div className="flex">
                                         {days.map(day => {
                                             const isActive = task.dueDate && isSameDay(task.dueDate.toDate(), day);
                                             return (
                                                 <div key={day.toISOString()} className="flex-shrink-0 w-12 h-12 border-r border-white/5 flex items-center justify-center p-1 relative">
                                                     {/* Current day indicator line */}
                                                     {isSameDay(day, today) && (
                                                         <div className="absolute top-0 bottom-0 left-1/2 w-px bg-indigo-500/20 pointer-events-none"></div>
                                                     )}

                                                     {isActive && (
                                                         <div 
                                                             onClick={() => onTaskClick(task)}
                                                             className={`w-full h-8 rounded-md cursor-pointer shadow-sm hover:scale-110 transition-transform ${getCategoryColor(task.category).replace('border-l-4', '').replace('border-', 'bg-')} opacity-80 hover:opacity-100`}
                                                             title={`${task.texto} - ${task.status}`}
                                                         />
                                                     )}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             );
                        })}
                     </div>
                </div>
            </div>
        </div>
    );
};

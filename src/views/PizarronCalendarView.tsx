import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';
import { PizarronTask } from '../../types';
import { getDaysInMonth, getFirstDayOfMonth, isSameDay, DAYS_OF_WEEK, getCategoryColor } from '../components/pizarron/helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface PizarronCalendarViewProps {
  tasks: PizarronTask[];
  onDropTask: (date: Date) => void;
  onTaskClick: (task: PizarronTask) => void;
  onSuggestSlots?: () => void; // AI Placeholder
}

const HEATMAP_COLORS = [
    'bg-slate-50 dark:bg-slate-800/50',
    'bg-indigo-50 dark:bg-indigo-900/20',
    'bg-indigo-100 dark:bg-indigo-900/40',
    'bg-indigo-200 dark:bg-indigo-900/60',
    'bg-indigo-300 dark:bg-indigo-900/80',
];

export const PizarronCalendarView: React.FC<PizarronCalendarViewProps> = ({ tasks, onDropTask, onTaskClick, onSuggestSlots }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<'month' | 'week'>('month');

  const getIntensityClass = (count: number) => {
      if (count === 0) return HEATMAP_COLORS[0];
      if (count <= 2) return HEATMAP_COLORS[1];
      if (count <= 4) return HEATMAP_COLORS[2];
      if (count <= 6) return HEATMAP_COLORS[3];
      return HEATMAP_COLORS[4];
  };

  const calendarGrid = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const grid = [];
    
    if (viewMode === 'month') {
        let day = 1;
        for (let i = 0; i < 6; i++) { 
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    week.push(null);
                } else if (day > daysInMonth) {
                    week.push(null);
                } else {
                    week.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                    day++;
                }
            }
            grid.push(week);
            if (day > daysInMonth) break;
        }
    } else {
        // Week view logic
        // Find start of current week (Sunday)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            week.push(d);
        }
        grid.push(week);
    }
    return grid;
  }, [currentDate, viewMode]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      onDropTask(date);
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 h-full flex flex-col shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => {
                    const newDate = new Date(currentDate);
                    viewMode === 'month' ? newDate.setMonth(newDate.getMonth() - 1) : newDate.setDate(newDate.getDate() - 7);
                    setCurrentDate(newDate);
                }}>
                    <Icon svg={ICONS.chevronLeft} />
                </Button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 min-w-[200px] text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    {viewMode === 'week' && ` (Semana ${Math.ceil(currentDate.getDate() / 7)})`}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => {
                    const newDate = new Date(currentDate);
                    viewMode === 'month' ? newDate.setMonth(newDate.getMonth() + 1) : newDate.setDate(newDate.getDate() + 7);
                    setCurrentDate(newDate);
                }}>
                    <Icon svg={ICONS.chevronRight} />
                </Button>
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={onSuggestSlots}>
                    <Icon svg={ICONS.sparkles} className="h-4 w-4 mr-2 text-amber-500" />
                    Sugerir Slots (IA)
                </Button>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Mes
                    </button>
                    <button 
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Semana
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 py-2">
                    {day}
                </div>
            ))}
        </div>

        <div className="flex-1 flex flex-col">
            {calendarGrid.map((week, wIndex) => (
                <div key={wIndex} className={`flex-1 grid grid-cols-7 ${viewMode === 'month' ? 'min-h-[100px]' : 'h-full'}`}>
                    {week.map((date, dIndex) => {
                        if (!date) return <div key={dIndex} className="bg-transparent border border-white/5 dark:border-slate-800/50" />;
                        
                        const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate.toDate(), date));
                        const isToday = isSameDay(new Date(), date);
                        const intensity = getIntensityClass(dayTasks.length);

                        return (
                            <div 
                                key={dIndex} 
                                className={`
                                    border border-white/10 dark:border-slate-700/30 p-2 transition-colors relative group
                                    ${intensity}
                                    ${isToday ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}
                                `}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, date)}
                            >
                                <span className={`
                                    text-xs font-semibold mb-1 block w-6 h-6 rounded-full flex items-center justify-center
                                    ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}
                                `}>
                                    {date.getDate()}
                                </span>
                                
                                <div className="space-y-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => onTaskClick(task)}
                                            draggable
                                            className={`
                                                text-[10px] p-1.5 rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all
                                                border-l-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                                                ${getCategoryColor(task.category).replace('bg-', 'border-')}
                                            `}
                                        >
                                            <div className="font-medium truncate">{task.texto}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </div>
  );
};

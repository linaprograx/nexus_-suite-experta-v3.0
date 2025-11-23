import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';
import { getDaysInMonth, getFirstDayOfMonth, isSameDay, DAYS_OF_WEEK, getCategoryColor } from './helpers';

interface DayCellProps {
    date: Date;
    tasks: PizarronTask[];
    onDropTask: (date: Date) => void;
    onTaskClick: (task: PizarronTask) => void;
}

const DayCell: React.FC<DayCellProps> = ({ date, tasks, onDropTask, onTaskClick }) => {
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        onDropTask(date);
    };

    return (
        <div 
            className="border dark:border-gray-700 p-1 min-h-[50px] overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <span className="text-xs font-semibold">{date.getDate()}</span>
            <div className="space-y-1 mt-1">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${getCategoryColor(task.category).replace('border-l-4', '').replace('border-', 'bg-')}`}
                        onClick={() => onTaskClick(task)}
                        title={task.texto}
                    >
                        {task.texto}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CalendarViewProps {
  tasks: PizarronTask[],
  onDropTask: (date: Date) => void,
  onTaskClick: (task: PizarronTask) => void,
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onDropTask, onTaskClick }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const calendarGrid = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const grid = [];
    let day = 1;
    for (let i = 0; i < 6; i++) { // 6 semanas
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
    return grid;
  }, [currentDate]);

  return (
    <div className="bg-card p-2 h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><Icon svg={ICONS.chevronLeft} /></Button>
            <h3 className="font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><Icon svg={ICONS.chevronRight} /></Button>
        </div>
        
        <div className="flex-1 overflow-auto">
            <div className="min-w-[900px] h-full flex flex-col">
                <div className="grid grid-cols-7 text-xs font-bold text-center border-l border-t border-r flex-shrink-0">
                    {DAYS_OF_WEEK.map(day => <div key={day} className="p-1">{day}</div>)}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l">
                    {calendarGrid.flat().map((date, index) => 
                        date ? (
                            <DayCell 
                                key={index}
                                date={date}
                                tasks={tasks.filter(t => t.dueDate && isSameDay(t.dueDate.toDate(), date))}
                                onDropTask={onDropTask}
                                onTaskClick={onTaskClick}
                            />
                        ) : <div key={index} className="border-t border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" />
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

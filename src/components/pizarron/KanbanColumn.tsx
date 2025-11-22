import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';
import { PizarronCard } from './PizarronCard';

interface KanbanColumnProps {
  title: string;
  status: 'ideas' | 'pruebas' | 'aprobado';
  tasks: PizarronTask[];
  onAddTask: (status: 'ideas' | 'pruebas' | 'aprobado') => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropOnColumn: (status: 'ideas' | 'pruebas' | 'aprobado') => void;
  onOpenTaskDetail: (task: PizarronTask) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, tasks, onAddTask, onDragStart, onDropOnColumn, onOpenTaskDetail }) => {
  return (
    <div 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex flex-col w-80 flex-shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(status);
      }}
    >
      <h2 className="font-semibold text-center p-2">{title}</h2>
      <div className="flex-1 overflow-y-auto space-y-2 p-1">
        {tasks.map(task => <PizarronCard key={task.id} task={task} onDragStart={(e) => onDragStart(e, task.id)} onOpenDetail={() => onOpenTaskDetail(task)} />)}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onAddTask(status)}>
        <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Añadir Idea
      </Button>
    </div>
  );
};

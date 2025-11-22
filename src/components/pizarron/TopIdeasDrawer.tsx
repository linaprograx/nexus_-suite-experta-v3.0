import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';

interface TopIdeasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PizarronTask[];
  onTaskClick: (task: PizarronTask) => void;
}

export const TopIdeasDrawer: React.FC<TopIdeasDrawerProps> = ({ isOpen, onClose, tasks, onTaskClick }) => {
  const topTasks = React.useMemo(() => {
    return [...tasks]
      .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
      .slice(0, 10);
  }, [tasks]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Contenido del Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Top Ideas (por Votos)</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon svg={ICONS.x} className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto space-y-2">
          {topTasks.map(task => (
            <div 
              key={task.id} 
              className="p-2 rounded-md bg-secondary shadow-sm cursor-pointer hover:bg-accent"
              onClick={() => { onTaskClick(task); onClose(); }}
            >
              <p className="text-sm font-medium truncate">{task.texto}</p>
              <span className="text-xs text-primary">{task.upvotes?.length || 0} Votos</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

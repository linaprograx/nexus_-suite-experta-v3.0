import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';
import { getCategoryColor, getPriorityIcon } from './helpers';

interface PizarronCardProps {
  task: PizarronTask;
  onDragStart: (e: React.DragEvent) => void;
  onOpenDetail: () => void;
}

export const PizarronCard: React.FC<PizarronCardProps> = ({ task, onDragStart, onOpenDetail }) => {
  const { icon: priorityIcon, color: priorityColor } = getPriorityIcon(task.priority);

  const averageRating = React.useMemo(() => {
    const ratings = Object.values(task.starRating || {});
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => Number(sum) + Number(rating), 0);
    return Number(total) / ratings.length;
  }, [task.starRating]);

  return (
    <Card 
      className={`p-3 cursor-pointer group relative mb-2 ${getCategoryColor(task.category)} border-l-4`}
      draggable="true"
      onDragStart={onDragStart}
      onClick={onOpenDetail}
    >
      {/* Task Text */}
      <p className="text-sm font-medium leading-snug mb-2">{task.texto}</p>

      {/* Labels */}
      <div className="flex flex-wrap gap-1">
        {task.labels?.slice(0, 3).map(label => (
          <span key={label} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{label}</span>
        ))}
      </div>

      {/* Footer Icons and Info */}
      <div className="flex justify-between items-center mt-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className={priorityColor}>
            <Icon svg={priorityIcon} className="h-4 w-4" />
          </span>
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Icon svg={ICONS.paperclip} className="h-4 w-4" />
              {task.attachments.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.upvotes?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <Icon svg={ICONS.arrowUp} className="h-4 w-4" />
              {task.upvotes.length}
            </span>
          )}
          {averageRating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <Icon svg={ICONS.star} className="h-4 w-4" />
              {averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      {task.authorName && (
        <div className="flex items-center gap-2 pt-2 border-t mt-2">
          <img src={task.authorPhotoURL || `https://ui-avatars.com/api/?name=${task.authorName}&background=random`} alt={task.authorName} className="w-6 h-6 rounded-full" />
          <span className="text-xs text-muted-foreground">{task.authorName}</span>
        </div>
      )}
    </Card>
  );
};

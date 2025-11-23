import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, Tag } from '../../../types';
import { getCategoryColor, getPriorityIcon } from './helpers';
import { useUI } from '../../context/UIContext';
import { motion } from 'framer-motion';

interface PizarronCardProps {
  task: PizarronTask;
  onDragStart: (e: React.DragEvent) => void;
  onOpenDetail: () => void;
  allTags?: Tag[];
}

export const PizarronCard: React.FC<PizarronCardProps> = ({ task, onDragStart, onOpenDetail, allTags }) => {
  const { compactMode, theme } = useUI();
  const { icon: priorityIcon, color: priorityColor } = getPriorityIcon(task.priority);

  const averageRating = React.useMemo(() => {
    const ratings = Object.values(task.starRating || {});
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => Number(sum) + Number(rating), 0);
    return Number(total) / ratings.length;
  }, [task.starRating]);

  const isUrgent = task.priority === 'alta' || task.category === 'Urgente';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative group cursor-pointer
        bg-white/60 dark:bg-slate-800/60 backdrop-blur-md
        border border-white/20 dark:border-slate-700/30
        rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-200
        ${isUrgent ? 'ring-2 ring-red-500/50 dark:ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}
        ${compactMode ? 'p-2' : 'p-4'}
      `}
      draggable="true"
      onDragStart={onDragStart as any}
      onClick={onOpenDetail}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(task.category)} opacity-5 rounded-xl pointer-events-none`} />

      {/* Task Text */}
      <p className={`font-medium text-slate-800 dark:text-slate-100 mb-2 line-clamp-3 ${compactMode ? 'text-xs' : 'text-sm'}`}>
        {task.texto}
      </p>

      {/* Labels & Tags */}
      {!compactMode && (
        <div className="flex flex-wrap gap-1 mb-3">
            {/* Smart Labels */}
            {task.labels?.slice(0, 2).map(label => (
            <span key={label} className="text-[10px] font-medium bg-slate-100/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-600/50">
                {label}
            </span>
            ))}
            {/* Dynamic Tags */}
            {task.tags?.map(tagId => {
                const tag = allTags?.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                    <span 
                        key={tag.id} 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white shadow-sm hover:scale-105 transition-transform"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.name}
                    </span>
                );
            })}
        </div>
      )}

      {/* Footer Icons and Info */}
      <div className={`flex justify-between items-center ${compactMode ? 'mt-1' : 'mt-2'} text-slate-500 dark:text-slate-400`}>
        <div className="flex items-center gap-2">
          <span className={`${priorityColor} flex items-center justify-center bg-current/10 p-1 rounded-md`}>
            <Icon svg={priorityIcon} className={compactMode ? "h-3 w-3" : "h-4 w-4"} />
          </span>
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Icon svg={ICONS.paperclip} className={compactMode ? "h-3 w-3" : "h-4 w-4"} />
              {!compactMode && task.attachments.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.upvotes?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
              <Icon svg={ICONS.arrowUp} className={compactMode ? "h-3 w-3" : "h-3 w-3"} />
              <span className="font-semibold">{task.upvotes.length}</span>
            </span>
          )}
          {averageRating > 0 && (
             <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              <Icon svg={ICONS.star} className={compactMode ? "h-3 w-3" : "h-3 w-3"} />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
      
      {!compactMode && task.authorName && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 mt-2">
          <img src={task.authorPhotoURL || `https://ui-avatars.com/api/?name=${task.authorName}&background=random`} alt={task.authorName} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-800" />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{task.authorName}</span>
        </div>
      )}
    </motion.div>
  );
};

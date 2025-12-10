import React from 'react';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, Tag } from '../../../types';
import { getCategoryColor, getPriorityIcon } from './helpers';
import { useUI } from '../../context/UIContext';
import { useApp } from '../../context/AppContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { optimizedThumbnail } from '../../utils/optimizedThumbnail';

interface PizarronCardProps {
  task: PizarronTask;
  onDragStart: (e: React.DragEvent) => void;
  onOpenDetail: () => void;
  allTags?: Tag[];
  borderColor?: string;
}

export const PizarronCard: React.FC<PizarronCardProps> = ({ task, onDragStart, onOpenDetail, allTags, borderColor }) => {
  const { compactMode, theme } = useUI();
  const { db, appId } = useApp();
  const { icon: priorityIcon, color: priorityColor } = getPriorityIcon(task.priority);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar tarea?")) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, task.id));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const averageRating = React.useMemo(() => {
    const ratings = Object.values(task.starRating || {});
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => Number(sum) + Number(rating), 0);
    return Number(total) / ratings.length;
  }, [task.starRating]);

  const isUrgent = task.priority === 'alta' || task.category === 'Urgente';

  const thumbnailAttachment = React.useMemo(() => {
    if (!task.attachments || task.attachments.length === 0) return null;
    const image = task.attachments.find(a => a.type === 'image');
    if (image) return { ...image, renderType: 'image' };
    // Assuming 'video' type exists or inferring from extensions if needed, but sticking to explicit type + basic inference if missing
    const video = task.attachments.find(a => a.type === 'video' || (a.url && a.url.match(/\.(mp4|mov|webm)$/i)));
    if (video) return { ...video, renderType: 'video' };
    const pdf = task.attachments.find(a => a.type === 'pdf' || (a.url && a.url.match(/\.pdf$/i)));
    if (pdf) return { ...pdf, renderType: 'pdf' };
    return null;
  }, [task.attachments]);

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
        rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
        ${isUrgent ? 'ring-2 ring-red-500/50 dark:ring-red-500/30' : ''}
        ${compactMode ? 'p-2' : 'p-4'}
        border-b-[3px] border-b-transparent
      `}
      draggable="true"
      onDragStart={onDragStart as any}
      onClick={onOpenDetail}
      style={{ borderBottomColor: borderColor || '#60A5FA' }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(task.category)} opacity-5 rounded-xl pointer-events-none`} />

      <button
        className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-110"
        title="Eliminar"
      >
        <Icon svg={ICONS.trash} className="w-[14px] h-[14px]" />
      </button>

      {/* Smart Thumbnail */}
      {thumbnailAttachment && !compactMode && (
        <div className="mb-3 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shrink-0">
          {thumbnailAttachment.renderType === 'image' && (
            <img
              src={optimizedThumbnail(thumbnailAttachment.url)}
              alt={thumbnailAttachment.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {thumbnailAttachment.renderType === 'video' && (
            <Icon svg={ICONS.video} className="w-8 h-8 text-slate-400" />
          )}
          {thumbnailAttachment.renderType === 'pdf' && (
            <Icon svg={ICONS.fileText} className="w-8 h-8 text-slate-400" />
          )}
        </div>
      )}

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

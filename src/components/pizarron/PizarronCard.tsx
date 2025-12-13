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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative group cursor-pointer
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm
        border border-slate-200/60 dark:border-slate-700/60
        rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-400/50 transition-all duration-300
        ${isUrgent ? 'ring-2 ring-rose-500/30' : ''}
        ${compactMode ? 'p-3' : 'p-5 min-h-[140px] flex flex-col'}
      `}
      draggable="true"
      onDragStart={onDragStart as any}
      onClick={onOpenDetail}
    >
      {/* Subtle Bottom Border based on category or prop */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl opacity-80"
        style={{ backgroundColor: borderColor || '#94a3b8' }}
      />

      <button
        className="absolute top-2 right-2 z-20 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-all font-medium"
        title="Eliminar"
        onClick={handleDelete}
      >
        <Icon svg={ICONS.trash} className="w-3.5 h-3.5" />
      </button>

      {/* Smart Thumbnail */}
      {thumbnailAttachment && !compactMode && (
        <div className="mb-3 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shrink-0 shadow-inner">
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
      <p className={`font-semibold text-slate-700 dark:text-slate-200 mb-3 leading-relaxed tracking-tight ${compactMode ? 'text-xs' : 'text-sm'}`}>
        {task.texto}
      </p>

      {/* Labels & Tags */}
      {!compactMode && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Smart Labels */}
          {task.labels?.slice(0, 2).map(label => (
            <span key={label} className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600/50 uppercase tracking-wider">
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
                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer Icons and Info */}
      <div className={`flex justify-between items-center ${compactMode ? 'mt-1' : 'mt-2'} pt-2 ${compactMode ? '' : 'border-t border-slate-100 dark:border-slate-700/50'} text-slate-500 dark:text-slate-400`}>
        <div className="flex items-center gap-3">
          <span className={`${priorityColor} flex items-center gap-1`}>
            <Icon svg={priorityIcon} className={compactMode ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </span>
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium">
              <Icon svg={ICONS.paperclip} className={compactMode ? "h-3 w-3" : "h-3.5 w-3.5"} />
              {!compactMode && task.attachments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.upvotes?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded-full">
              <Icon svg={ICONS.arrowUp} className={compactMode ? "h-3 w-3" : "h-3 w-3"} />
              <span>{task.upvotes.length}</span>
            </span>
          )}
          {averageRating > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              <Icon svg={ICONS.star} className={compactMode ? "h-3 w-3" : "h-3 w-3"} />
              <span>{averageRating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      {!compactMode && task.authorName && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Maybe show avatar on hover or keeps clean? Let's hide author usually unless pivotal.
               Or keep it at bottom? Code had it at bottom before.
               Let's leave it out or minimal to match 'Zen'.
               Wait, collaboration implies knowing who wrote it.
               Let's put small avatar at bottom right if space.
           */}
        </div>
      )}
    </motion.div>
  );
};

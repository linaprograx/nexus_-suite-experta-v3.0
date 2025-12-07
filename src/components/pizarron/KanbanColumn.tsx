import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, Tag } from '../../../types';
import { PizarronCard } from './PizarronCard';
import { useUI } from '../../context/UIContext';
import { usePizarraStore } from '../../store/pizarraStore';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: PizarronTask[];
  onAddTask: (status: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropOnColumn: (status: string) => void;
  onOpenTaskDetail: (task: PizarronTask) => void;
  isFocused?: boolean;
  onHeaderClick?: () => void;
  allTags?: Tag[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, tasks, onAddTask, onDragStart, onDropOnColumn, onOpenTaskDetail, isFocused, onHeaderClick, allTags }) => {
  const { theme, focusMode: uiFocusMode, compactMode } = useUI();
  const { focusMode } = usePizarraStore();

  const currentUserId = 'Lian Alviz';
  let visibleTasks = tasks;
  if (focusMode) visibleTasks = tasks.filter(t => t.assignees?.includes(currentUserId));

  // Only used if we want to color the column body background based on status
  // const getGradient = () => {
  //   const s = status.toLowerCase();
  //   if (s.includes('idea')) return 'from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/30';
  //   if (s.includes('prueba') || s.includes('desarrollo') || s.includes('lab')) return 'from-blue-100/50 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-700/30';
  //   if (s.includes('aprobado') || s.includes('final') || s.includes('ready')) return 'from-emerald-100/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30';
  //   return '';
  // };

  const getHeaderGradient = () => {
    const s = status.toLowerCase();
    if (s.includes('idea')) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (s.includes('prueba') || s.includes('desarrollo') || s.includes('lab')) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (s.includes('aprobado') || s.includes('final') || s.includes('ready')) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (s.includes('costeo')) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    if (s.includes('foto')) return 'bg-gradient-to-r from-pink-500 to-rose-500';
    if (s.includes('residuo')) return 'bg-gradient-to-r from-red-500 to-orange-500';
    return 'bg-slate-500';
  };

  return (
    <motion.div
      layout
      className={`
        rounded-xl flex flex-col flex-shrink-0 transition-all duration-300
        ${isFocused ? 'w-full max-w-4xl mx-auto' : compactMode ? 'w-64 shrink-0' : 'w-[360px] shrink-0'}
        ${compactMode ? 'h-full' : 'h-full'}
        bg-white/50 dark:bg-white/10 backdrop-blur-xl
        border border-white/20 dark:border-white/10 shadow-lg
        rounded-2xl
        snap-center
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(status);
      }}
    >
      <div
        className={`p-3 rounded-t-2xl cursor-pointer select-none group relative overflow-hidden`}
        onClick={onHeaderClick}
      >
        <div className={`absolute inset-0 opacity-10 ${getHeaderGradient()}`} />
        <div className="relative flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${getHeaderGradient()}`}></span>
            {title}
            <span className="text-xs font-normal text-slate-500 ml-2 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </h2>
          {uiFocusMode && (
            <Icon
              svg={isFocused ? ICONS.collapse : ICONS.grid}
              className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${compactMode ? 'p-1 space-y-1' : 'p-2 space-y-3'} custom-scrollbar`}>
        <AnimatePresence>
          {visibleTasks.map(task => (
            <PizarronCard
              key={task.id}
              task={task}
              onDragStart={(e) => onDragStart(e, task.id)}
              onOpenDetail={() => onOpenTaskDetail(task)}
              allTags={allTags}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="p-2 border-t border-white/10 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm rounded-b-2xl">
        <Button variant="ghost" size="sm" className="w-full justify-center text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => onAddTask(status)}>
          <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Añadir Tarea
        </Button>
      </div>
    </motion.div>
  );
};

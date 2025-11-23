import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, Tag } from '../../../types';
import { PizarronCard } from './PizarronCard';
import { useUI } from '../../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanColumnProps {
  title: string;
  status: 'ideas' | 'pruebas' | 'aprobado';
  tasks: PizarronTask[];
  onAddTask: (status: 'ideas' | 'pruebas' | 'aprobado') => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropOnColumn: (status: 'ideas' | 'pruebas' | 'aprobado') => void;
  onOpenTaskDetail: (task: PizarronTask) => void;
  isFocused?: boolean;
  onHeaderClick?: () => void;
  allTags?: Tag[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, tasks, onAddTask, onDragStart, onDropOnColumn, onOpenTaskDetail, isFocused, onHeaderClick, allTags }) => {
  const { theme, focusMode, compactMode } = useUI();

  const getGradient = () => {
    switch(status) {
      case 'ideas': return 'from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/30';
      case 'pruebas': return 'from-blue-100/50 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-700/30';
      case 'aprobado': return 'from-emerald-100/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30';
      default: return '';
    }
  };

  const getHeaderGradient = () => {
     switch(status) {
      case 'ideas': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'pruebas': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'aprobado': return 'bg-gradient-to-r from-emerald-500 to-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <motion.div 
      layout
      className={`
        rounded-xl flex flex-col flex-shrink-0 transition-all duration-300
        ${isFocused ? 'w-full max-w-4xl mx-auto' : compactMode ? 'w-64' : 'w-80'}
        ${compactMode ? 'h-full' : 'h-full'}
        bg-white/40 dark:bg-slate-900/40 backdrop-blur-md
        border border-white/20 dark:border-slate-700/30 shadow-sm
        snap-center
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(status);
      }}
    >
      <div 
        className={`p-3 rounded-t-xl cursor-pointer select-none group relative overflow-hidden`}
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
             {focusMode && (
                <Icon 
                    svg={isFocused ? ICONS.collapse : ICONS.layoutGrid} 
                    className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                />
            )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${compactMode ? 'p-1 space-y-1' : 'p-2 space-y-3'} custom-scrollbar`}>
        <AnimatePresence>
            {tasks.map(task => (
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
      
      <div className="p-2 border-t border-white/10 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-b-xl">
        <Button variant="ghost" size="sm" className="w-full justify-center text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => onAddTask(status)}>
            <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Añadir Tarea
        </Button>
      </div>
    </motion.div>
  );
};

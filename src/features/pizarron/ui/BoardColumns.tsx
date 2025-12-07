import React, { useRef, useState, useEffect } from 'react';
import { KanbanColumn } from '../../../components/pizarron/KanbanColumn';
import { PizarronTask, Tag, PizarronBoard } from '../../../../types';
import { safeNormalizeTask } from '../../../utils/taskHelpers';

interface BoardColumnsProps {
  activeBoard: PizarronBoard | undefined;
  filteredTasks: PizarronTask[];
  focusedColumn: string | null;
  focusMode: boolean;
  tags: Tag[];
  onAddTask: (status: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropOnColumn: (newStatus: string) => void;
  onOpenTaskDetail: (task: PizarronTask) => void;
  onColumnHeaderClick: (status: string) => void;
  boardThemeColor: string;
}

export const BoardColumns: React.FC<BoardColumnsProps> = ({
  activeBoard,
  filteredTasks,
  focusedColumn,
  focusMode,
  tags,
  onAddTask,
  onDragStart,
  onDropOnColumn,
  onOpenTaskDetail,
  onColumnHeaderClick,
  boardThemeColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [filteredTasks, activeBoard]);

  const columns = activeBoard?.columns || ['Ideas', 'Pruebas', 'Aprobado'];

  return (
    <div className="relative flex-1 min-h-0 w-full">
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-y-0 left-0 w-8 pointer-events-none bg-gradient-to-r from-black/5 to-transparent z-10 transition-opacity duration-300 ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-y-0 right-0 w-8 pointer-events-none bg-gradient-to-l from-black/5 to-transparent z-10 transition-opacity duration-300 ${showRightShadow ? 'opacity-100' : 'opacity-0'}`} />

        <div
          ref={containerRef}
          onScroll={checkScroll}
          className="flex flex-row gap-4 overflow-x-auto overflow-y-hidden px-4 pb-6 no-scrollbar min-h-full items-start"
          style={{ scrollBehavior: 'smooth' }}
        >
          {columns.map(col => {
            const columnTasks = filteredTasks
              .filter(task => safeNormalizeTask(task).status === col)
              .sort((a, b) => (b.priority === 'alta' ? 1 : 0) - (a.priority === 'alta' ? 1 : 0));

            const isFocused = focusMode && focusedColumn === col;

            if (focusMode && focusedColumn && !isFocused) return null;

            return (
              <div key={col} className="flex-shrink-0 w-[280px] h-full bg-white/5 dark:bg-slate-900/5 rounded-2xl flex flex-col overflow-hidden">
                <KanbanColumn
                  title={col}
                  status={col}
                  tasks={columnTasks}
                  onAddTask={onAddTask}
                  onDragStart={onDragStart}
                  onDropOnColumn={onDropOnColumn}
                  onOpenTaskDetail={onOpenTaskDetail}
                  isFocused={isFocused}
                  onHeaderClick={() => onColumnHeaderClick(col)}
                  allTags={tags}
                  boardThemeColor={boardThemeColor}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

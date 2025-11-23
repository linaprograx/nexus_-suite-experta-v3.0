import React, { useRef, useState, useEffect } from 'react';
import { KanbanColumn } from '../../../components/pizarron/KanbanColumn';
import { PizarronTask, Tag, PizarronBoard } from '../../../../types';

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
  }, [filteredTasks, activeBoard]); // Re-check when content changes

  const columns = activeBoard?.columns || ['Ideas', 'Pruebas', 'Aprobado'];

  return (
    <div className="relative flex-1 min-h-0 w-full">
        {/* Shadow Indicators */}
        <div 
            className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-black/10 to-transparent ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`} 
        />
        <div 
            className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-black/10 to-transparent ${showRightShadow ? 'opacity-100' : 'opacity-0'}`} 
        />

        <div 
            ref={containerRef}
            onScroll={checkScroll}
            className="flex flex-row gap-6 overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar px-4 pb-6 h-full scroll-snap-x snap-mandatory scroll-smooth"
            style={{ minWidth: '100%', display: 'inline-flex' }}
        >
            {columns.map(col => {
                const isFocused = focusedColumn === col;
                const isHidden = focusMode && focusedColumn && !isFocused;
                
                if (isHidden) return null;

                const columnTasks = filteredTasks.filter(t => 
                    t.status === col || 
                    (col === 'Ideas' && t.status === 'ideas') || 
                    (col === 'Pruebas' && t.status === 'pruebas') || 
                    (col === 'Aprobado' && t.status === 'aprobado')
                );

                return (
                    <div key={col} className="inline-flex h-full align-top">
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
                        />
                    </div>
                );
            })}
        </div>
    </div>
  );
};

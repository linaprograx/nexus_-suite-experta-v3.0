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
  const columns = activeBoard?.columns || ['Ideas', 'Pruebas', 'Aprobado'];

  return (
    <div className="flex gap-6 h-full items-start p-10"> {/* Added padding for "canvas" feel */}
      {columns.map(col => {
        const columnTasks = filteredTasks
          .filter(task => safeNormalizeTask(task).status === col)
          .sort((a, b) => (b.priority === 'alta' ? 1 : 0) - (a.priority === 'alta' ? 1 : 0));

        const isFocused = focusMode && focusedColumn === col;

        if (focusMode && focusedColumn && !isFocused) return null;

        return (
          <div key={col} className="flex-shrink-0 w-[300px] h-full max-h-full bg-white/5 dark:bg-slate-900/5 rounded-2xl flex flex-col overflow-hidden border border-white/10 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
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
  );
};

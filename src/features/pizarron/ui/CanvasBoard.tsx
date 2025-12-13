import React, { useRef } from 'react';
import { PizarronTask, Tag } from '../../../types';
import { PizarronCard } from '../../../components/pizarron/PizarronCard';
import { useCanvasState } from '../hooks/useCanvasState';

interface CanvasBoardProps {
    filteredTasks: PizarronTask[];
    onOpenTaskDetail: (task: PizarronTask) => void;
    onUpdateTaskPosition: (taskId: string, position: { x: number, y: number }) => void;
    tags: Tag[];
    activeTool?: string; // New prop
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
    filteredTasks,
    onOpenTaskDetail,
    onUpdateTaskPosition,
    tags,
    activeTool = 'pointer'
}) => {
    const { getInitialPosition, selectedIds, toggleSelection, clearSelection } = useCanvasState(filteredTasks);

    // Cursor style
    const cursorStyle = activeTool === 'hand' ? 'grab' :
        activeTool === 'text' ? 'text' :
            activeTool === 'shape' || activeTool === 'line' ? 'crosshair' :
                'default';

    const handleDragEnd = (e: React.DragEvent, task: PizarronTask) => {
        // This is tricky with standard HTML5 drag and drop on an absolute canvas because the "drop" event gives coordinates relative to drop target.
        // For a true smooth canvas feel, we might want to use pointer events or a library like framer-motion's drag.
        // Given we are using framer-motion in PizarronCard, let's leverage that if possible, 
        // OR standard mouse events on the container.

        // PizarronCard uses draggable="true" which is HTML5. 
        // We defined "onDragStart" in PizarronCard.
        // Let's rely on PizarronView's handling if we can, or refactor PizarronCard to support free drag.

        // BETTER APPROACH for "True Canvas":
        // Wrap PizarronCard in a div that handles position.
    };

    // Calculate board bounds based on tasks or default large area
    // User wants "Visual Boards" (Frames)
    // For now, we assume the active board is one large frame.
    const boardFrame = {
        x: -100,
        y: -100,
        width: 3000,
        height: 1500,
        title: "Lienzo Principal"
    };

    return (
        <div
            className={`relative w-full h-full min-w-[3000px] min-h-[3000px] transition-colors duration-200 ${cursorStyle === 'crosshair' ? 'cursor-crosshair' : cursorStyle === 'text' ? 'cursor-text' : cursorStyle === 'grab' ? 'cursor-grab' : 'cursor-default'}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    clearSelection();
                    // Interaction Placeholder
                    if (activeTool === 'text') {
                        console.log("Create Text at", e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        // Future: prompt user or add optimistic text node
                    } else if (activeTool === 'shape') {
                        console.log("Create Shape at", e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    }
                }
            }}
        >
            {/* VISUAL BOARD FRAME (Tablero Visual) */}
            <div
                className="absolute border-4 border-slate-200 dark:border-slate-800 rounded-[40px] pointer-events-none"
                style={{
                    left: boardFrame.x,
                    top: boardFrame.y,
                    width: boardFrame.width,
                    height: boardFrame.height
                }}
            >
                <div className="absolute -top-12 left-0 bg-transparent px-4 py-2 text-3xl font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest select-none">
                    {boardFrame.title}
                </div>
            </div>

            {/* Render Canvas Elements (Text, Shapes - Placeholders for now) */}
            {/* TODO: Integrate with real useCanvasState elements list */}

            {filteredTasks.map((task, index) => {
                const pos = task.position || getInitialPosition(task, index, 0);

                return (
                    <div
                        key={task.id}
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            width: '320px',
                            zIndex: selectedIds.has(task.id) ? 20 : 10
                        }}
                        className="transition-transform duration-100 ease-out will-change-transform"
                    >
                        {/* 
                            For true canvas interaction, we would wrap this in a customized DragControl.
                            For now, relying on PizarronCard's internal mechanisms or clicking to open.
                        */}
                        <PizarronCard
                            task={task}
                            allTags={tags}
                            onOpenDetail={() => onOpenTaskDetail(task)}
                            onDragStart={(e) => {
                                // Optional: Handle canvas-specific drag initiation
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

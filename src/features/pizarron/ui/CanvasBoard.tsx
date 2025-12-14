import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { PizarronTask, Tag, CanvasItem } from '../../../types';
import { PizarronCard } from '../../../components/pizarron/PizarronCard';
import { useCanvasState } from '../hooks/useCanvasState';

interface CanvasBoardProps {
    filteredTasks: PizarronTask[];
    onOpenTaskDetail: (task: PizarronTask) => void;
    onUpdateTaskPosition: (taskId: string, position: { x: number, y: number }) => void;
    tags: Tag[];
    activeTool?: string;
    onAddCanvasItem: (item: Partial<PizarronTask>) => void;
    onDeleteCanvasItem?: (id: string) => void; // New Prop
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
    filteredTasks,
    onOpenTaskDetail,
    onUpdateTaskPosition,
    tags,
    activeTool = 'pointer',
    onAddCanvasItem,
    onDeleteCanvasItem
}) => {
    const { getInitialPosition, selectedIds, toggleSelection, clearSelection } = useCanvasState(filteredTasks);

    // Cursor style
    const cursorStyle = activeTool === 'hand' ? 'grab' :
        activeTool === 'text' ? 'text' :
            activeTool === 'shape' || activeTool === 'line' ? 'crosshair' :
                activeTool === 'eraser' ? 'alias' : // Fallback for eraser icon
                    'default';

    const handleDragEnd = (event: any, info: any, item: any) => {
        const currentX = item.position?.x || 0;
        const currentY = item.position?.y || 0;
        if (onUpdateTaskPosition) {
            onUpdateTaskPosition(item.id, {
                x: currentX + info.offset.x,
                y: currentY + info.offset.y
            });
        }
    };

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target !== e.currentTarget && (e.target as HTMLElement).getAttribute('data-id') !== 'canvas-background') return;

        clearSelection();
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        if (activeTool === 'text') {
            onAddCanvasItem({
                type: 'text',
                texto: 'Nuevo Texto',
                position: { x, y },
                width: 300,
                height: 50
            });
        } else if (activeTool === 'shape') {
            onAddCanvasItem({
                type: 'shape',
                shapeType: 'rectangle', // Default to rectangle, can be sophisticated later
                position: { x, y },
                width: 200,
                height: 200,
                style: { backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid #cbd5e1' }
            });
        } else if (activeTool === 'line') {
            onAddCanvasItem({
                type: 'line',
                position: { x, y },
                lineStart: { x: 0, y: 0 }, // Relative to position
                lineEnd: { x: 200, y: 100 },
                style: { borderColor: '#f97316', borderWidth: '2px' }
            });
        }
        // Note: Logic for 'line' usually requires drag (start->end). Click creation is fallback.
    };

    // ... (rest of render)

    return (
        <div
            data-id="canvas-background"
            className={`relative w-full h-full min-w-[3000px] min-h-[3000px] transition-colors duration-200 ${cursorStyle === 'crosshair' ? 'cursor-crosshair' : cursorStyle === 'text' ? 'cursor-text' : cursorStyle === 'grab' ? 'cursor-grab' : 'cursor-default'}`}
            style={{ cursor: activeTool === 'eraser' ? 'url("/cursor-eraser.png"), pointer' : undefined }}
            onClick={handleBackgroundClick}
        >
            {/* UNIFIED CANVAS ELEMENTS RENDERER */}
            {filteredTasks.map((item) => {
                const canvasItem = item as CanvasItem;
                // Use stored position or calculate initial layout
                const pos = canvasItem.position || getInitialPosition(item, 0, 0);
                const isTask = !canvasItem.type || canvasItem.type === 'task';
                const isFrame = canvasItem.type === 'frame';

                // Z-Index Logic: Selected > Regular Items > Frames
                const baseZIndex = isFrame ? 0 : 10;
                const finalZIndex = selectedIds.has(item.id) ? 100 : (isFrame ? 0 : (canvasItem.zIndex || 10));

                return (
                    <motion.div
                        key={item.id}
                        layoutId={item.id}
                        drag={activeTool === 'pointer' || activeTool === 'hand'}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (activeTool === 'eraser') {
                                onDeleteCanvasItem && onDeleteCanvasItem(item.id);
                            } else {
                                toggleSelection(item.id, (e as any).shiftKey);
                            }
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: pos.x,
                            y: pos.y,
                            zIndex: finalZIndex
                        }}
                        // Highlights for selection
                        className={`absolute ${selectedIds.has(item.id) ? 'ring-2 ring-orange-500 ring-offset-4 ring-offset-transparent' : ''}`}
                        style={{ x: pos.x, y: pos.y, position: 'absolute' }}
                    >
                        {/* 1. FRAME RENDERER */}
                        {isFrame && (
                            <div
                                className="relative border-4 border-dashed border-slate-300 dark:border-slate-700/50 rounded-[40px] bg-slate-100/30 dark:bg-slate-800/20 backdrop-blur-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600"
                                style={{
                                    width: item.width || 800,
                                    height: item.height || 600
                                }}
                            >
                                <div className="absolute -top-5 left-8 bg-white dark:bg-slate-800 px-4 py-1 rounded-full text-sm font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                    {item.title || 'Marco'}
                                </div>
                            </div>
                        )}

                        {/* 2. TASK CARD RENDERER */}
                        {isTask && (
                            <div className="w-[320px]">
                                <PizarronCard
                                    task={item as PizarronTask}
                                    onOpenDetail={() => onOpenTaskDetail(item as PizarronTask)}
                                    onDragStart={() => { }}
                                    allTags={tags}
                                />
                            </div>
                        )}

                        {/* 3. TEXT RENDERER */}
                        {item.type === 'text' && (
                            <div className="min-w-[200px] p-2 cursor-text group">
                                <h2
                                    className="text-3xl font-bold text-slate-800 dark:text-white bg-transparent outline-none resize-none leading-tight border border-transparent group-hover:border-dashed group-hover:border-slate-300 rounded p-1"
                                    contentEditable={activeTool === 'text'}
                                    suppressContentEditableWarning
                                >
                                    {item.title || item.content || 'Escribe aquí...'}
                                </h2>
                            </div>
                        )}

                        {/* 4. SHAPE RENDERER */}
                        {item.type === 'shape' && (
                            <div
                                className={`
                                    border-4 transition-all duration-300
                                    ${item.shapeType === 'circle' ? 'rounded-full' : 'rounded-2xl'}
                                    bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm
                                    border-slate-300 dark:border-slate-600
                                    hover:border-orange-400 dark:hover:border-orange-500
                                    shadow-sm
                                `}
                                style={{
                                    width: item.width || 200,
                                    height: item.height || 200,
                                    ...item.style
                                }}
                            />
                        )}

                        {/* 5. IMAGE RENDERER */}
                        {item.type === 'image' && (
                            <div className="relative group overflow-hidden rounded-xl shadow-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                {item.path !== 'placeholder-image' ? (
                                    <img
                                        src={item.path}
                                        alt={item.title || 'Imagen'}
                                        className="w-full h-full object-cover pointer-events-none"
                                        style={{ width: item.width || 300, height: item.height || 'auto' }}
                                    />
                                ) : (
                                    <div
                                        className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        style={{ width: item.width || 300, height: item.height || 200 }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        <span className="text-xs mt-2 font-medium">Imagen de Referencia</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 6. STICKER RENDERER */}
                        {item.type === 'sticker' && (
                            <div
                                className="flex items-center justify-center transform hover:scale-110 transition-transform cursor-pointer"
                                style={{
                                    fontSize: item.style?.fontSize || '5rem',
                                    width: item.width || 100,
                                    height: item.height || 100
                                }}
                            >
                                {item.texto || item.content || '✨'}
                            </div>
                        )}

                        {/* 7. LINE RENDERER */}
                        {item.type === 'line' && (
                            <svg className="absolute overflow-visible pointer-events-none" width="300" height="300">
                                <line
                                    x1="0"
                                    y1="0"
                                    x2={item.width || 100}
                                    y2={item.height || 100}
                                    stroke={item.style?.borderColor || '#f97316'}
                                    strokeWidth={item.style?.borderWidth || '4'}
                                    strokeLinecap="round"
                                />
                                <circle cx="0" cy="0" r="4" fill="#f97316" />
                                <circle cx={item.width || 100} cy={item.height || 100} r="4" fill="#f97316" />
                            </svg>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

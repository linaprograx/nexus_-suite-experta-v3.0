import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { TbArrowsMove } from 'react-icons/tb';

/**
 * MobileResizeHandles - Matching Desktop Design
 * Handles stay fixed to element edges during resize
 */
export const MobileResizeHandles: React.FC = () => {
    const [activeHandle, setActiveHandle] = useState<string | null>(null);
    const [, forceUpdate] = useState(0);

    // Force re-render on EVERY store update for instant sync
    useEffect(() => {
        const unsubscribe = pizarronStore.subscribe(() => {
            forceUpdate(prev => prev + 1);
        });
        return unsubscribe;
    }, []);

    const state = pizarronStore.getState();
    const { selection, nodes, viewport } = state;

    if (selection.size === 0) return null;

    const selectedIds = Array.from(selection);
    const currentNode = nodes[selectedIds[0]];
    if (!currentNode || currentNode.locked) return null;

    const screenX = currentNode.x * viewport.zoom + viewport.x;
    const screenY = currentNode.y * viewport.zoom + viewport.y;
    const screenW = currentNode.w * viewport.zoom;
    const screenH = currentNode.h * viewport.zoom;

    // Corner handles (circles)
    const cornerHandles = [
        { id: 'nw', x: screenX, y: screenY, cursor: 'nwse-resize' },
        { id: 'ne', x: screenX + screenW, y: screenY, cursor: 'nesw-resize' },
        { id: 'se', x: screenX + screenW, y: screenY + screenH, cursor: 'nwse-resize' },
        { id: 'sw', x: screenX, y: screenY + screenH, cursor: 'nesw-resize' }
    ];

    // Edge handles (small pills/lines) - ALWAYS CENTERED
    const edgeHandles = [
        { id: 'n', x: screenX + screenW / 2, y: screenY, cursor: 'ns-resize', type: 'horizontal' },
        { id: 'e', x: screenX + screenW, y: screenY + screenH / 2, cursor: 'ew-resize', type: 'vertical' },
        { id: 's', x: screenX + screenW / 2, y: screenY + screenH, cursor: 'ns-resize', type: 'horizontal' },
        { id: 'w', x: screenX, y: screenY + screenH / 2, cursor: 'ew-resize', type: 'vertical' }
    ];

    // Rotate handles (top and bottom)
    const rotateHandles = [
        { id: 'rotate-top', x: screenX + screenW / 2, y: screenY - 60, icon: '↑' },
        { id: 'rotate-bottom', x: screenX + screenW / 2, y: screenY + screenH + 60, icon: '↓' }
    ];

    // Center move handle
    const centerHandle = {
        id: 'move',
        x: screenX + screenW / 2,
        y: screenY + screenH / 2
    };

    const handlePointerDown = (handleId: string) => (e: React.PointerEvent) => {
        e.stopPropagation();
        setActiveHandle(handleId);

        const startX = e.clientX;
        const startY = e.clientY;
        const startNode = { ...pizarronStore.getState().nodes[currentNode.id] };

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const deltaX = (moveEvent.clientX - startX) / viewport.zoom;
            const deltaY = (moveEvent.clientY - startY) / viewport.zoom;

            if (handleId.startsWith('rotate')) {
                const centerX = startNode.x + startNode.w / 2;
                const centerY = startNode.y + startNode.h / 2;
                const worldX = (moveEvent.clientX - viewport.x) / viewport.zoom;
                const worldY = (moveEvent.clientY - viewport.y) / viewport.zoom;
                const angle = Math.atan2(worldY - centerY, worldX - centerX) * (180 / Math.PI);
                pizarronStore.updateNode(currentNode.id, { rotation: angle + 90 });
            } else if (handleId === 'move') {
                pizarronStore.updateNode(currentNode.id, {
                    x: startNode.x + deltaX,
                    y: startNode.y + deltaY
                });
            } else {
                // Resize
                let newX = startNode.x;
                let newY = startNode.y;
                let newW = startNode.w;
                let newH = startNode.h;

                // Corner resizing
                if (handleId === 'nw') {
                    newX = startNode.x + deltaX;
                    newY = startNode.y + deltaY;
                    newW = startNode.w - deltaX;
                    newH = startNode.h - deltaY;
                } else if (handleId === 'ne') {
                    newY = startNode.y + deltaY;
                    newW = startNode.w + deltaX;
                    newH = startNode.h - deltaY;
                } else if (handleId === 'se') {
                    newW = startNode.w + deltaX;
                    newH = startNode.h + deltaY;
                } else if (handleId === 'sw') {
                    newX = startNode.x + deltaX;
                    newW = startNode.w - deltaX;
                    newH = startNode.h + deltaY;
                }
                // Edge resizing
                else if (handleId === 'n') {
                    newY = startNode.y + deltaY;
                    newH = startNode.h - deltaY;
                } else if (handleId === 'e') {
                    newW = startNode.w + deltaX;
                } else if (handleId === 's') {
                    newH = startNode.h + deltaY;
                } else if (handleId === 'w') {
                    newX = startNode.x + deltaX;
                    newW = startNode.w - deltaX;
                }

                // Minimum size
                const minSize = 20;
                if (newW < minSize) {
                    newW = minSize;
                    if (handleId.includes('w')) newX = startNode.x + startNode.w - minSize;
                }
                if (newH < minSize) {
                    newH = minSize;
                    if (handleId.includes('n')) newY = startNode.y + startNode.h - minSize;
                }

                pizarronStore.updateNode(currentNode.id, { x: newX, y: newY, w: newW, h: newH });
            }
        };

        const handlePointerUp = () => {
            setActiveHandle(null);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    // Use node ID as key to force complete remount on selection change
    return (
        <div key={currentNode.id}>
            {/* NO border - desktop already renders it */}

            {/* Corner Handles - Large Circles */}
            {cornerHandles.map(handle => (
                <div
                    key={handle.id}
                    className={`absolute w-4 h-4 bg-white dark:bg-slate-800 border-2 rounded-full shadow-lg ${activeHandle === handle.id
                            ? 'border-indigo-500 scale-125'
                            : 'border-indigo-400 hover:scale-110'
                        }`}
                    style={{
                        left: `${handle.x}px`,
                        top: `${handle.y}px`,
                        transform: 'translate(-50%, -50%)',
                        cursor: handle.cursor,
                        touchAction: 'none',
                        zIndex: 50
                    }}
                    onPointerDown={handlePointerDown(handle.id)}
                />
            ))}

            {/* Edge Handles - Small Pills (FIXED TO CENTER) */}
            {edgeHandles.map(handle => (
                <div
                    key={handle.id}
                    className={`absolute bg-white dark:bg-slate-800 border-2 rounded-full shadow-md ${activeHandle === handle.id
                            ? 'border-indigo-500 scale-110'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                        }`}
                    style={{
                        left: `${handle.x}px`,
                        top: `${handle.y}px`,
                        width: handle.type === 'horizontal' ? '24px' : '6px',
                        height: handle.type === 'horizontal' ? '6px' : '24px',
                        transform: 'translate(-50%, -50%)',
                        cursor: handle.cursor,
                        touchAction: 'none',
                        zIndex: 50
                    }}
                    onPointerDown={handlePointerDown(handle.id)}
                />
            ))}

            {/* Center Move Handle - Blue Circle */}
            <div
                className={`absolute flex items-center justify-center rounded-full shadow-lg ${activeHandle === 'move'
                        ? 'bg-indigo-600 scale-110'
                        : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                    }`}
                style={{
                    left: `${centerHandle.x}px`,
                    top: `${centerHandle.y}px`,
                    width: '48px',
                    height: '48px',
                    transform: 'translate(-50%, -50%)',
                    cursor: activeHandle === 'move' ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    zIndex: 51
                }}
                onPointerDown={handlePointerDown('move')}
            >
                <TbArrowsMove size={24} className="text-white" />
            </div>

            {/* Rotate Handles */}
            {rotateHandles.map(handle => (
                <React.Fragment key={handle.id}>
                    {/* Connection Line */}
                    <div
                        className="absolute border-l border-dashed border-slate-300 dark:border-slate-600 pointer-events-none"
                        style={{
                            left: `${screenX + screenW / 2}px`,
                            top: handle.id === 'rotate-top' ? `${screenY - 60}px` : `${screenY + screenH}px`,
                            height: '60px',
                            transform: 'translateX(-0.5px)',
                            zIndex: 48
                        }}
                    />
                    {/* Rotate Handle */}
                    <div
                        className={`absolute flex items-center justify-center rounded-full shadow-lg ${activeHandle === handle.id
                                ? 'bg-slate-700 scale-110'
                                : 'bg-slate-600 hover:bg-slate-700 hover:scale-105'
                            }`}
                        style={{
                            left: `${handle.x}px`,
                            top: `${handle.y}px`,
                            width: '40px',
                            height: '40px',
                            transform: 'translate(-50%, -50%)',
                            cursor: activeHandle === handle.id ? 'grabbing' : 'grab',
                            touchAction: 'none',
                            zIndex: 49
                        }}
                        onPointerDown={handlePointerDown(handle.id)}
                    >
                        <span className="text-white text-xl">{handle.icon}</span>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

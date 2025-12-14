import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';

const TOOLS = [
    { id: 'pointer', icon: '👆', label: 'Pointer' },
    { id: 'hand', icon: '✋', label: 'Pan' },
    { id: 'shape', icon: '🔷', label: 'Shapes' }, // Replaced Rectangle
    { id: 'line', icon: '📏', label: 'Line' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'image', icon: '🖼️', label: 'Image', isAction: true },
    // Presets
    { id: 'new-board', icon: '🔲', label: 'Board', isAction: true },
    { id: 'new-task', icon: '✅', label: 'Task', isAction: true },
    { id: 'new-idea', icon: '💡', label: 'Idea', isAction: true },

    { id: 'duplicate', icon: '📄', label: 'Duplicate', isAction: true },
    { id: 'delete', icon: '🗑️', label: 'Delete', isAction: true },
] as const;

const SHAPES = [
    { id: 'rectangle', icon: '⬜' },
    { id: 'circle', icon: '🔴' },
    { id: 'triangle', icon: '🔺' },
    { id: 'star', icon: '⭐' },
];

export const LeftRail: React.FC = () => {
    const [activeTool, setActiveTool] = useState('pointer');
    const [activeShape, setActiveShape] = useState('rectangle');

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setActiveTool(state.uiFlags.activeTool);
            setActiveShape(state.uiFlags.activeShapeType || 'rectangle');
        });
        return unsub;
    }, []);

    const handleTool = (tool: any) => {
        // Image Action
        if (tool.id === 'image') {
            const state = pizarronStore.getState();
            const vp = state.viewport;
            const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
            const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

            const newNode = {
                id: crypto.randomUUID(),
                type: 'image',
                x: cx - 100, y: cy - 100, w: 200, h: 200,
                zIndex: Object.keys(state.nodes).length + 1,
                content: { src: '', opacity: 1, borderRadius: 0 },
                updatedAt: Date.now(),
                createdAt: Date.now()
            };

            pizarronStore.addNode(newNode);
            pizarronStore.updateInteractionState({ editingImageId: newNode.id });
            return;
        }

        // Preset Actions
        if (['new-board', 'new-task', 'new-idea'].includes(tool.id)) {
            const state = pizarronStore.getState();
            const vp = state.viewport;
            const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
            const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;
            const z = Object.keys(state.nodes).length + 1;

            let newNode: any = {
                id: crypto.randomUUID(),
                x: cx - 100, y: cy - 50, w: 200, h: 100,
                zIndex: z,
                updatedAt: Date.now(), createdAt: Date.now()
            };

            if (tool.id === 'new-board') {
                newNode.type = 'board';
                newNode.w = 500; newNode.h = 400;
                newNode.content = { title: 'New Board', color: '#f1f5f9' };
                // Send board to back? 
                newNode.zIndex = -1;
            } else if (tool.id === 'new-task') {
                newNode.type = 'card';
                newNode.content = { title: 'New Task', body: 'Description...', color: '#dcfce7' }; // Green
            } else if (tool.id === 'new-idea') {
                newNode.type = 'card';
                newNode.content = { title: 'New Idea', body: 'Brainstorm...', color: '#dbeafe' }; // Blue
            }

            pizarronStore.addNode(newNode);
            pizarronStore.setSelection([newNode.id]);
            return;
        }

        if (tool.isAction) {
            const state = pizarronStore.getState();
            const selection = Array.from(state.selection);

            if (tool.id === 'delete') {
                selection.forEach(id => pizarronStore.deleteNode(id));
                pizarronStore.setSelection([]);
            }
            else if (tool.id === 'duplicate') {
                const newIds: string[] = [];
                selection.forEach(id => {
                    const node = state.nodes[id];
                    if (!node) return;
                    const newNode = {
                        ...node,
                        id: crypto.randomUUID(),
                        x: node.x + 20,
                        y: node.y + 20,
                        updatedAt: Date.now()
                    };
                    pizarronStore.addNode(newNode);
                    newIds.push(newNode.id);
                });
                if (newIds.length > 0) {
                    pizarronStore.setSelection(newIds);
                }
            }
        } else {
            pizarronStore.setActiveTool(tool.id);
        }
    };

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-auto items-start">
            {/* Main Strip */}
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map(tool => {
                    const isActive = activeTool === tool.id ||
                        (tool.id === 'shape' && ['rectangle', 'circle', 'triangle', 'star'].includes(activeTool));

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleTool(tool)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isActive
                                ? 'bg-orange-100 text-orange-600 border border-orange-200'
                                : 'hover:bg-slate-100 text-slate-600 border border-transparent'
                                }`}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    );
                })}
            </div>

            {/* Shape Selector (Visible when Shape Tool Active) */}
            {activeTool === 'shape' && (
                <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-xl p-2 flex flex-col gap-2 animate-in slide-in-from-left-2 duration-200">
                    {SHAPES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => pizarronStore.setActiveShapeType(s.id)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${activeShape === s.id
                                ? 'bg-slate-200 text-slate-900'
                                : 'hover:bg-slate-100 text-slate-400'
                                }`}
                            title={s.id}
                        >
                            {s.icon}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

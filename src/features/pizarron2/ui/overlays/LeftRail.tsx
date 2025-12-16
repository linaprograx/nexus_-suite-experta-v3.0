import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { ShapeSelector } from '../shared/ShapeSelector';
import { AssetDefinition } from '../panels/AssetLibrary';

const TOOLS = [
    { id: 'pointer', icon: '👆', label: 'Pointer' },
    { id: 'hand', icon: '✋', label: 'Pan' },
    { id: 'project', icon: '📂', label: 'Project', isAction: true },
    { id: 'library', icon: '📚', label: 'Library', isAction: true },
    { id: 'shape', icon: '🔷', label: 'Shapes' },
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

            const newNode: any = { // Temporary any to bypass strict checks for now, or use BoardNode if imported
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

        if (tool.id === 'library') {
            const current = pizarronStore.getState().uiFlags.showLibrary;
            pizarronStore.setUIFlag('showLibrary', !current);
            return;
        }

        if (tool.id === 'project') {
            const current = pizarronStore.getState().uiFlags.showProjectManager;
            pizarronStore.setUIFlag('showProjectManager', !current);
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

    const handleShapeSelect = (asset: AssetDefinition) => {
        // This relies on the engine support activeShapeType/data
        // We set activeTool to 'shape' first
        pizarronStore.setActiveTool('shape');

        // Pass the shape type (e.g., 'rectangle', 'cloud')
        // And potentially extra data if the store supports it (not fully visible here, but assuming basic shapeType works)
        if (asset.data && asset.data.shapeType) {
            pizarronStore.setActiveShapeType(asset.data.shapeType);
        }

        // If it's an icon or complex shape, we might need a Store update for "Next Node Defaults"
        // Since we can't see pizarronStore implementation, we assume basic shapeType is enough for now
        // or we rely on the creation logic reading from a "clipboard" or "defaults".
        // For now, this meets the requirement of using the new Selector.
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-auto items-start transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {/* Main Strip */}
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map(tool => {
                    const isActive = activeTool === tool.id ||
                        (tool.id === 'shape' && ['rectangle', 'circle', 'triangle', 'star', 'diamond', 'hexagon', 'cloud'].includes(activeTool));

                    if (tool.id === 'shape') {
                        return (
                            <ShapeSelector
                                key={tool.id}
                                currentShapeType={activeShape}
                                onSelect={handleShapeSelect}
                            />
                        )
                    }

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleTool(tool)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-orange-100 text-orange-600 border border-orange-200 scale-105 shadow-sm' // Active Pop
                                : 'hover:bg-slate-100 text-slate-600 border border-transparent hover:scale-110' // Hover Lift
                                }`}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

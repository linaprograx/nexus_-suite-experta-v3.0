import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import {
    LuMousePointer2,
    LuHand,
    LuLayoutGrid, // Pizarras (Grid view)
    LuShapes, // Library
    LuImage, // Image
    LuMonitorPlay, // Presentation
    LuTrash2
} from 'react-icons/lu';

const TOOLS = [
    { id: 'pointer', icon: <LuMousePointer2 size={20} />, label: 'Pointer' },
    { id: 'hand', icon: <LuHand size={20} />, label: 'Pan' },
    // Separator
    { id: 'sep1', type: 'separator' },
    { id: 'library', icon: <LuShapes size={20} />, label: 'Library', isAction: true },
    { id: 'image', icon: <LuImage size={20} />, label: 'Image', isAction: true },
    // Separator
    { id: 'sep2', type: 'separator' },
    { id: 'project', icon: <LuLayoutGrid size={20} />, label: 'Pizarras', isAction: true },
    { id: 'presentation', icon: <LuMonitorPlay size={20} />, label: 'Present (P)', isAction: true },
    // Bottom
    { id: 'sep3', type: 'separator' },
    { id: 'delete', icon: <LuTrash2 size={20} />, label: 'Delete', isAction: true },
] as const;

export const LeftRail: React.FC = () => {
    const [activeTool, setActiveTool] = useState('pointer');

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setActiveTool(state.uiFlags.activeTool);
        });
        return unsub;
    }, []);

    const handleTool = (tool: any) => {
        // Presentation Action
        if (tool.id === 'presentation') {
            pizarronStore.setPresentationMode(true);
            return;
        }

        // Image Action
        if (tool.id === 'image') {
            const state = pizarronStore.getState();
            const vp = state.viewport;
            const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
            const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

            const newNode: any = {
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
        } else {
            pizarronStore.setActiveTool(tool.id);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-auto items-start transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {/* Main Strip */}
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map((tool: any, i) => {
                    if (tool.type === 'separator') {
                        return <div key={`sep-${i}`} className="h-px w-6 bg-slate-200 mx-auto my-1" />;
                    }

                    const isActive = activeTool === tool.id;

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleTool(tool)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-orange-50 text-orange-600 border border-orange-200 scale-105 shadow-sm' // Active Pop (Orange)
                                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-transparent hover:scale-110' // Hover Lift
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

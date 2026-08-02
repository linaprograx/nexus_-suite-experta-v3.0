import { logger } from "../../../../utils/logger";

import React, { useEffect, useState } from 'react';
import { scaled } from '../../engine/nodeDefaults';
import { pizarronStore } from '../../state/store';
import {
    LuMousePointer2,
    LuHand,
    LuType,        // Texto
    LuSquare,      // Forma
    LuMinus,       // Línea
    LuImage,       // Imagen
    LuLibraryBig,  // Biblioteca (plantillas / formas / texto)
    LuLayoutGrid,  // Pizarras (Grid view)
    LuMonitorPlay, // Presentar
    LuCarrot,      // Ingrediente
    LuChefHat      // Receta
} from 'react-icons/lu';

// Tool groups — logically ordered: navegar → crear → biblioteca → grimorio → tablero
const TOOLS = [
    // Navegación
    { id: 'pointer', icon: <LuMousePointer2 size={20} />, label: 'Seleccionar', hint: 'V' },
    { id: 'hand', icon: <LuHand size={20} />, label: 'Mover lienzo', hint: 'Espacio' },
    { id: 'sep1', type: 'separator' },
    // Crear
    { id: 'text', icon: <LuType size={20} />, label: 'Texto', hint: 'T' },
    { id: 'shape', icon: <LuSquare size={20} />, label: 'Forma', hint: 'R' },
    { id: 'line', icon: <LuMinus size={20} />, label: 'Línea', hint: 'L' },
    { id: 'image', icon: <LuImage size={20} />, label: 'Imagen', isAction: true },
    { id: 'sep2', type: 'separator' },
    // Biblioteca
    { id: 'library', icon: <LuLibraryBig size={20} />, label: 'Biblioteca', isAction: true },
    { id: 'sep_grimorio', type: 'separator' },
    // Grimorio
    { id: 'ingredient', icon: <LuCarrot size={20} />, label: 'Ingrediente', isAction: true },
    { id: 'recipe', icon: <LuChefHat size={20} />, label: 'Receta', isAction: true },
    { id: 'sep3', type: 'separator' },
    // Tablero
    { id: 'project', icon: <LuLayoutGrid size={20} />, label: 'Mis pizarras', isAction: true },
    { id: 'presentation', icon: <LuMonitorPlay size={20} />, label: 'Presentar', hint: 'P', isAction: true },
] as const;

export const LeftRail: React.FC = () => {
    const activeTool = pizarronStore.useSelector(s => s.uiFlags.activeTool);
    const showLibrary = pizarronStore.useSelector(s => s.uiFlags.showLibrary);
    const showProjectManager = pizarronStore.useSelector(s => s.uiFlags.showProjectManager);
    const mode = pizarronStore.useSelector(s => s.interactionState.mode);

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
                x: cx - scaled(200) / 2, y: cy - scaled(200) / 2, w: scaled(200), h: scaled(200),
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

        if (tool.id === 'ingredient' || tool.id === 'recipe') {
            // Toggle Picker with specific Type
            // If already open with same type, close it.
            const current = pizarronStore.getState().uiFlags.grimorioPickerOpen;
            const target = tool.id === 'ingredient' ? 'ingredients' : 'recipes';

            if (current === target) {
                pizarronStore.setUIFlag('grimorioPickerOpen', null);
            } else {
                pizarronStore.setUIFlag('grimorioPickerOpen', target as any);
            }
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
            // Creation / navigation tools (pointer, hand, text, shape, line)
            if (tool.id === 'shape') {
                // Ensure a default shape so the draw tool produces a rectangle
                pizarronStore.setUIFlag('activeShapeType', 'rectangle');
            }
            pizarronStore.setActiveTool(tool.id);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 max-h-[55dvh] lg:max-h-none overflow-y-auto no-scrollbar flex gap-2 pointer-events-auto items-start transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {/* Main Strip */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map((tool: any, i) => {
                    // Phase 5: Interaction Mode Filtering
                    if (mode !== 'creative' && mode !== undefined) {
                        const allowed = ['pointer', 'hand', 'project', 'presentation', 'ingredient', 'recipe', 'sep1', 'sep_grimorio', 'sep3'];
                        if (!allowed.includes(tool.id)) return null;
                    }

                    if (tool.type === 'separator') {
                        return <div key={`sep-${i}`} className="h-px w-6 bg-slate-200 dark:bg-slate-700 mx-auto my-1" />;
                    }

                    let isActive = activeTool === tool.id;
                    if (tool.id === 'library') isActive = !!showLibrary;
                    if (tool.id === 'project') isActive = !!showProjectManager;

                    return (
                        <button
                            key={tool.id}
                            onClick={() => handleTool(tool)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 scale-105 shadow-sm' // Active Pop (Orange)
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent hover:scale-110' // Hover Lift
                                }`}
                            title={tool.hint ? `${tool.label} (${tool.hint})` : tool.label}
                        >
                            {tool.icon}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

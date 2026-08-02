import React from 'react';
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

/**
 * Definición y comportamiento de las herramientas del lienzo.
 *
 * Vive aparte porque lo consumen dos presentaciones distintas: el rail vertical
 * de escritorio (`LeftRail`) y la tira horizontal del móvil
 * (`MobileToolStrip`). Duplicar la lista y el manejador garantizaría que una de
 * las dos se quedase atrás en cuanto se añadiera una herramienta.
 */

type ToolId = 'pointer' | 'hand' | 'text' | 'shape' | 'line' | 'image' | 'rectangle';

export interface Tool {
    id: string;
    icon?: React.ReactNode;
    label?: string;
    hint?: string;
    isAction?: boolean;
    type?: 'separator';
}

// Orden lógico: navegar → crear → biblioteca → grimorio → tablero
export const TOOLS: Tool[] = [
    { id: 'pointer', icon: <LuMousePointer2 size={20} />, label: 'Seleccionar', hint: 'V' },
    { id: 'hand', icon: <LuHand size={20} />, label: 'Mover lienzo', hint: 'Espacio' },
    { id: 'sep1', type: 'separator' },
    { id: 'text', icon: <LuType size={20} />, label: 'Texto', hint: 'T' },
    { id: 'shape', icon: <LuSquare size={20} />, label: 'Forma', hint: 'R' },
    { id: 'line', icon: <LuMinus size={20} />, label: 'Línea', hint: 'L' },
    { id: 'image', icon: <LuImage size={20} />, label: 'Imagen', isAction: true },
    { id: 'sep2', type: 'separator' },
    { id: 'library', icon: <LuLibraryBig size={20} />, label: 'Biblioteca', isAction: true },
    { id: 'sep_grimorio', type: 'separator' },
    { id: 'ingredient', icon: <LuCarrot size={20} />, label: 'Ingrediente', isAction: true },
    { id: 'recipe', icon: <LuChefHat size={20} />, label: 'Receta', isAction: true },
    { id: 'sep3', type: 'separator' },
    { id: 'project', icon: <LuLayoutGrid size={20} />, label: 'Mis pizarras', isAction: true },
    { id: 'presentation', icon: <LuMonitorPlay size={20} />, label: 'Presentar', hint: 'P', isAction: true },
];

/**
 * Las cuatro que se usan constantemente. En móvil van siempre visibles; el
 * resto queda tras "Más", porque doce herramientas no caben en 390px sin
 * bajar de los 44px de objetivo táctil.
 */
export const HERRAMIENTAS_PRIMARIAS = ['pointer', 'hand', 'text', 'shape'];

/** Fuera del modo creativo solo tienen sentido estas. */
const PERMITIDAS_SIN_CREATIVO = [
    'pointer', 'hand', 'project', 'presentation', 'ingredient', 'recipe',
    'sep1', 'sep_grimorio', 'sep3',
];

export const herramientaPermitida = (tool: Tool, mode: string | undefined): boolean =>
    mode === 'creative' || mode === undefined || PERMITIDAS_SIN_CREATIVO.includes(tool.id);

export const herramientaActiva = (
    tool: Tool,
    flags: { activeTool?: string; showLibrary?: boolean; showProjectManager?: boolean }
): boolean => {
    if (tool.id === 'library') return !!flags.showLibrary;
    if (tool.id === 'project') return !!flags.showProjectManager;
    return flags.activeTool === tool.id;
};

/** Ejecuta la herramienta. Único punto de verdad del comportamiento. */
export const handleTool = (tool: Tool) => {
    if (tool.id === 'presentation') {
        pizarronStore.setPresentationMode(true);
        return;
    }

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
        // Alterna el selector; si ya está abierto con el mismo tipo, lo cierra.
        const current = pizarronStore.getState().uiFlags.grimorioPickerOpen;
        const target = tool.id === 'ingredient' ? 'ingredients' : 'recipes';
        pizarronStore.setUIFlag('grimorioPickerOpen', current === target ? null : (target as any));
        return;
    }

    if (tool.isAction) {
        if (tool.id === 'delete') {
            const selection = Array.from(pizarronStore.getState().selection);
            selection.forEach(id => pizarronStore.deleteNode(id));
            pizarronStore.setSelection([]);
        }
        return;
    }

    // Herramientas de creación y navegación (pointer, hand, text, shape, line)
    if (tool.id === 'shape') {
        // Una forma por defecto, para que la herramienta de dibujo produzca un rectángulo
        pizarronStore.setUIFlag('activeShapeType', 'rectangle');
    }
    pizarronStore.setActiveTool(tool.id as ToolId);
};

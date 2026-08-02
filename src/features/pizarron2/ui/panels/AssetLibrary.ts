import { scaled } from '../../engine/nodeDefaults';
import { BoardNode } from "../../engine/types";
import { FontDefinition } from "../../engine/FontLoader";
import { STRUCTURE_TEMPLATES } from "../../engine/structures";

// --- Types ---
export interface AssetCategory {
    id: string;
    label: string;
    items: AssetDefinition[];
}

export interface AssetDefinition {
    id: string;
    label: string;
    icon: string; // SVG Path string or Emoji or Shape Preview code
    type: 'icon' | 'shape' | 'sticker' | 'template' | 'line';
    tags?: string[];
    data: any; // Node payload
}

// --- Helper: Dedupe ---
export const dedupeByKey = <T>(items: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// --- Fonts Registry (Source of Truth) ---
// Expanded to include ~30+ popular, high-quality Google Fonts
export const AVAILABLE_FONTS: FontDefinition[] = [
    // Sans Serif
    { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700], source: 'google' },
    { family: 'Roboto', category: 'sans-serif', weights: [400, 500, 700], source: 'google' },
    { family: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Lato', category: 'sans-serif', weights: [400, 700], source: 'google' },
    { family: 'Montserrat', category: 'sans-serif', weights: [400, 500, 600, 700], source: 'google' },
    { family: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700], source: 'google' },
    { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700], source: 'google' },
    { family: 'Nunito', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Raleway', category: 'sans-serif', weights: [400, 600], source: 'google' },
    { family: 'Rubik', category: 'sans-serif', weights: [400, 500, 700], source: 'google' },
    { family: 'Work Sans', category: 'sans-serif', weights: [400, 600], source: 'google' },
    { family: 'Quicksand', category: 'sans-serif', weights: [400, 600], source: 'google' },
    { family: 'Manrope', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },

    // Serif
    { family: 'Playfair Display', category: 'serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Merriweather', category: 'serif', weights: [300, 400, 700], source: 'google' },
    { family: 'Lora', category: 'serif', weights: [400, 500, 600], source: 'google' },
    { family: 'PT Serif', category: 'serif', weights: [400, 700], source: 'google' },
    { family: 'Bitter', category: 'serif', weights: [400, 600], source: 'google' },
    { family: 'Libre Baskerville', category: 'serif', weights: [400, 700], source: 'google' },
    { family: 'Crimson Text', category: 'serif', weights: [400, 600], source: 'google' },
    { family: 'Arvo', category: 'serif', weights: [400, 700], source: 'google' },

    // Display / Handwriting / Monospace
    { family: 'Permanent Marker', category: 'display', weights: [400], source: 'google' },
    { family: 'Abril Fatface', category: 'display', weights: [400], source: 'google' },
    { family: 'Bebas Neue', category: 'display', weights: [400], source: 'google' },
    { family: 'Lobster', category: 'display', weights: [400], source: 'google' },
    { family: 'Pacifico', category: 'handwriting', weights: [400], source: 'google' },
    { family: 'Dancing Script', category: 'handwriting', weights: [400, 700], source: 'google' },
    { family: 'Indie Flower', category: 'handwriting', weights: [400], source: 'google' },
    { family: 'Fira Code', category: 'monospace', weights: [400, 600], source: 'google' },
    { family: 'Roboto Mono', category: 'monospace', weights: [400, 500], source: 'google' },
    { family: 'Space Mono', category: 'monospace', weights: [400, 700], source: 'google' },
];

// --- Shapes Catalog ---
// Default shape fill: light surface that applyTheme() remaps to dark slate in dark mode.
const SHAPE_FILL = '#f1f5f9';
const SHAPE_STROKE = '#94a3b8';
const shapeData = (shapeType: string, w: number, h: number, extra: any = {}) => ({
    type: 'shape', shapeType, w, h,
    content: { color: SHAPE_FILL, borderColor: SHAPE_STROKE, borderWidth: 2, ...extra },
});

const BASIC_SHAPES: AssetDefinition[] = [
    { id: 'rect', label: 'Cuadrado', icon: '◻️', type: 'shape', data: shapeData('rectangle', 120, 100), tags: ['box', 'square', 'cuadrado'] },
    { id: 'rect_round', label: 'Redondeado', icon: '▢', type: 'shape', data: shapeData('rectangle', 120, 100, { borderRadius: 16 }), tags: ['box', 'rounded', 'card'] },
    { id: 'circle', label: 'Círculo', icon: '○', type: 'shape', data: shapeData('circle', 100, 100), tags: ['round', 'circle', 'circulo'] },
    { id: 'pill', label: 'Píldora', icon: '⬭', type: 'shape', data: shapeData('pill', 160, 64), tags: ['pill', 'tag', 'badge', 'boton'] },
    { id: 'triangle', label: 'Triángulo', icon: '△', type: 'shape', data: shapeData('triangle', 100, 100), tags: ['poly', 'pyramid', 'triangulo'] },
    { id: 'diamond', label: 'Rombo', icon: '◇', type: 'shape', data: shapeData('diamond', 100, 100), tags: ['poly', 'decision', 'rombo'] },
    { id: 'star', label: 'Estrella', icon: '★', type: 'shape', data: shapeData('star', 110, 110), tags: ['fav', 'rating', 'estrella'] },
    { id: 'line_basic', label: 'Línea', icon: '╱', type: 'line', data: { type: 'line', w: 160, h: 0, content: { strokeStyle: 'solid', color: SHAPE_STROKE, strokeWidth: 3 } }, tags: ['line', 'linea'] },
    { id: 'arrow_basic', label: 'Flecha', icon: '➔', type: 'shape', data: shapeData('arrow_right', 120, 64), tags: ['dir', 'flecha'] },
];

const FLOW_SHAPES: AssetDefinition[] = [
    { id: 'process', label: 'Proceso', icon: '▭', type: 'shape', data: shapeData('rectangle', 140, 80, { borderRadius: 6 }), tags: ['process', 'proceso'] },
    { id: 'decision', label: 'Decisión', icon: '◇', type: 'shape', data: shapeData('diamond', 120, 100), tags: ['decision', 'decision'] },
    { id: 'terminator', label: 'Inicio/Fin', icon: '⬭', type: 'shape', data: shapeData('pill', 140, 64), tags: ['start', 'end', 'inicio'] },
    { id: 'data', label: 'Datos', icon: '▱', type: 'shape', data: shapeData('parallelogram', 120, 80), tags: ['io', 'input', 'datos'] },
    { id: 'arrow_box', label: 'Conector', icon: '➜', type: 'shape', data: shapeData('arrow_right', 120, 56), tags: ['dir', 'conector'] },
];

const CONTAINER_SHAPES: AssetDefinition[] = [
    { id: 'cloud', label: 'Nube', icon: '☁️', type: 'shape', data: shapeData('cloud', 140, 90), tags: ['cloud', 'nube'] },
    { id: 'speech', label: 'Diálogo', icon: '💬', type: 'shape', data: shapeData('speech_bubble', 140, 90), tags: ['chat', 'dialogo', 'bocadillo'] },
    { id: 'frame_simple', label: 'Marco', icon: '🖼️', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 320, h: 320, content: { color: 'transparent', borderColor: SHAPE_STROKE, borderWidth: 2, borderStyle: 'dashed', borderRadius: 8 } }, tags: ['group', 'marco', 'frame'] },
];

const GEOMETRIC_SHAPES: AssetDefinition[] = [
    { id: 'hexagon', label: 'Hexágono', icon: '⬡', type: 'shape', data: shapeData('hexagon', 110, 100), tags: ['poly', '6', 'hexagono'] },
    { id: 'pentagon', label: 'Pentágono', icon: '⬠', type: 'shape', data: shapeData('pentagon', 100, 100), tags: ['poly', '5', 'pentagono'] },
    { id: 'octagon', label: 'Octágono', icon: '⯃', type: 'shape', data: shapeData('octagon', 100, 100), tags: ['poly', 'stop', 'octagono'] },
    { id: 'trapezoid', label: 'Trapecio', icon: '⏢', type: 'shape', data: shapeData('trapezoid', 120, 80), tags: ['poly', 'trapecio'] },
    { id: 'parallelogram', label: 'Paralelo.', icon: '▱', type: 'shape', data: shapeData('parallelogram', 120, 80), tags: ['poly', 'paralelogramo'] },
    { id: 'triangle_right', label: 'Tri. Recto', icon: '◢', type: 'shape', data: shapeData('triangle_right', 100, 100), tags: ['poly'] },
    { id: 'cross', label: 'Cruz', icon: '✚', type: 'shape', data: shapeData('cross', 100, 100), tags: ['math', 'plus', 'cruz'] },
];

const ARROW_SHAPES: AssetDefinition[] = [
    { id: 'arrow_left', label: 'Izquierda', icon: '⬅', type: 'shape', data: shapeData('arrow_left', 120, 64), tags: ['dir', 'izquierda'] },
    { id: 'arrow_up', label: 'Arriba', icon: '⬆', type: 'shape', data: shapeData('arrow_up', 64, 120), tags: ['dir', 'arriba'] },
    { id: 'arrow_down', label: 'Abajo', icon: '⬇', type: 'shape', data: shapeData('arrow_down', 64, 120), tags: ['dir', 'abajo'] },
    { id: 'chevron', label: 'Chevron', icon: '›', type: 'shape', data: shapeData('chevron_right', 64, 100), tags: ['dir'] },
];

// --- Flattened Shape Lists for cleaner export ---
// Removing any duplicates by ID
const UNIQUE_BASIC = dedupeByKey(BASIC_SHAPES, i => i.id);
const UNIQUE_FLOW = dedupeByKey(FLOW_SHAPES, i => i.id);
const UNIQUE_CONTAINERS = dedupeByKey(CONTAINER_SHAPES, i => i.id);
const UNIQUE_GEOMETRIC = dedupeByKey(GEOMETRIC_SHAPES, i => i.id);
const UNIQUE_ARROWS = dedupeByKey(ARROW_SHAPES, i => i.id);

export const SHAPE_LIBRARIES: AssetCategory[] = [

    { id: 'basic', label: 'Básicas', items: UNIQUE_BASIC },
    { id: 'geometric', label: 'Geométricas', items: UNIQUE_GEOMETRIC },
    { id: 'arrows', label: 'Flechas', items: UNIQUE_ARROWS },
    {
        id: 'lines', label: 'Líneas', items: [
            { id: 'l-solid', label: 'Sólida', icon: '━', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'solid' } } },
            { id: 'l-dashed', label: 'Discontinues', icon: '┅', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dashed' } } },
            { id: 'l-dotted', label: 'Punteada', icon: '┄', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dotted' } } },
        ]
    },
    { id: 'flow', label: 'Diagrama de Flujo', items: UNIQUE_FLOW },
    { id: 'containers', label: 'Contenedores', items: UNIQUE_CONTAINERS }
];

// --- Icons (SVG Paths) ---
export const ICON_LIBRARIES: AssetCategory[] = [
    {
        id: 'essentials',
        label: 'Interfaz',
        items: [
            { id: 'user', label: 'User', icon: '👤', type: 'icon', tags: ['user', 'profile'], data: { type: 'icon', path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'settings', label: 'Settings', icon: '⚙️', type: 'icon', tags: ['gear', 'config'], data: { type: 'icon', path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'check', label: 'Check', icon: '✅', type: 'icon', tags: ['ok', 'success'], data: { type: 'icon', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'search', label: 'Search', icon: '🔍', type: 'icon', tags: ['find'], data: { type: 'icon', path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'star_icon', label: 'Star', icon: '⭐', type: 'icon', tags: ['fav'], data: { type: 'icon', path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'favorite', label: 'Heart', icon: '❤️', type: 'icon', tags: ['love'], data: { type: 'icon', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
        ]
    },
    {
        id: 'objects',
        label: 'Objetos',
        items: [
            { id: 'group', label: 'Gente', icon: '👥', type: 'icon', tags: ['team'], data: { type: 'icon', path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'image', label: 'Imagen', icon: '🖼️', type: 'icon', tags: ['photo'], data: { type: 'icon', path: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z', w: 60, h: 60, content: { color: '#64748b' } } },
        ]
    },
    {
        id: 'devices',
        label: 'Devices',
        items: [
            { id: 'phone', label: 'Phone', icon: '📱', type: 'icon', tags: ['mobile'], data: { type: 'icon', path: 'M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'laptop', label: 'Laptop', icon: '💻', type: 'icon', tags: ['computer'], data: { type: 'icon', path: 'M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'desktop', label: 'Desktop', icon: '🖥️', type: 'icon', tags: ['monitor'], data: { type: 'icon', path: 'M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z', w: 60, h: 60, content: { color: '#64748b' } } },
        ]
    },
    {
        id: 'misc',
        label: 'Misc',
        items: [
            { id: 'bolt', label: 'Bolt', icon: '⚡', type: 'icon', tags: ['energy'], data: { type: 'icon', path: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C7.56 12.63 7.85 12.06 8.5 11h2.7l-1 7zm0-15h2l-2 7h3.5c.58 0 .57.32.38.66l-.07.12C16.44 14.37 16.15 14.94 15.5 16h-2.7l1-7z', w: 60, h: 60, content: { color: '#64748b' } } }, // Simple Bolt fallback (bad path actually, replacing with better)
            { id: 'cloud', label: 'Cloud', icon: '☁️', type: 'icon', tags: ['weather'], data: { type: 'icon', path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'marker', label: 'Pin', icon: '📍', type: 'icon', tags: ['location'], data: { type: 'icon', path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', w: 60, h: 60, content: { color: '#64748b' } } }
        ]
    }
];

// --- Composite / Frameworks ---
// Merged into TEMPLATE_LIBRARIES below
export const COMPOSITE_SHAPES: AssetCategory[] = [];

// --- TEMPLATES (The Big Catalog) ---

// Helpers for creating nodes
const createNode = (type: string, x: number, y: number, w: number, h: number, content: any = {}) => ({
    id: `n-${Math.random()}`, // Placeholder ID, will be regenerated on insert
    type,
    x, y, w, h,
    content: { color: '#ffffff', ...content } // Default white bg
});

const createText = (x: number, y: number, w: number, h: number, text: string, fontSize: number = 14, fontWeight: string = 'normal', color: string = '#1e293b', textAlign: string = 'center') =>
    createNode('text', x, y, w, h, { title: text, fontSize, fontWeight, color, textAlign, backgroundColor: 'transparent' });

// 1. Frameworks


const T_BMC = {
    nodes: [
        createNode('shape', 0, 0, 1000, 600, { color: '#f8fafc', borderColor: '#64748b', borderWidth: 2 }),
        // Key Partners (Left Tall)
        createNode('shape', 10, 50, 190, 540, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(20, 60, 150, 30, 'Key Partners', 14, 'bold'),

        // Key Activities (Top Mid-Left)
        createNode('shape', 210, 50, 190, 265, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(220, 60, 150, 30, 'Key Activities', 14, 'bold'),

        // Key Resources (Bottom Mid-Left)
        createNode('shape', 210, 325, 190, 265, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(220, 335, 150, 30, 'Key Resources', 14, 'bold'),

        // Value Prop (Center Tall)
        createNode('shape', 410, 50, 180, 540, { color: '#f0f9ff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(420, 60, 150, 30, 'Value Propositions', 14, 'bold'),

        // Customer Relationships (Top Mid-Right)
        createNode('shape', 600, 50, 190, 265, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(610, 60, 150, 30, 'Relationships', 14, 'bold'),

        // Channels (Bottom Mid-Right)
        createNode('shape', 600, 325, 190, 265, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(610, 335, 150, 30, 'Channels', 14, 'bold'),

        // Customer Segments (Right Tall)
        createNode('shape', 800, 50, 190, 540, { color: '#ffffff', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(810, 60, 150, 30, 'Customer Segments', 14, 'bold'),

        // Title
        createText(0, 0, 1000, 50, 'Business Model Canvas', 20, 'bold'),
    ]
};

// 2. Grids & Layouts


// 3. Cards & Blocks
const T_KPI_CARD = {
    nodes: [
        createNode('shape', 0, 0, 240, 160, { color: 'white', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1, filters: { shadow: { color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 } } }),
        createText(20, 20, 200, 30, 'Total Revenue', 14, 'normal', '#64748b'),
        createText(20, 50, 200, 50, '$45,230', 36, 'bold', '#0f172a'),
        createText(20, 110, 100, 30, '+12.5%', 14, 'bold', '#22c55e'), // Green indicator
    ]
};


// 4. Diagrams
const T_FLOW_3STEP = {
    nodes: [
        createNode('shape', 0, 20, 140, 60, { shapeType: 'pill', color: '#dbeafe', borderColor: '#3b82f6', borderWidth: 1 }),
        createText(10, 35, 120, 30, 'Step 1: Input', 12, 'bold'),

        createNode('shape', 145, 45, 50, 10, { shapeType: 'arrow_right', color: '#94a3b8' }),

        createNode('shape', 200, 0, 140, 100, { shapeType: 'rectangle', color: 'white', borderColor: '#64748b', borderWidth: 1 }),
        createText(210, 40, 120, 20, 'Step 2: Process', 12, 'bold'),

        createNode('shape', 345, 45, 50, 10, { shapeType: 'arrow_right', color: '#94a3b8' }),

        createNode('shape', 400, 20, 140, 60, { shapeType: 'pill', color: '#dcfce7', borderColor: '#22c55e', borderWidth: 1 }),
        createText(410, 35, 120, 30, 'Step 3: Output', 12, 'bold'),
    ]
};

// 5. Tables Lite
const T_TABLE_SIMPLE = {
    nodes: [
        // Header Row
        createNode('shape', 0, 0, 600, 40, { color: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(10, 10, 180, 20, 'Name', 12, 'bold'),
        createText(210, 10, 180, 20, 'Category', 12, 'bold'),
        createText(410, 10, 180, 20, 'Status', 12, 'bold'),
        // Row 1
        createNode('shape', 0, 40, 600, 40, { color: 'white', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(10, 50, 180, 20, 'Item A', 12, 'normal'),
        createText(210, 50, 180, 20, 'Generic', 12, 'normal'),
        createText(410, 50, 180, 20, 'Active', 12, 'normal', '#166534'),
        // Row 2
        createNode('shape', 0, 80, 600, 40, { color: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1 }),
        createText(10, 90, 180, 20, 'Item B', 12, 'normal'),
        createText(210, 90, 180, 20, 'Special', 12, 'normal'),
        createText(410, 90, 180, 20, 'In Review', 12, 'normal', '#d97706'),
    ]
};


const T_TIMELINE_H = {
    nodes: [
        createNode('line', 0, 100, 600, 0, { strokeStyle: 'solid', strokeWidth: 4, color: '#94a3b8', endArrow: true }),
        // Points
        createNode('shape', 50, 90, 20, 20, { shapeType: 'circle', color: '#3b82f6' }),
        createText(30, 60, 60, 20, 'Start', 12, 'bold', '#3b82f6', 'center'),
        createNode('shape', 300, 90, 20, 20, { shapeType: 'circle', color: '#94a3b8' }),
        createText(280, 120, 60, 20, 'Phase 1', 12, 'normal', '#64748b', 'center'),
        createNode('shape', 550, 90, 20, 20, { shapeType: 'circle', color: '#10b981' }),
        createText(530, 60, 60, 20, 'Launch', 12, 'bold', '#10b981', 'center'),
    ]
};




// 6. Cocktail Systems
const T_APP_FLOW = {
    nodes: [
        createNode('shape', 0, 0, 200, 350, { color: 'white', borderRadius: 20, borderColor: '#1e293b', borderWidth: 4 }), // Phone frame
        createText(20, 20, 160, 20, 'Login Screen', 12, 'bold', '#94a3b8'),
        createNode('shape', 20, 150, 160, 40, { color: '#3b82f6', borderRadius: 8 }),
        createText(30, 160, 140, 20, 'Sign In', 12, 'bold', 'white'),
    ]
};


// Board template built on the new zone-based structure system.
// Each produces a single `board` node carrying structureId + a deep copy of the
// matching STRUCTURE_TEMPLATE so it follows dark mode and inline zone editing.
const boardTemplate = (
    structureId: string, label: string, icon: string, w: number, h: number, tags: string[] = [],
): AssetDefinition => ({
    id: `tpl-${structureId}`,
    label, icon, type: 'template', tags,
    data: {
        nodes: [{
            id: `n-${structureId}`, type: 'board', x: 0, y: 0, w, h,
            content: { title: label, color: '#ffffff' },
            structureId,
            structure: JSON.parse(JSON.stringify(STRUCTURE_TEMPLATES[structureId])),
        }],
    },
});

export const TEMPLATE_LIBRARIES: AssetCategory[] = [
    {
        id: 'pizarras',
        label: 'Pizarras',
        items: [
            {
                id: 't-empty', label: 'Pizarra Vacía', icon: '⬜', type: 'template', tags: ['empty', 'blank', 'vacia'],
                data: { nodes: [{ id: 'board-empty', type: 'board', x: 0, y: 0, w: 800, h: 600, content: { title: 'Nueva Pizarra', color: '#ffffff' } }] }
            },
            boardTemplate('technical-grid-structure', 'Análisis DAFO', '⚡', 900, 700, ['swot', 'dafo', 'estrategia']),
            boardTemplate('menu-design-structure', 'Ingeniería de Menú', '📊', 900, 720, ['bcg', 'matriz', 'rentabilidad']),
            boardTemplate('kanban-structure', 'Kanban', '📋', 1000, 620, ['agile', 'tareas', 'kanban']),
            boardTemplate('comparison-structure', 'Comparación', '⚖️', 1000, 620, ['comparar', 'opciones']),
            boardTemplate('planning-structure', 'Planificación Semanal', '📅', 1100, 600, ['semana', 'agenda', 'plan']),
        ]
    },
    {
        id: 'fyb',
        label: 'F&B / Carta',
        items: [
            boardTemplate('cocktail-recipe-structure', 'Ficha de Cóctel', '🍸', 760, 880, ['coctel', 'receta', 'drink']),
            boardTemplate('menu-layout-structure', 'Carta de Menú', '📜', 620, 820, ['menu', 'carta', 'food']),
        ]
    },
    {
        id: 'creativo',
        label: 'Creativo',
        items: [
            boardTemplate('storytelling-structure', 'Storytelling', '✨', 1000, 620, ['historia', 'marca', 'concepto']),
            boardTemplate('visual-moodboard-structure', 'Moodboard', '🖼️', 900, 680, ['inspiracion', 'imagenes', 'mood']),
        ]
    },
    {
        id: 'componentes',
        label: 'Componentes',
        items: [
            { id: 't-kpi', label: 'Tarjeta KPI', icon: '📊', type: 'template', data: T_KPI_CARD, tags: ['metric', 'data', 'kpi'] },
            { id: 't-flow', label: 'Proceso de Flujo', icon: '↔', type: 'template', data: T_FLOW_3STEP, tags: ['flow', 'steps', 'flujo'] },
            { id: 't-timeline', label: 'Línea de Tiempo', icon: '⟷', type: 'template', data: T_TIMELINE_H, tags: ['time', 'roadmap', 'tiempo'] },
            { id: 't-table', label: 'Tabla Simple', icon: '▦', type: 'template', data: T_TABLE_SIMPLE, tags: ['data', 'rows', 'tabla'] },
            { id: 't-bmc', label: 'Business Canvas', icon: '📰', type: 'template', data: T_BMC, tags: ['business', 'model', 'canvas'] },
            { id: 't-app', label: 'Vista Móvil', icon: '📱', type: 'template', data: T_APP_FLOW, tags: ['wireframe', 'mobile', 'movil'] },
        ]
    },
    {
        id: 'escandallator',
        label: '💰 Escandallator',
        items: [
            {
                id: 'costing-node',
                label: 'Recipe Costing',
                icon: '💵',
                type: 'template',
                tags: ['cost', 'finance', 'analysis'],
                data: {
                    nodes: [{
                        id: 'n-cost',
                        type: 'costing',
                        x: 0,
                        y: 0,
                        w: scaled(300),
                        h: scaled(200),
                        content: {
                            title: 'Recipe Costing',
                            borderRadius: 12,
                            backgroundColor: '#fefce8',
                            borderColor: '#fbbf24'
                        }
                    }]
                }
            },
            {
                id: 'scenario-node',
                label: 'Scenario Comparison',
                icon: '📊',
                type: 'template',
                tags: ['scenario', 'comparison', 'analysis'],
                data: {
                    nodes: [{
                        id: 'n-scenario',
                        type: 'costing-scenario',
                        x: 0,
                        y: 0,
                        w: scaled(400),
                        h: scaled(250),
                        content: {
                            title: 'Scenario Analysis',
                            borderRadius: 12,
                            backgroundColor: '#f0fdf4',
                            borderColor: '#10b981',
                            recipeIdsInScenario: []
                        }
                    }]
                }
            },
        ]
    }
];


// --- Graphics (Lines, Gradients, Stickers) ---
export const GRAPHIC_LIBRARIES: AssetCategory[] = [
    {
        id: 'stickers',
        label: 'Stickers y Emojis',
        items: [
            { id: 'e-smile', label: 'Smile', icon: '😀', type: 'icon', tags: ['smile', 'happy'], data: { type: 'text', w: 60, h: 60, content: { title: '😀', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-cool', label: 'Cool', icon: '😎', type: 'icon', tags: ['cool'], data: { type: 'text', w: 60, h: 60, content: { title: '😎', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-think', label: 'Think', icon: '🤔', type: 'icon', tags: ['thinking'], data: { type: 'text', w: 60, h: 60, content: { title: '🤔', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-rocket', label: 'Rocket', icon: '🚀', type: 'icon', tags: ['launch'], data: { type: 'text', w: 60, h: 60, content: { title: '🚀', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-fire', label: 'Fire', icon: '🔥', type: 'icon', tags: ['hot'], data: { type: 'text', w: 60, h: 60, content: { title: '🔥', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-check', label: 'Check', icon: '✅', type: 'icon', tags: ['ok'], data: { type: 'text', w: 60, h: 60, content: { title: '✅', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-warn', label: 'Warning', icon: '⚠️', type: 'icon', tags: ['alert'], data: { type: 'text', w: 60, h: 60, content: { title: '⚠️', fontSize: 48, backgroundColor: 'transparent' } } },
            { id: 'e-party', label: 'Party', icon: '🎉', type: 'icon', tags: ['fun'], data: { type: 'text', w: 60, h: 60, content: { title: '🎉', fontSize: 48, backgroundColor: 'transparent' } } },
        ]
    }
];


// --- Text Presets ---
// Text preset helper — builds a single-node text template
const textPreset = (
    id: string, label: string, sample: string,
    content: { fontFamily?: string; fontSize?: number; fontWeight?: string | number; fontStyle?: string; color?: string; textAlign?: string; letterSpacing?: number; lineHeight?: number; backgroundColor?: string; borderRadius?: number; padding?: number },
    w = 320, h = 60,
): AssetDefinition => ({
    id, label, icon: 'T', type: 'template',
    data: { nodes: [{ id: `n-${id}`, type: 'text', x: 0, y: 0, w, h, content: { title: sample, fontFamily: 'Inter', fontSize: 16, ...content } }] },
});

export const TEXT_PRESETS: AssetCategory[] = [
    {
        id: 'headings',
        label: 'Jerarquía',
        items: [
            textPreset('text-basic', 'Texto Simple', 'Tu texto aquí', { fontSize: 16 }, 220, 40),
            textPreset('h1', 'H1 · Título', 'Título Principal', { fontSize: 48, fontWeight: 700, letterSpacing: -1 }, 460, 64),
            textPreset('h2', 'H2 · Subtítulo', 'Subtítulo de Sección', { fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }, 380, 48),
            textPreset('h3', 'H3 · Apartado', 'Apartado Menor', { fontSize: 24, fontWeight: 600 }, 300, 36),
            textPreset('p', 'Párrafo', 'Escribe aquí tu contenido. Ideal para descripciones y bloques de texto largos.', { fontSize: 16, lineHeight: 1.5 }, 360, 110),
            textPreset('caption', 'Pie / Caption', 'Texto pequeño de apoyo', { fontSize: 12, color: '#94a3b8', letterSpacing: 0.3 }, 260, 28),
        ]
    },
    {
        id: 'display',
        label: 'Impacto / Display',
        items: [
            textPreset('d-bebas', 'Condensada', 'TÍTULO CON FUERZA', { fontFamily: 'Bebas Neue', fontSize: 52, letterSpacing: 1 }, 460, 70),
            textPreset('d-anton', 'Editorial', 'Gran Titular', { fontFamily: 'Abril Fatface', fontSize: 48, fontWeight: 400 }, 440, 66),
            textPreset('d-montserrat', 'Moderna', 'DISEÑO LIMPIO', { fontFamily: 'Montserrat', fontSize: 38, fontWeight: 700, letterSpacing: 2 }, 440, 56),
            textPreset('d-poppins', 'Geométrica', 'Estilo Geométrico', { fontFamily: 'Poppins', fontSize: 40, fontWeight: 600 }, 440, 58),
        ]
    },
    {
        id: 'elegant',
        label: 'Elegante / Serif',
        items: [
            textPreset('e-playfair', 'Lujo', 'Elegancia Atemporal', { fontFamily: 'Playfair Display', fontSize: 40, fontWeight: 600 }, 440, 60),
            textPreset('e-lora', 'Editorial Serif', 'Lectura Refinada', { fontFamily: 'Lora', fontSize: 30, fontWeight: 500 }, 380, 48),
            textPreset('e-merri', 'Clásica', 'Tradición y Detalle', { fontFamily: 'Merriweather', fontSize: 28, fontWeight: 400 }, 380, 46),
            textPreset('quote', 'Cita', '"La simplicidad es la máxima sofisticación."', { fontFamily: 'Playfair Display', fontSize: 22, fontStyle: 'italic', color: '#64748b', lineHeight: 1.4 }, 360, 90),
        ]
    },
    {
        id: 'handwriting',
        label: 'Manuscrita',
        items: [
            textPreset('h-pacifico', 'Casual', 'Hecho a mano', { fontFamily: 'Pacifico', fontSize: 38, fontWeight: 400 }, 380, 60),
            textPreset('h-dancing', 'Cursiva', 'Con estilo propio', { fontFamily: 'Dancing Script', fontSize: 40, fontWeight: 700 }, 380, 58),
            textPreset('h-indie', 'Informal', 'Nota rápida', { fontFamily: 'Indie Flower', fontSize: 34, fontWeight: 400 }, 320, 50),
            textPreset('h-marker', 'Rotulador', 'DESTACADO!', { fontFamily: 'Permanent Marker', fontSize: 34, fontWeight: 400, color: '#f97316' }, 340, 52),
        ]
    },
    {
        id: 'mono',
        label: 'Técnico / Etiquetas',
        items: [
            textPreset('code', 'Código', 'const sabor = "premium";', { fontFamily: 'Fira Code', fontSize: 15, color: '#e2e8f0', backgroundColor: '#1e293b', borderRadius: 8, padding: 12 }, 320, 80),
            textPreset('m-space', 'Monoespaciada', 'DATA · 2026', { fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, letterSpacing: 1 }, 300, 40),
            textPreset('badge', 'Etiqueta', 'NUEVO', { fontFamily: 'Inter', fontSize: 13, fontWeight: 700, color: '#ffffff', backgroundColor: '#f97316', borderRadius: 99, padding: 8, textAlign: 'center', letterSpacing: 1 }, 120, 34),
            textPreset('label-up', 'Eyebrow', 'CATEGORÍA', { fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#0ea5e9', letterSpacing: 2 }, 200, 26),
        ]
    },
];

// Keep other exports if necessary
// (Stickers, Palettes, etc. omitted for brevity if unused, but kept basic empty arrays to avoid breakages if preferred)
export const STICKER_LIBRARIES: AssetCategory[] = [];
export const PALETTE_LIBRARIES: AssetCategory[] = [];

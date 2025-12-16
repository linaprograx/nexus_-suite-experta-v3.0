import { BoardNode } from "../../engine/types";
import { FontDefinition } from "../../engine/FontLoader";

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
const BASIC_SHAPES: AssetDefinition[] = [
    { id: 'rect', label: 'Square', icon: '◻️', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 100, h: 100 }, tags: ['box', 'square'] },
    { id: 'circle', label: 'Circle', icon: '○', type: 'shape', data: { type: 'shape', shapeType: 'circle', w: 100, h: 100 }, tags: ['round', 'circle'] },
    { id: 'triangle', label: 'Triangle', icon: '△', type: 'shape', data: { type: 'shape', shapeType: 'triangle', w: 100, h: 100 }, tags: ['poly', 'pyramid'] },
    { id: 'line_basic', label: 'Line', icon: '╱', type: 'line', data: { type: 'line', w: 100, h: 0, content: { strokeStyle: 'solid', color: '#64748b' } }, tags: ['line'] },
    { id: 'arrow_basic', label: 'Arrow', icon: '➔', type: 'shape', data: { type: 'shape', shapeType: 'arrow_right', w: 100, h: 60 }, tags: ['dir'] },
];

const FLOW_SHAPES: AssetDefinition[] = [
    // { id: 'process', label: 'Process', icon: '▭', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 120, h: 80 }, tags: ['process'] },
    // { id: 'decision', label: 'Decision', icon: '◇', type: 'shape', data: { type: 'shape', shapeType: 'diamond', w: 100, h: 100 }, tags: ['decision'] },
    // { id: 'start_end', label: 'Terminator', icon: '0', type: 'shape', data: { type: 'shape', shapeType: 'pill', w: 120, h: 60 }, tags: ['start', 'end'] },
    { id: 'data', label: 'Data', icon: '▱', type: 'shape', data: { type: 'shape', shapeType: 'parallelogram', w: 120, h: 80 }, tags: ['io', 'input'] },
    { id: 'document', label: 'Document', icon: '📄', type: 'shape', data: { type: 'shape', shapeType: 'file', w: 100, h: 120 }, tags: ['file'] },
    { id: 'arrow_box', label: 'Direction', icon: '➜', type: 'shape', data: { type: 'shape', shapeType: 'arrow_right', w: 100, h: 60 }, tags: ['dir'] },
];

const CONTAINER_SHAPES: AssetDefinition[] = [
    { id: 'cloud', label: 'Cloud', icon: '☁️', type: 'shape', data: { type: 'shape', shapeType: 'cloud', w: 120, h: 80 }, tags: ['cloud'] },
    { id: 'speech', label: 'Speech', icon: '💬', type: 'shape', data: { type: 'shape', shapeType: 'speech_bubble', w: 120, h: 80 }, tags: ['chat'] },
    { id: 'frame_simple', label: 'Frame', icon: '🖼️', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 300, h: 300, content: { color: 'transparent', borderColor: '#94a3b8', borderWidth: 2, borderStyle: 'dashed' } }, tags: ['group'] },
];

const GEOMETRIC_SHAPES: AssetDefinition[] = [
    { id: 'pentagon', label: 'Pentagon', icon: '⬠', type: 'shape', data: { type: 'shape', shapeType: 'pentagon', w: 100, h: 100 }, tags: ['poly', '5'] },
    { id: 'octagon', label: 'Octagon', icon: '🛑', type: 'shape', data: { type: 'shape', shapeType: 'octagon', w: 100, h: 100 }, tags: ['poly', 'stop'] },
    { id: 'trapezoid', label: 'Trapezoid', icon: '⏢', type: 'shape', data: { type: 'shape', shapeType: 'trapezoid', w: 120, h: 80 }, tags: ['poly'] },
    { id: 'parallelogram', label: 'Parallel', icon: '▱', type: 'shape', data: { type: 'shape', shapeType: 'parallelogram', w: 120, h: 80 }, tags: ['poly'] },
    { id: 'triangle_right', label: 'Right Tri', icon: '⊿', type: 'shape', data: { type: 'shape', shapeType: 'triangle_right', w: 100, h: 100 }, tags: ['poly'] },
    { id: 'cross', label: 'Plus', icon: '✚', type: 'shape', data: { type: 'shape', shapeType: 'cross', w: 100, h: 100 }, tags: ['math'] },
];

const ARROW_SHAPES: AssetDefinition[] = [
    { id: 'arrow_left', label: 'Left', icon: '⬅️', type: 'shape', data: { type: 'shape', shapeType: 'arrow_left', w: 100, h: 60 }, tags: ['dir'] },
    { id: 'arrow_up', label: 'Up', icon: '⬆️', type: 'shape', data: { type: 'shape', shapeType: 'arrow_up', w: 60, h: 100 }, tags: ['dir'] },
    { id: 'arrow_down', label: 'Down', icon: '⬇️', type: 'shape', data: { type: 'shape', shapeType: 'arrow_down', w: 60, h: 100 }, tags: ['dir'] },
    { id: 'chevron', label: 'Chevron', icon: '›', type: 'shape', data: { type: 'shape', shapeType: 'chevron_right', w: 60, h: 100 }, tags: ['dir'] },
];

// --- Flattened Shape Lists for cleaner export ---
// Removing any duplicates by ID
const UNIQUE_BASIC = dedupeByKey(BASIC_SHAPES, i => i.id);
const UNIQUE_FLOW = dedupeByKey(FLOW_SHAPES, i => i.id);
const UNIQUE_CONTAINERS = dedupeByKey(CONTAINER_SHAPES, i => i.id);
const UNIQUE_GEOMETRIC = dedupeByKey(GEOMETRIC_SHAPES, i => i.id);
const UNIQUE_ARROWS = dedupeByKey(ARROW_SHAPES, i => i.id);

export const SHAPE_LIBRARIES: AssetCategory[] = [
    { id: 'basic', label: 'Basic', items: UNIQUE_BASIC },
    { id: 'geometric', label: 'Geometric', items: UNIQUE_GEOMETRIC },
    { id: 'arrows', label: 'Arrows', items: UNIQUE_ARROWS },
    { id: 'flow', label: 'Flowchart', items: UNIQUE_FLOW },
    { id: 'containers', label: 'Containers', items: UNIQUE_CONTAINERS }
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
        label: 'Objects',
        items: [
            { id: 'user', label: 'User', icon: '👤', type: 'icon', tags: ['person', 'profile'], data: { type: 'icon', path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'group', label: 'People', icon: '👥', type: 'icon', tags: ['team'], data: { type: 'icon', path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'check', label: 'Check', icon: '✅', type: 'icon', tags: ['ok'], data: { type: 'icon', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'star_icon', label: 'Star', icon: '⭐', type: 'icon', tags: ['fav'], data: { type: 'icon', path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'heart', label: 'Heart', icon: '❤️', type: 'icon', tags: ['love'], data: { type: 'icon', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', w: 60, h: 60, content: { color: '#64748b' } } },
            { id: 'image', label: 'Image', icon: '🖼️', type: 'icon', tags: ['photo'], data: { type: 'icon', path: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z', w: 60, h: 60, content: { color: '#64748b' } } },
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
export const COMPOSITE_SHAPES: AssetCategory[] = [
    {
        id: 'frameworks',
        label: 'Frameworks',
        items: [
            {
                id: 'comp-swot', label: 'SWOT', icon: '⊞', type: 'template',
                data: {
                    nodes: [{
                        id: 'swot-1', type: 'composite', x: 0, y: 0, w: 600, h: 400,
                        content: {
                            composite: {
                                layout: 'swot',
                                structure: { rows: 2, cols: 2, gap: 10, padding: 20 },
                                cells: [
                                    { id: 'c1', row: 0, col: 0, text: 'STRENGTHS', color: '#dcfce7' },
                                    { id: 'c2', row: 0, col: 1, text: 'WEAKNESSES', color: '#fee2e2' },
                                    { id: 'c3', row: 1, col: 0, text: 'OPPORTUNITIES', color: '#dbeafe' },
                                    { id: 'c4', row: 1, col: 1, text: 'THREATS', color: '#ffedd5' },
                                ]
                            }
                        }
                    }]
                }
            },
            {
                id: 'comp-grid-2x2', label: '2x2 Grid', icon: '田', type: 'template',
                data: {
                    nodes: [{
                        id: 'grid-2x2', type: 'composite', x: 0, y: 0, w: 400, h: 400,
                        content: {
                            composite: {
                                layout: 'grid',
                                structure: { rows: 2, cols: 2, gap: 10, padding: 0 },
                                cells: Array.from({ length: 4 }, (_, i) => ({
                                    id: `c-${i}`, row: Math.floor(i / 2), col: i % 2, text: '', color: '#ffffff'
                                }))
                            }
                        }
                    }]
                }
            },
            {
                id: 'comp-kanban-3', label: 'Kanban (3 Col)', icon: '|||', type: 'template',
                data: {
                    nodes: [
                        { id: 'k1', type: 'shape', x: 0, y: 0, w: 200, h: 500, content: { color: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 } },
                        { id: 'kt1', type: 'text', x: 10, y: 10, w: 180, h: 30, content: { title: 'TO DO', fontWeight: 'bold', textAlign: 'center' } },
                        { id: 'k2', type: 'shape', x: 210, y: 0, w: 200, h: 500, content: { color: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 } },
                        { id: 'kt2', type: 'text', x: 220, y: 10, w: 180, h: 30, content: { title: 'DOING', fontWeight: 'bold', textAlign: 'center' } },
                        { id: 'k3', type: 'shape', x: 420, y: 0, w: 200, h: 500, content: { color: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 } },
                        { id: 'kt3', type: 'text', x: 430, y: 10, w: 180, h: 30, content: { title: 'DONE', fontWeight: 'bold', textAlign: 'center' } },
                    ]
                }
            }
        ]
    }
];

// --- TEMPLATES (The Big Catalog) ---

// Helpers for creating nodes
const createNode = (type: string, x: number, y: number, w: number, h: number, content: any = {}) => ({
    id: `n-${Math.random()}`, // Placeholder ID, will be regenerated on insert
    type,
    x, y, w, h,
    content: { color: '#ffffff', ...content } // Default white bg
});

const createText = (x: number, y: number, w: number, h: number, text: string, fontSize: number = 14, fontWeight: string = 'normal', color: string = '#1e293b') =>
    createNode('text', x, y, w, h, { title: text, fontSize, fontWeight, color, textAlign: 'center', backgroundColor: 'transparent' });

// 1. Frameworks
const T_DAFO = {
    nodes: [
        // Header
        createText(0, 0, 800, 50, 'DAFO / SWOT ANALYSIS', 24, 'bold'),
        // Matrix
        createNode('shape', 0, 60, 390, 250, { color: '#dcfce7', borderRadius: 8 }), // Strengths
        createText(10, 70, 200, 30, 'STRENGTHS', 16, 'bold', '#166534'),

        createNode('shape', 410, 60, 390, 250, { color: '#fee2e2', borderRadius: 8 }), // Weaknesses
        createText(420, 70, 200, 30, 'WEAKNESSES', 16, 'bold', '#991b1b'),

        createNode('shape', 0, 320, 390, 250, { color: '#dbeafe', borderRadius: 8 }), // Opportunities
        createText(10, 330, 200, 30, 'OPPORTUNITIES', 16, 'bold', '#1e40af'),

        createNode('shape', 410, 320, 390, 250, { color: '#ffedd5', borderRadius: 8 }), // Threats
        createText(420, 330, 200, 30, 'THREATS', 16, 'bold', '#9a3412'),
    ]
};

const T_MATRIX_2X2 = {
    nodes: [
        // Axes
        createNode('shape', 0, 0, 600, 600, { color: 'transparent', borderColor: '#94a3b8', borderWidth: 2 }),
        createNode('line', 300, 0, 0, 600, { color: '#cbd5e1', strokeWidth: 2 }),
        createNode('line', 0, 300, 600, 0, { color: '#cbd5e1', strokeWidth: 2 }),
        // Labels
        createText(250, 10, 100, 30, 'HIGH IMPACT', 12, 'bold'),
        createText(250, 560, 100, 30, 'LOW IMPACT', 12, 'bold'),
        createText(10, 285, 100, 30, 'LOW EFFORT', 12, 'bold'),
        createText(500, 285, 100, 30, 'HIGH EFFORT', 12, 'bold'),
        // Quadrants
        createText(100, 100, 100, 30, 'Quick Wins', 16, 'bold', '#166534'),
        createText(400, 100, 100, 30, 'Major Projects', 16, 'bold', '#1e40af'),
        createText(100, 400, 100, 30, 'Fill Ins', 16, 'bold', '#94a3b8'),
        createText(400, 400, 100, 30, 'Thankless Tasks', 16, 'bold', '#ef4444'),
    ]
};

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
const T_GRID_3COL = {
    nodes: [
        createNode('shape', 0, 0, 250, 500, { color: '#f1f5f9', borderRadius: 8 }),
        createText(10, 10, 230, 30, 'Column 1', 14, 'bold'),
        createNode('shape', 270, 0, 250, 500, { color: '#f1f5f9', borderRadius: 8 }),
        createText(280, 10, 230, 30, 'Column 2', 14, 'bold'),
        createNode('shape', 540, 0, 250, 500, { color: '#f1f5f9', borderRadius: 8 }),
        createText(550, 10, 230, 30, 'Column 3', 14, 'bold'),
    ]
};

const T_MENU_LAYOUT = {
    nodes: [
        createText(0, 0, 400, 40, 'Menu Section', 20, 'bold', '#d97706'),
        // Item 1
        createText(0, 50, 300, 30, 'Signature Dish', 16, 'bold'),
        createText(320, 50, 80, 30, '$18', 16, 'bold', '#166534'),
        createText(0, 80, 400, 40, 'Description of the dish goes here. Tasty and fresh.', 12, 'normal', '#64748b'),
        createNode('line', 0, 130, 400, 0, { color: '#e2e8f0', strokeWidth: 1 }),
        // Item 2
        createText(0, 150, 300, 30, 'Another Delight', 16, 'bold'),
        createText(320, 150, 80, 30, '$24', 16, 'bold', '#166534'),
        createText(0, 180, 400, 40, 'Another description. Premium ingredients only.', 12, 'normal', '#64748b'),
    ]
};

// 3. Cards & Blocks
const T_KPI_CARD = {
    nodes: [
        createNode('shape', 0, 0, 240, 160, { color: 'white', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1, filters: { shadow: { color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 } } }),
        createText(20, 20, 200, 30, 'Total Revenue', 14, 'normal', '#64748b'),
        createText(20, 50, 200, 50, '$45,230', 36, 'bold', '#0f172a'),
        createText(20, 110, 100, 30, '+12.5%', 14, 'bold', '#22c55e'), // Green indicator
    ]
};

const T_COCKTAIL_CARD = {
    nodes: [
        createNode('shape', 0, 0, 300, 400, { color: '#1e293b', borderRadius: 16 }),
        createNode('shape', 0, 0, 300, 200, { color: '#334155', borderRadius: 16 }), // Image placeholder
        createText(100, 80, 100, 40, 'PHOTO', 20, 'bold', '#94a3b8'),
        createText(20, 220, 260, 40, 'Negroni Sbagliato', 20, 'bold', '#ffffff'),
        createText(20, 260, 260, 100, '• 1oz Campari\n• 1oz Sweet Vermouth\n• 1oz Prosecco', 14, 'normal', '#cbd5e1'),
        createText(20, 360, 100, 30, 'Stir / Rocks', 12, 'italic', '#94a3b8'),
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

const T_KANBAN_SIMPLE = {
    nodes: [
        createText(0, 0, 800, 40, 'Project Kanban', 24, 'bold'),
        // Columns
        createNode('shape', 0, 50, 250, 400, { color: '#f1f5f9', borderRadius: 8 }),
        createText(10, 60, 200, 20, 'To Do', 14, 'bold'),
        createNode('shape', 270, 50, 250, 400, { color: '#f1f5f9', borderRadius: 8 }),
        createText(280, 60, 200, 20, 'In Progress', 14, 'bold', '#eab308'),
        createNode('shape', 540, 50, 250, 400, { color: '#f1f5f9', borderRadius: 8 }),
        createText(550, 60, 200, 20, 'Done', 14, 'bold', '#22c55e'),
        // Cards
        createNode('shape', 10, 100, 230, 80, { color: 'white', borderRadius: 4, shadow: { color: '#000000', blur: 4, offsetX: 0, offsetY: 2, opacity: 0.1 } }),
        createText(20, 110, 210, 60, 'Task 1: Analysis', 12, 'normal'),
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

const T_BRAINSTORM = {
    nodes: [
        createText(0, 0, 400, 40, 'Brainstorming Session', 24, 'bold'),
        createNode('shape', 0, 60, 150, 150, { color: '#fef3c7', shadow: { color: '#000000', blur: 2, offsetX: 2, offsetY: 2, opacity: 0.1 } }), // Yellow
        createText(10, 70, 130, 130, 'Idea 1', 16, 'normal'),
        createNode('shape', 170, 60, 150, 150, { color: '#dcfce7', shadow: { color: '#000000', blur: 2, offsetX: 2, offsetY: 2, opacity: 0.1 } }), // Green
        createText(180, 70, 130, 130, 'Idea 2', 16, 'normal'),
        createNode('shape', 340, 60, 150, 150, { color: '#dbeafe', shadow: { color: '#000000', blur: 2, offsetX: 2, offsetY: 2, opacity: 0.1 } }), // Blue
        createText(350, 70, 130, 130, 'Idea 3', 16, 'normal'),
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


export const TEMPLATE_LIBRARIES: AssetCategory[] = [
    {
        id: 'frameworks',
        label: 'Frameworks',
        items: [
            { id: 't-dafo', label: 'DAFO Analysis', icon: '⊞', type: 'template', data: T_DAFO, tags: ['swot', 'strategy'] },
            { id: 't-matrix', label: '2x2 Matrix', icon: '田', type: 'template', data: T_MATRIX_2X2, tags: ['priority', 'grid'] },
            { id: 't-bmc', label: 'Business Canvas', icon: '📰', type: 'template', data: T_BMC, tags: ['business', 'model'] },
            { id: 't-kanban', label: 'Kanban Board', icon: '📋', type: 'template', data: T_KANBAN_SIMPLE, tags: ['agile', 'task'] },
        ]
    },
    {
        id: 'layouts',
        label: 'Grids & Layouts',
        items: [
            { id: 't-3col', label: '3 Columns', icon: '|||', type: 'template', data: T_GRID_3COL, tags: ['structure', 'layout'] },
            { id: 't-menu', label: 'Menu Layout', icon: '📜', type: 'template', data: T_MENU_LAYOUT, tags: ['food', 'list'] },
            { id: 't-brainstorm', label: 'Brainstorm', icon: '🧠', type: 'template', data: T_BRAINSTORM, tags: ['ideas', 'sticky'] },
        ]
    },
    {
        id: 'cards',
        label: 'Cards & Blocks',
        items: [
            { id: 't-kpi', label: 'KPI Card', icon: '📊', type: 'template', data: T_KPI_CARD, tags: ['metric', 'data'] },
            { id: 't-cocktail', label: 'Cocktail Card', icon: '🍸', type: 'template', data: T_COCKTAIL_CARD, tags: ['drink', 'recipe'] },
        ]
    },
    {
        id: 'diagrams',
        label: 'Diagrams',
        items: [
            { id: 't-flow', label: 'Flow Process', icon: '↔', type: 'template', data: T_FLOW_3STEP, tags: ['flow', 'steps'] },
            { id: 't-timeline', label: 'Timeline', icon: '⟷', type: 'template', data: T_TIMELINE_H, tags: ['time', 'roadmap'] },
        ]
    },
    {
        id: 'tables',
        label: 'Tables',
        items: [
            { id: 't-table', label: 'Simple Table', icon: '▦', type: 'template', data: T_TABLE_SIMPLE, tags: ['data', 'rows'] },
        ]
    },
    {
        id: 'systems',
        label: 'Mobile / App',
        items: [
            { id: 't-app', label: 'Mobile View', icon: '📱', type: 'template', data: T_APP_FLOW, tags: ['wireframe', 'mobile'] },
        ]
    }
];


// --- Graphics (Lines, Gradients, Stickers) ---
export const GRAPHIC_LIBRARIES: AssetCategory[] = [
    {
        id: 'lines',
        label: 'Lines',
        items: [
            { id: 'l-solid', label: 'Solid', icon: '━', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'solid' } } },
            { id: 'l-dashed', label: 'Dashed', icon: '┅', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dashed' } } },
            { id: 'l-dotted', label: 'Dotted', icon: '┄', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dotted' } } },
        ]
    },
    {
        id: 'stickers',
        label: 'Stickers & Emojis',
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
export const TEXT_PRESETS: AssetCategory[] = [
    {
        id: 'headings',
        label: 'Headings',
        items: [
            { id: 'h1', label: 'H1 Title', icon: 'H1', type: 'template', data: { nodes: [{ id: 'n1', type: 'text', w: 400, h: 60, content: { title: 'Big Heading', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter' } }] } },
            { id: 'h2', label: 'H2 Sub', icon: 'H2', type: 'template', data: { nodes: [{ id: 'n2', type: 'text', w: 300, h: 40, content: { title: 'Sub Heading', fontSize: 32, fontWeight: '600', fontFamily: 'Inter' } }] } },
            { id: 'h3', label: 'H3 Small', icon: 'H3', type: 'template', data: { nodes: [{ id: 'n2b', type: 'text', w: 250, h: 30, content: { title: 'Small Heading', fontSize: 24, fontWeight: '600', fontFamily: 'Inter' } }] } },
            { id: 'p', label: 'Paragraph', icon: '¶', type: 'template', data: { nodes: [{ id: 'n3', type: 'text', w: 300, h: 100, content: { title: 'Start typing here...', fontSize: 16, fontFamily: 'Inter' } }] } },
            { id: 'code', label: 'Code', icon: '</>', type: 'template', data: { nodes: [{ id: 'n4', type: 'text', w: 300, h: 100, content: { title: 'const foo = "bar";', fontSize: 14, fontFamily: 'Fira Code', backgroundColor: '#f1f5f9', color: '#0f172a' } }] } },
            { id: 'quote', label: 'Quote', icon: '“', type: 'template', data: { nodes: [{ id: 'n5', type: 'text', w: 300, h: 80, content: { title: '“To be or not to be...”', fontSize: 20, fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#475569' } }] } },
        ]
    }
];

// Keep other exports if necessary
// (Stickers, Palettes, etc. omitted for brevity if unused, but kept basic empty arrays to avoid breakages if preferred)
export const STICKER_LIBRARIES: AssetCategory[] = [];
export const PALETTE_LIBRARIES: AssetCategory[] = [];

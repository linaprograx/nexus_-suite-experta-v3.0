import { BoardNode } from "../engine/types";
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
    icon: string; // SVG Path string or Emoji
    type: 'icon' | 'shape' | 'sticker' | 'template';
    tags?: string[];
    data: any; // Node payload
}

// --- Icons (SVG Paths) ---
// Sources: Lucide / Heroicons (MIT)

export const ICON_LIBRARIES: AssetCategory[] = [
    {
        id: 'essentials',
        title: 'Interfaz & UI',
        items: [
            { id: 'user', label: 'User', icon: '👤', type: 'icon', tags: ['user', 'profile'], data: { type: 'shape', shapeType: 'icon', path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'settings', label: 'Settings', icon: '⚙️', type: 'icon', tags: ['gear', 'config'], data: { type: 'shape', shapeType: 'icon', path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'check', label: 'Check', icon: '✅', type: 'icon', tags: ['ok', 'success'], data: { type: 'shape', shapeType: 'icon', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'search', label: 'Search', icon: '🔍', type: 'icon', tags: ['find'], data: { type: 'shape', shapeType: 'icon', path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'home', label: 'Home', icon: '🏠', type: 'icon', tags: ['house', 'main'], data: { type: 'shape', shapeType: 'icon', path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'star', label: 'Star', icon: '⭐', type: 'icon', tags: ['fav', 'rate'], data: { type: 'shape', shapeType: 'icon', path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'favorite', label: 'Heart', icon: '❤️', type: 'icon', tags: ['love', 'like'], data: { type: 'shape', shapeType: 'icon', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'delete', label: 'Trash', icon: '🗑️', type: 'icon', tags: ['delete', 'remove'], data: { type: 'shape', shapeType: 'icon', path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'add', label: 'Add', icon: '➕', type: 'icon', tags: ['plus', 'new'], data: { type: 'shape', shapeType: 'icon', path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'menu', label: 'Menu', icon: '☰', type: 'icon', tags: ['list'], data: { type: 'shape', shapeType: 'icon', path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'close', label: 'Close', icon: '✖️', type: 'icon', tags: ['x'], data: { type: 'shape', shapeType: 'icon', path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
        ]
    },
    {
        id: 'food',
        title: 'Gastronomía',
        items: [
            { id: 'restaurant', label: 'Restaurant', icon: '🍽️', type: 'icon', tags: ['eat'], data: { type: 'shape', shapeType: 'icon', path: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'bar', label: 'Copas', icon: '🍸', type: 'icon', tags: ['drink', 'cocktail'], data: { type: 'shape', shapeType: 'icon', path: 'M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'cafe', label: 'Coffe', icon: '☕', type: 'icon', tags: ['drink'], data: { type: 'shape', shapeType: 'icon', path: 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'cake', label: 'Pastel', icon: '🍰', type: 'icon', tags: ['sweet'], data: { type: 'shape', shapeType: 'icon', path: 'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm6 3h-5V5.5c0-.83-.67-1.5-1.5-1.5S10 4.67 10 5.5V9H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2zm0 11H5v-9h14v9z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'pizza', label: 'Pizza', icon: '🍕', type: 'icon', tags: ['food'], data: { type: 'shape', shapeType: 'icon', path: 'M12 2C8.43 2 5.23 3.54 3.01 6L12 22l8.99-16C18.78 3.55 15.57 2 12 2zm-2 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'icecream', label: 'Ice Cream', icon: '🍦', type: 'icon', tags: ['sweet'], data: { type: 'shape', shapeType: 'icon', path: 'M12 2C8.69 2 6 4.69 6 8v6l6 8 6-8V8c0-3.31-2.69-6-6-6zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 3c1.66 0 3 1.34 3 3v2H9v-2c0-1.66 1.34-3 3-3z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
        ]
    },
    {
        id: 'finance',
        title: 'Finanzas',
        items: [
            { id: 'dollar', label: 'Dólar', icon: '💲', type: 'icon', tags: ['money'], data: { type: 'shape', shapeType: 'icon', path: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'chart', label: 'Gráfico', icon: '📊', type: 'icon', tags: ['analytics'], data: { type: 'shape', shapeType: 'icon', path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
            { id: 'wallet', label: 'Cartera', icon: '👛', type: 'icon', tags: ['money'], data: { type: 'shape', shapeType: 'icon', path: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h1c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2h-1zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', w: 60, h: 60, content: { color: '#64748b', borderWidth: 0 } } },
        ]
    }
];

export const SHAPE_LIBRARIES: AssetCategory[] = [
    {
        id: 'basic',
        title: 'Básicos',
        items: [
            { id: 'rect', label: 'Rectángulo', icon: '▭', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 100, h: 100 }, tags: ['box'] },
            { id: 'circle', label: 'Círculo', icon: '○', type: 'shape', data: { type: 'shape', shapeType: 'circle', w: 100, h: 100 }, tags: ['round'] },
            { id: 'triangle', label: 'Triángulo', icon: '△', type: 'shape', data: { type: 'shape', shapeType: 'triangle', w: 100, h: 100 }, tags: ['poly'] },
            { id: 'star', label: 'Estrella', icon: '★', type: 'shape', data: { type: 'shape', shapeType: 'star', w: 100, h: 100 }, tags: ['poly'] },
            { id: 'hexagon', label: 'Hexágono', icon: '⬡', type: 'shape', data: { type: 'shape', shapeType: 'hexagon', w: 100, h: 100 }, tags: ['poly'] },
        ]
    },
    {
        id: 'flow',
        title: 'Diagramas',
        items: [
            { id: 'diamond', label: 'Decisión', icon: '◇', type: 'shape', data: { type: 'shape', shapeType: 'diamond', w: 100, h: 100 }, tags: ['decision'] },
            { id: 'pill', label: 'Píldora', icon: '0', type: 'shape', data: { type: 'shape', shapeType: 'pill', w: 120, h: 60 }, tags: ['button'] },
            { id: 'arrow_box', label: 'Dirección', icon: '➜', type: 'shape', data: { type: 'shape', shapeType: 'arrow_right', w: 100, h: 60 }, tags: ['dir'] },
            { id: 'cloud', label: 'Nube', icon: '☁️', type: 'shape', data: { type: 'shape', shapeType: 'cloud', w: 120, h: 80 }, tags: ['cloud'] },
            { id: 'message', label: 'Mensaje', icon: '💬', type: 'shape', data: { type: 'shape', shapeType: 'speech_bubble', w: 120, h: 80 }, tags: ['chat'] },
        ]
    }
];

// --- Stickers ---
export const STICKER_LIBRARIES: AssetCategory[] = [
    {
        id: 'reactions',
        title: 'Reacciones',
        items: [
            { id: 'st_like', label: 'Like', icon: '👍', type: 'sticker', data: { w: 100, h: 100, content: { title: '👍', color: 'transparent' } }, tags: ['reaction'] },
            { id: 'st_love', label: 'Love', icon: '❤️', type: 'sticker', data: { w: 100, h: 100, content: { title: '❤️', color: 'transparent' } }, tags: ['reaction'] },
            { id: 'st_fire', label: 'Fire', icon: '🔥', type: 'sticker', data: { w: 100, h: 100, content: { title: '🔥', color: 'transparent' } }, tags: ['reaction'] },
            { id: 'st_check', label: 'Check', icon: '✅', type: 'sticker', data: { w: 100, h: 100, content: { title: '✅', color: 'transparent' } }, tags: ['reaction'] },
        ]
    }
];

// --- Graphics (Gradients, Lines, Frames) ---
export const GRAPHIC_LIBRARIES: AssetCategory[] = [
    {
        id: 'gradients',
        label: 'Gradients',
        items: [
            { id: 'g-ocean', label: 'Ocean', icon: '🌊', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 150, h: 100, content: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', borderWidth: 0 } } },
            { id: 'g-sunset', label: 'Sunset', icon: '🌅', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 150, h: 100, content: { gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)', borderWidth: 0 } } },
            { id: 'g-forest', label: 'Forest', icon: '🌲', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 150, h: 100, content: { gradient: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)', borderWidth: 0 } } },
            { id: 'g-royal', label: 'Royal', icon: '👑', type: 'shape', data: { type: 'shape', shapeType: 'rectangle', w: 150, h: 100, content: { gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderWidth: 0 } } },
        ]
    },
    {
        id: 'lines',
        label: 'Styled Lines',
        items: [
            { id: 'l-solid', label: 'Solid', icon: '➖', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'solid' } } },
            { id: 'l-dashed', label: 'Dashed', icon: '┄', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dashed' } } },
            { id: 'l-dotted', label: 'Dotted', icon: '…', type: 'line', data: { type: 'line', w: 200, h: 0, content: { color: '#64748b', strokeWidth: 4, strokeStyle: 'dotted' } } },
        ]
    }
];

// --- Palettes ---
const CREATE_PALETTE = (colors: string[]) => colors.map((c, i) => ({
    id: `p-${i}`, type: 'shape', x: i * 60, y: 0, w: 50, h: 50, content: { color: c, borderWidth: 0, borderRadius: 8 }
}));

const PALETTE_DATA = {
    modern: CREATE_PALETTE(['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8']),
    vibrant: CREATE_PALETTE(['#f97316', '#facc15', '#4ade80', '#2dd4bf', '#3b82f6']),
    pastel: CREATE_PALETTE(['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe']),
};

export const PALETTE_LIBRARIES: AssetCategory[] = [
    {
        id: 'schemes',
        label: 'Color Schemes',
        items: [
            { id: 'pal-modern', label: 'Modern Slate', icon: '🌑', type: 'template', data: { name: 'Modern Palette', nodes: PALETTE_DATA.modern } },
            { id: 'pal-vibrant', label: 'Vibrant', icon: '🌈', type: 'template', data: { name: 'Vibrant Palette', nodes: PALETTE_DATA.vibrant } },
            { id: 'pal-pastel', label: 'Pastels', icon: '🧁', type: 'template', data: { name: 'Pastel Palette', nodes: PALETTE_DATA.pastel } },
        ]
    }
];

// --- Templates ---
const T_KANBAN = {
    name: 'Kanban Board',
    nodes: [
        { id: 'k1', type: 'shape', x: 0, y: 0, w: 240, h: 600, content: { color: '#f8fafc', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1 } },
        { id: 'kt1', type: 'text', x: 20, y: 15, w: 200, h: 40, content: { title: 'TO DO', fontSize: 14, fontWeight: 'bold', color: '#64748b', textAlign: 'center' } },

        { id: 'k2', type: 'shape', x: 260, y: 0, w: 240, h: 600, content: { color: '#f8fafc', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1 } },
        { id: 'kt2', type: 'text', x: 280, y: 15, w: 200, h: 40, content: { title: 'DOING', fontSize: 14, fontWeight: 'bold', color: '#3b82f6', textAlign: 'center' } },

        { id: 'k3', type: 'shape', x: 520, y: 0, w: 240, h: 600, content: { color: '#f8fafc', borderRadius: 12, borderColor: '#e2e8f0', borderWidth: 1 } },
        { id: 'kt3', type: 'text', x: 540, y: 15, w: 200, h: 40, content: { title: 'DONE', fontSize: 14, fontWeight: 'bold', color: '#22c55e', textAlign: 'center' } },
    ]
};

const T_MATRIX = {
    name: '2x2 Matrix',
    nodes: [
        { id: 'bg', type: 'shape', x: 0, y: 0, w: 600, h: 600, content: { color: 'transparent', borderColor: '#cbd5e1', borderWidth: 4, borderRadius: 0 } },
        { id: 'l1', type: 'line', x: 300, y: 0, w: 0, h: 600, content: { color: '#cbd5e1', strokeWidth: 4 } },
        { id: 'l2', type: 'line', x: 0, y: 300, w: 600, h: 0, content: { color: '#cbd5e1', strokeWidth: 4 } },
        { id: 't1', type: 'text', x: 10, y: 10, w: 100, h: 30, content: { title: 'High Value', fontSize: 12 } },
        { id: 't4', type: 'text', x: 310, y: 310, w: 100, h: 30, content: { title: 'Low Value', fontSize: 12 } },
    ]
};

const T_BRAINSTORM = {
    name: 'Brainstorm',
    nodes: [
        { id: 'center', type: 'shape', x: 300, y: 300, w: 160, h: 100, content: { color: '#fde047', borderRadius: 50, borderColor: '#eab308', borderWidth: 2 } }, // Ellipse-ish
        { id: 'ct', type: 'text', x: 310, y: 335, w: 140, h: 30, content: { title: 'MAIN TOPIC', fontSize: 16, fontWeight: 'bold', textAlign: 'center' } },

        { id: 'i1', type: 'shape', x: 100, y: 100, w: 100, h: 100, content: { color: '#ffffff', borderRadius: 100, borderColor: '#cbd5e1', borderWidth: 1 } },
        { id: 'i2', type: 'shape', x: 500, y: 100, w: 100, h: 100, content: { color: '#ffffff', borderRadius: 100, borderColor: '#cbd5e1', borderWidth: 1 } },
        { id: 'i3', type: 'shape', x: 100, y: 500, w: 100, h: 100, content: { color: '#ffffff', borderRadius: 100, borderColor: '#cbd5e1', borderWidth: 1 } },
        { id: 'i4', type: 'shape', x: 500, y: 500, w: 100, h: 100, content: { color: '#ffffff', borderRadius: 100, borderColor: '#cbd5e1', borderWidth: 1 } },
    ]
};

const T_SWOT = {
    name: 'SWOT Analysis',
    nodes: [
        { id: 'q1', type: 'shape', x: 0, y: 0, w: 300, h: 300, content: { color: '#dcfce7' } }, // Strengths
        { id: 'qt1', type: 'text', x: 20, y: 20, w: 200, h: 30, content: { title: 'STRENGTHS', fontWeight: 'bold' } },

        { id: 'q2', type: 'shape', x: 310, y: 0, w: 300, h: 300, content: { color: '#fee2e2' } }, // Weaknesses
        { id: 'qt2', type: 'text', x: 330, y: 20, w: 200, h: 30, content: { title: 'WEAKNESSES', fontWeight: 'bold' } },

        { id: 'q3', type: 'shape', x: 0, y: 310, w: 300, h: 300, content: { color: '#dbeafe' } }, // Opportunities
        { id: 'qt3', type: 'text', x: 20, y: 330, w: 200, h: 30, content: { title: 'OPPORTUNITIES', fontWeight: 'bold' } },

        { id: 'q4', type: 'shape', x: 310, y: 310, w: 300, h: 300, content: { color: '#ffedd5' } }, // Threats
        { id: 'qt4', type: 'text', x: 330, y: 330, w: 200, h: 30, content: { title: 'THREATS', fontWeight: 'bold' } },
    ]
};

const T_PERSONA = {
    name: 'User Persona',
    nodes: [
        { id: 'card', type: 'shape', x: 0, y: 0, w: 400, h: 500, content: { color: 'white', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 16 } },
        { id: 'avatar', type: 'shape', x: 150, y: 30, w: 100, h: 100, content: { color: '#e2e8f0', borderRadius: 100 } },
        { id: 'name', type: 'text', x: 50, y: 140, w: 300, h: 40, content: { title: 'User Name', fontSize: 20, fontWeight: 'bold', textAlign: 'center' } },
        { id: 'bio', type: 'shape', x: 40, y: 200, w: 320, h: 100, content: { color: '#f8fafc', borderRadius: 8 } },
        { id: 'biot', type: 'text', x: 50, y: 210, w: 300, h: 80, content: { title: 'Bio & Goals...', fontSize: 12, color: '#64748b' } },
    ]
};

const T_FLOW = {
    name: 'Simple Flow',
    nodes: [
        { id: 's1', type: 'shape', x: 0, y: 100, w: 120, h: 60, content: { color: '#dcfce7', borderRadius: 30, borderColor: '#16a34a', borderWidth: 1 } },
        { id: 't1', type: 'text', x: 10, y: 115, w: 100, h: 30, content: { title: 'START', textAlign: 'center', fontSize: 12 } },

        { id: 'ar1', type: 'shape', x: 130, y: 120, w: 80, h: 20, content: { type: 'arrow_right', color: '#cbd5e1' } }, // Mock arrow

        { id: 's2', type: 'shape', x: 220, y: 80, w: 120, h: 100, content: { color: 'white', borderColor: '#cbd5e1', borderWidth: 1 } },
        { id: 't2', type: 'text', x: 230, y: 120, w: 100, h: 30, content: { title: 'PROCESS', textAlign: 'center', fontSize: 12 } },

        { id: 'ar2', type: 'shape', x: 350, y: 120, w: 80, h: 20, content: { type: 'arrow_right', color: '#cbd5e1' } },

        { id: 's3', type: 'shape', x: 440, y: 100, w: 120, h: 60, content: { color: '#dcfce7', borderRadius: 30, borderColor: '#16a34a', borderWidth: 1 } },
        { id: 't3', type: 'text', x: 450, y: 115, w: 100, h: 30, content: { title: 'END', textAlign: 'center', fontSize: 12 } },
    ]
};

export const TEMPLATE_LIBRARIES: AssetCategory[] = [
    {
        id: 'methods',
        label: 'Methodologies',
        items: [
            { id: 'tmpl-kanban', label: 'Kanban', icon: '📋', type: 'template', data: T_KANBAN },
            { id: 'tmpl-matrix', label: 'Matrix', icon: '田', type: 'template', data: T_MATRIX },
            { id: 'tmpl-swot', label: 'SWOT', icon: '📊', type: 'template', data: T_SWOT },
            { id: 'tmpl-brain', label: 'Brainstorm', icon: '🧠', type: 'template', data: T_BRAINSTORM },
            { id: 'tmpl-persona', label: 'Persona', icon: '👤', type: 'template', data: T_PERSONA },
            { id: 'tmpl-flow', label: 'Flow', icon: '➡️', type: 'template', data: T_FLOW },
        ]
    }
];

export const COMPOSITE_SHAPES: AssetCategory[] = [
    {
        id: 'frameworks',
        label: 'Frameworks',
        items: [
            {
                id: 'comp-swot', label: 'DAFO / SWOT', icon: 'DAFO', type: 'template',
                data: {
                    nodes: [{
                        id: 'swot-1', type: 'composite', x: 0, y: 0, w: 600, h: 400,
                        content: {
                            composite: {
                                layout: 'swot',
                                structure: { rows: 2, cols: 2, gap: 10, padding: 20 },
                                cells: [
                                    { id: 'c1', row: 0, col: 0, text: 'DEBILIDADES', color: '#fee2e2' },
                                    { id: 'c2', row: 0, col: 1, text: 'AMENAZAS', color: '#ffedd5' },
                                    { id: 'c3', row: 1, col: 0, text: 'FORTALEZAS', color: '#dcfce7' },
                                    { id: 'c4', row: 1, col: 1, text: 'OPORTUNIDADES', color: '#dbeafe' },
                                ]
                            }
                        }
                    }]
                }
            },
            {
                id: 'comp-grid-3x3', label: 'Grid 3x3', icon: 'GRID', type: 'template',
                data: {
                    nodes: [{
                        id: 'grid-3x3', type: 'composite', x: 0, y: 0, w: 400, h: 400,
                        content: {
                            borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 1,
                            composite: {
                                layout: 'grid',
                                structure: { rows: 3, cols: 3, gap: 1, padding: 0 },
                                cells: Array.from({ length: 9 }, (_, i) => ({
                                    id: `c-${i}`, row: Math.floor(i / 3), col: i % 3, text: '', color: '#ffffff'
                                }))
                            }
                        }
                    }]
                }
            },
            {
                id: 'comp-eisenhower', label: 'Eisenhower', icon: 'E.H.', type: 'template',
                data: {
                    nodes: [{
                        id: 'eisenhower-1', type: 'composite', x: 0, y: 0, w: 600, h: 600,
                        content: {
                            composite: {
                                layout: 'swot', // Reusing swot 2x2 layout mechanic
                                structure: { rows: 2, cols: 2, gap: 20, padding: 40 },
                                cells: [
                                    { id: 'e1', row: 0, col: 0, text: 'URGENTE\nIMPORTANTE', color: '#fecaca', textColor: '#b91c1c' },
                                    { id: 'e2', row: 0, col: 1, text: 'NO URGENTE\nIMPORTANTE', color: '#bfdbfe', textColor: '#1d4ed8' },
                                    { id: 'e3', row: 1, col: 0, text: 'URGENTE\nNO IMPORTANTE', color: '#fde68a', textColor: '#b45309' },
                                    { id: 'e4', row: 1, col: 1, text: 'NI URGENTE\nNI IMPORTANTE', color: '#e5e7eb', textColor: '#374151' },
                                ]
                            }
                        }
                    }]
                }
            }
        ]
    }
];

// --- Fonts ---
export const AVAILABLE_FONTS: FontDefinition[] = [
    { family: 'Inter', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700], source: 'google' },
    { family: 'Poppins', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Montserrat', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Manrope', category: 'sans-serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Playfair Display', category: 'serif', weights: [400, 600, 700], source: 'google' },
    { family: 'Lora', category: 'serif', weights: [400, 600], source: 'google' },
    { family: 'Merriweather', category: 'serif', weights: [300, 400, 700], source: 'google' },
    { family: 'Permanent Marker', category: 'display', weights: [400], source: 'google' },
    { family: 'Abril Fatface', category: 'display', weights: [400], source: 'google' },
];

export const TEXT_PRESETS: AssetCategory[] = [
    {
        id: 'headings',
        label: 'Títulos',
        items: [
            {
                id: 'txt-h1', label: 'H1', icon: 'H1', type: 'template', data: {
                    nodes: [{
                        id: 'h1-node', type: 'text', x: 0, y: 0, w: 400, h: 80,
                        content: { title: 'Gran Título', fontSize: 48, fontWeight: 'bold', fontFamily: 'Inter' }
                    }]
                }
            },
            {
                id: 'txt-h2', label: 'H2', icon: 'H2', type: 'template', data: {
                    nodes: [{
                        id: 'h2-node', type: 'text', x: 0, y: 0, w: 300, h: 50,
                        content: { title: 'Subtítulo', fontSize: 32, fontWeight: '600', fontFamily: 'Inter' }
                    }]
                }
            },
            {
                id: 'txt-p', label: 'Párrafo', icon: '¶', type: 'template', data: {
                    nodes: [{
                        id: 'p-node', type: 'text', x: 0, y: 0, w: 300, h: 100,
                        content: { title: 'Texto de párrafo. Haz doble clic para editar.', fontSize: 16, fontFamily: 'Inter', color: '#475569' }
                    }]
                }
            },
        ]
    },
    {
        id: 'styles',
        label: 'Estilos',
        items: [
            {
                id: 'txt-quote', label: 'Cita', icon: '❞', type: 'template', data: {
                    nodes: [{
                        id: 'q-node', type: 'text', x: 0, y: 0, w: 400, h: 100,
                        content: { title: '"La creatividad es contagiosa, pásala."', fontSize: 24, fontStyle: 'italic', fontFamily: 'Playfair Display', color: '#1e293b' }
                    }]
                }
            },
            {
                id: 'txt-marker', label: 'Rotulador', icon: '🖍️', type: 'template', data: {
                    nodes: [{
                        id: 'm-node', type: 'text', x: 0, y: 0, w: 300, h: 60,
                        content: { title: 'Nota Importante', fontSize: 28, fontFamily: 'Permanent Marker', color: '#ef4444' }
                    }]
                }
            },
            {
                id: 'txt-elegant', label: 'Elegante', icon: '✨', type: 'template', data: {
                    nodes: [{
                        id: 'e-node', type: 'text', x: 0, y: 0, w: 300, h: 60,
                        content: { title: 'Elegancia Pura', fontSize: 36, fontFamily: 'Abril Fatface', color: '#1e1e1e' }
                    }]
                }
            },
        ]
    }
];

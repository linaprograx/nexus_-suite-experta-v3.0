// Palette Definitions
export const PALETTES = {
    slate: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
    red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
    amber: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
    blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
    indigo: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
    violet: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    pink: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
};

export const GRADIENTS = [
    { label: 'Sunset', start: '#f472b6', end: '#f59e0b' },
    { label: 'Ocean', start: '#3b82f6', end: '#10b981' },
    { label: 'Royal', start: '#8b5cf6', end: '#ec4899' },
    { label: 'Slate', start: '#94a3b8', end: '#475569' },
];

export interface ThemeDef {
    id: string;
    label: string;
    bg: string;
    gridColor: string;
    nodeDefaultColor: string;
    nodeDefaultTextColor: string;
}

export const BOARD_THEMES: ThemeDef[] = [
    { id: 'light', label: 'Light (Default)', bg: '#f8fafc', gridColor: '#cbd5e1', nodeDefaultColor: '#ffffff', nodeDefaultTextColor: '#1e293b' },
    { id: 'dark', label: 'Dark Mode', bg: '#0f172a', gridColor: '#334155', nodeDefaultColor: '#1e293b', nodeDefaultTextColor: '#f8fafc' },
    { id: 'blueprint', label: 'Blueprint', bg: '#1e3a8a', gridColor: '#60a5fa', nodeDefaultColor: '#dbeafe', nodeDefaultTextColor: '#1e3a8a' },
];

export interface FontDef {
    id: string;
    family: string;
    label: string;
    type: 'sans' | 'serif' | 'mono' | 'display';
}

export const FONT_LIBRARY: FontDef[] = [
    { id: 'inter', family: 'Inter, sans-serif', label: 'Inter (Default)', type: 'sans' },
    { id: 'roboto', family: 'Roboto, sans-serif', label: 'Roboto', type: 'sans' },
    { id: 'playfair', family: '"Playfair Display", serif', label: 'Playfair', type: 'serif' },
    { id: 'jetbrains', family: '"JetBrains Mono", monospace', label: 'JetBrains Mono', type: 'mono' },
    { id: 'lobster', family: '"Lobster", display', label: 'Lobster', type: 'display' },
];

import { BoardNode } from './types';
import { PizarraMetadata } from './types';

export const TemplateEngine = {
    generateLayout(templateId: string, metadata: PizarraMetadata): BoardNode[] {
        const nodes: BoardNode[] = [];
        const t = Date.now();

        switch (templateId) {
            case 'creative': return generateCreative(nodes, t);
            case 'mixologist': return generateMixologist(nodes, t);
            case 'productive': return generateProductive(nodes, t);
            case 'nexus': return generateNexus(nodes, t);
            default: return generateCreative(nodes, t);
        }
    }
};

const createBoard = (title: string, x: number, y: number, w: number, h: number, color: string, type: string, t: number): BoardNode => ({
    id: crypto.randomUUID(),
    type: 'board',
    x, y, w, h,
    zIndex: 0,
    createdAt: t, updatedAt: t,
    content: {
        title,
        body: '',
        color,
        shapeType: 'rectangle' // implies board frame
    }
});

const createNote = (text: string, x: number, y: number, color: string, t: number): BoardNode => ({
    id: crypto.randomUUID(),
    type: 'card',
    x, y, w: 200, h: 100,
    zIndex: 10,
    createdAt: t, updatedAt: t,
    content: {
        title: '',
        body: text,
        color
    }
});

// --- Layouts ---

// Creative: 3 Boards side-by-side + scattered notes
const generateCreative = (nodes: BoardNode[], t: number) => {
    // 1. Inspiración (Moodboard) - Left
    nodes.push(createBoard("Inspiración", -850, -300, 500, 600, '#fdf4ff', 'moodboard', t));

    // 2. Ingredientes (Concepts) - Center
    nodes.push(createBoard("Ingredientes", -300, -300, 600, 600, '#fffbeb', 'ingredients', t));

    // 3. Lab (Playground) - Right
    nodes.push(createBoard("Laboratorio", 350, -300, 500, 600, '#f0f9ff', 'lab', t));

    // Scattered Notes
    nodes.push(createNote("Referencia Visual", -800, 320, '#fef3c7', t));
    nodes.push(createNote("Sabor Ácido?", -100, 320, '#d1fae5', t));

    return nodes;
};

// Mixologist: 2x2 Grid
const generateMixologist = (nodes: BoardNode[], t: number) => {
    const w = 500;
    const h = 400;
    const gap = 50;

    // Top-Left: Structure
    nodes.push(createBoard("Arquitectura Menú", -w - gap / 2, -h - gap / 2, w, h, '#f8fafc', 'structure', t));

    // Top-Right: Recipes
    nodes.push(createBoard("Fichas Técnicas", gap / 2, -h - gap / 2, w, h, '#fff1f2', 'recipes', t));

    // Bottom-Left: Costs
    nodes.push(createBoard("Costes & Rentabilidad", -w - gap / 2, gap / 2, w, h, '#ecfdf5', 'costs', t));

    // Bottom-Right: Story
    nodes.push(createBoard("Storytelling", gap / 2, gap / 2, w, h, '#fff7ed', 'narrative', t));

    return nodes;
};

// Productive: Horizontal Kanban
const generateProductive = (nodes: BoardNode[], t: number) => {
    const w = 350;
    const h = 700;
    const gap = 40;
    let startX = -((w * 4) + (gap * 3)) / 2;

    nodes.push(createBoard("Por Hacer", startX, -350, w, h, '#f3f4f6', 'todo', t));
    nodes.push(createBoard("En Progreso", startX + w + gap, -350, w, h, '#e0f2fe', 'wip', t));
    nodes.push(createBoard("Revisión", startX + (w + gap) * 2, -350, w, h, '#fef9c3', 'review', t));
    nodes.push(createBoard("Completado", startX + (w + gap) * 3, -350, w, h, '#dcfce7', 'done', t));

    return nodes;
};

// Nexus: Central Hub + Satellites
const generateNexus = (nodes: BoardNode[], t: number) => {
    // Center: Concept
    nodes.push(createBoard("NEXUS CORE", -300, -300, 600, 600, '#f5f3ff', 'core', t));

    // Satellites
    const dist = 700;
    // Top
    nodes.push(createBoard("Catalog", -200, -300 - dist, 400, 500, '#f0f9ff', 'catalog', t));
    // Right
    nodes.push(createBoard("Narrative", 300 + 100, -250, 400, 500, '#fff7ed', 'narrative', t));
    // Bottom
    nodes.push(createBoard("Design", -200, 300 + 200, 400, 500, '#fdf2f8', 'design', t));
    // Left
    nodes.push(createBoard("Control", -300 - 400 - 100, -250, 400, 500, '#f1f5f9', 'control', t));

    return nodes;
};

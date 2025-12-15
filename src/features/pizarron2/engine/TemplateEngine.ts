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
            case 'analytical': return generateAnalytical(nodes, t);
            case 'advanced': return generateAdvanced(nodes, t);
            default: return generateCreative(nodes, t);
        }
    }
};

const createBoard = (title: string, x: number, y: number, w: number, h: number, color: string, t: number): BoardNode => ({
    id: crypto.randomUUID(),
    type: 'board',
    x, y, w, h,
    zIndex: 0,
    createdAt: t, updatedAt: t,
    content: {
        title,
        body: '',
        color, // Board Background
        borderColor: '#e2e8f0',
        borderWidth: 2,
        borderRadius: 16
    }
});

const createComposite = (type: 'swot' | 'grid', x: number, y: number, w: number, h: number, t: number): BoardNode => {
    let compositeContent: any = {};
    if (type === 'swot') {
        compositeContent = {
            layout: 'swot',
            structure: { rows: 2, cols: 2, gap: 10, padding: 20 },
            cells: [
                { id: crypto.randomUUID(), row: 0, col: 0, text: 'FORTALEZAS', color: '#dcfce7' },
                { id: crypto.randomUUID(), row: 0, col: 1, text: 'DEBILIDADES', color: '#fee2e2' },
                { id: crypto.randomUUID(), row: 1, col: 0, text: 'OPORTUNIDADES', color: '#e0f2fe' },
                { id: crypto.randomUUID(), row: 1, col: 1, text: 'AMENAZAS', color: '#fef9c3' }
            ]
        };
    }

    return {
        id: crypto.randomUUID(),
        type: 'composite',
        x, y, w, h,
        zIndex: 5,
        createdAt: t, updatedAt: t,
        content: {
            title: type.toUpperCase(),
            composite: compositeContent
        }
    };
}


const createNote = (text: string, x: number, y: number, color: string, t: number): BoardNode => ({
    id: crypto.randomUUID(),
    type: 'card',
    x, y, w: 200, h: 120,
    zIndex: 10,
    createdAt: t, updatedAt: t,
    content: {
        title: '',
        body: text,
        color
    }
});

// --- Layouts ---

// 1. CREATIVA
const generateCreative = (nodes: BoardNode[], t: number) => {
    // Center: Concept
    nodes.push(createBoard("Concepto Principal", -400, -300, 800, 600, '#fafafa', t));

    // Left: Inspiration
    nodes.push(createBoard("Inspiración Visual", -950, -300, 500, 600, '#f0f9ff', t));

    // Right: Notes
    nodes.push(createBoard("Notas & Ideas", 450, -300, 400, 600, '#fffbeb', t));

    // Bottom: Iterations
    nodes.push(createBoard("Iteraciones", -400, 350, 800, 400, '#f8fafc', t));

    // Elements
    nodes.push(createNote("¿Qué sabor buscamos?", 500, -200, '#fef3c7', t));

    return nodes;
};

// 2. MIXÓLOGO
const generateMixologist = (nodes: BoardNode[], t: number) => {
    // Top Left: Base
    nodes.push(createBoard("Receta Base", -600, -400, 500, 400, '#ffffff', t));

    // Top Right: Ingredients
    nodes.push(createBoard("Ingredientes", -50, -400, 500, 400, '#ecfdf5', t));

    // Bottom Left: Techniques
    nodes.push(createBoard("Técnicas", -600, 50, 500, 400, '#eff6ff', t));

    // Bottom Right: Trials
    nodes.push(createBoard("Pruebas y Ajustes", -50, 50, 500, 400, '#fff1f2', t));

    return nodes;
};

// 3. PRODUCTIVA (Kanban ish)
const generateProductive = (nodes: BoardNode[], t: number) => {
    // Top: Kanban
    const kW = 300;
    nodes.push(createBoard("To Do", -500, -400, kW, 600, '#f1f5f9', t));
    nodes.push(createBoard("Doing", -150, -400, kW, 600, '#e0f2fe', t));
    nodes.push(createBoard("Done", 200, -400, kW, 600, '#dcfce7', t));

    // Bottom: Planning
    nodes.push(createBoard("Planificación Semanal", -500, 250, 650, 300, '#fffbeb', t));
    nodes.push(createBoard("Notas Operativas", 200, 250, 300, 300, '#ffffff', t));

    return nodes;
};

// 4. NEXUS
const generateNexus = (nodes: BoardNode[], t: number) => {
    // Left Column: Structure
    nodes.push(createBoard("Estructura Menú", -800, -400, 400, 800, '#f8fafc', t));

    // Center: Cocktails
    nodes.push(createBoard("Cócteles", -350, -400, 600, 500, '#ffffff', t));

    // Center Bottom: Story
    nodes.push(createBoard("Storytelling", -350, 150, 600, 250, '#fff7ed', t));

    // Right: Visuals
    nodes.push(createBoard("Visual & Layout", 300, -400, 400, 800, '#f3f4f6', t));

    return nodes;
};

// 5. ANALÍTICA
const generateAnalytical = (nodes: BoardNode[], t: number) => {
    // Left: SWOT (Composite)
    nodes.push(createComposite('swot', -600, -300, 600, 500, t));

    // Top Right: Pros/Cons
    nodes.push(createBoard("Pros / Contras", 50, -300, 400, 500, '#ffffff', t));

    // Bottom Right: Decision
    nodes.push(createBoard("Conclusión Estratégica", 50, 250, 400, 200, '#f0fdf4', t));

    return nodes;
};

// 6. AVANZADA
const generateAdvanced = (nodes: BoardNode[], t: number) => {
    // Just a massive grid/area
    nodes.push(createBoard("Zona de Trabajo", -600, -400, 1200, 800, '#ffffff', t));

    // Side: Resources
    nodes.push(createBoard("Recursos", 650, -400, 300, 800, '#f8fafc', t));

    return nodes;
};

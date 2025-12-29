import { BoardNode } from './types';
import { PizarraMetadata } from './types';

export const TemplateEngine = {
    generateLayout(templateId: string, metadata: PizarraMetadata): BoardNode[] {
        const nodes: BoardNode[] = [];
        const t = Date.now();

        switch (templateId) {
            case 't-empty': return [];
            case 'creative': return generateCreative(nodes, t);
            case 'mixologist': return generateMixologist(nodes, t);
            case 'productive': return generateProductive(nodes, t);
            case 'nexus': return generateNexus(nodes, t);
            case 'analytical': return generateAnalytical(nodes, t);
            case 'advanced': return generateAdvanced(nodes, t);
            // Phase 5 Generators
            case 'menu_engineering': return generateMenuEngineering(nodes, t);
            case 'shift_briefing': return generateShiftBriefing(nodes, t);
            case 'event_map': return generateEventMap(nodes, t);
            case 'strategic_roadmap': return generateStrategicRoadmap(nodes, t);
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
    nodes.push(createBoard("Receta Base", -600, -400, 500, 400, '#ffffff', t));
    nodes.push(createBoard("Ingredientes", -50, -400, 500, 400, '#ecfdf5', t));
    nodes.push(createBoard("Técnicas", -600, 50, 500, 400, '#eff6ff', t));
    nodes.push(createBoard("Pruebas y Ajustes", -50, 50, 500, 400, '#fff1f2', t));
    return nodes;
};

// 3. PRODUCTIVA
const generateProductive = (nodes: BoardNode[], t: number) => {
    const kW = 300;
    nodes.push(createBoard("To Do", -500, -400, kW, 600, '#f1f5f9', t));
    nodes.push(createBoard("Doing", -150, -400, kW, 600, '#e0f2fe', t));
    nodes.push(createBoard("Done", 200, -400, kW, 600, '#dcfce7', t));
    nodes.push(createBoard("Planificación Semanal", -500, 250, 650, 300, '#fffbeb', t));
    nodes.push(createBoard("Notas Operativas", 200, 250, 300, 300, '#ffffff', t));
    return nodes;
};

// 4. NEXUS
const generateNexus = (nodes: BoardNode[], t: number) => {
    nodes.push(createBoard("Estructura Menú", -800, -400, 400, 800, '#f8fafc', t));
    nodes.push(createBoard("Cócteles", -350, -400, 600, 500, '#ffffff', t));
    nodes.push(createBoard("Storytelling", -350, 150, 600, 250, '#fff7ed', t));
    nodes.push(createBoard("Visual & Layout", 300, -400, 400, 800, '#f3f4f6', t));
    return nodes;
};

// 5. ANALÍTICA
const generateAnalytical = (nodes: BoardNode[], t: number) => {
    nodes.push(createComposite('swot', -600, -300, 600, 500, t));
    nodes.push(createBoard("Pros / Contras", 50, -300, 400, 500, '#ffffff', t));
    nodes.push(createBoard("Conclusión Estratégica", 50, 250, 400, 200, '#f0fdf4', t));
    return nodes;
};

// 6. AVANZADA
const generateAdvanced = (nodes: BoardNode[], t: number) => {
    nodes.push(createBoard("Zona de Trabajo", -600, -400, 1200, 800, '#ffffff', t));
    nodes.push(createBoard("Recursos", 650, -400, 300, 800, '#f8fafc', t));
    return nodes;
};

// --- PHASE 5 NEW TEMPLATES ---

// 7. INGENIERÍA DE MENÚ
const generateMenuEngineering = (nodes: BoardNode[], t: number) => {
    // Top Left: BCG Matrix (Simulated via grid for now)
    nodes.push(createBoard("Matriz BCG", -600, -400, 600, 600, '#ffffff', t));

    // Top Right: Candidate Dishes
    nodes.push(createBoard("Nuevos Platos", 50, -400, 400, 600, '#fff7ed', t));

    // Bottom: Cost Analysis
    nodes.push(createBoard("Análisis de Costos", -600, 250, 1050, 300, '#f0fdf4', t));

    // Initial Notes
    nodes.push(createNote("Definir Estrellas y Vacas", -550, -350, '#fee2e2', t));
    return nodes;
};

// 8. BRIEFING DE TURNO
const generateShiftBriefing = (nodes: BoardNode[], t: number) => {
    // Vertical Layout
    nodes.push(createBoard("Objetivos del Día", -300, -400, 600, 200, '#dbeafe', t));
    nodes.push(createBoard("Bajas / 86", -300, -150, 280, 400, '#fee2e2', t));
    nodes.push(createBoard("Notas de Servicio", 20, -150, 280, 400, '#fef9c3', t));

    nodes.push(createNote("Especial del día: ...", -280, -350, '#ffffff', t));
    return nodes;
};

// 9. MAPA DE EVENTO
const generateEventMap = (nodes: BoardNode[], t: number) => {
    // Large Layout Area
    nodes.push(createBoard("Plano de Sala", -800, -500, 1000, 800, '#f8fafc', t));

    // Right: Timeline
    nodes.push(createBoard("Cronograma", 250, -500, 400, 800, '#ffffff', t));

    // Bottom: Staff
    nodes.push(createBoard("Personal", -800, 350, 1450, 200, '#f3f4f6', t));
    return nodes;
};

// 10. ROADMAP ESTRATÉGICO
const generateStrategicRoadmap = (nodes: BoardNode[], t: number) => {
    // Timeline Q1-Q4
    const qW = 280;
    const gap = 20;
    const startX = -600;

    nodes.push(createBoard("Q1: Ene-Mar", startX, -300, qW, 600, '#eff6ff', t));
    nodes.push(createBoard("Q2: Abr-Jun", startX + qW + gap, -300, qW, 600, '#ecfdf5', t));
    nodes.push(createBoard("Q3: Jul-Sep", startX + (qW + gap) * 2, -300, qW, 600, '#fff7ed', t));
    nodes.push(createBoard("Q4: Oct-Dic", startX + (qW + gap) * 3, -300, qW, 600, '#fef2f2', t));

    return nodes;
};

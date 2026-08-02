import { BoardNode } from './types';
import { PizarraMetadata } from './types';
import { STRUCTURE_TEMPLATES } from './structures';

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

// Board carrying one of the new zone-based layouts (structures.ts).
// Follows dark mode + inline zone editing automatically.
const createStructuredBoard = (title: string, x: number, y: number, w: number, h: number, structureId: string, t: number): BoardNode => ({
    id: crypto.randomUUID(),
    type: 'board',
    x, y, w, h,
    zIndex: 0,
    createdAt: t, updatedAt: t,
    content: {
        title,
        body: '',
        color: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 2,
        borderRadius: 16
    },
    structureId,
    structure: JSON.parse(JSON.stringify(STRUCTURE_TEMPLATES[structureId])),
});

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
    // Receta Base → full Ficha de Cóctel layout
    nodes.push(createStructuredBoard("Ficha de Cóctel", -640, -440, 560, 860, 'cocktail-recipe-structure', t));
    nodes.push(createBoard("Técnicas", 0, -440, 500, 410, '#eff6ff', t));
    nodes.push(createBoard("Pruebas y Ajustes", 0, 10, 500, 410, '#fff1f2', t));
    return nodes;
};

// 3. PRODUCTIVA
const generateProductive = (nodes: BoardNode[], t: number) => {
    // Three manual columns → single Kanban layout
    nodes.push(createStructuredBoard("Tablero Kanban", -540, -460, 1040, 560, 'kanban-structure', t));
    // Weekly planning → Planificación Semanal layout
    nodes.push(createStructuredBoard("Planificación Semanal", -540, 140, 1040, 420, 'planning-structure', t));
    return nodes;
};

// 4. NEXUS
const generateNexus = (nodes: BoardNode[], t: number) => {
    nodes.push(createStructuredBoard("Estructura Menú", -860, -440, 460, 860, 'menu-layout-structure', t));
    nodes.push(createStructuredBoard("Ficha de Cóctel", -360, -440, 560, 860, 'cocktail-recipe-structure', t));
    nodes.push(createStructuredBoard("Storytelling", 240, -440, 620, 540, 'storytelling-structure', t));
    nodes.push(createBoard("Visual & Layout", 240, 140, 620, 280, '#f3f4f6', t));
    return nodes;
};

// 5. ANALÍTICA
const generateAnalytical = (nodes: BoardNode[], t: number) => {
    // SWOT → real DAFO zone layout (replaces legacy composite cells)
    nodes.push(createStructuredBoard("Análisis DAFO", -640, -340, 640, 560, 'technical-grid-structure', t));
    nodes.push(createStructuredBoard("Comparación", 40, -340, 500, 560, 'comparison-structure', t));
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
    // Top Left: BCG Matrix → real Ingeniería de Menú layout (Estrellas/Caballos/Enigmas/Perros)
    nodes.push(createStructuredBoard("Matriz BCG", -640, -440, 720, 640, 'menu-design-structure', t));

    // Top Right: Candidate Dishes → Carta de Menú layout
    nodes.push(createStructuredBoard("Nuevos Platos", 120, -440, 460, 700, 'menu-layout-structure', t));

    // Bottom: Cost Analysis → Kanban for cost workflow
    nodes.push(createStructuredBoard("Análisis de Costos", -640, 240, 720, 360, 'kanban-structure', t));
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

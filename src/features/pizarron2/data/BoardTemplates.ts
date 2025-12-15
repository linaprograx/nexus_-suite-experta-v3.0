import { BoardTemplate } from '../engine/types';

export const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: 'creative',
        name: 'Pizarra Creativa',
        description: 'Espacio fluido para la invención de cócteles y conceptos.',
        icon: '🎨',
        focus: 'Creación de cócteles',
        structure: [
            { title: 'Inspiración', type: 'moodboard', description: 'Referencias visuales y conceptos' },
            { title: 'Ingredientes', type: 'database', description: 'Banco de sabores y componentes' },
            { title: 'Laboratorio', type: 'canvas', description: 'Espacio de pruebas y combinaciones' },
            { title: 'Notas', type: 'docs', description: 'Registro de ideas y feedback' }
        ]
    },
    {
        id: 'mixologist',
        name: 'Pizarra Mixólogo',
        description: 'Estructuración profesional de menús y ofertas gastronómicas.',
        icon: '🍸',
        focus: 'Creación de menús',
        structure: [
            { title: 'Estructura', type: 'hierarchy', description: 'Arquitectura del menú' },
            { title: 'Recetario', type: 'catalog', description: 'Fichas técnicas detalladas' },
            { title: 'Costes', type: 'finance', description: 'Análisis de rentabilidad' },
            { title: 'Storytelling', type: 'narrative', description: 'Narrativa de venta' }
        ]
    },
    {
        id: 'productive',
        name: 'Pizarra Productivo',
        description: 'Gestión operativa eficiente del equipo y los recursos.',
        icon: '⚡',
        focus: 'Gestión operativa',
        structure: [
            { title: 'Tareas', type: 'kanban', description: 'Flujo de trabajo' },
            { title: 'Turnos', type: 'calendar', description: 'Horarios y rotaciones' },
            { title: 'Servicios', type: 'checklist', description: 'Protocolos de servicio' },
            { title: 'Planificación', type: 'timeline', description: 'Vista semanal/mensual' }
        ]
    },
    {
        id: 'nexus',
        name: 'Pizarra Nexus',
        description: 'El sistema definitivo para el diseño integral de experiencias.',
        icon: '💠',
        focus: 'Diseño integral',
        structure: [
            { title: 'Concepto', type: 'moodboard', description: 'Visión global' },
            { title: 'Recetas Maestras', type: 'catalog', description: 'Fórmulas perfeccionadas' },
            { title: 'Narrativa', type: 'narrative', description: 'Viaje del cliente' },
            { title: 'Diseño Menú', type: 'layout', description: 'Aspecto visual final' },
            { title: 'Control', type: 'dashboard', description: 'KPIs y validación' }
        ]
    }
];

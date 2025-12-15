import { BoardTemplate } from '../engine/types';

export const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: 'creative',
        name: 'Pizarra Creativa',
        description: 'Ideación, conceptos y exploración visual.',
        icon: '🎨',
        focus: 'Ideación y Concepto',
        structure: [
            { title: 'Concepto Principal', type: 'board', description: 'El núcleo de la idea' },
            { title: 'Inspiración Visual', type: 'board', description: 'Moodboard de referencias' },
            { title: 'Notas & Ideas', type: 'board', description: 'Brainstorming rápido' },
            { title: 'Iteraciones', type: 'board', description: 'Variaciones del concepto' }
        ]
    },
    {
        id: 'mixologist',
        name: 'Pizarra Mixólogo',
        description: 'Desarrollo técnico y creativo de recetas.',
        icon: '🍸',
        focus: 'Desarrollo de Recetas',
        structure: [
            { title: 'Receta Base', type: 'board', description: 'La fórmula inicial' },
            { title: 'Ingredientes', type: 'board', description: 'Componentes clave' },
            { title: 'Técnicas', type: 'board', description: 'Métodos de preparación' },
            { title: 'Pruebas', type: 'board', description: 'Registro de intentos' }
        ]
    },
    {
        id: 'productive',
        name: 'Pizarra Productiva',
        description: 'Organización de tareas, turnos y servicios.',
        icon: '⚡',
        focus: 'Planificación Operativa',
        structure: [
            { title: 'Kanban', type: 'board', description: 'Flujo de trabajo' },
            { title: 'Planificación Semanal', type: 'board', description: 'Vista calendario' },
            { title: 'Operativa', type: 'board', description: 'Notas y protocolos' }
        ]
    },
    {
        id: 'nexus',
        name: 'Pizarra Nexus',
        description: 'Diseño integral de menús y experiencias.',
        icon: '💠',
        focus: 'Diseño de Menús',
        structure: [
            { title: 'Estructura Menú', type: 'board', description: 'Arquitectura de venta' },
            { title: 'Cócteles', type: 'board', description: 'Desarrollo de tragos' },
            { title: 'Storytelling', type: 'board', description: 'Narrativa del concepto' },
            { title: 'Visual & Layout', type: 'board', description: 'Diseño gráfico' }
        ]
    },
    {
        id: 'analytical',
        name: 'Pizarra Analítica',
        description: 'Evaluación estratégica y toma de decisiones.',
        icon: '📊',
        focus: 'Análisis y Decisión',
        structure: [
            { title: 'DAFO', type: 'swot', description: 'Análisis Estratégico' },
            { title: 'Pros / Contras', type: 'board', description: 'Balanza de decisión' },
            { title: 'Conclusión', type: 'board', description: 'Decisión final' }
        ]
    },
    {
        id: 'advanced',
        name: 'Pizarra Libre Avanzada',
        description: 'Lienzo modular para usuarios expertos.',
        icon: '🚀',
        focus: 'Canvas Modular',
        structure: [
            { title: 'Zona de Trabajo', type: 'grid', description: 'Espacio principal' },
            { title: 'Recursos', type: 'board', description: 'Banco de assets' }
        ]
    }
];

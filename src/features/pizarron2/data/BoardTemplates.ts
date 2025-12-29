import { BoardTemplate, BoardCapability, InteractionMode } from '../engine/types';

interface ExtendedBoardTemplate extends BoardTemplate {
    capabilities?: BoardCapability[];
    defaultMode?: InteractionMode;
}

export const BOARD_TEMPLATES: ExtendedBoardTemplate[] = [
    {
        id: 'menu_engineering', // Phase 5: New Template
        name: 'Ingeniería de Menú',
        description: 'Análisis de rentabilidad y popularidad de platos.',
        icon: '🥩',
        focus: 'Rentabilidad y Diseño',
        capabilities: ['costing', 'variants'],
        defaultMode: 'operational',
        structure: [
            { title: 'Matriz BCG', type: 'grid', description: 'Vacas, Estrellas, Perros, Puzzles' },
            { title: 'Nuevos Platos', type: 'board', description: 'Candidatos al menú' },
            { title: 'Costos', type: 'board', description: 'Análisis detallado' }
        ]
    },
    {
        id: 'shift_briefing', // Phase 5: New Template
        name: 'Briefing de Turno',
        description: 'Comunicación diaria para equipos de sala y cocina.',
        icon: '📢',
        focus: 'Comunicación Diaria',
        capabilities: ['checklist', 'staff_read'],
        defaultMode: 'operational',
        structure: [
            { title: 'Objetivos del Día', type: 'board', description: 'Focus de venta' },
            { title: 'Bajas / 86', type: 'board', description: 'Platos no disponibles' },
            { title: 'Notas de Servicio', type: 'board', description: 'Incidencias previas' }
        ]
    },
    {
        id: 'event_map', // Phase 5: New Template
        name: 'Mapa de Evento',
        description: 'Logística de sala y cronograma de servicio.',
        icon: '📍',
        focus: 'Logística y Tiempos',
        capabilities: ['layout', 'time_tracking'],
        defaultMode: 'creative', // Map layout needs drag
        structure: [
            { title: 'Plano de Sala', type: 'board', description: 'Distribución de mesas' },
            { title: 'Timeline', type: 'board', description: 'Secuencia de servicio' },
            { title: 'Personal', type: 'board', description: 'Asignaciones' }
        ]
    },
    {
        id: 'strategic_roadmap', // Phase 5: New Template
        name: 'Roadmap Estratégico',
        description: 'Planificación trimestral de objetivos.',
        icon: '🚩',
        focus: 'Visión Trimestral',
        capabilities: ['status_tracking'],
        defaultMode: 'executive', // Review focus
        structure: [
            { title: 'Q1', type: 'board', description: 'Objetivos Enero-Marzo' },
            { title: 'Q2', type: 'board', description: 'Objetivos Abril-Junio' },
            { title: 'Q3', type: 'board', description: 'Objetivos Julio-Septiembre' },
            { title: 'Q4', type: 'board', description: 'Objetivos Octubre-Diciembre' }
        ]
    },
    {
        id: 'creative',
        name: 'Pizarra Creativa',
        description: 'Ideación, conceptos y exploración visual.',
        icon: '🎨',
        focus: 'Ideación y Concepto',
        // capabilities: undefined (Generic)
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
        capabilities: ['variants'],
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
        capabilities: ['checklist', 'status_tracking'],
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
        capabilities: ['costing', 'layout'],
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

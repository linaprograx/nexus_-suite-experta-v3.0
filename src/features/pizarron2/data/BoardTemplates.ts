import { BoardTemplate, BoardCapability, InteractionMode } from '../engine/types';

interface ExtendedBoardTemplate extends BoardTemplate {
    capabilities?: BoardCapability[];
    defaultMode?: InteractionMode;
}

// Order leads with the F&B-focused, structure-based templates (updated to the new
// zone layouts) and ends with the more generic / free-form ones.
export const BOARD_TEMPLATES: ExtendedBoardTemplate[] = [
    {
        id: 'mixologist',
        name: 'Pizarra Mixólogo',
        description: 'Ficha de cóctel completa con técnica, costes e ingredientes.',
        icon: '🍸',
        focus: 'Desarrollo de Recetas',
        capabilities: ['variants'],
        structure: [
            { title: 'Ficha de Cóctel', type: 'board', description: 'Layout de receta por zonas' },
            { title: 'Técnicas', type: 'board', description: 'Métodos de preparación' },
            { title: 'Pruebas', type: 'board', description: 'Registro de intentos' }
        ]
    },
    {
        id: 'nexus',
        name: 'Pizarra Nexus',
        description: 'Diseño integral: carta, cócteles y narrativa de concepto.',
        icon: '💠',
        focus: 'Diseño de Menús',
        capabilities: ['costing', 'layout'],
        structure: [
            { title: 'Estructura Menú', type: 'board', description: 'Carta por secciones' },
            { title: 'Ficha de Cóctel', type: 'board', description: 'Desarrollo de tragos' },
            { title: 'Storytelling', type: 'board', description: 'Narrativa del concepto' },
            { title: 'Visual & Layout', type: 'board', description: 'Diseño gráfico' }
        ]
    },
    {
        id: 'menu_engineering',
        name: 'Ingeniería de Menú',
        description: 'Matriz BCG real de rentabilidad y popularidad de platos.',
        icon: '📊',
        focus: 'Rentabilidad y Diseño',
        capabilities: ['costing', 'variants'],
        defaultMode: 'operational',
        structure: [
            { title: 'Matriz BCG', type: 'grid', description: 'Estrellas, Caballos, Enigmas, Perros' },
            { title: 'Nuevos Platos', type: 'board', description: 'Carta de candidatos' },
            { title: 'Análisis de Costos', type: 'board', description: 'Flujo Kanban de costeo' }
        ]
    },
    {
        id: 'productive',
        name: 'Pizarra Productiva',
        description: 'Kanban de tareas y planificación semanal del equipo.',
        icon: '⚡',
        focus: 'Planificación Operativa',
        capabilities: ['checklist', 'status_tracking'],
        structure: [
            { title: 'Tablero Kanban', type: 'board', description: 'Pendiente · En curso · Hecho' },
            { title: 'Planificación Semanal', type: 'board', description: 'Lunes a Viernes' }
        ]
    },
    {
        id: 'analytical',
        name: 'Pizarra Analítica',
        description: 'Análisis DAFO por zonas y comparación de opciones.',
        icon: '📈',
        focus: 'Análisis y Decisión',
        structure: [
            { title: 'Análisis DAFO', type: 'board', description: 'Matriz estratégica' },
            { title: 'Comparación', type: 'board', description: 'Balanza de opciones' }
        ]
    },
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
        id: 'shift_briefing',
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
        id: 'event_map',
        name: 'Mapa de Evento',
        description: 'Logística de sala y cronograma de servicio.',
        icon: '📍',
        focus: 'Logística y Tiempos',
        capabilities: ['layout', 'time_tracking'],
        defaultMode: 'creative',
        structure: [
            { title: 'Plano de Sala', type: 'board', description: 'Distribución de mesas' },
            { title: 'Cronograma', type: 'board', description: 'Secuencia de servicio' },
            { title: 'Personal', type: 'board', description: 'Asignaciones' }
        ]
    },
    {
        id: 'strategic_roadmap',
        name: 'Roadmap Estratégico',
        description: 'Planificación trimestral de objetivos.',
        icon: '🚩',
        focus: 'Visión Trimestral',
        capabilities: ['status_tracking'],
        defaultMode: 'executive',
        structure: [
            { title: 'Q1', type: 'board', description: 'Objetivos Enero-Marzo' },
            { title: 'Q2', type: 'board', description: 'Objetivos Abril-Junio' },
            { title: 'Q3', type: 'board', description: 'Objetivos Julio-Septiembre' },
            { title: 'Q4', type: 'board', description: 'Objetivos Octubre-Diciembre' }
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

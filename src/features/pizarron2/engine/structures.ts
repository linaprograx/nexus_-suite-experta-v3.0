import { BoardStructure } from './types';

// Color palette optimised for dark-mode canvas (readable on #0f172a / #1e293b)
const C = {
    green:   { bg: '#0f2d1a', border: '#22c55e', title: '#22c55e', titleBg: '#14532d' },
    red:     { bg: '#2d0f0f', border: '#ef4444', title: '#f87171', titleBg: '#7f1d1d' },
    blue:    { bg: '#0f1d3a', border: '#60a5fa', title: '#93c5fd', titleBg: '#1e3a8a' },
    amber:   { bg: '#2d1a0f', border: '#f59e0b', title: '#fcd34d', titleBg: '#78350f' },
    purple:  { bg: '#1a0f2d', border: '#a78bfa', title: '#c4b5fd', titleBg: '#4c1d95' },
    slate:   { bg: '#0f172a', border: '#475569', title: '#94a3b8', titleBg: '#1e293b' },
    orange:  { bg: '#2d1500', border: '#f97316', title: '#fb923c', titleBg: '#7c2d12' },
    teal:    { bg: '#0a2420', border: '#2dd4bf', title: '#5eead4', titleBg: '#134e4a' },
};

const zoneStyle = (c: typeof C[keyof typeof C], extra: object = {}) => ({
    backgroundColor: c.bg,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 6,
    titleColor: c.title,
    titleBackgroundColor: c.titleBg,
    showLabel: true,
    ...extra,
});

export const STRUCTURE_TEMPLATES: Record<string, BoardStructure> = {

    // ─── DAFO / SWOT ────────────────────────────────────────────────────────
    'technical-grid-structure': {
        id: 'technical-grid-structure',
        name: 'Análisis DAFO',
        description: 'Matriz 2×2 para análisis estratégico: Fortalezas, Debilidades, Oportunidades, Amenazas.',
        gap: 6,
        zones: [
            {
                id: 'q1', label: '💪 FORTALEZAS', x: 0, y: 0, w: 0.5, h: 0.5,
                defaultType: 'list',
                style: zoneStyle(C.green),
                content: { text: '• Equipo con experiencia\n• Producto diferenciado\n• Buena reputación\n• Proceso optimizado' },
            },
            {
                id: 'q2', label: '⚠️ DEBILIDADES', x: 0.5, y: 0, w: 0.5, h: 0.5,
                defaultType: 'list',
                style: zoneStyle(C.red),
                content: { text: '• Falta de capital\n• Equipo pequeño\n• Dependencia de proveedor\n• Escasa presencia digital' },
            },
            {
                id: 'q3', label: '🚀 OPORTUNIDADES', x: 0, y: 0.5, w: 0.5, h: 0.5,
                defaultType: 'list',
                style: zoneStyle(C.blue),
                content: { text: '• Mercado en crecimiento\n• Nuevas tendencias\n• Alianzas estratégicas\n• Expansión geográfica' },
            },
            {
                id: 'q4', label: '🔥 AMENAZAS', x: 0.5, y: 0.5, w: 0.5, h: 0.5,
                defaultType: 'list',
                style: zoneStyle(C.amber),
                content: { text: '• Competencia creciente\n• Cambios regulatorios\n• Aumento de costes\n• Saturación del mercado' },
            },
        ]
    },

    // ─── KANBAN ─────────────────────────────────────────────────────────────
    'kanban-structure': {
        id: 'kanban-structure',
        name: 'Kanban',
        description: 'Tablero Kanban con 3 columnas para gestión de tareas por estado.',
        gap: 6,
        zones: [
            {
                id: 'todo', label: '📋 PENDIENTE', x: 0, y: 0, w: 0.333, h: 1,
                defaultType: 'list',
                style: zoneStyle(C.slate),
                content: { text: '• Definir estrellas y vacas\n• Revisar escandallos\n• Actualizar carta\n• Formación equipo\n• Análisis proveedores' },
            },
            {
                id: 'doing', label: '⚡ EN PROGRESO', x: 0.333, y: 0, w: 0.334, h: 1,
                defaultType: 'list',
                style: zoneStyle(C.orange),
                content: { text: '• Diseño nueva carta\n• Prueba de receta cóctel' },
            },
            {
                id: 'done', label: '✅ COMPLETADO', x: 0.667, y: 0, w: 0.333, h: 1,
                defaultType: 'list',
                style: zoneStyle(C.green),
                content: { text: '• Inventario actualizado\n• Pedido semanal hecho\n• Brief equipo martes' },
            },
        ]
    },

    // ─── FICHA DE CÓCTEL ────────────────────────────────────────────────────
    'cocktail-recipe-structure': {
        id: 'cocktail-recipe-structure',
        name: 'Ficha de Cóctel',
        description: 'Ficha técnica premium para desarrollo y documentación de cócteles.',
        gap: 4,
        zones: [
            // Header: nombre del cóctel
            {
                id: 'name', label: '🍸 NOMBRE DEL CÓCTEL', x: 0, y: 0, w: 0.6, h: 0.10,
                defaultType: 'text', style: { ...zoneStyle(C.teal), showLabel: false },
                content: { text: 'NOMBRE DEL CÓCTEL', style: { fontSize: 22, fontWeight: '700', color: '#5eead4', textAlign: 'center' } },
            },
            // Categoría + temporada
            {
                id: 'meta', label: 'CATEGORÍA / TEMPORADA', x: 0.6, y: 0, w: 0.4, h: 0.10,
                defaultType: 'text', style: zoneStyle(C.slate),
                content: { text: 'Clásico · Temporada Verano · ABV: 12%' },
            },
            // Foto principal
            {
                id: 'photo', label: '📷 FOTO', x: 0, y: 0.10, w: 0.35, h: 0.55,
                defaultType: 'image',
                style: { ...zoneStyle(C.slate), dashed: true, showLabel: false },
                content: { text: '' },
            },
            // Historia / Concepto
            {
                id: 'concept', label: '✍️ CONCEPTO', x: 0.35, y: 0.10, w: 0.65, h: 0.22,
                defaultType: 'text', style: zoneStyle(C.purple),
                content: { text: 'Historia del cóctel, inspiración o concepto detrás de la creación. ¿Qué emociones evoca?' },
            },
            // Ingredientes (grimorio)
            {
                id: 'ingredients', label: '🌿 INGREDIENTES (del Grimorio)', x: 0, y: 0.65, w: 0.5, h: 0.35,
                defaultType: 'list', style: zoneStyle(C.green),
                content: { text: '• Añade ingredientes desde el Grimorio\n• Base: 50 ml\n• Modificador: 20 ml\n• Dulce: 15 ml\n• Ácido: 20 ml\n• Complemento: c/s' },
            },
            // Elaboración
            {
                id: 'technique', label: '⚙️ TÉCNICA', x: 0.35, y: 0.32, w: 0.35, h: 0.33,
                defaultType: 'list', style: zoneStyle(C.blue),
                content: { text: 'Método: Agitado\nCopa: Coupe\nHielo: Sin hielo\nGuarnición: Twist limón\nTemperatura: -6°C' },
            },
            // Costes y precio (grimorio)
            {
                id: 'costs', label: '💰 COSTE / PVP', x: 0.7, y: 0.32, w: 0.3, h: 0.33,
                defaultType: 'list', style: zoneStyle(C.amber),
                content: { text: 'Coste: €2,40\nPVP: €12,00\nMargen: 80%\n\n→ Ver escandallo\nen Grimorio' },
            },
            // Notas
            {
                id: 'notes', label: '📝 NOTAS', x: 0.5, y: 0.65, w: 0.5, h: 0.35,
                defaultType: 'text', style: zoneStyle(C.slate),
                content: { text: 'Notas de servicio, maridaje sugerido, temporada, alérgenos, variantes y observaciones del bartender.' },
            },
        ]
    },

    // ─── COMPARACIÓN ────────────────────────────────────────────────────────
    'comparison-structure': {
        id: 'comparison-structure',
        name: 'Comparación 3 Opciones',
        description: 'Layout de 3 columnas para comparar proveedores, productos o estrategias.',
        gap: 6,
        zones: [
            {
                id: 'col1', label: '🥇 OPCIÓN A', x: 0, y: 0, w: 0.333, h: 1,
                defaultType: 'list', style: zoneStyle(C.teal),
                content: { text: '✓ Ventaja principal 1\n✓ Ventaja principal 2\n✓ Ventaja principal 3\n\n✗ Limitación 1\n✗ Limitación 2\n\n💰 Precio: €___\n⭐ Score: 8/10' },
            },
            {
                id: 'col2', label: '🥈 OPCIÓN B', x: 0.333, y: 0, w: 0.334, h: 1,
                defaultType: 'list', style: zoneStyle(C.purple),
                content: { text: '✓ Ventaja principal 1\n✓ Ventaja principal 2\n✓ Ventaja principal 3\n\n✗ Limitación 1\n✗ Limitación 2\n\n💰 Precio: €___\n⭐ Score: 7/10' },
            },
            {
                id: 'col3', label: '🥉 OPCIÓN C', x: 0.667, y: 0, w: 0.333, h: 1,
                defaultType: 'list', style: zoneStyle(C.slate),
                content: { text: '✓ Ventaja principal 1\n✓ Ventaja principal 2\n✓ Ventaja principal 3\n\n✗ Limitación 1\n✗ Limitación 2\n\n💰 Precio: €___\n⭐ Score: 6/10' },
            },
        ]
    },

    // ─── STORYTELLING / CONCEPTO ────────────────────────────────────────────
    'storytelling-structure': {
        id: 'storytelling-structure',
        name: 'Storytelling',
        description: 'Layout asimétrico para presentar un concepto o historia de marca.',
        gap: 4,
        zones: [
            {
                id: 'hero', label: 'IMAGEN PRINCIPAL', x: 0, y: 0, w: 0.55, h: 1,
                defaultType: 'image',
                style: { ...zoneStyle(C.slate), dashed: true, showLabel: false },
                content: { text: '' },
            },
            {
                id: 'tagline', label: '✨ CLAIM', x: 0.55, y: 0, w: 0.45, h: 0.15,
                defaultType: 'text', style: { ...zoneStyle(C.orange), showLabel: false },
                content: { text: 'LA VISIÓN', style: { fontSize: 18, fontWeight: '700', color: '#fb923c', textAlign: 'center' } },
            },
            {
                id: 'title', label: '📌 TÍTULO', x: 0.55, y: 0.15, w: 0.45, h: 0.20,
                defaultType: 'text', style: zoneStyle(C.purple),
                content: { text: 'El nombre del concepto, plato o evento que quieres presentar.' },
            },
            {
                id: 'body', label: '📖 HISTORIA', x: 0.55, y: 0.35, w: 0.45, h: 0.38,
                defaultType: 'text', style: zoneStyle(C.blue),
                content: { text: 'Narrativa que explica la inspiración, el origen o la propuesta de valor. ¿Qué hace único a este concepto?' },
            },
            {
                id: 'cta', label: '🎯 LLAMADA A LA ACCIÓN', x: 0.55, y: 0.73, w: 0.45, h: 0.27,
                defaultType: 'text', style: zoneStyle(C.teal),
                content: { text: 'Próximos pasos, fecha de lanzamiento, precio o dónde probarlo.' },
            },
        ]
    },

    // ─── MENÚ VERTICAL ──────────────────────────────────────────────────────
    'menu-layout-structure': {
        id: 'menu-layout-structure',
        name: 'Carta de Menú',
        description: 'Diseño de carta con secciones, platos, descripciones y precios.',
        gap: 3,
        zones: [
            {
                id: 'header', label: 'ENCABEZADO', x: 0, y: 0, w: 1, h: 0.11,
                defaultType: 'text',
                style: { ...zoneStyle(C.teal), showLabel: false },
                content: { text: 'SECCIÓN DE CARTA', style: { fontSize: 16, fontWeight: '700', color: '#5eead4', textAlign: 'center' } },
            },
            { id: 'n1', label: 'Plato 1', x: 0, y: 0.11, w: 0.68, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Nombre del plato / cóctel' } },
            { id: 'p1', label: 'Precio', x: 0.68, y: 0.11, w: 0.32, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.amber), showLabel: false }, content: { text: '12,00 €' } },
            { id: 'd1', label: 'Desc 1', x: 0, y: 0.18, w: 1, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Descripción de ingredientes y perfil de sabor.' } },

            { id: 'n2', label: 'Plato 2', x: 0, y: 0.25, w: 0.68, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Nombre del plato / cóctel' } },
            { id: 'p2', label: 'Precio', x: 0.68, y: 0.25, w: 0.32, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.amber), showLabel: false }, content: { text: '14,00 €' } },
            { id: 'd2', label: 'Desc 2', x: 0, y: 0.32, w: 1, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Descripción de ingredientes y perfil de sabor.' } },

            { id: 'n3', label: 'Plato 3', x: 0, y: 0.39, w: 0.68, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Nombre del plato / cóctel' } },
            { id: 'p3', label: 'Precio', x: 0.68, y: 0.39, w: 0.32, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.amber), showLabel: false }, content: { text: '11,00 €' } },
            { id: 'd3', label: 'Desc 3', x: 0, y: 0.46, w: 1, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Descripción de ingredientes y perfil de sabor.' } },

            { id: 'n4', label: 'Plato 4', x: 0, y: 0.53, w: 0.68, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Nombre del plato / cóctel' } },
            { id: 'p4', label: 'Precio', x: 0.68, y: 0.53, w: 0.32, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.amber), showLabel: false }, content: { text: '13,00 €' } },
            { id: 'd4', label: 'Desc 4', x: 0, y: 0.60, w: 1, h: 0.07, defaultType: 'text', style: { ...zoneStyle(C.slate), showLabel: false }, content: { text: 'Descripción de ingredientes y perfil de sabor.' } },

            {
                id: 'chef', label: '👨‍🍳 NOTA DEL CHEF', x: 0, y: 0.67, w: 1, h: 0.33,
                defaultType: 'text', style: zoneStyle(C.purple),
                content: { text: 'Nota especial, recomendaciones del chef, maridaje sugerido o información de alérgenos.' },
            },
        ]
    },

    // ─── MOODBOARD ──────────────────────────────────────────────────────────
    'visual-moodboard-structure': {
        id: 'visual-moodboard-structure',
        name: 'Moodboard Visual',
        description: 'Mosaico de imágenes para tablero de inspiración y referencias visuales.',
        gap: 4,
        zones: [
            { id: 'z1', label: '', x: 0, y: 0, w: 0.34, h: 0.5, defaultType: 'image', style: { ...zoneStyle(C.slate), dashed: true, showLabel: false }, content: { text: '' } },
            { id: 'z2', label: '', x: 0.34, y: 0, w: 0.33, h: 0.5, defaultType: 'image', style: { ...zoneStyle(C.slate), dashed: true, showLabel: false }, content: { text: '' } },
            { id: 'z3', label: '', x: 0.67, y: 0, w: 0.33, h: 0.5, defaultType: 'image', style: { ...zoneStyle(C.slate), dashed: true, showLabel: false }, content: { text: '' } },
            { id: 'z4', label: '', x: 0, y: 0.5, w: 0.5, h: 0.5, defaultType: 'image', style: { ...zoneStyle(C.slate), dashed: true, showLabel: false }, content: { text: '' } },
            { id: 'z5', label: '', x: 0.5, y: 0.5, w: 0.5, h: 0.5, defaultType: 'image', style: { ...zoneStyle(C.slate), dashed: true, showLabel: false }, content: { text: '' } },
        ]
    },

    // ─── PLANIFICACIÓN SEMANAL ──────────────────────────────────────────────
    'planning-structure': {
        id: 'planning-structure',
        name: 'Planificación Semanal',
        description: 'Vista de 5 días para planificación operativa de la semana laboral.',
        gap: 5,
        zones: [
            { id: 'lunes',    label: '📅 LUNES',    x: 0,    y: 0, w: 0.2, h: 1, defaultType: 'list', style: zoneStyle(C.blue),   content: { text: '🕗 Briefing\n• Revisar metas\n• Asignar tareas\n\n🍽 Servicio\n• Mise en place\n• Control stock' } },
            { id: 'martes',   label: '📅 MARTES',   x: 0.2,  y: 0, w: 0.2, h: 1, defaultType: 'list', style: zoneStyle(C.teal),  content: { text: '📦 Pedidos\n• Proveedor A\n• Proveedor B\n\n👨‍🍳 Formación\n• Cata\n• Nueva receta' } },
            { id: 'miercoles', label: '📅 MIÉRCOLES', x: 0.4, y: 0, w: 0.2, h: 1, defaultType: 'list', style: zoneStyle(C.purple), content: { text: '📊 Gestión\n• Inventario\n• Escandallos\n\n📋 Admin\n• Horarios\n• Revisión KPIs' } },
            { id: 'jueves',   label: '📅 JUEVES',   x: 0.6,  y: 0, w: 0.2, h: 1, defaultType: 'list', style: zoneStyle(C.orange), content: { text: '🎯 Creativo\n• Nuevas propuestas\n• Test recetas\n\n📸 Marketing\n• Fotos\n• RRSS' } },
            { id: 'viernes',  label: '📅 VIERNES',  x: 0.8,  y: 0, w: 0.2, h: 1, defaultType: 'list', style: zoneStyle(C.green),  content: { text: '📈 Análisis\n• Ventas semana\n• Feedback\n\n🔮 Planificar\n• Próxima semana\n• Ajustes' } },
        ]
    },

    // ─── DISEÑO DE MENÚ ─────────────────────────────────────────────────────
    'menu-design-structure': {
        id: 'menu-design-structure',
        name: 'Ingeniería de Menú',
        description: 'Análisis matricial de rentabilidad y popularidad de la carta.',
        gap: 5,
        zones: [
            {
                id: 'stars', label: '⭐ ESTRELLAS (Alto margen · Alta venta)', x: 0, y: 0, w: 0.5, h: 0.5,
                defaultType: 'list', style: zoneStyle(C.green),
                content: { text: '→ Potenciar y mantener\n\n• Cóctel firma\n• Plato estrella\n• Producto premium\n\nAcción: Destacar en carta,\nformar al equipo para vender' },
            },
            {
                id: 'plowhorses', label: '🐴 CABALLOS (Bajo margen · Alta venta)', x: 0.5, y: 0, w: 0.5, h: 0.5,
                defaultType: 'list', style: zoneStyle(C.amber),
                content: { text: '→ Mejorar rentabilidad\n\n• Revisar escandallo\n• Negociar proveedores\n• Ajustar precio\n\nAcción: Subir precio 5-10%\no reducir coste de receta' },
            },
            {
                id: 'puzzles', label: '❓ ENIGMAS (Alto margen · Baja venta)', x: 0, y: 0.5, w: 0.5, h: 0.5,
                defaultType: 'list', style: zoneStyle(C.blue),
                content: { text: '→ Impulsar ventas\n\n• Repositionar en carta\n• Formación al equipo\n• Promoción especial\n\nAcción: Ubicar mejor en carta\no crear combo con estrella' },
            },
            {
                id: 'dogs', label: '🐕 PERROS (Bajo margen · Baja venta)', x: 0.5, y: 0.5, w: 0.5, h: 0.5,
                defaultType: 'list', style: zoneStyle(C.red),
                content: { text: '→ Eliminar o rediseñar\n\n• Revisar viabilidad\n• Considerar retirada\n• Rediseñar receta\n\nAcción: Eliminar de carta\no reformular completamente' },
            },
        ]
    },
};

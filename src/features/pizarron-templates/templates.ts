export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  columns: string[];
  automations: string[];
  linkedViews: string[];
}

export const PIZARRON_TEMPLATES: BoardTemplate[] = [
  {
    id: "R&D",
    name: "Investigación y Desarrollo",
    description: "Flujo completo para innovaciones culinarias, desde la idea hasta el plato.",
    color: "#8B5CF6", // Violeta
    icon: "beaker",
    columns: ["Ideas", "Pruebas", "Laboratorio", "Resultados", "Aprobado"],
    automations: [
      "Si la tarea tiene imagen -> mover a 'Resultados'",
      "Si tiene ingredientes -> mover a 'Pruebas'"
    ],
    linkedViews: ["thelab", "cerebrity"]
  },
  {
    id: "MenuLaunch",
    name: "Lanzamiento de Menú",
    description: "Gestión estructurada para lanzar nuevos menús de temporada.",
    color: "#10B981", // Esmeralda
    icon: "bookOpen",
    columns: ["Conceptos", "Desarrollo", "Pruebas Internas", "Costeo", "Fotografía", "Finalizados"],
    automations: [
      "Al entrar en 'Costeo' -> disparar Escandallo"
    ],
    linkedViews: ["escandallator", "makemenu"]
  },
  {
    id: "ZeroWaste",
    name: "Zero Waste & Sostenibilidad",
    description: "Optimización de recursos y transformación de mermas.",
    color: "#F59E0B", // Ámbar
    icon: "recycle",
    columns: ["Identificación", "Recuperación", "Transformación", "Prototipo", "Validado"],
    automations: [
      "Si categoría == 'residuo' -> marcar Prioridad Alta"
    ],
    linkedViews: ["zerowastechef"]
  },
  {
    id: "LabPhys",
    name: "Laboratorio Físico",
    description: "Control de procesos físicos, infusiones y fermentos.",
    color: "#3B82F6", // Azul
    icon: "cube",
    columns: ["Mise en Place", "Producción", "Infusiones", "Clarificaciones", "Ready"],
    automations: [
      "Auto-batch en columna 'Producción'"
    ],
    linkedViews: ["lab"]
  },
  {
    id: "Creativity",
    name: "Brainstorming Creativo",
    description: "Espacio libre para ideas salvajes y refinamiento de conceptos.",
    color: "#EC4899", // Rosa
    icon: "lightbulb",
    columns: ["Ideas Salvajes", "Refinamiento", "Semillas Creativas", "Experimentos", "Publicables"],
    automations: [
      "Al crear -> auto-generar variantes con IA"
    ],
    linkedViews: ["cerebrity"]
  },
  {
    id: "Blank",
    name: "Tablero en Blanco",
    description: "Empieza desde cero y configura tu propio flujo de trabajo.",
    color: "#64748B", // Slate
    icon: "plus",
    columns: ["Por hacer", "En progreso", "Hecho"],
    automations: [],
    linkedViews: []
  }
];

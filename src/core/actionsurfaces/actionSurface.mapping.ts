
import { ActionSurface } from './actionSurface.types';

// Map Insight IDs to Action Surfaces
// This allows decoupling the Insight generation from the Action hint.

export const ACTION_SURFACE_MAPPING: Record<string, Partial<ActionSurface>> = {
    'INSIGHT_MARKET_SAVINGS_HIGH_IMPACT': {
        label: "Ver opciones de compra",
        description: "Existen alternativas de proveedor con menor coste unitario.",
        actionType: 'informational', // Passive
        scope: 'market'
    },
    'INSIGHT_SINGLE_SUPPLIER_DEPENDENCY': {
        label: "Explorar proveedores",
        description: "Este producto depende de un único proveedor.",
        actionType: 'informational',
        scope: 'market'
    },
    'INSIGHT_COST_OVERRUN': {
        label: "Revisar composición de costes",
        description: "Coste real dominado por divergencias de precio.",
        actionType: 'informational',
        scope: 'cost'
    },
    'INSIGHT_DATA_QUALITY': {
        label: "Ir a gestión de stock", // Stub
        description: "Hay ingredientes sin correspondencia de compra.",
        actionType: 'navigational_stub',
        scope: 'stock'
    }
};

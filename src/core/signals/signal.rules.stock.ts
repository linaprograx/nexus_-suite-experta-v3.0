import { Signal, StockSignalInput } from './signal.types';

export const STOCK_MISSING_PRICE = 'STOCK_MISSING_PRICE';
export const STOCK_MISSING_LINK = 'STOCK_MISSING_LINK';
export const STOCK_STALE_PURCHASE = 'STOCK_STALE_PURCHASE';

export const evaluateStockRules = (input: StockSignalInput): Signal[] => {
    const signals: Signal[] = [];
    const item = input.stockItem;

    // Rule 1: Missing Price
    // Impact: Blocks "Real Cost" calculation for any recipe using this.
    if (!item.averageUnitCost || item.averageUnitCost <= 0) {
        signals.push({
            id: STOCK_MISSING_PRICE,
            type: 'stock',
            severity: 'critical',
            scope: 'stock',
            message: 'Sin Coste Operativo',
            explanation: 'Este ítem no tiene un coste promedio válido, lo que impide calcular el coste real de las recetas.',
            context: {
                quantity: item.quantityAvailable
            },
            meta: { linkStatus: item.ingredientId ? 'linked' : 'unlinked' },
            visible: true
        });
    }

    // Rule 2: Missing Link to Master Ingredient
    // Impact: Cannot map to recipes or market data.
    if (!item.ingredientId || item.ingredientId === 'unlinked') {
        signals.push({
            id: STOCK_MISSING_LINK,
            type: 'stock',
            severity: 'warning',
            scope: 'stock',
            message: 'Ítem no vinculado',
            explanation: 'Este ítem de stock no está vinculado a un Ingrediente Maestro.',
            context: {},
            meta: {},
            visible: true
        });
    }

    // Rule 3: Stale Purchase (Price might be outdated)
    const STALE_THRESHOLD_DAYS = 60;
    const now = Date.now();
    const lastPurchase = item.lastPurchaseDate ? new Date(item.lastPurchaseDate).getTime() : 0;
    const daysSince = (now - lastPurchase) / (1000 * 60 * 60 * 24);

    if (daysSince > STALE_THRESHOLD_DAYS && item.quantityAvailable > 0) {
        signals.push({
            id: STOCK_STALE_PURCHASE,
            type: 'stock',
            severity: 'info',
            scope: 'stock',
            message: 'Precio antiguo',
            explanation: `La última compra fue hace ${Math.floor(daysSince)} días. El coste real podría estar desactualizado.`,
            context: { daysSince: Math.floor(daysSince) },
            meta: { lastPurchaseDate: lastPurchase },
            visible: true
        });
    }

    return signals;
};

import { PurchaseEvent, StockMovement } from '../types';

export interface StockItem {
    ingredientId: string;
    ingredientName: string;
    unit: string;
    quantityAvailable: number;
    totalValue: number;
    averageUnitCost: number;
    lastPurchaseDate: Date | string | number;
    providerName: string;
    lastPurchaseQuantity: number;
}


export const buildStockFromPurchases = (purchases: PurchaseEvent[]): StockItem[] => {
    const stockMap: Record<string, StockItem> = {};

    // Purchases should be sorted by date (oldest first or newest first)
    // Here we assume we want to iterate all to build the aggregate.
    // If we want Last Purchase Date, iterating keeps updating it if we process chronological or check dates.

    purchases.forEach(purchase => {
        // Skip incomplete or invalid purchases
        if (!purchase.ingredientId || purchase.quantity <= 0) return;

        const existing = stockMap[purchase.ingredientId];

        if (existing) {
            // Update existing
            const newQuantity = existing.quantityAvailable + purchase.quantity;
            const newTotalValue = existing.totalValue + (purchase.totalCost || 0);

            // Recalculate Average Cost (Weighted)
            // Avoid division by zero
            const newAverageCost = newQuantity > 0 ? newTotalValue / newQuantity : existing.averageUnitCost;

            // Check for latest date
            const purchaseDate = new Date(purchase.createdAt);
            const isLatest = purchaseDate > existing.lastPurchaseDate;

            stockMap[purchase.ingredientId] = {
                ...existing,
                quantityAvailable: newQuantity,
                totalValue: newTotalValue,
                averageUnitCost: newAverageCost,
                lastPurchaseDate: isLatest ? purchaseDate : existing.lastPurchaseDate,
                providerName: isLatest ? (purchase.providerName || existing.providerName) : existing.providerName,
                lastPurchaseQuantity: isLatest ? purchase.quantity : existing.lastPurchaseQuantity
            };

        } else {
            // Create new
            stockMap[purchase.ingredientId] = {
                ingredientId: purchase.ingredientId,
                ingredientName: purchase.ingredientName || 'Ingrediente Desconocido',
                unit: purchase.unit,
                quantityAvailable: purchase.quantity,
                totalValue: purchase.totalCost || 0,
                averageUnitCost: (purchase.totalCost || 0) / purchase.quantity,
                lastPurchaseDate: new Date(purchase.createdAt),
                providerName: purchase.providerName || 'Sin Proveedor',
                lastPurchaseQuantity: purchase.quantity
            };
        }
    });

    return Object.values(stockMap);
};

/**
 * Subtracts consumption/waste/adjustment movements from the purchase-built stock.
 * INVARIANT: with an empty `movements` array this returns the input unchanged, so
 * behaviour is identical to today until the first movement is recorded.
 * Quantities and value are clamped at 0 (a movement can't push stock below empty).
 */
export const applyMovementsToStock = (stock: StockItem[], movements: StockMovement[]): StockItem[] => {
    if (!movements || movements.length === 0) return stock;

    // Sum removed quantity per ingredient.
    // consumption/waste are always removals (>= 0). 'adjustment' (physical count) is signed:
    // positive delta removes (digital > counted), negative delta adds back (counted > digital).
    const consumedByIng: Record<string, number> = {};
    for (const m of movements) {
        if (!m.ingredientId || !m.quantity) continue;
        const q = m.type === 'adjustment' ? m.quantity : Math.max(0, m.quantity);
        consumedByIng[m.ingredientId] = (consumedByIng[m.ingredientId] || 0) + q;
    }

    return stock.map(item => {
        const consumed = consumedByIng[item.ingredientId];
        if (!consumed) return item;
        const newQty = Math.max(0, item.quantityAvailable - consumed);
        // Reduce value at the item's weighted average cost (keeps averageUnitCost stable)
        const newValue = Math.max(0, newQty * item.averageUnitCost);
        return { ...item, quantityAvailable: newQty, totalValue: newValue };
    });
};

/**
 * **Existencias actuales. Fuente única.**
 *
 * Stock = compras que entraron − movimientos que salieron. Las dos mitades
 * juntas, en un solo sitio, porque separarlas ya costó un fallo: el Dashboard
 * llamaba solo a `buildStockFromPurchases` y enseñaba el almacén como si nunca
 * se hubiera consumido nada, mientras Inventario sí restaba los movimientos.
 * Dos cifras distintas del mismo dato en dos pantallas contiguas (39.471 € y
 * 39.452,96 €), y ninguna forma de saber cuál era la buena.
 *
 * Quien necesite existencias llama aquí. Las dos funciones que compone siguen
 * exportadas porque el motor de coste usa `buildStockFromPurchases` a solas
 * para derivar precios de compra, que es otra pregunta distinta.
 */
export const buildCurrentStock = (
    purchases: PurchaseEvent[],
    movements: StockMovement[] = [],
): StockItem[] => applyMovementsToStock(buildStockFromPurchases(purchases), movements);

export const calculateInventoryMetrics = (stock: StockItem[]) => {
    const totalValue = stock.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = stock.length;
    // Sort by value desc for "Top Value items" often useful
    const topValueItems = [...stock].sort((a, b) => b.totalValue - a.totalValue).slice(0, 3);

    return {
        totalValue,
        totalItems,
        topValueItems
    };
};

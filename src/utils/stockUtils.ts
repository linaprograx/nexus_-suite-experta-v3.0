import { PurchaseEvent, StockItem } from '../types';

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

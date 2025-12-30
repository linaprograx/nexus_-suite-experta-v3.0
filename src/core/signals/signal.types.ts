export type SignalType = 'cost' | 'market' | 'stock';
export type SignalSeverity = 'info' | 'warning' | 'critical';
export type SignalContext = 'recipe' | 'product' | 'stock';

export interface SignalMeta {
    theoreticalCost?: number | null;
    realCost?: number | null;
    deltaPercent?: number | null;
    missingCount?: number;
    minUnitPrice?: number;
    maxUnitPrice?: number;
    referenceUnitPrice?: number;
    bestUnitPrice?: number;
    supplierCount?: number;
    daysSinceLastUpdate?: number;
    [key: string]: any;
}

export interface StockSignalInput {
    stockItem: {
        ingredientId?: string;
        averageUnitCost: number;
        quantityAvailable: number;
        lastPurchaseDate?: Date | string | number;
    }
}

export interface Signal {
    id: string;
    type: SignalType;
    severity: SignalSeverity;
    scope: SignalContext; // Renamed from context (recipe | product)
    message: string;
    explanation?: string; // Human-readable reasoning (WHY)
    context?: {           // Metadata for explanation derivation
        deltaPct?: number;
        deltaAbs?: number;
        comparedSuppliers?: number;
        daysStale?: number;
        recipesAffected?: number;
        [key: string]: any;
    };
    meta?: SignalMeta;
    visible: boolean;
}

export interface CostSignalInput {
    theoreticalCost: number;
    realCost: number | null;
    missingStockIngredients: number;
}

export interface MarketSignalInput {
    product: {
        id: string;
        name: string;
        category: string | null;
        // Map of supplier ID -> data
        supplierData: Record<string, {
            price: number;
            formatQty: number;
            formatUnit: 'ml' | 'g' | 'l' | 'kg' | 'units';
            updatedAt?: number | string
        }>;
        referencePrice: number | null;
        referenceSupplierId: string | null;
        unitBase?: 'ml' | 'g' | 'l' | 'kg' | 'units'; // normalized base
    };
}

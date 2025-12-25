import { Signal, MarketSignalInput } from './signal.types';

export const MARKET_PRICE_VARIANCE = 'MARKET_PRICE_VARIANCE';
export const MARKET_SAVINGS_OPPORTUNITY = 'MARKET_SAVINGS_OPPORTUNITY';
export const MARKET_SINGLE_SUPPLIER_RISK = 'MARKET_SINGLE_SUPPLIER_RISK';
export const MARKET_PRICE_STALE = 'MARKET_PRICE_STALE';

// Helper to normalize price to per-unit-base
const calculateUnitPrice = (
    price: number,
    formatQty: number,
    formatUnit: string,
    targetUnit: string
): number | null => {
    if (price <= 0 || formatQty <= 0) return null;

    // Simplistic conversion: map to standard ml or g
    // Ideally we'd reuse a robust unit conversion lib from the app
    let multiplier = 1;

    // Normalize input to base (g/ml)
    if (formatUnit === 'kg' || formatUnit === 'l') multiplier = 1000;

    // Normalize target to base (g/ml) -> this logic assumes unitBase is 'g' or 'ml'
    // If targetUnit is 'kg', we want price per kg.
    // Let's assume Unit Price is ALWAYS Price / (Qty * Multiplier) -> Price per BASE unit (g/ml)
    // The user requirement says "normalized to unitBase (ml or g)"

    const qtyInBase = formatQty * multiplier;
    return price / qtyInBase;
};

export const evaluateMarketRules = (input: MarketSignalInput): Signal[] => {
    const signals: Signal[] = [];
    const p = input.product;

    if (!p.supplierData) return signals;

    const supplierIds = Object.keys(p.supplierData);
    const supplierCount = supplierIds.length;

    // 3. Single Supplier Risk
    if (supplierCount === 1) {
        signals.push({
            id: MARKET_SINGLE_SUPPLIER_RISK,
            type: 'market',
            severity: 'info',
            scope: 'product',
            message: 'Riesgo: proveedor único',
            explanation: 'Este producto depende de un único proveedor registrado.',
            context: {
                comparedSuppliers: 1
            },
            meta: { supplierCount },
            visible: true
        });
    }

    // Prepare unit prices
    const unitPrices: number[] = [];
    supplierIds.forEach(id => {
        const data = p.supplierData[id];
        // Only calculate if compatible format. 
        // We assume formatUnit matches p.unitBase family (mass/vol)
        // For this phase, simplified:
        const up = calculateUnitPrice(data.price, data.formatQty, data.formatUnit, p.unitBase || 'units');
        if (up !== null) unitPrices.push(up);
    });

    if (unitPrices.length > 0) {
        const minPrice = Math.min(...unitPrices);
        const maxPrice = Math.max(...unitPrices);

        // 1. Price Variance
        if (supplierCount >= 2) {
            const delta = maxPrice - minPrice;
            const threshold = Math.max(0.05, minPrice * 0.05); // Max of 5 cents or 5% (assuming price is per base unit which is tiny... wait)
            // If base unit is 'g', price is tiny (e.g. 0.005). 5 cents is HUGE for 'g'.
            // The instruction says: "max(€0.05, 5% of minUnitPrice)". 
            const avgPrice = unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length;
            const variancePct = (delta / minPrice) * 100;

            // Threshold: > 20% difference is significant
            if (variancePct > 20) {
                signals.push({
                    id: MARKET_PRICE_VARIANCE,
                    type: 'market',
                    severity: 'warning',
                    scope: 'product',
                    message: 'Alta variabilidad de precios',
                    explanation: 'Este producto tiene una diferencia significativa de precio entre proveedores.',
                    context: {
                        deltaAbs: delta,
                        deltaPct: variancePct,
                        comparedSuppliers: supplierCount
                    },
                    meta: {
                        minUnitPrice: minPrice,
                        maxUnitPrice: maxPrice,
                        supplierCount
                    },
                    visible: true
                });
            }
        }
        // 2. Savings Opportunity (Value for Money)
        // If current reference price (or highest price if no ref) is significantly higher than min price
        // We reuse calculateUnitPrice to be safe, assuming referencePrice is for 1 unit of unitBase.
        const currentRef = p.referencePrice ?
            calculateUnitPrice(p.referencePrice, 1, p.unitBase || 'units', p.unitBase || 'units') || maxPrice :
            maxPrice;

        if (currentRef && currentRef > minPrice) {
            const savingsDelta = currentRef - minPrice;
            const savingsPct = (savingsDelta / currentRef) * 100;

            if (savingsPct > 5) {
                signals.push({
                    id: MARKET_SAVINGS_OPPORTUNITY,
                    type: 'market',
                    severity: 'info',
                    scope: 'product',
                    message: `Oportunidad de ahorro: ${savingsPct.toFixed(0)}%`,
                    explanation: `Estás pagando un ${savingsPct.toFixed(0)}% más que el proveedor más barato disponible.`,
                    context: {
                        deltaPct: savingsPct,
                        comparedSuppliers: supplierCount
                    },
                    meta: {
                        bestUnitPrice: minPrice,
                        savingsPotentialPercent: savingsPct
                    },
                    visible: true
                });
            }
        }
    }


    // Rule 4: Stale Price (Old update)
    // Check the oldest update
    const now = Date.now();
    const ages = Object.values(input.product.supplierData).map(d => {
        if (!d.updatedAt) return 999;
        const updated = typeof d.updatedAt === 'string' ? new Date(d.updatedAt).getTime() : (d.updatedAt as any).seconds ? (d.updatedAt as any).seconds * 1000 : Number(d.updatedAt);
        const diff = now - updated;
        return diff / (1000 * 60 * 60 * 24); // Days
    });

    const minAge = ages.length > 0 ? Math.min(...ages) : 0;

    if (minAge > 30) {
        signals.push({
            id: MARKET_PRICE_STALE,
            type: 'market',
            severity: 'warning',
            scope: 'product',
            message: 'Precios desactualizados',
            explanation: 'El precio de este producto no se ha actualizado recientemente.',
            context: {
                daysStale: Math.floor(minAge)
            },
            meta: { daysSinceLastUpdate: minAge },
            visible: true
        });
    }

    return signals;
};

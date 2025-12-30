import { Recipe, Ingredient, IngredientLineItem } from '../../../types';

// --- Conversion Tables ---
const UNIT_CONVERSIONS: { [key: string]: { to: 'ml' | 'g' | 'und'; factor: number } } = {
    // Volume
    'cl': { to: 'ml', factor: 10 },
    'l': { to: 'ml', factor: 1000 },
    'oz': { to: 'ml', factor: 29.57 },
    'gal': { to: 'ml', factor: 3785.41 },
    'dash': { to: 'ml', factor: 0.9 },
    'dashes': { to: 'ml', factor: 0.9 },
    'drop': { to: 'ml', factor: 0.05 },
    'barspoon': { to: 'ml', factor: 5 },
    'tsp': { to: 'ml', factor: 5 },
    'tbsp': { to: 'ml', factor: 15 },
    'botella70': { to: 'ml', factor: 700 }, // Special helper
    'botella75': { to: 'ml', factor: 750 }, // Special helper

    // Weight
    'kg': { to: 'g', factor: 1000 },
    'lb': { to: 'g', factor: 453.59 },
    'oz_weight': { to: 'g', factor: 28.35 },

    // Count - Base Factors
    'pieza': { to: 'und', factor: 1 },
    'rebanada': { to: 'und', factor: 1 },
    'rodaja': { to: 'und', factor: 1 },
    'slice': { to: 'und', factor: 1 },
    'hoja': { to: 'und', factor: 1 },
};

// Aliases Map for Normalization
const ALIASES: { [key: string]: string } = {
    'litro': 'l', 'litros': 'l', 'lt': 'l', 'l': 'l', 'L': 'l',
    'ml': 'ml', 'mililitro': 'ml', 'mililitros': 'ml',
    'oz': 'oz', 'onza': 'oz', 'onzas': 'oz',
    'cl': 'cl', 'centilitro': 'cl',
    'g': 'g', 'gramo': 'g', 'gramos': 'g', 'gr': 'g',
    'kg': 'kg', 'kilo': 'kg', 'kilogramo': 'kg',
    'lb': 'lb', 'libra': 'lb',
    'gal': 'gal', 'galon': 'gal',
    'und': 'und', 'unidad': 'und', 'unidades': 'und', 'pieza': 'und', 'ud': 'und', 'uds': 'und'
};

export interface CostedIngredient extends IngredientLineItem {
    costo: number;
}

export interface RecipeCostResult {
    costoTotal: number;
    costoPorIngrediente: CostedIngredient[];
}

// Helper: Normalize any unit to its base (ml, g, und) and return the quantity in that base
const normalizeToBase = (quantity: number, unit: string): { qty: number, base: 'ml' | 'g' | 'und' | 'unknown' } => {
    const u = ALIASES[unit.toLowerCase()] || unit.toLowerCase();

    // 1. Check direct base units
    if (u === 'ml') return { qty: quantity, base: 'ml' };
    if (u === 'g') return { qty: quantity, base: 'g' };
    if (u === 'und') return { qty: quantity, base: 'und' };

    // 2. Check Conversion Table
    const conv = UNIT_CONVERSIONS[u];
    if (conv) {
        return { qty: quantity * conv.factor, base: conv.to };
    }

    // 3. Heuristic for Weight (if standard naming fails)
    if (['oz'].includes(u)) return { qty: quantity * 29.57, base: 'ml' }; // Default oz to fluid oz

    return { qty: quantity, base: 'unknown' };
};

export const calculateRecipeCost = (
    recipe: Partial<Recipe>,
    allIngredients: Ingredient[]
): RecipeCostResult => {

    if (!recipe.ingredientes || recipe.ingredientes.length === 0) {
        return { costoTotal: 0, costoPorIngrediente: [] };
    }

    const costoPorIngrediente: CostedIngredient[] = [];
    let costoTotal = 0;

    for (const lineItem of recipe.ingredientes) {
        const ingredient = allIngredients.find(i => i.id === lineItem.ingredientId);
        let itemCost = 0;

        if (ingredient) {
            // 1. Get Ingredient Purchase Data
            const packPrice = ingredient.precioCompra || ingredient.standardPrice || 0;
            const packQty = ingredient.standardQuantity || 1; // e.g., 0.7 or 700 or 1
            const packUnit = ingredient.standardUnit || ingredient.unidadCompra || 'und'; // e.g., 'l', 'ml', 'cl'

            if (packPrice > 0) {
                // 2. Normalize Purchase Data to Base Unit (e.g. 0.7 L -> 700 ml)
                const packNorm = normalizeToBase(packQty, packUnit);

                // 3. Normalize Recipe Usage to Base Unit (e.g. 30 ml -> 30 ml)
                const usageNorm = normalizeToBase(lineItem.cantidad, lineItem.unidad);

                // 4. Calculate Logic
                if (packNorm.base !== 'unknown' && usageNorm.base !== 'unknown') {
                    if (packNorm.base === usageNorm.base) {
                        // Same Base (Volume -> Volume, Weight -> Weight)
                        // Price per Base Unit = Price / Total Base Qty
                        const pricePerBaseUnit = packPrice / packNorm.qty;
                        itemCost = usageNorm.qty * pricePerBaseUnit;
                    }
                    else if (packNorm.base === 'g' && usageNorm.base === 'ml') {
                        // Weight -> Volume (Approx 1g = 1ml for water/liquids)
                        const pricePerBaseUnit = packPrice / packNorm.qty;
                        itemCost = usageNorm.qty * pricePerBaseUnit;
                    }
                    else if (packNorm.base === 'ml' && usageNorm.base === 'g') {
                        // Volume -> Weight (Approx 1ml = 1g)
                        const pricePerBaseUnit = packPrice / packNorm.qty;
                        itemCost = usageNorm.qty * pricePerBaseUnit;
                    }
                    else if (packNorm.base === 'und' && ['ml', 'g'].includes(usageNorm.base)) {
                        // Count -> Volume/Weight (e.g. 1 Bottle -> 30ml)
                        // Heuristic: Try to parse bottle size from Name or default to 1000ml/1000g
                        let packSizeInUsageBase = 1000; // Default 1L/1Kg

                        const nameLower = ingredient.nombre.toLowerCase();
                        if (nameLower.includes('700')) packSizeInUsageBase = 700;
                        else if (nameLower.includes('750')) packSizeInUsageBase = 750;
                        else if ((nameLower.includes('galon') || nameLower.includes('gal')) && !nameLower.includes('galleta')) packSizeInUsageBase = 3785;
                        else if (nameLower.includes('330')) packSizeInUsageBase = 330;
                        else if (nameLower.includes('355')) packSizeInUsageBase = 355;

                        // Price per Single Unit (e.g. 1 Bottle)
                        const pricePerItem = packPrice / packQty;

                        // Effective Price per ml/g assuming the item = packSizeInUsageBase
                        const pricePerBase = pricePerItem / packSizeInUsageBase;

                        itemCost = usageNorm.qty * pricePerBase;
                    }
                    else {
                        // Mismatched incompatible types (e.g. Und -> Und, but bases differ and logic failed)
                        // Fallback: 1:1 if really stuck? or 0? 
                        // Better to assume 1:1 if unknown just to show SOMETHING, or 0.
                        // Let's rely on standard logic:
                        console.warn(`Unit mismatch: ${packUnit} (${packNorm.base}) vs ${lineItem.unidad} (${usageNorm.base})`);
                    }
                } else {
                    // One unit is unknown, try raw calculation if names match?
                    if (packUnit.toLowerCase() === lineItem.unidad.toLowerCase()) {
                        itemCost = (lineItem.cantidad / packQty) * packPrice;
                    }
                }
            }
        }

        costoPorIngrediente.push({ ...lineItem, costo: itemCost });
        costoTotal += itemCost;
    }

    return { costoTotal, costoPorIngrediente };
};

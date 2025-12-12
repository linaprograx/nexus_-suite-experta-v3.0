import { Recipe, Ingredient, IngredientLineItem } from '../../../types';

// --- Conversion Tables ---
const UNIT_CONVERSIONS: { [key: string]: { to: 'ml' | 'g' | 'und'; factor: number } } = {
    // Volume
    'cl': { to: 'ml', factor: 10 },
    'l': { to: 'ml', factor: 1000 },
    'dash': { to: 'ml', factor: 0.9 },
    'dashes': { to: 'ml', factor: 0.9 },
    'drop': { to: 'ml', factor: 0.05 },
    'barspoon': { to: 'ml', factor: 5 },
    'tsp': { to: 'ml', factor: 5 },
    'tbsp': { to: 'ml', factor: 15 },
    // Weight
    'kg': { to: 'g', factor: 1000 },
    // Count
    'pieza': { to: 'und', factor: 1 },
    'rodaja': { to: 'und', factor: 1 }, // Assuming 1 slice is the standard unit for costing
    'slice': { to: 'und', factor: 1 },
    'hoja': { to: 'und', factor: 1 },
};

export interface CostedIngredient extends IngredientLineItem {
    costo: number;
}

export interface RecipeCostResult {
    costoTotal: number;
    costoPorIngrediente: CostedIngredient[];
}

/**
 * Calculates the total cost of a recipe and the individual cost of each ingredient.
 * @param recipe The recipe to calculate.
 * @param allIngredients A list of all available ingredients with their standard prices.
 * @returns An object containing the total cost and a detailed cost breakdown.
 */
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
            // Fallback for property names mismatch
            const price = ingredient.precioCompra || ingredient.standardPrice || 0;
            // Normalize ingredient standard unit
            let ingStandardUnit = (ingredient.standardUnit || ingredient.unidadCompra || '').toLowerCase();

            // Normalization Map
            const NORMALIZE: { [key: string]: string } = {
                'litro': 'l', 'litros': 'l', 'lt': 'l', 'l': 'l',
                'ml': 'ml', 'mililitro': 'ml', 'mililitros': 'ml',
                'g': 'g', 'gramo': 'g', 'gramos': 'g',
                'kg': 'kg', 'kilo': 'kg', 'kilogramo': 'kg',
                'cl': 'cl',
                'und': 'und', 'unidad': 'und', 'unidades': 'und'
            };

            ingStandardUnit = NORMALIZE[ingStandardUnit] || ingStandardUnit;

            // Determine the quantity of the purchase unit
            const packageSize = ingredient.standardQuantity || 1;

            const pricePerUnit = price / packageSize;

            if (price > 0) {
                let cantidad = lineItem.cantidad;
                let itemUnidad = lineItem.unidad.toLowerCase();
                // Normalize recipe item unit too
                itemUnidad = NORMALIZE[itemUnidad] || itemUnidad;

                // Convert recipe unit to ingredient standard unit (e.g. cl -> ml)
                if (itemUnidad !== ingStandardUnit) {
                    // Direct conversion using table
                    if (UNIT_CONVERSIONS[itemUnidad] && UNIT_CONVERSIONS[itemUnidad].to === ingStandardUnit) {
                        cantidad = cantidad * UNIT_CONVERSIONS[itemUnidad].factor;
                    }
                    // Manual fallbacks for common mismatched directions
                    else if (ingStandardUnit === 'l' && (itemUnidad === 'ml' || itemUnidad === 'g')) cantidad = cantidad / 1000;
                    else if (ingStandardUnit === 'l' && itemUnidad === 'cl') cantidad = cantidad / 100;
                    else if (ingStandardUnit === 'ml' && itemUnidad === 'l') cantidad = cantidad * 1000;
                    else if (ingStandardUnit === 'ml' && itemUnidad === 'cl') cantidad = cantidad * 10;
                    else if (ingStandardUnit === 'kg' && (itemUnidad === 'g' || itemUnidad === 'ml')) cantidad = cantidad / 1000;
                    else if (ingStandardUnit === 'g' && (itemUnidad === 'kg' || itemUnidad === 'l')) cantidad = cantidad * 1000;

                    // Handle 'Und' when Recipe asks for 'ml'/'g' (e.g. 90ml Pure -> 1 Und Bottle)
                    else if ((ingStandardUnit === 'und' || ingStandardUnit === 'botella') && (['ml', 'cl', 'l', 'g', 'kg', 'oz'].includes(itemUnidad))) {
                        // 1. Try to guess bottle size from Name (e.g. "Pure Maracuya 1kg" or "Ron 700ml")
                        let bottleSizeMl = 1000; // Default to 1L/1Kg if unknown (Standard Bar Prep/Pack size)

                        const nameLower = ingredient.nombre.toLowerCase();
                        const sizeMatch = nameLower.match(/(\d+)\s?(ml|cl|l|g|kg)/);
                        if (sizeMatch) {
                            const val = parseFloat(sizeMatch[1]);
                            const unit = sizeMatch[2];
                            if (unit === 'l' || unit === 'kg') bottleSizeMl = val * 1000;
                            else if (unit === 'cl') bottleSizeMl = val * 10;
                            else bottleSizeMl = val;
                        } else {
                            // If no size in name, check heuristics
                            if (nameLower.includes('750')) bottleSizeMl = 750;
                            else if (nameLower.includes('700')) bottleSizeMl = 700;
                            // Fruits often != 1L. 
                            else if (nameLower.includes('limon') || nameLower.includes('lima') || nameLower.includes('naranja')) {
                                bottleSizeMl = 50; // Approx juice yield? Dangerous assumption but better than 1L cost.
                                // Actually, for fruits, usually Und is price per fruit. 1 Naranja = 100ml juice? 
                                // Let's keep 1000 for packs, but maybe warn?
                                // Optimization: Leave as 1000 for now to avoid underselling cost (overestimating is safer) unless it's obviously a fruit.
                            }
                        }

                        // Convert Recipe Qty to ml/g
                        let recipeQtyMl = cantidad;
                        if (itemUnidad === 'l' || itemUnidad === 'kg') recipeQtyMl = cantidad * 1000;
                        else if (itemUnidad === 'cl') recipeQtyMl = cantidad * 10;
                        else if (itemUnidad === 'oz') recipeQtyMl = cantidad * 30;

                        // Fraction of bottle used
                        cantidad = recipeQtyMl / bottleSizeMl;
                    }
                    else {
                        // console.warn(`Cannot convert ${itemUnidad} to ${ingStandardUnit}`);
                    }
                }

                itemCost = cantidad * pricePerUnit;
            }
        }

        costoPorIngrediente.push({ ...lineItem, costo: itemCost });
        costoTotal += itemCost;
    }

    return { costoTotal, costoPorIngrediente };
};

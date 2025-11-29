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

        if (ingredient && ingredient.standardPrice) {
            let cantidad = lineItem.cantidad;
            let unidad = lineItem.unidad.toLowerCase();

            // Convert units if necessary
            if (unidad !== ingredient.standardUnit && UNIT_CONVERSIONS[unidad]) {
                const conversion = UNIT_CONVERSIONS[unidad];
                if (conversion.to === ingredient.standardUnit) {
                    cantidad = cantidad * conversion.factor;
                } else {
                    console.warn(`Cannot convert ${unidad} to ${ingredient.standardUnit} for ${ingredient.nombre}`);
                }
            }
            
            itemCost = cantidad * ingredient.standardPrice;
        }

        costoPorIngrediente.push({ ...lineItem, costo: itemCost });
        costoTotal += itemCost;
    }

    return { costoTotal, costoPorIngrediente };
};


import { Recipe, Ingredient } from '../../types';

export interface EscandalloReport {
    costo: number;
    precioVenta: number;
    baseImponible: number;
    ivaSoportado: number;
    margenBruto: number;
    rentabilidad: number;
}

export interface EscandalloSignals {
    realCost: number | null;
    missingCount: number;
}

export interface EscandalloResult {
    report: EscandalloReport;
    pie: { name: string; value: number }[];
    signals: EscandalloSignals;
}

/**
 * Calculates theoretical and real costs for a recipe based on ingredients and stock prices.
 * Canonical engine for Grimorium and Escandallator.
 */
export const calculateEscandallo = (
    recipe: Recipe | null,
    salePrice: number,
    allIngredients: Ingredient[]
): EscandalloResult | null => {
    if (!recipe || salePrice < 0) return null;

    const IVA_RATE = 0.21;
    const costo = recipe.costoReceta || 0;
    const baseImponible = salePrice / (1 + IVA_RATE);
    const ivaSoportado = salePrice - baseImponible;
    const margenBruto = baseImponible - costo;
    // Prevent division by zero
    const rentabilidad = baseImponible > 0 ? (margenBruto / baseImponible) * 100 : 0;

    // --- Real Cost Calculation ---
    let realCostTotal = 0;
    let missingIngredientsCount = 0;

    if (recipe.ingredientes) {
        recipe.ingredientes.forEach((recipeIng: any) => {
            // Find stock ingredient by ID or Name
            const stockIng = allIngredients.find(i => i.id === recipeIng.id || i.nombre === recipeIng.nombre || i.nombre === recipeIng.ingredientName) as any;

            // Use averagePrice (from purchase history) or lastPrice. 
            // In Grimorium/Nexus, 'precioCompra' on Ingredient is usually the reference price. 
            // 'averageUnitCost' is calculated in StockItems.
            // For now, we reuse the logic from GrimoriumView which seemed to access 'averagePrice' or 'lastPrice' optionally existing on the ingredient object if enriched.
            // If strictly using 'allIngredients' (which are base definitions), we might need 'precioCompra'.

            // GrimoriumView logic was:
            // const price = stockIng?.averagePrice || stockIng?.lastPrice || 0;

            // Fallback to 'precioCompra' if average/last not found, assuming standard ingredient object
            const price = stockIng?.averagePrice || stockIng?.lastPrice || stockIng?.precioCompra || 0;

            if (price > 0) {
                realCostTotal += (recipeIng.cantidad || 0) * price;
            } else {
                missingIngredientsCount++;
            }
        });
    }

    // Logic: If we have no stock items for ANY ingredient (missing count > 0), Real Cost is suspect.
    // However, if total is 0 and we have missing ingredients, return null to indicate "Unknown" rather than "Free".
    const realCostFinal = (realCostTotal === 0 && missingIngredientsCount > 0) ? null : realCostTotal;

    return {
        report: {
            costo,
            precioVenta: salePrice,
            baseImponible,
            ivaSoportado,
            margenBruto,
            rentabilidad
        },
        pie: [
            { name: 'Costo', value: costo },
            { name: 'Margen', value: margenBruto },
            { name: 'IVA', value: ivaSoportado }
        ],
        signals: {
            realCost: realCostFinal,
            missingCount: missingIngredientsCount
        }
    };
};


import { CrossLayerRule, ContextHint } from './crossLayer.types';

export const evaluateMarketToRecipes: CrossLayerRule = (input) => {
    const hints: ContextHint[] = [];
    const { selectedIngredientId } = input.market;

    // Rule: "MARKET_IMPACTS_RECIPES"
    // If a selected ingredient is used in active recipes, show impact.
    if (selectedIngredientId && input.recipes.length > 0) {
        const selectedIng = input.market.ingredients.find(i => i.id === selectedIngredientId);
        if (!selectedIng) return hints;

        // Find which recipes use this ingredient
        // Match by ID OR by Name (normalized) to catch links even if IDs differ
        const normalize = (s: string) => s.toLowerCase().trim();
        const selectedName = normalize(selectedIng.nombre);

        const affectedRecipes = input.recipes.filter(r =>
            r.ingredientes?.some(ing =>
                ing.id === selectedIngredientId ||
                normalize(ing.nombre) === selectedName ||
                normalize(ing.nombre).includes(selectedName) || // Looser match for "Gin" in "Gin Tonic"
                selectedName.includes(normalize(ing.nombre))
            )
        );

        if (affectedRecipes.length > 0) {
            // Calculate total impact or relevance
            // For now, simple count
            const count = affectedRecipes.length;
            const isHighImpact = count >= 3;

            hints.push({
                id: 'MARKET_IMPACTS_RECIPES',
                message: `Este producto se utiliza en ${count} receta${count > 1 ? 's' : ''} activa${count > 1 ? 's' : ''}.`,
                type: 'info',
                relevance: isHighImpact ? 0.9 : 0.6,
                metadata: {
                    recipeIds: affectedRecipes.map(r => r.id),
                    recipeNames: affectedRecipes.map(r => r.nombre)
                }
            });
        } else {
            // Rule: "CROSS_LAYER_MARKET_ONLY"
            hints.push({
                id: 'MARKET_UNUSED',
                message: `Producto presente en Market pero no utilizado en ninguna receta activa.`,
                type: 'info',
                relevance: 0.3
            });
        }
    }

    return hints;
};

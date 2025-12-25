import { Ingredient, Recipe } from '../types';
import { calculateRecipeCost } from '../modules/costing/costCalculator';

export interface IngredientLineItem {
    ingredientId: string | null;
    nombre: string; // The ingredient name from CSV
    cantidad: number;
    unidad: string;
}

export interface ParsedRecipeResult {
    recipeName: string;
    ingredients: IngredientLineItem[];
}

/**
 * Parses a CSV string into structured Recipe data.
 * Expected format: recipe_name, ingredient, quantity, unit
 * Header row is optional but recommended to be skipped by caller if present.
 */
export const parseCsvRecipes = (csvText: string, allIngredients: Ingredient[]): { recipes: Partial<Recipe>[], newIngredients: string[] } => {
    const lines = csvText.split('\n');
    const recipeMap = new Map<string, IngredientLineItem[]>();
    const newIngredientsSet = new Set<string>();

    // Normalize existing ingredients for matching (lowercase, trimmed)
    const ingredientMap = new Map<string, string>(); // name -> id
    allIngredients.forEach(ing => {
        ingredientMap.set(ing.nombre.toLowerCase().trim(), ing.id);
    });

    for (const line of lines) {
        if (!line.trim()) continue;

        // Handle CSV splitting (comma or semicolon)
        const separator = line.includes(';') ? ';' : ',';
        const cols = line.split(separator);

        if (cols.length < 2) continue; // Minimum: Recipe Name, Ingredient

        const recipeName = cols[0].trim();
        const ingredientName = cols[1].trim();
        const quantity = parseFloat(cols[2]?.replace(',', '.') || '0');
        const unit = cols[3]?.trim() || 'und';

        // Skip header if detected (heuristic)
        if (recipeName.toLowerCase() === 'recipe_name' || recipeName.toLowerCase() === 'nombre receta') continue;

        if (!recipeName || !ingredientName) continue;

        // Find match
        let ingredientId: string | null = null;
        const normalizedIngName = ingredientName.toLowerCase().trim();

        if (ingredientMap.has(normalizedIngName)) {
            ingredientId = ingredientMap.get(normalizedIngName)!;
        } else {
            newIngredientsSet.add(ingredientName);
        }

        const lineItem: IngredientLineItem = {
            ingredientId,
            nombre: ingredientName,
            cantidad: quantity,
            unidad: unit
        };

        if (!recipeMap.has(recipeName)) {
            recipeMap.set(recipeName, []);
        }
        recipeMap.get(recipeName)!.push(lineItem);
    }

    // Convert Map to Recipes
    const recipes: Partial<Recipe>[] = [];

    recipeMap.forEach((lines, name) => {
        const recipe: Partial<Recipe> = {
            nombre: name,
            categorias: ['Importado'],
            ingredientes: lines,
            preparacion: '',
            garnish: '',
            ingredientesTexto: lines.map(l => `${l.cantidad} ${l.unidad} ${l.nombre}`).join('\n')
        };

        // Cost calculation
        // Note: Can only calculate correctly if ingredients match existing ones with prices.
        const { costoTotal } = calculateRecipeCost(recipe, allIngredients);
        recipe.costoReceta = costoTotal;

        recipes.push(recipe);
    });

    return {
        recipes,
        newIngredients: Array.from(newIngredientsSet)
    };
};

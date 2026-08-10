import { Recipe, Ingredient, IngredientLineItem } from '../../types';

/**
 * ¿El coste de esta receta se apoya en datos sin verificar?
 *
 * Los ingredientes creados con el alta exprés llevan `pendienteRevision`: su
 * precio es **una estimación tecleada para poder cerrar la receta**, no un
 * precio de catálogo. Hasta ahora esa marca era solo visual y el número
 * estimado entraba en el escandallo, en el margen y en el valor de inventario
 * exactamente igual que uno real.
 *
 * Un coste que no distingue lo medido de lo supuesto es peor que no tener
 * coste: parece que sabes, y no sabes.
 *
 * **No cambia ningún cálculo.** Solo dice de qué se está fabricando el número,
 * para que la interfaz pueda decir «estimado» en vez de afirmar sin más.
 */

/** Recorre las líneas de una receta expandiendo sub-recetas referenciadas. */
const recorrerLineas = (
    recipe: Partial<Recipe> | undefined,
    allRecipes: Recipe[],
    visitadas: Set<string>,
    salida: IngredientLineItem[],
): void => {
    if (!recipe) return;
    if (recipe.id) {
        if (visitadas.has(recipe.id)) return;   // guarda anti-ciclos
        visitadas.add(recipe.id);
    }
    for (const linea of ((recipe.ingredientes || []) as IngredientLineItem[])) {
        salida.push(linea);
        if (linea?.subItems?.length) {
            recorrerLineas({ ingredientes: linea.subItems } as any, allRecipes, visitadas, salida);
        }
        if (linea?.subRecipeId) {
            const ref = allRecipes.find(r => r.id === linea.subRecipeId);
            if (ref) recorrerLineas(ref, allRecipes, visitadas, salida);
        }
    }
};

/**
 * Nombres de los ingredientes sin verificar de los que depende esta receta,
 * sub-recetas y garnish incluidos. Vacío = el coste se apoya solo en catálogo.
 */
export const ingredientesSinVerificar = (
    recipe: Partial<Recipe> | undefined,
    allIngredients: Ingredient[],
    allRecipes: Recipe[] = [],
): string[] => {
    if (!recipe) return [];

    const lineas: IngredientLineItem[] = [];
    recorrerLineas(recipe, allRecipes, new Set(), lineas);

    const porId = new Map(allIngredients.filter(i => i?.id).map(i => [i.id, i]));
    const nombres = new Set<string>();

    for (const l of lineas) {
        if (!l?.ingredientId) continue;
        const ing = porId.get(l.ingredientId);
        if (ing?.pendienteRevision) nombres.add(ing.nombre || 'Sin nombre');
    }
    return Array.from(nombres);
};

/** Atajo para cuando solo importa el sí o el no. */
export const costeEsEstimado = (
    recipe: Partial<Recipe> | undefined,
    allIngredients: Ingredient[],
    allRecipes: Recipe[] = [],
): boolean => ingredientesSinVerificar(recipe, allIngredients, allRecipes).length > 0;

import { Ingredient, IngredientLineItem } from '../../../types';

/**
 * Normalizes a string for fuzzy matching (lowercase, no accents, trimmed).
 * @param str The string to normalize.
 * @returns The normalized string.
 */
const normalize = (str: string) => 
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/**
 * Parses a single ingredient line from the PDF text.
 * e.g., "60ml Ron Blanco" -> { cantidad: 60, unidad: 'ml', nombre: 'Ron Blanco' }
 * @param line The raw ingredient line.
 * @returns A structured representation of the ingredient line.
 */
const parseIngredientLine = (line: string): Omit<IngredientLineItem, 'ingredientId'> => {
    const regex = /([\d.,]+)\s*([a-zA-Z]+)?\s*(.*)/;
    const match = line.match(regex);
  
    if (match) {
      const cantidad = parseFloat(match[1].replace(',', '.')) || 0;
      const unidad = match[2] || 'und';
      const nombre = match[3].trim();
      return { nombre, cantidad, unidad };
    }
  
    return { nombre: line.trim(), cantidad: 1, unidad: 'und' };
};

export interface MatchedIngredientResult {
    lineItems: IngredientLineItem[];
    ingredientsToCreate: Omit<Ingredient, 'id'>[];
}

/**
 * Matches ingredients from a recipe's text block against an existing ingredient list.
 * If an ingredient is not found, it's marked for creation.
 * 
 * @param ingredientesTexto The raw text block for a recipe's ingredients.
 * @param allIngredients The list of all existing ingredients in the Grimorio.
 * @returns An object containing the final line items and a list of new ingredients to create.
 */
export const matchIngredients = (
  ingredientesTexto: string,
  allIngredients: Ingredient[]
): MatchedIngredientResult => {
  
  const lineItems: IngredientLineItem[] = [];
  const ingredientsToCreate: Omit<Ingredient, 'id'>[] = [];
  const existingIngredientsNormalized = allIngredients.map(ing => ({ ...ing, normalizedName: normalize(ing.nombre) }));
  const createdCache = new Set<string>();

  const lines = ingredientesTexto.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    const parsedLine = parseIngredientLine(line.replace(/^-/, '').trim());
    const normalizedName = normalize(parsedLine.nombre);

    // 1. Find by exact normalized match
    let found = existingIngredientsNormalized.find(ing => ing.normalizedName === normalizedName);

    // 2. Find by partial match if no exact match
    if (!found) {
        found = existingIngredientsNormalized.find(ing => ing.normalizedName.includes(normalizedName) || normalizedName.includes(ing.normalizedName));
    }

    if (found) {
      lineItems.push({
        ...parsedLine,
        ingredientId: found.id,
      });
    } else {
      lineItems.push({
        ...parsedLine,
        ingredientId: null, // Placeholder, will be filled after creation
      });
      
      if (!createdCache.has(normalizedName)) {
        ingredientsToCreate.push({
          nombre: parsedLine.nombre,
          categoria: 'Importado', // Default category
          precioCompra: 0,
          unidadCompra: parsedLine.unidad,
          standardUnit: parsedLine.unidad as any,
          standardQuantity: 1,
          standardPrice: 0,
        });
        createdCache.add(normalizedName);
      }
    }
  }

  return { lineItems, ingredientsToCreate };
};

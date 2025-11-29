import { Ingredient, Recipe } from '../../types';
import { parseIngredient } from '../modules/ingredients/ingredientParser';
import { findBestMatch } from '../modules/ingredients/ingredientMatcher';
import { calculateRecipeCost } from '../modules/costing/costCalculator';

// Tipos de datos que necesita el módulo
export interface IngredientLineItem {
  ingredientId: string | null;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface RecipeFirestore {
  nombre: string;
  categorias: string[];
  ingredientes: IngredientLineItem[];
  ingredientesTexto: string;
  preparacion: string;
  garnish: string;
  imageUrl?: string;
}

/**
 * Parsea un bloque de texto que representa una única receta.
 * Esta versión se centra solo en extraer los bloques de texto.
 * La lógica de ingredientes se manejará en la función principal.
 */
export const parseRecipeTextBlock = (text: string): Partial<RecipeFirestore> | null => {
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const recipe: Partial<RecipeFirestore> = {};
  let currentSection: 'nombre' | 'categorias' | 'ingredientes' | 'preparacion' | 'garnish' | null = null;
  let ingredientsText = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.startsWith('[Nombre]')) {
      recipe.nombre = trimmedLine.replace('[Nombre]', '').trim();
      currentSection = null;
    } else if (trimmedLine.startsWith('[Categorias]')) {
      const cats = trimmedLine.replace('[Categorias]', '').trim();
      recipe.categorias = cats.split(',').map(c => c.trim());
      currentSection = null;
    } else if (trimmedLine.startsWith('[Ingredientes]')) {
      currentSection = 'ingredientes';
    } else if (trimmedLine.startsWith('[Preparacion]')) {
      currentSection = 'preparacion';
      recipe.preparacion = '';
    } else if (trimmedLine.startsWith('[Garnish]')) {
      currentSection = 'garnish';
      recipe.garnish = '';
    } else if (currentSection) {
      switch (currentSection) {
        case 'ingredientes':
          if (trimmedLine.startsWith('-')) {
            ingredientsText += trimmedLine + '\n';
          }
          break;
        case 'preparacion':
          recipe.preparacion += trimmedLine + '\n';
          break;
        case 'garnish':
          recipe.garnish += trimmedLine + '\n';
          break;
      }
    }
  }

  recipe.ingredientesTexto = ingredientsText.trim();
  if (recipe.preparacion) recipe.preparacion = recipe.preparacion.trim();
  if (recipe.garnish) recipe.garnish = recipe.garnish.trim();

  return recipe.nombre ? recipe : null;
};


/**
 * Parsea un archivo TXT completo, procesa ingredientes con el sistema PRO,
 * y devuelve recetas listas para guardar. NO crea ingredientes nuevos.
 */
export const parseMultipleRecipes = (txt: string, allIngredients: Ingredient[]): RecipeFirestore[] => {
  const recipeBlocks = txt.split('---').filter(block => block.trim().length > 0);
  const finalRecipes: RecipeFirestore[] = [];

  for (const block of recipeBlocks) {
    const parsedRecipe = parseRecipeTextBlock(block);
    if (!parsedRecipe) continue;

    const ingredientLines = (parsedRecipe.ingredientesTexto || '').split('\n');
    const lineItems: IngredientLineItem[] = [];

    for (const line of ingredientLines) {
      if (!line.trim()) continue;
      
      const parsedIngredient = parseIngredient(line);
      const bestMatch = findBestMatch(parsedIngredient, allIngredients);

      lineItems.push({
        ingredientId: bestMatch ? bestMatch.id : null,
        nombre: parsedIngredient.nombreBase, // Usamos el nombre base normalizado
        cantidad: parsedIngredient.cantidad,
        unidad: parsedIngredient.unidad,
      });
    }

    const finalRecipe: Partial<Recipe> = {
      ...parsedRecipe,
      ingredientes: lineItems,
    };

    // Auto-calculate cost upon import
    const { costoTotal } = calculateRecipeCost(finalRecipe, allIngredients);
    finalRecipe.costoReceta = costoTotal;
    
    finalRecipes.push(finalRecipe as RecipeFirestore);
  }
  
  return finalRecipes;
};

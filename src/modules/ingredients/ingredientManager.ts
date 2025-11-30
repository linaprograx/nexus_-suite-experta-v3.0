import { Ingredient } from '../../../types';
import { normalizeText as normalize } from './ingredientNormalizer';
import { classifyIngredient, AromaticFamily } from './families';
import { resolveAlias } from './aliases';
import { generateDerivatives } from './derivatives';

export interface ResolvedIngredient {
    nombre: string;
    familia: AromaticFamily;
    alias: string;
    derivados: Omit<Ingredient, 'id'>[];
}

/**
 * Normalizes an ingredient name by resolving its alias and cleaning the text.
 * @param name The raw ingredient name.
 * @returns A cleaned, canonical name.
 */
export const normalizeIngredient = (name: string): string => {
    const aliased = resolveAlias(name);
    return normalize(aliased);
};

/**
 * Provides a complete analysis of an ingredient, including its family, aliases, and derivatives.
 * @param ingredient The base ingredient to resolve.
 * @returns A ResolvedIngredient object with the full analysis.
 */
export const resolveIngredient = (ingredient: Ingredient): ResolvedIngredient => {
    const familia = classifyIngredient(ingredient.nombre);
    const derivados = generateDerivatives(ingredient);
    
    return {
        nombre: ingredient.nombre,
        familia,
        alias: resolveAlias(ingredient.nombre),
        derivados,
    };
};

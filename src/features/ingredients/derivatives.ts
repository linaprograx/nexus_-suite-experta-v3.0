import { Ingredient } from '../../../types';
import { AromaticFamily, classifyIngredient } from './families';

type DerivativeRule = (base: Ingredient) => Omit<Ingredient, 'id'> | null;

const DERIVATIVE_RULES: { [key in AromaticFamily]?: DerivativeRule[] } = {
    'Citrus': [
        (base) => ({
            ...base,
            nombre: `Zumo de ${base.nombre}`,
            // Cost assumption: Yield is ~30% for juice, price remains similar per unit of fruit
            standardPrice: base.standardPrice / 0.3, 
            standardUnit: 'ml',
            standardQuantity: 1, // Placeholder
            unidadCompra: 'ml', // Placeholder
        }),
        (base) => ({
            ...base,
            nombre: `Twist de ${base.nombre}`,
            standardPrice: base.standardPrice * 0.1, // Small cost for a twist
            standardUnit: 'und',
            standardQuantity: 1,
            unidadCompra: 'und',
        }),
    ],
    'Fruits': [
        (base) => ({
            ...base,
            nombre: `Pure de ${base.nombre}`,
            standardPrice: base.standardPrice * 1.2, // Slight increase for processing
            standardUnit: 'g',
            standardQuantity: 1,
            unidadCompra: 'g',
        }),
    ],
    'Herbs': [
        (base) => ({
            ...base,
            nombre: `Sirope de ${base.nombre}`,
            standardPrice: (base.standardPrice / 10) + 2, // Base cost + sugar cost (approx)
            standardUnit: 'ml',
            standardQuantity: 1,
            unidadCompra: 'ml',
        }),
    ],
};

/**
 * Generates a list of potential derivative ingredients from a base ingredient.
 * @param baseIngredient The ingredient to generate derivatives from.
 * @returns An array of new Ingredient objects (without id).
 */
export const generateDerivatives = (baseIngredient: Ingredient): Omit<Ingredient, 'id'>[] => {
    const family = classifyIngredient(baseIngredient.nombre);
    const rules = DERIVATIVE_RULES[family];
    
    if (!rules) {
        return [];
    }

    return rules.map(rule => rule(baseIngredient)).filter(Boolean) as Omit<Ingredient, 'id'>[];
};

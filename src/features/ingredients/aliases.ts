import { normalizeText } from './ingredientNormalizer';

const ALIAS_MAP: { [key: string]: string } = {
    'limon': 'Limon',
    'lemon': 'Limon',
    'lemon juice': 'Zumo de Limon',
    'zumo limon': 'Zumo de Limon',
    'lima': 'Lima',
    'lime': 'Lima',
    'lime juice': 'Zumo de Lima',
    'zumo lima': 'Zumo de Lima',
    'naranja': 'Naranja',
    'orange': 'Naranja',
    'orange juice': 'Zumo de Naranja',
    'zumo naranja': 'Zumo de Naranja',
    'azucar': 'Azucar',
    'sugar': 'Azucar',
};

/**
 * Resolves an ingredient name to its canonical form using a dictionary of aliases.
 * If no alias is found, it returns the original name.
 * @param ingredientName The name to resolve.
 * @returns The resolved, canonical ingredient name.
 */
export const resolveAlias = (ingredientName: string): string => {
    const normalized = normalizeText(ingredientName).trim();
    return ALIAS_MAP[normalized] || ingredientName;
};

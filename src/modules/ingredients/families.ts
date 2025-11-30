import { normalizeText } from './ingredientNormalizer';

export type AromaticFamily = 'Citrus' | 'Fruits' | 'Herbs' | 'Spices' | 'Floral' | 'Vegetal' | 'Toasted' | 'Umami' | 'Sweeteners' | 'Fermented' | 'Alcohol Base' | 'Bitters' | 'Syrups' | 'Cordials' | 'Infusions' | 'Unknown';

const FAMILY_KEYWORDS: { [key in AromaticFamily]: string[] } = {
    'Citrus': ['limon', 'lima', 'naranja', 'pomelo', 'bergamota', 'yuzu', 'mandarina', 'citron'],
    'Fruits': ['fresa', 'frambuesa', 'mora', 'arandano', 'manzana', 'pera', 'uva', 'platano', 'mango', 'piña', 'coco', 'maracuya', 'melocoton'],
    'Herbs': ['menta', 'hierbabuena', 'albahaca', 'romero', 'tomillo', 'salvia', 'cilantro', 'perejil', 'eneldo'],
    'Spices': ['canela', 'clavo', 'nuez moscada', 'anís', 'cardamomo', 'jengibre', 'pimienta', 'vainilla'],
    'Floral': ['rosa', 'lavanda', 'hibisco', 'jazmin', 'violeta', 'azahar', 'sambuco'],
    'Vegetal': ['pepino', 'apio', 'pimiento', 'tomate', 'zanahoria', 'remolacha'],
    'Toasted': ['cafe', 'cacao', 'chocolate', 'almendra', 'avellana', 'nuez', 'caramelo', 'toffee'],
    'Umami': ['seta', 'trufa', 'alga', 'kombu', 'soja', 'miso'],
    'Sweeteners': ['azucar', 'miel', 'agave', 'sirope', 'jarabe'],
    'Fermented': ['vino', 'cerveza', 'sidra', 'kombucha', 'chicha'],
    'Alcohol Base': ['ron', 'whisky', 'bourbon', 'ginebra', 'gin', 'vodka', 'tequila', 'mezcal', 'pisco', 'brandy', 'cognac'],
    'Bitters': ['angostura', 'bitter', 'amargo'],
    'Syrups': ['sirope', 'jarabe', 'syrup'],
    'Cordials': ['cordial'],
    'Infusions': ['infusion', 'te'],
    'Unknown': [],
};

/**
 * Classifies an ingredient name into an aromatic family.
 * @param ingredientName The name of the ingredient.
 * @returns The AromaticFamily for the ingredient.
 */
export const classifyIngredient = (ingredientName: string): AromaticFamily => {
    const normalized = normalizeText(ingredientName);

    for (const [family, keywords] of Object.entries(FAMILY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                return family as AromaticFamily;
            }
        }
    }
    return 'Unknown';
};

import { normalizeIngredientLine, cleanIngredientName } from './ingredientNormalizer';

export interface ParsedIngredient {
  cantidad: number;
  unidad: string;
  nombreBase: string;
  nota: string | null;
  original: string;
}

const UNITS_REGEX = 'ml|g|gr|kg|l|lt|litro|oz|lb|und|unid|unidad|botella|dash|dashes|slice|rodaja|pieza|hoja|tsp|tbsp|cl';

/**
 * Parses a single raw ingredient line into a structured object.
 * Handles formats like: '50ml Ron', 'Ron 50ml', '1/2 und Lima'.
 *
 * @param line The raw ingredient string.
 * @returns A ParsedIngredient object.
 */
export const parseIngredient = (line: string): ParsedIngredient => {
  const normalizedLine = normalizeIngredientLine(line);

  // Regex to capture (number) (unit) (name) or (name) (number) (unit)
  const regex = new RegExp(`^([\\d./]+)?\\s*(${UNITS_REGEX})?\\s*(.*?)\\s*([\\d./]+)?\\s*(${UNITS_REGEX})?$`);
  const match = normalizedLine.match(regex);

  if (!match) {
    const { name, note } = cleanIngredientName(line);
    return { cantidad: 1, unidad: 'und', nombreBase: name, nota: note, original: line };
  }

  const cantidadStr = match[1] || match[4] || '1';
  const unidadRaw = match[2] || match[5] || 'und';
  let nombreRaw = (match[3] || '').trim();

  let cantidad = parseFloat(cantidadStr);
  if (isNaN(cantidad)) { // Handle cases like "1/2" that aren't auto-parsed
    try {
      // eslint-disable-next-line no-eval
      cantidad = eval(cantidadStr);
    } catch (e) {
      cantidad = 1;
    }
  }

  // If the name part is empty, it means the unit was probably part of the name
  if (!nombreRaw && unidadRaw !== 'und') {
    nombreRaw = unidadRaw;
  }

  const { name: nombreBase, note } = cleanIngredientName(nombreRaw || line);

  return {
    cantidad,
    unidad: unidadRaw,
    nombreBase,
    nota: note,
    original: line,
  };
};

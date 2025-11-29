/**
 * A map of unicode fractions to their decimal equivalents.
 */
const FRACTION_MAP: { [key: string]: number } = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1/6,
  '⅚': 5/6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

/**
 * Converts unicode fraction characters in a string to their decimal representation.
 * @param text The input string.
 * @returns The string with fractions converted to decimals.
 */
export const convertFractions = (text: string): string => {
  return text.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (char) => FRACTION_MAP[char].toString());
};

/**
 * Removes accents and converts the string to lowercase.
 * @param text The input string.
 * @returns The accent-free, lowercase string.
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Capitalizes the first letter of each word in a string.
 * @param text The input string.
 * @returns The capitalized string.
 */
export const capitalize = (text: string): string => {
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * A set of irrelevant keywords to be extracted as notes.
 */
const NOTE_KEYWORDS = new Set(['fresh', 'zumo', 'juice', 'fresco', 'clarificado', 'clarificada']);

/**
 * Cleans the base name of an ingredient and extracts notes.
 * e.g., "Zumo de Lima Fresco" -> { name: "Lima", note: "zumo fresco" }
 * @param text The raw ingredient name.
 * @returns An object containing the cleaned name and any extracted notes.
 */
export const cleanIngredientName = (text: string): { name: string; note: string | null } => {
  const words = normalizeText(text).split(' ').filter(w => w.length > 0);
  const notes: string[] = [];
  
  const baseWords = words.filter(word => {
    if (NOTE_KEYWORDS.has(word)) {
      notes.push(word);
      return false;
    }
    return true;
  });

  // Further cleaning common prepositions if they are at the start
  let finalName = baseWords.join(' ');
  if (finalName.startsWith('de ')) {
      finalName = finalName.substring(3);
  }

  return {
    name: capitalize(finalName.replace(/s$/, '')), // Simple singularization
    note: notes.length > 0 ? notes.join(' ') : null,
  };
};

/**
 * A comprehensive normalization pipeline for an ingredient line.
 * @param line The raw ingredient string.
 * @returns A fully cleaned and normalized string.
 */
export const normalizeIngredientLine = (line: string): string => {
    let processedLine = line;
    processedLine = convertFractions(processedLine);
    processedLine = normalizeText(processedLine);
    processedLine = processedLine.replace(/\s+/g, ' ').trim(); // Consolidate whitespace
    return processedLine;
}

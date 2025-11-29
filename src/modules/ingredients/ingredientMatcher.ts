import { Ingredient } from '../../../types';
import { ParsedIngredient } from './ingredientParser';
import { normalizeText } from './ingredientNormalizer';

/**
 * Calculates the Levenshtein distance between two strings, a measure of their difference.
 * @param s1 The first string.
 * @param s2 The second string.
 * @returns The Levenshtein distance.
 */
const levenshtein = (s1: string, s2: string): number => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = new Array(s2.length + 1);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Calculates a similarity score between 0 and 1 for two strings.
 * @param s1 The first string.
 * @param s2 The second string.
 * @returns The similarity score.
 */
const calculateSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, shorter)) / parseFloat(longer.length.toString());
};

const MIN_SIMILARITY = 0.7; // 70% similarity threshold

/**
 * Finds the best match for a parsed ingredient from a list of existing ingredients.
 * @param parsedIngredient The ingredient parsed from the import file.
 * @param allIngredients The list of all ingredients in the database.
 * @returns The matched Ingredient object or null if no suitable match is found.
 */
export const findBestMatch = (
  parsedIngredient: ParsedIngredient,
  allIngredients: Ingredient[]
): Ingredient | null => {
  const normalizedParsedName = normalizeText(parsedIngredient.nombreBase);
  let bestMatch: Ingredient | null = null;
  let highestSimilarity = 0;

  for (const existing of allIngredients) {
    const normalizedExistingName = normalizeText(existing.nombre);
    const similarity = calculateSimilarity(normalizedParsedName, normalizedExistingName);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = existing;
    }
  }

  if (highestSimilarity >= MIN_SIMILARITY) {
    return bestMatch;
  }

  return null;
};

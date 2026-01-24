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
/**
 * Finds the best match for a parsed ingredient from a list of existing ingredients.
 * Uses multiple strategies: Exact, Substring, Token Overlap, and Levenshtein.
 * @param parsedIngredient The ingredient parsed from the import file.
 * @param allIngredients The list of all ingredients in the database.
 * @returns The matched Ingredient object or null if no suitable match is found.
 */
export const findBestMatch = (
  parsedIngredient: ParsedIngredient,
  allIngredients: Ingredient[]
): Ingredient | null => {
  const normalizedParsedName = normalizeText(parsedIngredient.nombreBase);
  const parsedTokens = normalizedParsedName.split(' ').filter(t => t.length > 2); // Ignore small words like 'de', 'la'

  let bestMatch: Ingredient | null = null;
  let highestScore = 0;

  for (const existing of allIngredients) {
    const normalizedExistingName = normalizeText(existing.nombre);
    const existingTokens = normalizedExistingName.split(' ').filter(t => t.length > 2);

    let score = 0;

    // Strategy 1: Exact Match (Normalized)
    if (normalizedParsedName === normalizedExistingName) {
      return existing; // Immediate return for exact match
    }

    // Strategy 2: Substring Match
    // If the existing ingredient is "Naranja" and parsed is "Piel de Naranja", this refers to Naranja.
    // We prioritize cases where existing name is inside parsed name.
    if (normalizedParsedName.includes(normalizedExistingName)) {
      // Base score 0.85. 
      // Penalize if the existing name is very short relative to parsed (e.g. "Tea" inside "Tear drop") - edge case.
      // But for ingredients, usually good.
      score = Math.max(score, 0.85);
    }

    // Strategy 3: Token Overlap & Fuzzy Token
    // "Maker's Mars" vs "Maker's Mark"
    let matchingTokens = 0;
    for (const pToken of parsedTokens) {
      for (const eToken of existingTokens) {
        if (pToken === eToken) {
          matchingTokens++;
        } else if (levenshtein(pToken, eToken) <= 1 && pToken.length > 3) {
          // Fuzzy token match (typo tolerance)
          matchingTokens++;
        }
      }
    }

    if (existingTokens.length > 0) {
      const tokenScore = (matchingTokens / existingTokens.length) * 0.9;
      // If we matched all tokens of existing ingredient, that's strong.
      // e.g. "Makers" "Mark" (2 tokens). Matched 1 (Makers). Score 0.45.
      // Matched "Mars" vs "Mark" via levenshtein -> 2 matches. Score 0.9.
      score = Math.max(score, tokenScore);
    }

    // Strategy 4: Raw Levenshtein (Visual Similarity)
    const levenSim = calculateSimilarity(normalizedParsedName, normalizedExistingName);
    score = Math.max(score, levenSim);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = existing;
    }
  }

  // Lower threshold slightly to allow for "Maker's Mars" -> "Maker's Mark" variations
  // But keep it high enough to avoid "Vodka" -> "Soda"
  if (highestScore >= 0.65) {
    return bestMatch;
  }

  return null;
};

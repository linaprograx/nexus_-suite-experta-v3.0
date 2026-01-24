import { Recipe } from '../../../types';

/**
 * Normalizes a string for fuzzy matching.
 */
export const normalizeName = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
};

/**
 * Calculates the Levenshtein distance between two strings.
 */
const levenshtein = (s1: string, s2: string): number => {
  const costs = new Array(s2.length + 1);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Calculates a similarity score between 0 and 1.
 */
const calculateSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, s2)) / longer.length;
};

/**
 * Guesses the best image for a given recipe from a list of image names.
 */
export const guessImageForRecipe = (
  recipeName: string,
  imageList: string[]
): string | null => {
  const normalizedRecipeName = normalizeName(recipeName);
  let bestMatch: string | null = null;
  let highestSimilarity = 0;

  for (const imageName of imageList) {
    const normalizedImageName = normalizeName(imageName);
    const similarity = calculateSimilarity(normalizedRecipeName, normalizedImageName);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = imageName;
    }
  }

  return highestSimilarity > 0.7 ? bestMatch : null;
};

/**
 * Creates a map between recipe names and their best-matched image.
 */
export const createImageMap = (
  recipes: Partial<Recipe>[],
  images: { ocrText: string, imagePath: string }[]
): Map<string, string> => {
  const imageMap = new Map<string, string>();
  const imageNames = images.map(img => img.ocrText);

  for (const recipe of recipes) {
    if (recipe.nombre) {
      const bestImageName = guessImageForRecipe(recipe.nombre, imageNames);
      if (bestImageName) {
        const imageData = images.find(img => img.ocrText === bestImageName);
        if (imageData) {
          imageMap.set(recipe.nombre, imageData.imagePath);
        }
      }
    }
  }

  return imageMap;
};

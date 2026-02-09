/**
 * @deprecated FULLY DEPRECATED - DO NOT USE
 * 
 * This file contained legacy direct browser calls to Google AI APIs,
 * which exposed API keys in the client bundle (SECURITY VULNERABILITY).
 * 
 * ✅ MIGRATION COMPLETE:
 * - Text generation → src/services/ai/textService.ts (via AI Gateway)
 * - Image generation → src/services/ai/imageService.ts (via AI Gateway)
 * - Search → src/services/ai/textService.ts:generateWithSearch()
 * 
 * This file is kept only to prevent import errors during the transition.
 * All exports throw errors to catch any remaining usage.
 */

const DEPRECATION_ERROR =
    '❌ CRITICAL: Legacy gemini.ts is fully deprecated.\n\n' +
    'This function exposed API keys in the browser bundle.\n\n' +
    'MIGRATE TO:\n' +
    '- Text: import { generateText } from "src/services/ai/textService"\n' +
    '- Images: import { generateImage } from "src/services/ai/imageService"\n' +
    '- Search: import { generateWithSearch } from "src/services/ai/textService"\n\n' +
    'All AI calls now go through the secure AI Gateway backend.';

/**
 * @deprecated Use src/services/ai/textService.ts instead
 */
export const callGeminiApi = async (...args: any[]): Promise<never> => {
    throw new Error(DEPRECATION_ERROR);
};

/**
 * @deprecated Use src/services/ai/imageService.ts instead
 */
export const generateImage = async (...args: any[]): Promise<never> => {
    throw new Error(DEPRECATION_ERROR);
};

/**
 * @deprecated Use src/services/ai/textService.ts:generateWithSearch() instead
 */
export const callGeminiApiWithSearch = async (...args: any[]): Promise<never> => {
    throw new Error(DEPRECATION_ERROR);
};

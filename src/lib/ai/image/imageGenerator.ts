
import { generateImage } from '../../../utils/gemini';

/**
 * Nexus Visual Identity AI Layer
 * Image Generator Service v2.1 (Restored Hybrid/Turbo)
 */

export const ImageGenerator = {
    /**
     * Generates a hyper-realistic image URL.
     * Strategy:
     * 1. Try Gemini "Imagen 3" (Official Key).
     * 2. Fallback to Pollinations "Turbo" (Direct Image URL).
     * 
     * @param prompt The detailed visual prompt
     * @param seed Optional seed only if deterministic results are needed
     * @returns The direct URL (or Data URL) to the generated image
     */
    generateImageUrl: async (prompt: string, seed?: number): Promise<string> => {
        const timestamp = Date.now();
        const randomSeed = seed || Math.floor(Math.random() * 1000000) + timestamp;

        // 1. Prepare Prompt
        // Truncate to avoid URL overflow in fallback, but keep enough detail
        const cleanPrompt = prompt.replace(/[*_`]/g, '').trim().slice(0, 450);
        const enhancedPrompt = `${cleanPrompt}, hyper-realistic, 8k resolution, cinematic lighting, professional photography, shallow depth of field`;

        // 2. ATTEMPT 1: REAL AI (Gemini Imagen 3)
        try {
            console.log("Attempting Gemini Imagen 3 generation...");
            const result = await generateImage(enhancedPrompt);
            const base64 = result.predictions?.[0]?.bytesBase64Encoded;
            if (base64) {
                return `data:image/png;base64,${base64}`;
            }
        } catch (geminiError) {
            console.warn("Gemini Imagen 3 failed (Auth/Quota). Switching to Fallback provider.", geminiError);
        }

        // 3. ATTEMPT 2: FALLBACK (Pollinations Turbo)
        // We use 'image.pollinations.ai' to ensure we get a binary image response, not HTML.
        // We use 'turbo' model because 'flux' is sometimes under maintenance.
        console.log("Using Fallback Provider: Pollinations (Turbo)");
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        // FORCE CACHE BUSTING: Add timestamp param 't' to URL to prevent browser/network caching of "System Upgrade" images
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=turbo&nologo=true&t=${timestamp}`;
    },

    /**
     * Generates an abstract brand graphic URL.
     */
    generateGraphicUrl: async (prompt: string, seed?: number): Promise<string> => {
        const timestamp = Date.now();
        const randomSeed = seed || Math.floor(Math.random() * 1000000) + timestamp;

        const cleanPrompt = prompt.replace(/[*_`]/g, '').trim().slice(0, 400);
        const enhancedPrompt = `${cleanPrompt}, vector style, abstract data visualization, minimal3d, behance style, premium design, 8k resolution`;

        // Same strategy: Try Real AI first, then fallback
        try {
            // We use the same generateImage helper which now targets Imagen
            const result = await generateImage(enhancedPrompt);
            const base64 = result.predictions?.[0]?.bytesBase64Encoded;
            if (base64) return `data:image/png;base64,${base64}`;
        } catch (e) {
            console.warn("Gemini Graphic Generation Failed. Falling back.", e);
        }

        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&seed=${randomSeed}&model=turbo&nologo=true&t=${timestamp}`;
    }
};

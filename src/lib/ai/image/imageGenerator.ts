import { generateImage } from '../../../utils/gemini';

/**
 * Nexus Visual Identity AI Layer
 * Image Generator Service using Gemini (Primary) and Pollinations.ai (Backup)
 */

export const ImageGenerator = {
    /**
     * Generates a hyper-realistic image URL based on a prompt.
     * Tries Gemini Imagen 3 first, falls back to Pollinations.ai (Flux).
     * 
     * @param prompt The detailed visual prompt
     * @param seed Optional seed only if deterministic results are needed (default: random)
     * @returns The direct URL (or Data URL) to the generated image
     */
    generateImageUrl: async (prompt: string, seed?: number): Promise<string> => {
        const timestamp = Date.now();
        const randomSeed = seed || Math.floor(Math.random() * 1000000) + timestamp;

        // 1. Clean and Truncate Prompt (Safe Limit)
        const cleanPrompt = prompt.replace(/[*_`]/g, '').trim().slice(0, 800); // Gemini handles longer prompts better

        // 2. Enhance for Quality
        const enhancedPrompt = `${cleanPrompt}, hyper-realistic, 8k resolution, cinematic lighting, professional photography, shallow depth of field --seed ${randomSeed}`;

        // STRATEGY: TRY REAL AI (GEMINI) FIRST
        try {
            console.log("Attemping Real AI Image Generation (Gemini)...");
            const result = await generateImage(enhancedPrompt);
            const base64 = result.predictions?.[0]?.bytesBase64Encoded;
            if (base64) {
                return `data:image/png;base64,${base64}`;
            }
            throw new Error("Gemini returned no image data");
        } catch (e) {
            console.warn("Gemini Image API Failed or Rate Limited. Falling back to Pollinations (Flux).", e);

            // FALLBACK: Pollinations (Flux)
            const fallbackPrompt = cleanPrompt.slice(0, 400); // Pollinations needs shorter prompt
            const encodedPrompt = encodeURIComponent(`${fallbackPrompt}, photorealistic, 8k --seed ${randomSeed}`);
            return `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux&nologo=true`;
        }
    },

    /**
     * Generates an abstract brand graphic URL.
     * Slightly different tuning for graphics vs photos.
     */
    generateGraphicUrl: async (prompt: string, seed?: number): Promise<string> => {
        const timestamp = Date.now();
        const randomSeed = seed || Math.floor(Math.random() * 1000000) + timestamp;

        const cleanPrompt = prompt.replace(/[*_`]/g, '').trim().slice(0, 800);
        const enhancedPrompt = `${cleanPrompt}, vector style, abstract data visualization, minimal3d, behance style, premium design, 8k resolution --seed ${randomSeed}`;

        // STRATEGY: TRY REAL AI (GEMINI) FIRST
        try {
            console.log("Attemping Real AI Graphic Generation (Gemini)...");
            const result = await generateImage(enhancedPrompt);
            const base64 = result.predictions?.[0]?.bytesBase64Encoded;
            if (base64) {
                return `data:image/png;base64,${base64}`;
            }
            throw new Error("Gemini returned no image data");
        } catch (e) {
            console.warn("Gemini Graphic API Failed. Falling back to Pollinations.", e);

            // FALLBACK: Pollinations (Flux)
            const fallbackPrompt = cleanPrompt.slice(0, 400);
            const encodedPrompt = encodeURIComponent(`${fallbackPrompt}, abstract vector graphic, 8k --seed ${randomSeed}`);
            return `https://pollinations.ai/p/${encodedPrompt}?width=800&height=800&seed=${randomSeed}&model=flux&nologo=true`;
        }
    }
};

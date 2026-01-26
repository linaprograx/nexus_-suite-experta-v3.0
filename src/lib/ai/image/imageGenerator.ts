import { generateImage as generateGeminiImage } from '../../../utils/gemini';
import { generateImage as generateVertexImage } from '../../../services/ai/imageService';
import { buildImagePrompt } from '../../../ai/promptBuilders/buildImagePrompt';
import { selectScenario, ScenarioId } from '../../../ai/presets/editorialScenarios';

/**
 * Nexus Visual Identity AI Layer
 * Image Generator Service v3.0 (Vertex Gateway + Dynamic Editorial Scenarios)
 */

// Toggle this to enable/disable the new Gateway integration
const TRY_VERTEX_GATEWAY = true;

// Toggle 'editorial' to use professional photorealistic presets, or 'free' for raw prompt
type ImageMode = 'editorial' | 'free';
const IMAGE_MODE: ImageMode = 'editorial';

export const ImageGenerator = {
    /**
     * Generates a hyper-realistic image URL.
     * Strategy:
     * 0. Vertex AI Gateway with Dynamic Scenarios
     * 1. Fallback to methods
     * 
     * @param prompt The detailed visual prompt (Subject only, or full desc)
     * @param seed Optional seed
     * @param explicitScenarioId Optional override for the scenario (e.g. 'BAR_AT_NIGHT')
     */
    generateImageUrl: async (prompt: string, seed?: number, explicitScenarioId?: ScenarioId): Promise<string> => {
        const timestamp = Date.now();
        const randomSeed = seed || Math.floor(Math.random() * 1000000) + timestamp;

        // 1. Prepare Prompt with Creative Control
        let enhancedPrompt = prompt;

        if (IMAGE_MODE === 'editorial') {
            // Intelligent Scenario Selection:
            // 1. Use explicit Override if provided
            // 2. Auto-detect from prompt keywords (night, studio, etc.)
            // 3. Default to TABLETOP_LUXE (The "Michelin" standard)
            const scenario = selectScenario(prompt, explicitScenarioId);

            console.log(`🎨 Editorial Mode: Using scenario [${scenario.id}]`);
            enhancedPrompt = buildImagePrompt(prompt, scenario);
        } else {
            // Legacy/Free mode basic cleanup
            const cleanPrompt = prompt.replace(/[*_`]/g, '').trim().slice(0, 450);
            enhancedPrompt = `${cleanPrompt}, hyper-realistic, 8k resolution, cinematic lighting, professional photography, shallow depth of field`;
        }

        // 0. ATTEMPT 0: VERTEX AI GATEWAY (Secure Backend)
        if (TRY_VERTEX_GATEWAY) {
            try {
                console.log("Attempting Vertex AI Gateway generation...");
                const vertexImageUrl = await generateVertexImage(enhancedPrompt);
                if (vertexImageUrl) {
                    return vertexImageUrl;
                }
            } catch (vertexError: any) {
                console.warn("Vertex Gateway failed. Falling back to legacy methods.", vertexError.message);
            }
        }

        // 2. ATTEMPT 1: LEGACY GEMINI (Client-side)
        try {
            console.log("Attempting Legacy Gemini Imagen 3 generation...");
            const result = await generateGeminiImage(enhancedPrompt);
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
            const result = await generateGeminiImage(enhancedPrompt);
            const base64 = result.predictions?.[0]?.bytesBase64Encoded;
            if (base64) return `data:image/png;base64,${base64}`;
        } catch (e) {
            console.warn("Gemini Graphic Generation Failed. Falling back.", e);
        }

        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&seed=${randomSeed}&model=turbo&nologo=true&t=${timestamp}`;
    }
};

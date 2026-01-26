/**
 * Nexus Suite - Prompt Builder System
 * Phase 4A: Advanced Creative Control
 */

import { ImagePreset, IMAGE_PRESETS } from '../presets/imagePresets';

const QUALITY_GUARDRAILS = [
    "no illustration",
    "no cartoon",
    "no digital art",
    "no 3D render style",
    "no painting",
    "no drawing",
    "no anime",
    "no surrealism",
    "no unrealistic colors",
    "no distorted glass",
    "no floating objects",
    "no text",
    "no watermark",
    "no logos",
    "no people",
    "no hands"
];

/**
 * Builds a strictly controlled prompt for the AI generator.
 * @param userPrompt The raw input from the user (e.g., "A mojito with mint")
 * @param presetKey The preset to apply (defaults to NEXUS_COCKTAIL_EDITORIAL)
 * @returns The final engineered prompt string
 */
export const buildImagePrompt = (
    userPrompt: string,
    presetKey: keyof typeof IMAGE_PRESETS = 'NEXUS_COCKTAIL_EDITORIAL'
): string => {
    const preset = IMAGE_PRESETS[presetKey];

    // Construct the positive prompt with strict ordering
    const positivePrompt = [
        // 1. Subject & Action (The core request)
        `Subject: ${userPrompt}.`,

        // 2. Artistic Direction from Preset
        `Style: ${preset.description}.`,
        `Glassware: ${preset.glassware}.`,
        `Background: ${preset.background}.`,
        `Lighting: ${preset.lighting}.`,

        // 3. Technical Specs
        `Camera: ${preset.camera}.`,
        `Color: ${preset.colorGrading}.`,
        `Quality: ${preset.qualityConstraints}.`,
    ].join(' ');

    // Construct the negative prompt (Guardrails)
    // Note: Some models accept a separate negative_prompt param, 
    // but for simple text-to-image prompts we often append it as exclusions.
    const negativePrompt = `Avoid: ${QUALITY_GUARDRAILS.join(", ")}.`;

    // Combine
    return `${positivePrompt} ${negativePrompt}`;
};

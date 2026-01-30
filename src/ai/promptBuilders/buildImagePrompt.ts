/**
 * Nexus Suite - Prompt Builder System
 * Phase 4A: Advanced Creative Control
 */

import { EditorialScenario } from '../presets/editorialScenarios';

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
 * Builds a strictly controlled prompt for the AI generator using Editorial Scenarios.
 * @param userPrompt The raw input from the user (e.g., "A mojito with mint")
 * @param scenario The selected editorial scenario
 * @returns The final engineered prompt string
 */
export const buildImagePrompt = (
    userPrompt: string,
    scenario: EditorialScenario
): string => {
    // Construct the positive prompt with strict ordering
    const positivePrompt = [
        // 1. Subject & Action (The core request)
        `Subject: ${userPrompt}.`,

        // 2. Artistic Direction from Scenario
        `Style: ${scenario.promptFragment.mood}.`,
        `Environment: ${scenario.promptFragment.environment}.`,
        `Lighting: ${scenario.promptFragment.lighting}.`,

        // 3. Technical Specs
        `Camera: ${scenario.promptFragment.camera}.`,
        "Quality: 8k resolution, photorealistic, cinematic depth of field, award-winning photography."
    ].join(' ');

    // Construct the negative prompt (Guardrails + Scenario Specifics)
    const constraints = [...QUALITY_GUARDRAILS, ...(scenario.negativeConstraints || [])];
    const negativePrompt = `Avoid: ${constraints.join(", ")}.`;

    // Combine
    return `${positivePrompt} ${negativePrompt}`;
};

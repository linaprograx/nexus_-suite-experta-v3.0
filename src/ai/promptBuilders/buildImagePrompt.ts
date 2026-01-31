import { EditorialScenario } from '../presets/editorialScenarios';

const MASTER_VISUAL_IDENTITY = `
CORE VISUAL IDENTITY:
• Ultra-realistic professional beverage photography (Hasselblad/Phase One style).
• Real optical physics (refraction, caustics, correct meniscus).
• High-end cocktail glassware with thin rims.
• Edible, intentional garnishes.
• Liquid translucency and natural gradients.
• NO CGI, NO 3D render look, NO illustration.
`;

const QUALITY_GUARDRAILS = [
    "illustration",
    "cartoon",
    "digital art",
    "3D render",
    "CGI",
    "painting",
    "drawing",
    "anime",
    "surrealism",
    "floating objects",
    "impossible physics",
    "fake reflections",
    "distorted glass",
    "text",
    "watermark",
    "logo",
    "people",
    "hands"
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
        // 0. Master Identity (Global Override)
        MASTER_VISUAL_IDENTITY,

        // 1. Subject & Action (The core request)
        `Subject: ${userPrompt}.`,

        // 2. Artistic Direction from Scenario
        `Style: ${scenario.promptFragment.mood}.`,
        `Environment: ${scenario.promptFragment.environment}.`,
        `Lighting: ${scenario.promptFragment.lighting}.`,

        // 3. Technical Specs (Enforcing Camera & Realism)
        `Camera: ${scenario.promptFragment.camera}.`,
        "Quality: 8k resolution, raw photo, cinematic lighting, sharp focus, beverage photography award winner."
    ].join(' ');

    // Construct the negative prompt (Guardrails + Scenario Specifics)
    const constraints = [...QUALITY_GUARDRAILS, ...(scenario.negativeConstraints || [])];
    const negativePrompt = `Avoid: ${constraints.join(", ")}.`;

    // Combine
    return `${positivePrompt} ${negativePrompt}`;
};

/**
 * Nexus Suite - Editorial Scenarios System
 * Phase 6: Advanced Photographic Contexts
 * 
 * Defines distinct photographic environments without imposing cocktail attributes.
 */

export type ScenarioId = 'TABLETOP_LUXE' | 'BAR_AT_NIGHT' | 'STUDIO_EDITORIAL' | 'CONCEPTUAL_MINIMAL';

export interface EditorialScenario {
    id: ScenarioId;
    label: string;
    internalDescription: string;
    promptFragment: {
        environment: string;
        lighting: string;
        camera: string;
        mood: string;
    };
    negativeConstraints: string[];
}

const COMMON_NEGATIVE_CONSTRAINTS = [
    "cartoon", "illustration", "CGI", "3D render", "anime",
    "surrealism", "painting", "drawing", "fake glass", "plastic texture",
    "low quality", "distorted", "watermark", "text"
];

export const EDITORIAL_SCENARIOS: Record<ScenarioId, EditorialScenario> = {
    TABLETOP_LUXE: {
        id: 'TABLETOP_LUXE',
        label: 'Michelin Dining',
        internalDescription: 'Daytime luxury restaurant ambience, window light, natural organic textures.',
        promptFragment: {
            environment: "Premium stone or fine wood tabletop surface with real projected shadows, blurred upscale restaurant interior background (bokeh depth).",
            lighting: "Natural lateral window light, soft directional shadows, no harsh flash, organic daylight feel.",
            camera: "Full-frame DSLR, 85mm portrait lens, shallow depth of field, sharp focus on subject.",
            mood: "Michelin-star culinary excellence, sophisticated, organic luxury."
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "studio background", "flat lighting", "night"]
    },

    BAR_AT_NIGHT: {
        id: 'BAR_AT_NIGHT',
        label: 'Luxury Bar Night',
        internalDescription: 'Evening service, dark ambience, warm practical lights, cinematic contrast.',
        promptFragment: {
            environment: "Dark polish bar counter surface, dim luxury speakeasy environment, warm bokeh lights in background.",
            lighting: "Low-key cinematic lighting, controlled highlights, deep shadows, moody contrast.",
            camera: "35mm or 50mm f/1.4 lens, cinematic wide aperture, rich low-light performance.",
            mood: "Exclusive night service, cinematic, intimate, premium nightlife."
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "daylight", "bright window", "white background"]
    },

    STUDIO_EDITORIAL: {
        id: 'STUDIO_EDITORIAL',
        label: 'Studio Clean',
        internalDescription: 'Neutral professional studio, magazine look, focus purely on product.',
        promptFragment: {
            environment: "Neutral professional studio setting, smooth gradient or high-quality solid texture background, no distracted environment.",
            lighting: "controlled softbox lighting, perfect rim light, even illumination, commercial photography standard.",
            camera: "100mm macro lens, f/8 for sharpness front-to-back, crisp details.",
            mood: "Clean, commercial perfection, high-end magazine editorial."
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "restaurant", "bar", "complex background", "messy"]
    },

    CONCEPTUAL_MINIMAL: {
        id: 'CONCEPTUAL_MINIMAL',
        label: 'Artistic Minimal',
        internalDescription: 'Abstract, harsh shadows, geometric composition, gallery style.',
        promptFragment: {
            environment: "Minimalist concrete or monolithic surface, stark composition, architectural background.",
            lighting: "Strong directional sunlight (hard light), crisp distinct shadows, high contrast.",
            camera: "50mm lens, sharp focus, geometric framing.",
            mood: "Avant-garde, artistic, modern gallery aesthetic, experimental."
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "clutter", "bokeh", "warm cozy"]
    }
};

/**
 * Intelligent Scenario Selection
 * @param userPrompt The original user request potentially containing mood keywords
 * @param explicitChoice Optional manual override
 */
export const selectScenario = (userPrompt: string = "", explicitChoice?: ScenarioId): EditorialScenario => {
    // 1. Explicit Choice
    if (explicitChoice && EDITORIAL_SCENARIOS[explicitChoice]) {
        return EDITORIAL_SCENARIOS[explicitChoice];
    }

    const p = userPrompt.toLowerCase();

    // 2. Keyword matching for Auto-Selection
    if (p.includes("night") || p.includes("bar") || p.includes("party") || p.includes("evening") || p.includes("dark")) {
        return EDITORIAL_SCENARIOS.BAR_AT_NIGHT;
    }

    if (p.includes("studio") || p.includes("white") || p.includes("isolated") || p.includes("product") || p.includes("clean")) {
        return EDITORIAL_SCENARIOS.STUDIO_EDITORIAL;
    }

    if (p.includes("art") || p.includes("minimal") || p.includes("concept") || p.includes("abstract") || p.includes("geometry")) {
        return EDITORIAL_SCENARIOS.CONCEPTUAL_MINIMAL;
    }

    // 3. Global Default
    return EDITORIAL_SCENARIOS.TABLETOP_LUXE;
};

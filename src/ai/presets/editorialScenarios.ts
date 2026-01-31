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
        internalDescription: 'Luxury tabletop surface (stone, wood, mineral), Natural light from side or back, Soft shadows, Michelin restaurant aesthetic.',
        promptFragment: {
            environment: "Luxury tabletop surface (stone, marble, fine wood), michelin star restaurant background, organic textures",
            lighting: "Natural soft window light from side or back, soft realistic shadows, no harsh flash",
            camera: "Full-frame Hasselblad style, 85mm lens, natural compression, elegant depth of field",
            mood: "Michelin-level culinary excellence, sophisticated, organic luxury"
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "studio background", "flat lighting", "night", "neon"]
    },

    BAR_AT_NIGHT: {
        id: 'BAR_AT_NIGHT',
        label: 'Luxury Bar Night',
        internalDescription: 'Dark, moody bar environment, Subtle bokeh lights, Controlled highlights, Night-time elegance.',
        promptFragment: {
            environment: "Dark moody luxury bar environment, subtle bokeh lights in background, polish bar counter",
            lighting: "Low-key cinematic lighting, controlled highlights, deep shadows, moody contrast, warm practical lights",
            camera: "Full-frame camera, 50mm f/1.2 lens, cinematic aperture, rich low-light performance",
            mood: "Exclusive night service, cinematic, intimate, premium nightlife elegance"
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "daylight", "bright window", "white background", "sunlight"]
    },

    STUDIO_EDITORIAL: {
        id: 'STUDIO_EDITORIAL',
        label: 'Studio Clean',
        internalDescription: 'Clean background (not pure white unless requested), Commercial product photography, Even, precise lighting.',
        promptFragment: {
            environment: "Clean high-end studio setting, smooth neutral background (grey/beige/soft textured), commercial aesthetic",
            lighting: "Even precise studio lighting, controlled softbox, perfect rim light, commercial standard",
            camera: "100mm macro lens, f/8 sharpness, crisp details, commercial product photography",
            mood: "Clean, commercial perfection, high-end magazine editorial, masterclass"
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "restaurant", "bar", "messy", "dark shadows"]
    },

    CONCEPTUAL_MINIMAL: {
        id: 'CONCEPTUAL_MINIMAL',
        label: 'Artistic Minimal',
        internalDescription: 'Minimalist composition, Strong geometry, Artistic shadows, Still realistic, never abstract fantasy.',
        promptFragment: {
            environment: "Minimalist geometric composition, stark architectural surface, monolithic background",
            lighting: "Strong directional hard light, crisp distinct artistic shadows, high contrast",
            camera: "50mm lens, sharp focus, geometric framing, architectural photography style",
            mood: "Avant-garde, artistic, modern gallery aesthetic, experimental but realistic"
        },
        negativeConstraints: [...COMMON_NEGATIVE_CONSTRAINTS, "clutter", "bokeh", "warm cozy", "vintage"]
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

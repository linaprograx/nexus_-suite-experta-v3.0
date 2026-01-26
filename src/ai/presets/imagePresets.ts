/**
 * Nexus Suite - Image Generation Presets
 * Phase 4A: Advanced Creative Control
 */

export interface ImagePreset {
    id: string;
    description: string;
    subjectType: string;
    glassware: string;
    background: string;
    lighting: string;
    camera: string;
    colorGrading: string;
    qualityConstraints: string;
}

export const IMAGE_PRESETS = {
    NEXUS_COCKTAIL_EDITORIAL: {
        id: 'NEXUS_COCKTAIL_EDITORIAL',
        description: 'High-end luxury beverage photography, Michelin star style',
        subjectType: 'Must be a cocktail or mocktail',
        glassware: 'Crystal clear, premium glassware, thin rim, potentially with minimalist ice block',
        background: 'Dark, moody, sophisticated textured surface (slate, marble, or dark wood), blurred bokeh background',
        lighting: 'Professional studio lighting, rim light to accentuate liquid translucency, soft main light, dramatic shadows',
        camera: '85mm lens, f/1.8 aperture, macro details available, sharp focus on garnish or condensation',
        colorGrading: 'Cinematic, rich contrast, vibrant but natural liquid colors, deep blacks',
        qualityConstraints: 'Photorealistic, 8k resolution, highly detailed texture, no artifacts, no text, no logos'
    } as ImagePreset,

    TABLETOP_LUXE: {
        id: 'TABLETOP_LUXE',
        description: 'High-end editorial tabletop cocktail photography, Michelin star ambience',
        subjectType: 'Must be a premium cocktail or mocktail',
        glassware: 'Premium fine crystal glassware, sharp rims, realistic reflections',
        background: 'Premium tabletop (dark wood, marble, or stone) with real projected shadows. Ambient background depth (blurred upscale restaurant interior), never flat black.',
        lighting: 'Soft directional side lighting (window light style), natural shadows on table, no harsh flash',
        camera: 'Full-frame DSLR, 85mm portrait lens, shallow depth of field (bokeh), sharp focus on the drink',
        colorGrading: 'Elegant, understated luxury, natural tones, rich but not oversaturated',
        qualityConstraints: 'Photorealistic, 8k, highly detailed, no cartoon, no 3D render, no CGI, no anime, no surrealism'
    } as ImagePreset,
};

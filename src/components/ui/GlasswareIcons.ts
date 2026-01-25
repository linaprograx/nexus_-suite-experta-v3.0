// nexus-suite-experta-v3.0---génesis/src/components/ui/GlasswareIcons.ts

// REFINED GLASSWARE SVGS - High fidelity, outline style
export const GLASSWARE_ICONS = {
    // Coupe/Coupette: Curved bowl, stem, base
    coupe: '<path d="M18 5c0 3-2 5.5-6 5.5S6 8 6 5M12 10.5v9M8 19.5h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Martini: V-shape, stem, base
    martini: '<path d="M7 4l5 8 5-8M12 12v7M8 19h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Rocks/Old Fashioned: Short, wide, simple
    rocks: '<path d="M5 6l2 14h10l2-14H5zM6 9h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Highball/Collins: Tall, straight
    highball: '<path d="M6 4h12v16H6zM7 4v16M17 4v16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Flute: Tall thin bowl, stem, base
    flute: '<path d="M9 4h6l-1 10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L9 4zM12 16v5M9 21h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Nick & Nora: Rounded bowl (like coupe but deeper/narrower), stem, base
    nicknora: '<path d="M17 5c0 4-2.5 7-5 7s-5-3-5-7M12 12v7M9 19h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Glencairn (Whisky): Tulip shape, short base
    glencairn: '<path d="M8 8c0 3 1.5 6 4 6s4-3 4-6-1.5-4-4-4-4 1-4 4zM12 14v2M9 18h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    // Default (Generic Wine/Cocktail)
    generic: '<path d="M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};

// Helper to deduce icon from name
export const getGlasswareIcon = (name: string): string => {
    const lower = (name || "").toLowerCase();

    if (lower.includes('coupe') || lower.includes('coupette')) return GLASSWARE_ICONS.coupe;
    if (lower.includes('martini') || lower.includes('cocktail')) return GLASSWARE_ICONS.martini;
    if (lower.includes('rocks') || lower.includes('old fashioned') || lower.includes('vaso corto') || lower.includes('bajo')) return GLASSWARE_ICONS.rocks;
    if (lower.includes('highball') || lower.includes('collins') || lower.includes('largo') || lower.includes('long')) return GLASSWARE_ICONS.highball;
    if (lower.includes('flute') || lower.includes('champagne') || lower.includes('cava')) return GLASSWARE_ICONS.flute;
    if ((lower.includes('nick') && lower.includes('nora'))) return GLASSWARE_ICONS.nicknora;
    if (lower.includes('glencairn') || lower.includes('catar') || lower.includes('snifter')) return GLASSWARE_ICONS.glencairn;

    return GLASSWARE_ICONS.generic;
};

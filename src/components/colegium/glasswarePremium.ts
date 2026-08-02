/**
 * Premium glassware illustrations for the visual quiz mode.
 * Full inline SVGs (filled glass + liquid + garnish) rendered large.
 * Far richer than the thin-line outline icons used elsewhere.
 */

const wrap = (inner: string) =>
    `<svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${inner}</svg>`;

const GLASS = '#cbd5e1';       // glass outline
const GLASS_FILL = 'rgba(203,213,225,0.12)';
const RIM = '#e2e8f0';

const PREMIUM: Record<string, string> = {
    // MARTINI — V bowl, olive on a pick, stem + base
    martini: wrap(`
        <defs><linearGradient id="mLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#a5b4fc"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
        <path d="M24 26 L60 66 L96 26" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M32 30 L60 61 L88 30 Z" fill="url(#mLiq)" opacity="0.9"/>
        <line x1="24" y1="26" x2="96" y2="26" stroke="${RIM}" stroke-width="3" stroke-linecap="round"/>
        <line x1="60" y1="66" x2="60" y2="108" stroke="${GLASS}" stroke-width="3"/>
        <path d="M40 112 Q60 104 80 112" stroke="${GLASS}" stroke-width="3" stroke-linecap="round"/>
        <line x1="72" y1="20" x2="58" y2="48" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="56" cy="50" r="6" fill="#84cc16" stroke="#4d7c0f" stroke-width="1.5"/>
    `),

    // COUPE — shallow rounded bowl
    coupe: wrap(`
        <defs><linearGradient id="cLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
        <path d="M26 30 Q26 64 60 64 Q94 64 94 30" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M33 34 Q33 56 60 56 Q87 56 87 34 Z" fill="url(#cLiq)" opacity="0.9"/>
        <line x1="24" y1="30" x2="96" y2="30" stroke="${RIM}" stroke-width="3" stroke-linecap="round"/>
        <line x1="60" y1="64" x2="60" y2="108" stroke="${GLASS}" stroke-width="3"/>
        <path d="M40 112 Q60 104 80 112" stroke="${GLASS}" stroke-width="3" stroke-linecap="round"/>
    `),

    // ROCKS — short tumbler + amber spirit + ice cube
    rocks: wrap(`
        <defs><linearGradient id="rLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs>
        <path d="M34 40 L40 110 L80 110 L86 40 Z" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M37 66 L40.5 106 L79.5 106 L83 66 Z" fill="url(#rLiq)" opacity="0.85"/>
        <line x1="32" y1="40" x2="88" y2="40" stroke="${RIM}" stroke-width="3" stroke-linecap="round"/>
        <rect x="50" y="60" width="20" height="20" rx="3" fill="#e0f2fe" opacity="0.7" stroke="#bae6fd" stroke-width="1.5" transform="rotate(12 60 70)"/>
    `),

    // HIGHBALL — tall glass + liquid + bubbles
    highball: wrap(`
        <defs><linearGradient id="hLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>
        <path d="M38 16 L42 116 L78 116 L82 16 Z" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 44 L42.5 112 L77.5 112 L80 44 Z" fill="url(#hLiq)" opacity="0.85"/>
        <line x1="36" y1="16" x2="84" y2="16" stroke="${RIM}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="52" cy="70" r="2.5" fill="#fff" opacity="0.7"/>
        <circle cx="66" cy="58" r="2" fill="#fff" opacity="0.6"/>
        <circle cx="60" cy="90" r="2.5" fill="#fff" opacity="0.7"/>
        <circle cx="50" cy="98" r="1.8" fill="#fff" opacity="0.5"/>
    `),

    // FLUTE — tall narrow + sparkling + rising bubbles
    flute: wrap(`
        <defs><linearGradient id="fLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
        <path d="M46 16 Q46 70 52 86 L52 104 M68 104 L68 86 Q74 70 74 16 Z" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M49 30 Q49 66 54 82 L66 82 Q71 66 71 30 Z" fill="url(#fLiq)" opacity="0.9"/>
        <line x1="44" y1="16" x2="76" y2="16" stroke="${RIM}" stroke-width="3" stroke-linecap="round"/>
        <line x1="60" y1="104" x2="60" y2="116" stroke="${GLASS}" stroke-width="3"/>
        <path d="M46 120 Q60 112 74 120" stroke="${GLASS}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="58" cy="44" r="1.6" fill="#fff" opacity="0.8"/>
        <circle cx="62" cy="56" r="1.4" fill="#fff" opacity="0.7"/>
        <circle cx="59" cy="68" r="1.5" fill="#fff" opacity="0.6"/>
    `),

    // GLENCAIRN — tulip whisky nosing glass + amber
    glencairn: wrap(`
        <defs><linearGradient id="gLiq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs>
        <path d="M40 30 Q34 70 50 86 L50 96 L70 96 L70 86 Q86 70 80 30 Q60 22 40 30 Z" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M43 56 Q40 76 53 86 L67 86 Q80 76 77 56 Q60 50 43 56 Z" fill="url(#gLiq)" opacity="0.9"/>
        <path d="M40 30 Q60 24 80 30" stroke="${RIM}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <rect x="46" y="96" width="28" height="8" rx="2" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3"/>
        <ellipse cx="60" cy="108" rx="22" ry="5" fill="${GLASS_FILL}" stroke="${GLASS}" stroke-width="3"/>
    `),
};

/** Resolve a glass name to a premium SVG illustration. */
export const getPremiumGlassware = (name: string): string => {
    const k = (name || '').toLowerCase();
    if (k.includes('martini')) return PREMIUM.martini;
    if (k.includes('coupe')) return PREMIUM.coupe;
    if (k.includes('rocks') || k.includes('old fashioned')) return PREMIUM.rocks;
    if (k.includes('highball') || k.includes('collins')) return PREMIUM.highball;
    if (k.includes('flute') || k.includes('champagne') || k.includes('cava')) return PREMIUM.flute;
    if (k.includes('glencairn') || k.includes('whisky') || k.includes('snifter')) return PREMIUM.glencairn;
    return PREMIUM.coupe;
};

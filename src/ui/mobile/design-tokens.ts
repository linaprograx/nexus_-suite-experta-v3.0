/**
 * Design Tokens for Ultra-Premium Mobile UI
 * Extracted from Stitch prototypes - Nexus Suite v3.0
 */

export const MOBILE_GRADIENTS = {
    // Grimorio Module
    stockAlert: 'linear-gradient(180deg, #FF2E2E 0%, #FF4D4D 35%, rgba(255, 46, 77, 0) 55%)',
    grimorioRecipes: 'linear-gradient(180deg, #ff5e00 0%, #ff8800 25%, rgba(255, 136, 0, 0) 45%)',
    grimorioMarket: 'linear-gradient(180deg, #00E096 0%, #10B981 35%, rgba(16, 185, 129, 0) 65%)',

    // Authentication & Core
    login: 'linear-gradient(180deg, #2563EB 0%, #7C3AED 25%, #DB2777 50%, rgba(248, 249, 250, 0) 80%)',
    dashboard: 'linear-gradient(180deg, #0066FF 0%, #00C2FF 35%, rgba(0, 102, 255, 0) 55%)',

    // Avatar Module
    avatarCore: 'linear-gradient(180deg, #312E81 0%, #4338ca 30%, #7C3AED 55%, rgba(124, 58, 237, 0) 85%)',
    avatarIntelligence: 'linear-gradient(180deg, #DC2626 0%, #EF4444 35%, rgba(239, 68, 68, 0) 65%)',
    avatarCompetition: 'linear-gradient(180deg, #10B981 0%, #34D399 35%, rgba(52, 211, 153, 0) 65%)',
    avatarMemberships: 'linear-gradient(180deg, #ff0099 0%, #ec4899 35%, rgba(236, 72, 153, 0) 65%)',

    // Cerebrity Module
    cerebritySynthesis: 'linear-gradient(180deg, #FF00CC 0%, #8F00FF 35%, rgba(143, 0, 255, 0) 65%)',
    cerebrityCritic: 'linear-gradient(180deg, #00E5FF 0%, #0097A7 35%, rgba(0, 151, 167, 0) 65%)',
    cerebrityLab: 'linear-gradient(180deg, #F000FF 0%, #6200EE 40%, rgba(98, 0, 238, 0) 100%)',
    cerebrityTrend: 'linear-gradient(180deg, #FFD700 0%, #D97706 35%, rgba(217, 119, 6, 0) 65%)',
    cerebrityMakeMenu: 'linear-gradient(180deg, rgba(255, 230, 0, 0.3) 0%, rgba(255, 230, 0, 0.1) 35%, rgba(255, 230, 0, 0) 60%)',

    // Utilities
    pizarron: 'linear-gradient(180deg, rgba(0, 229, 255, 0.15) 0%, rgba(240, 249, 250, 0) 100%)',
    personal: 'linear-gradient(180deg, #172554 0%, #1E293B 45%, rgba(30, 41, 59, 0) 80%)',
    colegium: 'linear-gradient(180deg, #ea580c 0%, #f97316 35%, rgba(249, 115, 22, 0) 65%)',
} as const;

export const MOBILE_COLORS = {
    // Primary accents by module
    stockAlert: '#FF2E2E',
    grimorioRecipes: '#ff6a00',
    grimorioMarket: '#00E096',
    login: '#4338ca',
    dashboard: '#0066FF',
    avatarCore: '#7C3AED',
    avatarIntelligence: '#DC2626',
    avatarCompetition: '#10B981',
    avatarMemberships: '#ff0099',
    cerebritySynthesis: '#FF00CC',
    cerebrityCritic: '#00E5FF',
    cerebrityLab: '#F000FF',
    cerebrityTrend: '#FFD700',
    cerebrityMakeMenu: '#FFE600',
    pizarron: '#00E5FF',
    personal: '#3B82F6',
    colegium: '#ea580c',
} as const;

export const MOBILE_SHADOWS = {
    // Glass effects
    glassCard: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
    glassDeep: '0 15px 40px -15px rgba(0, 0, 0, 0.05)',
    glassIntense: '0 10px 40px -10px rgba(0, 0, 0, 0.1)',

    // Glow effects
    actionGlow: (color: string) => `0 10px 25px -5px ${color}`,
    neonGlow: (color: string) => `0 0 20px ${color}, 0 0 40px ${color}`,
    buttonGlow: (color: string) => `0 4px 20px ${color}`,
    intenseGlow: (color: string) => `0 0 25px ${color}`,

    // Module-specific glows
    stockGlow: '0 10px 25px -5px rgba(255, 46, 46, 0.5)',
    recipeGlow: '0 8px 20px -6px rgba(255, 106, 0, 0.6)',
    marketGlow: '0 8px 20px -6px rgba(0, 224, 150, 0.6)',
    loginGlow: '0 10px 40px -10px rgba(217, 70, 239, 0.6), 0 0 20px rgba(59, 130, 246, 0.4)',
    dashboardGlow: '0 0 25px rgba(0, 102, 255, 0.5)',
    avatarGlow: '0 8px 20px -5px rgba(124, 58, 237, 0.6)',
    cerebrityPinkGlow: '0 0 15px rgba(255, 0, 204, 0.5)',
    cerebrityTurquoiseGlow: '0 0 20px rgba(0, 229, 255, 0.4)',
    cerebrityMagentaGlow: '0 0 25px rgba(240, 0, 255, 0.5)',
    cerebrityGoldGlow: '0 0 20px rgba(255, 215, 0, 0.4)',
    pizarronGlow: '0 0 15px rgba(0, 229, 255, 0.5)',

    // Navigation
    navBlur: '0 20px 40px rgba(0, 0, 0, 0.1)',
    floatingCard: '0 20px 50px -10px rgba(0, 0, 0, 0.1)',
} as const;

export const MOBILE_BORDERS = {
    glass: '1px solid rgba(255, 255, 255, 0.6)',
    glassLight: '1px solid rgba(255, 255, 255, 0.8)',
    glassDark: '1px solid rgba(255, 255, 255, 0.2)',
    glassSubtle: '1px solid rgba(255, 255, 255, 0.5)',
} as const;

export const MOBILE_BACKGROUNDS = {
    glass: 'rgba(255, 255, 255, 0.6)',
    glassLight: 'rgba(255, 255, 255, 0.7)',
    glassDark: 'rgba(255, 255, 255, 0.4)',
    glassBlur: 'rgba(255, 255, 255, 0.65)',
    navBlur: 'rgba(255, 255, 255, 0.9)',
    navBlurDark: 'rgba(255, 255, 255, 0.8)',
    blackGlass: 'rgba(0, 0, 0, 0.05)',
} as const;

export const MOBILE_BLUR = {
    standard: 'blur(20px)',
    intense: 'blur(25px)',
    subtle: 'blur(15px)',
    navigation: 'blur(20px)',
} as const;

export const MOBILE_TYPOGRAPHY = {
    tracking: {
        tighter: '-0.025em',
        tight: '-0.01em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        ultraWide: '0.2em',
        megaWide: '0.3em',
    },
    weight: {
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },
} as const;

export const MOBILE_TRANSITIONS = {
    default: 'all 0.3s ease',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Helper to get theme by page
export type ModuleName = keyof typeof MOBILE_GRADIENTS;

export const getModuleTheme = (module: ModuleName) => ({
    gradient: MOBILE_GRADIENTS[module],
    color: MOBILE_COLORS[module],
    shadow: MOBILE_SHADOWS.actionGlow(MOBILE_COLORS[module]),
});

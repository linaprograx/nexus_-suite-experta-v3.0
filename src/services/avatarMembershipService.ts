import { PlanTier } from '../core/product/plans.types';

/**
 * Avatar Membership Intelligence Service
 * Manages narrative-based permission system using evolutionary states
 * 
 * Core Principle: Limit depth and simultaneity, not functionality
 */

// Feature definitions
export type MembershipFeature =
    | 'avatar_create'
    | 'avatar_switch'
    | 'critic_full'
    | 'competition_mode'
    | 'advanced_config'
    | 'synthesis'
    | 'make_menu'
    | 'lab'
    | 'trend_locator';

// Feature gates map
const FEATURE_GATES: Record<MembershipFeature, PlanTier[]> = {
    // Base features - available to all
    synthesis: ['FREE', 'PRO', 'EXPERT', 'STUDIO'],
    make_menu: ['FREE', 'PRO', 'EXPERT', 'STUDIO'],
    lab: ['FREE', 'PRO', 'EXPERT', 'STUDIO'],
    trend_locator: ['FREE', 'PRO', 'EXPERT', 'STUDIO'],

    // Avatar creation - capacity limited
    avatar_create: ['FREE', 'PRO', 'EXPERT', 'STUDIO'], // Handled by count limit

    // ASCENDANT unlocks
    avatar_switch: ['PRO', 'EXPERT', 'STUDIO'],
    critic_full: ['PRO', 'EXPERT', 'STUDIO'],
    competition_mode: ['PRO', 'EXPERT', 'STUDIO'],

    // PLATINUM unlocks
    advanced_config: ['EXPERT', 'STUDIO'],
};

// Avatar capacity limits
const AVATAR_LIMITS: Record<PlanTier, number> = {
    FREE: 1,
    PRO: 2,
    EXPERT: 4,
    STUDIO: 99,
};

// State narrative names
const STATE_NAMES: Record<PlanTier, string> = {
    FREE: 'Génesis',
    PRO: 'Ascendente',
    EXPERT: 'Platinum',
    STUDIO: 'Jupiter',
};

// Feature narrative descriptions
const FEATURE_NARRATIVES: Record<MembershipFeature, {
    name: string;
    benefit: string;
    requiredState: PlanTier;
}> = {
    avatar_create: {
        name: 'Manifestaciones Adicionales',
        benefit: 'Expande tu capacidad de manifestación cognitiva',
        requiredState: 'PRO',
    },
    avatar_switch: {
        name: 'Alternancia de Identidades',
        benefit: 'Cambia entre manifestaciones según el contexto operativo',
        requiredState: 'PRO',
    },
    critic_full: {
        name: 'Evaluación Crítica Completa',
        benefit: 'Análisis profundo con feedback activo y métricas de mejora continua',
        requiredState: 'PRO',
    },
    competition_mode: {
        name: 'Modo Competición',
        benefit: 'Evalúa propuestas contra estándares de competición profesional',
        requiredState: 'PRO',
    },
    advanced_config: {
        name: 'Configuración Avanzada',
        benefit: 'Acceso a criterios estratégicos y validación de coherencia cross-section',
        requiredState: 'EXPERT',
    },
    synthesis: {
        name: 'Síntesis Cognitiva',
        benefit: 'Generación creativa base',
        requiredState: 'FREE',
    },
    make_menu: {
        name: 'Diseño de Menú',
        benefit: 'Ejecución de diseño editorial',
        requiredState: 'FREE',
    },
    lab: {
        name: 'Evaluación de Composición',
        benefit: 'Análisis de combinaciones',
        requiredState: 'FREE',
    },
    trend_locator: {
        name: 'Exploración de Tendencias',
        benefit: 'Descubrimiento de patrones emergentes',
        requiredState: 'FREE',
    },
};

export const AvatarMembershipService = {
    /**
     * Check if user can access a feature
     */
    canAccess(feature: MembershipFeature, userPlan: PlanTier): boolean {
        const allowedPlans = FEATURE_GATES[feature];
        return allowedPlans.includes(userPlan);
    },

    /**
     * Get avatar capacity limit for plan
     */
    getAvatarLimit(userPlan: PlanTier): number {
        return AVATAR_LIMITS[userPlan];
    },

    /**
     * Get narrative state name
     */
    getStateName(plan: PlanTier): string {
        return STATE_NAMES[plan];
    },

    /**
     * Get next evolutionary state
     */
    getNextState(currentPlan: PlanTier): PlanTier | null {
        const progression: PlanTier[] = ['FREE', 'PRO', 'EXPERT', 'STUDIO'];
        const currentIndex = progression.indexOf(currentPlan);
        return currentIndex < progression.length - 1 ? progression[currentIndex + 1] : null;
    },

    /**
     * Get ascension narrative for locked feature
     */
    getAscensionNarrative(feature: MembershipFeature, currentPlan: PlanTier): {
        featureName: string;
        benefit: string;
        requiredState: string;
        requiredPlan: PlanTier;
        message: string;
    } {
        const featureInfo = FEATURE_NARRATIVES[feature];
        const requiredStateName = STATE_NAMES[featureInfo.requiredState];

        return {
            featureName: featureInfo.name,
            benefit: featureInfo.benefit,
            requiredState: requiredStateName,
            requiredPlan: featureInfo.requiredState,
            message: `Disponible en estado ${requiredStateName}`,
        };
    },

    /**
     * Get required state for feature
     */
    getRequiredState(feature: MembershipFeature): PlanTier {
        return FEATURE_NARRATIVES[feature].requiredState;
    },

    /**
     * Check if feature is preview-only for user
     */
    isPreviewMode(feature: MembershipFeature, userPlan: PlanTier): boolean {
        return !this.canAccess(feature, userPlan);
    },
};

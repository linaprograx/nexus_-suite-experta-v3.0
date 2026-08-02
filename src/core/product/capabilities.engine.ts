import { PlanTier, IntelligenceLayer } from './plans.types';
import { PLANS, DEFAULT_PLAN_TIER } from './plans.config';

/** App sections that can be gated by plan (mirror of the backend access rules). */
export type Feature = 'grimorium' | 'cerebrity' | 'pizarron' | 'avatar' | 'colegium' | 'controlCenter';

const TIER_RANK: Record<PlanTier, number> = { FREE: 0, PRO: 1, EXPERT: 2, STUDIO: 3 };

// Minimum plan required per feature — single source of truth for UI gating.
export const FEATURE_MIN_TIER: Record<Feature, PlanTier> = {
    grimorium: 'FREE',
    colegium: 'FREE',
    pizarron: 'PRO',
    cerebrity: 'EXPERT',
    avatar: 'EXPERT',
    controlCenter: 'EXPERT',
};

/**
 * Engine to check user capabilities based on their assigned plan.
 */
export const CapabilitiesEngine = {

    /** Whether the plan grants access to a given app section/feature. */
    canAccessSection: (planTier: PlanTier, feature: Feature): boolean => {
        const tier = planTier in TIER_RANK ? planTier : DEFAULT_PLAN_TIER;
        return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
    },

    /**
     * Check if a specific Intelligence Layer is enabled for the plan.
     */
    hasLayer: (planTier: PlanTier, layer: IntelligenceLayer): boolean => {
        const plan = PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
        return plan.enabled_layers.includes(layer);
    },

    /**
     * Check if specific boolean features are enabled.
     */
    canExecuteActions: (planTier: PlanTier): boolean => {
        const plan = PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
        return plan.limits.active_actions;
    },

    canCustomizeThresholds: (planTier: PlanTier): boolean => {
        const plan = PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
        return plan.limits.custom_thresholds;
    },

    /**
     * Get numeric limits (e.g. max insights).
     * Returns Infinity for 'unlimited'.
     */
    getMaxAssistedInsights: (planTier: PlanTier): number => {
        const plan = PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
        if (plan.limits.assisted_insights === 'unlimited') return Infinity;
        return plan.limits.assisted_insights;
    },

    getAuditRetentionDays: (planTier: PlanTier): number => {
        const plan = PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
        return plan.limits.audit_retention_days;
    },

    /**
     * Helper to get the full plan object
     */
    getPlan: (planTier: PlanTier) => {
        return PLANS[planTier] || PLANS[DEFAULT_PLAN_TIER];
    }
};

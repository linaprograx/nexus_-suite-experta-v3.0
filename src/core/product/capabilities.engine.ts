import { PlanTier, IntelligenceLayer } from './plans.types';
import { PLANS, DEFAULT_PLAN_TIER } from './plans.config';

/**
 * Engine to check user capabilities based on their assigned plan.
 */
export const CapabilitiesEngine = {
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

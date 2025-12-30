import { UserIntelProfile } from './learning.types';

// Absolute constraints defined in spec
export const ABSOLUTE_LIMITS = {
    assisted_minimum_to_show: { min: 18, max: 28 },
    active_confidence_threshold: { min: 75, max: 90 },
    max_visible_insights_default: { min: 1, max: 2 }
};

export const AUTO_TUNING_FREEZE_HOURS = 48;

/**
 * Ensures a profile's values never exceed safe operational limits.
 * "Trust-First" architecture requires strict clamping.
 */
export const LearningGuardrails = {
    /**
     * Clamps all numerical values in the visibility profile to defined limits.
     */
    clampProfile: (profile: UserIntelProfile): UserIntelProfile => {
        const p = { ...profile };

        // Clamp Assisted Minimum (Sensitivity)
        p.visibility.assisted_minimum_to_show = Math.max(
            ABSOLUTE_LIMITS.assisted_minimum_to_show.min,
            Math.min(ABSOLUTE_LIMITS.assisted_minimum_to_show.max, p.visibility.assisted_minimum_to_show)
        );

        // Clamp Active Confidence (Risk)
        p.visibility.active_confidence_threshold = Math.max(
            ABSOLUTE_LIMITS.active_confidence_threshold.min,
            Math.min(ABSOLUTE_LIMITS.active_confidence_threshold.max, p.visibility.active_confidence_threshold)
        );

        // Clamp Max Items (Noise)
        p.visibility.max_visible_insights_default = Math.max(
            ABSOLUTE_LIMITS.max_visible_insights_default.min,
            Math.min(ABSOLUTE_LIMITS.max_visible_insights_default.max, p.visibility.max_visible_insights_default)
        );

        return p;
    },

    /**
     * Checks if auto-tuning should be frozen.
     */
    isFrozen: (profile: UserIntelProfile): boolean => {
        // If we had a "lastResetAt" in history, we would check it here.
        // For now, we rely on the tuning counters or a specific flag if added.
        // Assuming we add a 'lastManualReset' field later or misuse 'lastTunedAt' if it was a reset.
        return false; // Implement properly if we add schema field
    }
};

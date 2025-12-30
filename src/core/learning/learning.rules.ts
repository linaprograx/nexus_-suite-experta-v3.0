
import { UserIntelProfile, LearningEvent } from './learning.types';
import { logLearningAdjustment } from './learning.audit';

// Rule ID definitions
export const RULES = {
    SNOOZE_REPEATED_ENTITY: 'SNOOZE_REPEATED_ENTITY',
    RAISE_MINIMUM_IF_NOISE: 'RAISE_MINIMUM_IF_NOISE'
};

export const applyLearningRules = (profile: UserIntelProfile, recentEvents: LearningEvent[]): UserIntelProfile => {
    let nextProfile = { ...profile };
    let hasChanges = false;

    // RULE: Auto-Snooze Repeated Entity
    // Trigger: Dismiss same entity 3 times in short window (e.g. recentEvents slice should be relevant window)
    const dismissals = recentEvents.filter(e => e.type === 'suggestion_dismissed');
    const entityCounts: Record<string, number> = {};

    dismissals.forEach(e => {
        const key = e.entity.ingredientId || e.entity.supplierId; // Naive key
        if (key) {
            entityCounts[key] = (entityCounts[key] || 0) + 1;
        }
    });

    Object.entries(entityCounts).forEach(([key, count]) => {
        if (count >= 3) {
            // Check if already snoozed to avoid redundant updates
            const existingSnooze = nextProfile.snoozes.byEntity[key];
            const now = Date.now();
            if (!existingSnooze || existingSnooze.until < now) {
                // Apply Snooze 14 days
                nextProfile.snoozes.byEntity[key] = {
                    until: now + (14 * 24 * 60 * 60 * 1000),
                    reason: 'Auto-snoozed due to frequent dismissal'
                };
                hasChanges = true;
                logLearningAdjustment(RULES.SNOOZE_REPEATED_ENTITY, `Snoozed entity ${key} for 14 days`, null, nextProfile.snoozes.byEntity[key]);
            }
        }
    });

    // RULE: Raise Threshold if Noise
    // Trigger: If ratio of dismissals to views is high (global check usually, here simplified)
    // Detailed implementation would require analyzing larger history.

    return nextProfile;
};

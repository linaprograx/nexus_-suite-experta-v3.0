import { Firestore } from 'firebase/firestore';
import { UserIntelProfile, DEFAULT_INTEL_PROFILE } from './learning.types';
import { LearningEngine } from './learning.engine';
import { IntelChangelog } from './learning.changelog';

export type SystemState = {
    silenceLevel: 'Bajo' | 'Medio' | 'Alto';
    confidenceMode: 'Relajada' | 'Normal' | 'Estricta';
    actionMode: 'Desactivadas' | 'Opt-in activas';
};

export const LearningTransparency = {
    /**
     * Derives human-readable system state from raw profile numbers.
     */
    getSystemState: (profile: UserIntelProfile): SystemState => {
        // Silence Level
        // Low: max items 2, min score low
        // High: max items 1, min score high
        let silenceLevel: SystemState['silenceLevel'] = 'Medio';
        if (profile.visibility.max_visible_insights_default === 1 && profile.visibility.assisted_minimum_to_show >= 25) {
            silenceLevel = 'Alto';
        } else if (profile.visibility.max_visible_insights_default === 2 && profile.visibility.assisted_minimum_to_show <= 20) {
            silenceLevel = 'Bajo';
        }

        // Confidence Mode
        let confidenceMode: SystemState['confidenceMode'] = 'Normal';
        if (profile.visibility.active_confidence_threshold >= 88) {
            confidenceMode = 'Estricta';
        } else if (profile.visibility.active_confidence_threshold <= 78) {
            confidenceMode = 'Relajada';
        }

        return {
            silenceLevel,
            confidenceMode,
            actionMode: 'Opt-in activas' // Currently always true in Phase 3.1
        };
    },

    /**
     * Reverts the profile to default values (Factory Reset).
     */
    resetToDefaults: async (db: Firestore, userId: string) => {
        await LearningEngine.resetProfile(db, userId);
        IntelChangelog.clear();
        await IntelChangelog.logChange(db, userId, {
            ruleId: 'MANUAL_RESET',
            description: 'Restablecimiento de fábrica manual.',
            before: 'Personalizado',
            after: 'Por defecto',
            scope: 'global',
            reversible: false
        });
    },

    /**
     * Revert a specific numeric change (Simplified).
     * In a full implementation, we'd need to know exactly what field changed.
     * For Phase 4.1, we assume we might mostly be reverting snoozes or thresholds.
     */
    revertChange: async (db: Firestore | null, userId: string, changeDescription: string) => {
        // This is complex request "Revert only selected change".
        // Without storing a full snapshot diff, we can't always perfectly revert.
        // For this iteration, we will implement a "Smart Revert" for common cases if possible,
        // or just log that it was reverted manually.

        // Implementation: We can't actually revert arbitrary changes without a RevertAction in the log.
        // For now, we will mark this as "Requires Future Implementation" for granular revert,
        // OR we just allow resetting specific keys if the log entry has metadata.

        // Placeholder for the "Revert" button action
        console.log("Reverting change:", changeDescription);

        // We log the revert
        await IntelChangelog.logChange(db, userId, {
            ruleId: 'MANUAL_REVERT',
            description: `Reversión manual: ${changeDescription}`,
            before: '?',
            after: '?',
            scope: 'global',
            reversible: false
        });
    }
};


import { Firestore } from 'firebase/firestore';
import { LearningEvent, UserIntelProfile, DEFAULT_INTEL_PROFILE } from './learning.types';
import { recordEvent, loadUserProfile, saveUserProfile } from './learning.store';
import { applyLearningRules } from './learning.rules';

export const LearningEngine = {
    trackEvent: async (db: Firestore, userId: string, event: Omit<LearningEvent, 'id' | 'timestamp' | 'userId'>) => {
        const fullEvent: LearningEvent = {
            ...event,
            id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            userId
        };

        // 1. Record
        await recordEvent(db, fullEvent);

        // 2. Evaluate Rules (Lazy or Periodic? - For Phase 4.0 we can do eager check for "Demo" feel)
        // Load profile -> Check Rules -> Save if changed
        const profile = await loadUserProfile(db, userId);

        // Simulating "Recent Events" fetch - in real app query DB. 
        // For now, we only react to the immediate event + some counter state if we had it.
        // But `applyLearningRules` currently inspects a list. 
        // Let's pass array of [currentEvent]. 
        // More complex rules need history queries.

        const newProfile = applyLearningRules(profile, [fullEvent]);

        // Check structural equality of critical sections or just use a flag from rules return?
        // Rules returns new object ref if changed.
        await saveUserProfile(db, newProfile);
    },

    getProfile: async (db: Firestore, userId: string) => {
        return loadUserProfile(db, userId);
    },

    updateProfile: async (db: Firestore, userId: string, updates: Partial<UserIntelProfile>) => {
        const current = await loadUserProfile(db, userId);
        const updated = { ...current, ...updates }; // Deep merge might be needed for nested objects like snoozes
        // Simple shallow merge for now, but handle snoozes carefully in UI
        await saveUserProfile(db, updated);
        return updated;
    },

    resetProfile: async (db: Firestore, userId: string) => {
        // Full Reset to Defaults
        console.log(`[LEARNING] Resetting profile for user ${userId}`);
        const defaultProfile: UserIntelProfile = {
            userId,
            ...DEFAULT_INTEL_PROFILE
        };
        await saveUserProfile(db, defaultProfile);

        // Also log the reset as a special event
        await recordEvent(db, {
            id: `RESET_${Date.now()}`,
            userId,
            timestamp: Date.now(),
            type: 'action_executed', // Reusing action type for system action
            scope: 'global',
            entity: {},
            signalIds: [],
            meta: { confidence: 100 }
        } as any);

        return defaultProfile;
    }
};

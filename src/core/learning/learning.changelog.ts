import { Firestore } from 'firebase/firestore';
import { IntelChangeLogEntry } from './learning.types';

const LOCAL_STORAGE_KEY = 'nexus_intel_changelog_cache';
const MAX_ENTRIES = 50;

/**
 * Service to manage the "Transparency Log" of the AI.
 * Keeps track of why values changed.
 */
export const IntelChangelog = {
    /**
     * Log a new change entry.
     * Persists to LocalStorage immediately for UI speed, 
     * should ideally sync to Firestore in background (omitted for now to keep it lightweight as requested).
     */
    logChange: async (db: Firestore | null, userId: string, entry: Omit<IntelChangeLogEntry, 'id' | 'timestamp'>) => {
        const newEntry: IntelChangeLogEntry = {
            ...entry,
            id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };

        const current = IntelChangelog.getRecentEntries();
        const updated = [newEntry, ...current].slice(0, MAX_ENTRIES);

        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            // In a real implementation, we would also:
            // await addDoc(collection(db, `users/${userId}/intel_changelog`), newEntry);
        } catch (e) {
            console.warn('Failed to save changelog', e);
        }

        return newEntry;
    },

    /**
     * Get recent changes for the UI.
     */
    getRecentEntries: (): IntelChangeLogEntry[] => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    /**
     * Clear log (e.g. on reset).
     */
    clear: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
};

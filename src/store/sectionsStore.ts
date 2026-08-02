import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_SECTIONS } from '../config/appSections';

const LOCKED_IDS = new Set(APP_SECTIONS.filter(s => s.locked).map(s => s.id));

interface SectionsState {
    /** Ids of sections the user has hidden from the navigation menus. */
    hiddenSections: string[];
    toggleSection: (id: string) => void;
    isEnabled: (id: string) => boolean;
}

/**
 * Persistent (localStorage) visibility of app sections in the nav menus.
 * Locked sections are always enabled regardless of stored state.
 */
export const useSectionsStore = create<SectionsState>()(
    persist(
        (set, get) => ({
            hiddenSections: [],
            toggleSection: (id: string) => {
                if (LOCKED_IDS.has(id)) return; // locked sections can't be toggled
                set(state => ({
                    hiddenSections: state.hiddenSections.includes(id)
                        ? state.hiddenSections.filter(s => s !== id)
                        : [...state.hiddenSections, id],
                }));
            },
            isEnabled: (id: string) => LOCKED_IDS.has(id) || !get().hiddenSections.includes(id),
        }),
        { name: 'nexus-sections-visibility' }
    )
);

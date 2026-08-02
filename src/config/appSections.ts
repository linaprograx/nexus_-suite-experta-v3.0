import { ICONS } from '../components/ui/icons';

/**
 * Single source of truth for the app's navigable sections.
 * Consumed by the desktop Sidebar, the mobile bottom nav and the
 * "command center" (section visibility toggles) in Personal settings.
 *
 * `locked: true` → always visible, cannot be disabled (avoids locking the
 * user out of core areas / the command center itself).
 */
export interface AppSection {
    id: string;       // stable key used for visibility persistence
    label: string;
    icon: string;     // SVG path from ICONS
    path: string;     // router path
    locked?: boolean; // always visible when true
}

export const APP_SECTIONS: AppSection[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.grid, path: '/', locked: true },
    { id: 'grimorium', label: 'Grimorium', icon: ICONS.book, path: '/grimorium', locked: true },
    { id: 'cerebrIty', label: 'CerebrIty', icon: ICONS.brain, path: '/cerebrIty' },
    { id: 'pizarron', label: 'Pizarrón', icon: ICONS.layoutGrid, path: '/pizarron' },
    { id: 'avatar', label: 'Avatar', icon: ICONS.radar, path: '/avatar' },
    { id: 'colegium', label: 'Colegium', icon: ICONS.school, path: '/colegium' },
];

/** Sections that can be toggled on/off from the command center. */
export const TOGGLEABLE_SECTIONS = APP_SECTIONS.filter(s => !s.locked);

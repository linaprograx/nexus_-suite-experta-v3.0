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
    /**
     * Color de la sección, en hexadecimal.
     *
     * **No es una paleta nueva**: son los mismos valores que ya usaba la barra
     * inferior de móvil (`SECTION_ACCENT`). Vivían allí dentro, así que la
     * barra lateral no podía usarlos y el escritorio acabó con un arcoíris
     * fijo para todo. Ahora la fuente es esta, y la barra inferior la consume.
     */
    color: string;
}

export const APP_SECTIONS: AppSection[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.grid, path: '/', locked: true, color: '#0ea5e9' },
    { id: 'grimorium', label: 'Grimorium', icon: ICONS.book, path: '/grimorium', locked: true, color: '#10b981' },
    { id: 'cerebrIty', label: 'CerebrIty', icon: ICONS.brain, path: '/cerebrIty', color: '#ec4899' },
    { id: 'pizarron', label: 'Pizarrón', icon: ICONS.layoutGrid, path: '/pizarron', color: '#6366f1' },
    { id: 'avatar', label: 'Avatar', icon: ICONS.radar, path: '/avatar', color: '#8b5cf6' },
    { id: 'colegium', label: 'Colegium', icon: ICONS.school, path: '/colegium', color: '#f59e0b' },
];

/** El color de una sección a partir de su ruta. Indigo si no se reconoce. */
export const colorDeRuta = (ruta: string): string => {
    const exacta = APP_SECTIONS.find(s => s.path === ruta);
    if (exacta) return exacta.color;
    const porPrefijo = APP_SECTIONS.find(s => s.path !== '/' && ruta.startsWith(s.path));
    return porPrefijo?.color || '#64748b';
};

/** Sections that can be toggled on/off from the command center. */
export const TOGGLEABLE_SECTIONS = APP_SECTIONS.filter(s => !s.locked);

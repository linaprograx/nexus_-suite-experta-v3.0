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
     * ## Cuidado con este campo: solo dos valores están verificados
     *
     * Al montarlo se tomaron los colores de `SECTION_ACCENT`, el mapa que vivía
     * dentro de la barra inferior de móvil, **dándolos por buenos**. No lo
     * eran: ponía Colegium en naranja cuando Colegium es azul marino.
     *
     * Lo que de verdad declara cada vista es esto:
     *
     * - **Grimorio** usa `gradientTheme="emerald"` → verde. Verificado.
     * - **Colegium** usa `gradientTheme="colegium"` → `#1e3a8a`. Verificado.
     * - **CerebrIty** toma el magenta de la cabecera de Synthesis, `#FF00CC`.
     *   Verificado contra `CerebrityView`.
     * - **Avatar** toma el rojo de su pestaña «Inteligencia», `#e11d48`, que
     *   ahora es el único de esa sección. Verificado contra `AvatarView`.
     *
     * Quedan **dos propuestas**: Dashboard y Pizarrón, que no declaran color
     * propio y caen en el `indigo` por defecto de `PremiumLayout`. Se cambian
     * aquí, en un sitio.
     */
    color: string;
}

export const APP_SECTIONS: AppSection[] = [
    // propuesto
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.grid, path: '/', locked: true, color: '#4f46e5' },
    // VERIFICADO: la vista declara `gradientTheme="emerald"`
    { id: 'grimorium', label: 'Grimorium', icon: ICONS.book, path: '/grimorium', locked: true, color: '#059669' },
    // VERIFICADO: es el magenta de la cabecera de Synthesis en `CerebrityView`
    { id: 'cerebrIty', label: 'CerebrIty', icon: ICONS.brain, path: '/cerebrIty', color: '#FF00CC' },
    // propuesto — su fondo real es `slate-950`, de ahí el gris azulado
    { id: 'pizarron', label: 'Pizarrón', icon: ICONS.layoutGrid, path: '/pizarron', color: '#475569' },
    // VERIFICADO: Avatar unifica sus pestañas en el rojo de «Inteligencia»
    { id: 'avatar', label: 'Avatar', icon: ICONS.radar, path: '/avatar', color: '#e11d48' },
    // VERIFICADO: la vista declara `gradientTheme="colegium"` → azul marino
    { id: 'colegium', label: 'Colegium', icon: ICONS.school, path: '/colegium', color: '#1e3a8a' },
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

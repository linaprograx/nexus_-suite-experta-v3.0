import { Recipe, Ingredient } from '../types';
import { MenuEntry } from '../hooks/useActiveMenu';
import { computeMenuDrift, summarizeDrift } from './menuDrift';
import { proveedoresDeFicha } from '../core/ofertas/oferta';

export interface GrimorioAlert {
    id: string;            // stable id → dedupes in the notifications collection
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    link: string;          // route to open
}

const sourceCount = proveedoresDeFicha;

const isOrphan = (r: Recipe): boolean => {
    const lines = (r.ingredientes as any[]) || [];
    if (lines.length === 0) return true;
    return !lines.some(li => li?.ingredientId || li?.subItems?.length || li?.subRecipeId);
};

/**
 * #18 · Computes the set of business-level Grimorio alerts to surface in the
 * app-wide notification tray. Stable ids so the sync layer dedupes/heals them.
 * All read-only aggregation over data already loaded.
 */
export const computeGrimorioAlerts = (
    allRecipes: Recipe[],
    allIngredients: Ingredient[],
    menu: MenuEntry[] = []
): GrimorioAlert[] => {
    const alerts: GrimorioAlert[] = [];
    if (!allRecipes || !allIngredients) return alerts;

    // #20 · Menu feedback loop: a published card whose economics drifted needs review
    if (menu.length > 0) {
        const drift = summarizeDrift(computeMenuDrift(menu, allRecipes, allIngredients));
        if (drift.needsAttention > 0) {
            alerts.push({
                id: 'grimorio-menu-drift',
                title: 'Carta desactualizada',
                message: `${drift.needsAttention} receta(s) de tu carta requieren revisión${drift.critical > 0 ? ` · ${drift.critical} con margen crítico` : ''}.`,
                type: drift.critical > 0 ? 'error' : 'warning',
                link: '/grimorium',
            });
        }
    }

    const orphan = allRecipes.filter(isOrphan).length;
    if (orphan > 0) {
        alerts.push({
            id: 'grimorio-orphan-recipes',
            title: 'Recetas sin ingredientes',
            message: `${orphan} receta(s) no tienen ingredientes vinculados al inventario.`,
            type: 'warning',
            link: '/grimorium',
        });
    }

    const critical = allRecipes.filter(r => {
        const v = r.precioVenta || 0;
        const c = r.costoTotal || r.costoReceta || 0;
        return v > 0 && c > 0 && ((v - c) / v) * 100 < 20;
    }).length;
    if (critical > 0) {
        alerts.push({
            id: 'grimorio-critical-margin',
            title: 'Recetas con margen crítico',
            message: `${critical} receta(s) por debajo del 20% de margen.`,
            type: 'error',
            link: '/grimorium',
        });
    }

    const single = allIngredients.filter(i => sourceCount(i) === 1).length;
    if (single > 0) {
        alerts.push({
            id: 'grimorio-single-supplier',
            title: 'Riesgo de proveedor único',
            message: `${single} ingrediente(s) dependen de un solo proveedor.`,
            type: 'warning',
            link: '/grimorium',
        });
    }

    return alerts;
};

export const GRIMORIO_ALERT_PREFIX = 'grimorio-';

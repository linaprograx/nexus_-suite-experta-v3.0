import { getAdminDb } from '../firebase.js';

// Reuses the SAME engines the app runs in the browser — no duplicated business rules,
// so the agent can never report a number that differs from what the user sees.
import { calculateRecipeCost } from '../../../src/core/costing/costCalculator';
import { buildStockFromPurchases, applyMovementsToStock } from '../../../src/utils/stockUtils';
import { computeMenuDrift, summarizeDrift } from '../../../src/utils/menuDrift';

export interface BriefingItem {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    area: 'recetas' | 'carta' | 'stock' | 'proveedores';
    title: string;
    detail: string;
    /** Rough € at stake, used to rank what deserves the user's attention. */
    impact?: number;
    entities?: string[];
}

export interface Briefing {
    generatedAt: string;
    userId: string;
    stats: {
        recipes: number;
        ingredients: number;
        menuItems: number;
        inventoryValue: number;
        avgMargin: number;
    };
    items: BriefingItem[];
    /**
     * Checks the agent could NOT perform because the data needed isn't configured.
     * Reported explicitly so "all quiet" never hides "I couldn't look".
     */
    blindSpots: string[];
    /** true when there is nothing worth notifying about */
    quiet: boolean;
}

/** Recipes that are components, not sellable drinks — a missing sale price is expected. */
const isComponent = (r: any) =>
    r.categorias?.includes('Preparacion') || r.categorias?.includes('Garnish');

const CRITICAL_MARGIN = 20;
const LOW_STOCK_FACTOR = 1; // at or below the ingredient's minStock

const col = async (db: any, path: string) => {
    try {
        const snap = await db.collection(path).get();
        return snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
    } catch {
        return [];
    }
};

/**
 * Computes the nightly briefing for one user: everything worth waking someone up for,
 * ranked by money at stake. Read-only.
 */
export async function buildBriefing(userId: string, appId: string): Promise<Briefing> {
    const db = await getAdminDb();
    if (!db) throw new Error('Firebase Admin not configured');

    const [recipes, ingredients, purchases, movements, menu] = await Promise.all([
        col(db, `users/${userId}/grimorio`),
        col(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`),
        col(db, `users/${userId}/purchases`),
        col(db, `users/${userId}/stock_movements`),
        col(db, `users/${userId}/menu_items`),
    ]);

    const items: BriefingItem[] = [];
    const blindSpots: string[] = [];

    // --- Recipes: critical margin ---
    const costed = recipes
        .filter((r: any) => r.ingredientes?.length)
        .map((r: any) => {
            const cost = calculateRecipeCost(r, ingredients as any, undefined, recipes as any).costoTotal || 0;
            const price = r.precioVenta || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : null;
            return { recipe: r, cost, price, margin };
        });

    const critical = costed.filter(c => c.margin !== null && c.cost > 0 && (c.margin as number) < CRITICAL_MARGIN);
    if (critical.length) {
        items.push({
            id: 'recipes-critical-margin',
            severity: 'critical',
            area: 'recetas',
            title: `${critical.length} receta(s) con margen crítico`,
            detail: critical.slice(0, 5).map(c => `${c.recipe.nombre} (${(c.margin as number).toFixed(0)}%)`).join(', '),
            impact: critical.reduce((a, c) => a + Math.max(0, c.cost), 0),
            entities: critical.map(c => c.recipe.nombre),
        });
    }

    // --- Recipes: sellable but with no sale price → profitability unknown ---
    const noPrice = costed.filter(c => !isComponent(c.recipe) && c.price <= 0);
    if (noPrice.length) {
        items.push({
            id: 'recipes-no-price',
            severity: 'warning',
            area: 'recetas',
            title: `${noPrice.length} receta(s) sin precio de venta`,
            detail: `No se puede saber si son rentables: ${noPrice.slice(0, 6).map(c => c.recipe.nombre).join(', ')}`,
            entities: noPrice.map(c => c.recipe.nombre),
        });
    }

    // --- Recipes: zero cost → ingredients unlinked or unpriced ---
    const zeroCost = costed.filter(c => c.cost === 0);
    if (zeroCost.length) {
        items.push({
            id: 'recipes-zero-cost',
            severity: 'warning',
            area: 'recetas',
            title: `${zeroCost.length} receta(s) con coste 0`,
            detail: `Sus ingredientes no están vinculados o no tienen precio: ${zeroCost.slice(0, 6).map(c => c.recipe.nombre).join(', ')}`,
            entities: zeroCost.map(c => c.recipe.nombre),
        });
    }

    // --- Menu: cost drift since publication ---
    if (menu.length === 0) {
        blindSpots.push('No puedo vigilar la carta: aún no has publicado ninguna receta en ella.');
    }
    if (menu.length) {
        const drifts = computeMenuDrift(menu as any, recipes as any, ingredients as any);
        const sum = summarizeDrift(drifts);
        if (sum.needsAttention > 0) {
            const worst = drifts
                .filter(d => d.severity !== 'ok')
                .sort((a, b) => b.costDeltaPct - a.costDeltaPct)
                .slice(0, 5);
            items.push({
                id: 'menu-drift',
                severity: sum.critical > 0 ? 'critical' : 'warning',
                area: 'carta',
                title: `${sum.needsAttention} receta(s) de la carta requieren revisión`,
                detail: worst.map(d => `${d.entry.nombre}: ${d.reason}`).join(' · '),
                entities: worst.map(d => d.entry.nombre),
            });
        }
    }

    // --- Stock: below minimum ---
    const stock = applyMovementsToStock(buildStockFromPurchases(purchases as any), movements as any);
    const withMin = ingredients.filter((i: any) => Number(i.minStock) > 0);
    if (withMin.length === 0) {
        // Without a minimum there is no threshold to compare against — say so instead of
        // reporting "all good" on a check that can never fire.
        blindSpots.push('No puedo vigilar el stock bajo: ningún ingrediente tiene stock mínimo configurado.');
    }
    const low = stock.filter((s: any) => {
        const ing: any = ingredients.find((i: any) => i.id === s.ingredientId);
        const min = Number(ing?.minStock) || 0;
        return min > 0 && s.quantityAvailable <= min * LOW_STOCK_FACTOR;
    });
    if (low.length) {
        items.push({
            id: 'stock-low',
            severity: 'warning',
            area: 'stock',
            title: `${low.length} ingrediente(s) en mínimo de stock`,
            detail: low.slice(0, 8).map((s: any) => `${s.ingredientName} (${s.quantityAvailable.toFixed(1)} ${s.unit})`).join(', '),
            entities: low.map((s: any) => s.ingredientName),
        });
    }

    // --- Suppliers: single-source risk ---
    const sourceCount = (i: any) =>
        i.supplierData ? Object.keys(i.supplierData).length
            : i.proveedores?.length ? i.proveedores.length
                : i.proveedor ? 1 : 0;
    const single = ingredients.filter((i: any) => sourceCount(i) === 1);
    if (single.length > 0 && ingredients.length > 0) {
        const pct = Math.round((single.length / ingredients.length) * 100);
        if (pct >= 25) {
            items.push({
                id: 'supplier-single-source',
                severity: 'info',
                area: 'proveedores',
                title: `${single.length} ingrediente(s) dependen de un solo proveedor (${pct}%)`,
                detail: single.slice(0, 6).map((i: any) => i.nombre).join(', '),
                entities: single.slice(0, 20).map((i: any) => i.nombre),
            });
        }
    }

    const withMargin = costed.filter(c => c.margin !== null);
    const avgMargin = withMargin.length
        ? withMargin.reduce((a, c) => a + (c.margin as number), 0) / withMargin.length
        : 0;

    // Money at stake first, then severity
    const rank = { critical: 0, warning: 1, info: 2 };
    items.sort((a, b) => rank[a.severity] - rank[b.severity] || (b.impact || 0) - (a.impact || 0));

    return {
        generatedAt: new Date().toISOString(),
        userId,
        stats: {
            recipes: recipes.length,
            ingredients: ingredients.length,
            menuItems: menu.length,
            inventoryValue: stock.reduce((a: number, s: any) => a + (s.totalValue || 0), 0),
            avgMargin,
        },
        items,
        blindSpots,
        quiet: items.filter(i => i.severity !== 'info').length === 0 && blindSpots.length === 0,
    };
}

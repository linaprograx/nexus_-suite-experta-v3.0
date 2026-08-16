import { Recipe, Ingredient, IngredientLineItem, StockItem } from '../types';
import { normalizeToBase, BaseUnit } from './packNormalization';
import { recipeTotalVolume } from '../core/costing/costCalculator';
import { indicePorId, resolverMaestro } from '../core/identity/masterProduct';

export interface DepletionLine {
    ingredientId: string;
    ingredientName: string;
    /** Amount to deduct, expressed in the STOCK item's own unit. */
    quantity: number;
    unit: string;
    /** Base-unit usage (ml/g/und), for display/debugging. */
    usedBaseQty: number;
    usedBase: BaseUnit | 'unknown';
    /** False when we could not safely convert to the stock unit (line is skipped). */
    resolved: boolean;
    note?: string;
}

interface Usage {
    ingredientId: string;
    name: string;
    qty: number;
    base: BaseUnit | 'unknown';
}

/**
 * Flattens a recipe into base-unit ingredient usages, expanding sub-recipes and
 * garnishes proportionally (component × usedQty / batchYield), mirroring how the
 * costing engine prorates them. Guards against circular references.
 */
const flattenUsages = (
    lines: IngredientLineItem[],
    factor: number,
    allRecipes: Recipe[],
    out: Map<string, Usage>,
    seen: Set<string>
): void => {
    for (const li of lines || []) {
        const isComposite = li.isSubRecipe || li.isGarnish || li.subItems || li.subRecipeId;

        if (isComposite) {
            // Resolve the batch: inline components, or a referenced saved recipe
            let batch: IngredientLineItem[] = (li.subItems || []) as IngredientLineItem[];
            let refId: string | undefined;
            if (batch.length === 0 && li.subRecipeId) {
                const ref = allRecipes.find(r => r.id === li.subRecipeId);
                if (ref && !seen.has(ref.id)) {
                    batch = (ref.ingredientes || []) as IngredientLineItem[];
                    refId = ref.id;
                }
            }
            if (batch.length === 0) continue;

            const yieldQty = recipeTotalVolume({ ingredientes: batch });
            if (yieldQty <= 0) continue;

            const usedNorm = normalizeToBase(li.cantidad || 0, li.unidad || 'ml');
            const used = usedNorm.base === 'unknown' ? (li.cantidad || 0) : usedNorm.qty;
            if (used <= 0) continue;

            const nextSeen = new Set(seen);
            if (refId) nextSeen.add(refId);
            // Each component contributes its share of the batch actually consumed
            flattenUsages(batch, factor * (used / yieldQty), allRecipes, out, nextSeen);
            continue;
        }

        if (!li.ingredientId) continue;
        const norm = normalizeToBase(li.cantidad || 0, li.unidad || 'ml');
        const qty = (norm.base === 'unknown' ? (li.cantidad || 0) : norm.qty) * factor;
        if (qty <= 0) continue;

        const prev = out.get(li.ingredientId);
        if (prev && prev.base === norm.base) {
            prev.qty += qty;
        } else if (!prev) {
            out.set(li.ingredientId, { ingredientId: li.ingredientId, name: li.nombre || '', qty, base: norm.base });
        } else {
            // Same ingredient used in two incompatible bases — keep the first, note the clash
            prev.qty += qty;
        }
    }
};

// A real pack is never smaller than ~10 ml/g nor larger than a 50 L keg. Used to reject
// corrupt values such as a unit label that ended up as "140542.000 L + 0.700 L".
const MIN_PACK = 10;
const MAX_PACK = 50000;
const isSanePack = (qty: number) => qty >= MIN_PACK && qty <= MAX_PACK;

/**
 * Reads a pack size out of a free-text unit label, e.g. "0.750 L" → 750 ml.
 * Scans EVERY number+unit pair and keeps the first sane one, so a corrupted label
 * like "140542.000 L + 0.700 L" still resolves to the real 700 ml pack.
 */
const packFromLabel = (text: string): { size: number; base: BaseUnit } | null => {
    const n = (text || '').toLowerCase().replace(/,/g, '.');
    const re = /([\d.]+)\s*(ml|cl|lt|l|kg|gr|g)\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(n)) !== null) {
        const qty = parseFloat(m[1]);
        if (!qty || isNaN(qty)) continue;
        const unit = m[2] === 'lt' ? 'l' : m[2] === 'gr' ? 'g' : m[2];
        const norm = normalizeToBase(qty, unit);
        if (norm.base !== 'ml' && norm.base !== 'g') continue;
        // "0.7 ml" style typo → treat as 0.7 L
        const fixed = norm.qty > 0 && norm.qty < MIN_PACK ? norm.qty * 1000 : norm.qty;
        if (isSanePack(fixed)) return { size: fixed, base: norm.base };
    }
    return null;
};

/** Pack size declared on the ingredient master, if usable. */
const packFromIngredient = (ing: Ingredient | undefined): { size: number; base: BaseUnit } | null => {
    if (!ing) return null;
    const std = Number(ing.standardQuantity);
    if (std > 0) {
        const stdBase = normalizeToBase(1, ing.standardUnit || 'ml').base;
        if (stdBase === 'ml' || stdBase === 'g') {
            const fixed = std < MIN_PACK ? std * 1000 : std;
            if (isSanePack(fixed)) return { size: fixed, base: stdBase };
        }
    }
    return packFromLabel(ing.unidadCompra || '') || packFromLabel(ing.nombre || '');
};

/** How many base units (ml/g) one unit of the stock's unit represents. */
const stockUnitSizeInBase = (
    stockUnit: string,
    ingredient: Ingredient | undefined,
    targetBase: BaseUnit | 'unknown'
): { size: number; base: BaseUnit | 'unknown' } => {
    const norm = normalizeToBase(1, stockUnit);

    // Clean volume/weight unit (L, kg, ml, g…) → 1 stock unit = norm.qty base units
    if (norm.base === 'ml' || norm.base === 'g') return { size: norm.qty, base: norm.base };

    // Counted per unit (bottle/box), OR an unrecognised label like "0.750 L":
    // both mean "each stock unit is one pack", so we just need the pack size.
    const pack = packFromIngredient(ingredient) || packFromLabel(stockUnit);
    if (pack) return { size: pack.size, base: pack.base };

    // No pack size anywhere: only safe when the recipe also counts in whole units
    if (norm.base === 'und' && targetBase === 'und') return { size: 1, base: 'und' };

    return { size: 1, base: 'unknown' };
};

/**
 * Computes the stock movements needed to produce/serve `servings` of a recipe.
 * Converts each ingredient's recipe quantity into the unit its stock is counted in.
 * Lines that cannot be converted safely are returned with resolved:false so the UI
 * can show them instead of silently deducting a wrong amount.
 */
export const computeRecipeDepletion = (
    recipe: Recipe,
    servings: number,
    allIngredients: Ingredient[],
    stockItems: StockItem[],
    allRecipes: Recipe[] = []
): DepletionLine[] => {
    const usages = new Map<string, Usage>();
    flattenUsages(
        (recipe.ingredientes || []) as IngredientLineItem[],
        Math.max(0, servings),
        allRecipes,
        usages,
        recipe.id ? new Set([recipe.id]) : new Set()
    );

    /**
     * Las existencias vienen consolidadas en el producto maestro, así que una
     * línea de receta que apunte a una ficha absorbida no encontraba stock y
     * salía como «Sin stock registrado» teniendo el almacén lleno.
     *
     * **El id que se emite NO cambia**, y es deliberado: el movimiento se anota
     * sobre la ficha que la receta nombra, y `buildCurrentStock` ya lo resuelve
     * al maestro al leerlo. Reescribirlo aquí sería decidir por el histórico.
     */
    const porIdIng = indicePorId(allIngredients);
    const maestroDe = (id: string) => resolverMaestro(id, porIdIng);

    const out: DepletionLine[] = [];
    for (const u of Array.from(usages.values())) {
        const ing = allIngredients.find(i => i.id === u.ingredientId);
        const idMaestro = maestroDe(u.ingredientId);
        const stock = stockItems.find(s => s.ingredientId === idMaestro)
            || stockItems.find(s => s.ingredientId === u.ingredientId);
        const name = ing?.nombre || u.name || 'Ingrediente';

        if (!stock) {
            out.push({ ingredientId: u.ingredientId, ingredientName: name, quantity: 0, unit: '—', usedBaseQty: u.qty, usedBase: u.base, resolved: false, note: 'Sin stock registrado' });
            continue;
        }

        const { size, base: stockBase } = stockUnitSizeInBase(stock.unit, ing, u.base);

        // ml↔g are treated 1:1 (density ≈ 1), same assumption the costing engine makes
        const compatible =
            stockBase === u.base ||
            ((stockBase === 'ml' || stockBase === 'g') && (u.base === 'ml' || u.base === 'g'));

        if (!compatible || size <= 0) {
            out.push({ ingredientId: u.ingredientId, ingredientName: name, quantity: 0, unit: stock.unit, usedBaseQty: u.qty, usedBase: u.base, resolved: false, note: `No se pudo convertir a "${stock.unit}"` });
            continue;
        }

        const qtyInStockUnit = u.qty / size;
        out.push({
            ingredientId: u.ingredientId,
            ingredientName: name,
            quantity: Math.round(qtyInStockUnit * 10000) / 10000,
            unit: stock.unit,
            usedBaseQty: u.qty,
            usedBase: u.base,
            resolved: true,
        });
    }

    return out.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
};

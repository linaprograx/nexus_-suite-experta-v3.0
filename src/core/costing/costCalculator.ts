import { Recipe, Ingredient, IngredientLineItem, PurchaseEvent } from '../../types';
import { buildStockFromPurchases } from '../../utils/stockUtils';
// Shared canonical unit logic — single source of truth (see src/utils/packNormalization.ts)
import {
    normalizeToBase,
    parsePackFromText as parsePackFromName,
    sanePackSize as sanePackSizeShared,
} from '../../utils/packNormalization';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

export interface CostedIngredient extends IngredientLineItem {
    costo: number;
}

export interface RecipeCostResult {
    costoTotal: number;
    costoPorIngrediente: CostedIngredient[];
}

// Enriches allIngredients with purchase-derived pricing (averageUnitCost from stock).
// Only overrides ingredients that have no price stored in master doc.
export const enrichIngredientsWithPurchases = (
    allIngredients: Ingredient[],
    purchaseHistory: PurchaseEvent[]
): Ingredient[] => {
    if (!purchaseHistory.length) return allIngredients;

    const stock = buildStockFromPurchases(purchaseHistory);
    const byId = new Map(stock.map(s => [s.ingredientId, s]));
    const byName = new Map(stock.map(s => [s.ingredientName.trim().toLowerCase(), s]));

    return allIngredients.map(ing => {
        // Already has a pre-computed per-base price — trust it
        if (toNum((ing as any).standardPrice) > 0) return ing;

        const s = byId.get(ing.id) || byName.get(ing.nombre.trim().toLowerCase());
        if (!s || s.averageUnitCost <= 0) return ing;

        const purchaseUnit = (s.unit || 'und').trim();
        const purchaseUnitNorm = normalizeToBase(1, purchaseUnit);

        let pricePerMl: number | null = null;
        let pricePerG: number | null = null;
        let pricePerUnd: number | null = null;

        if (purchaseUnitNorm.base === 'ml') {
            // averageUnitCost is €/(purchaseUnitNorm.qty ml), e.g. "L" → €/1000ml
            pricePerMl = s.averageUnitCost / purchaseUnitNorm.qty;
        } else if (purchaseUnitNorm.base === 'g') {
            pricePerG = s.averageUnitCost / purchaseUnitNorm.qty;
        } else {
            // unit is count (botellas, und, uds…) OR unknown volume string
            // Derive pack size from the ingredient name
            const parsed = parsePackFromName(ing.nombre);
            if (parsed) {
                const sizeNorm = normalizeToBase(parsed.qty, parsed.unit);
                if (sizeNorm.base === 'ml' && sizeNorm.qty >= 10) {
                    // Only trust if size is ≥10ml (safeguard against "0.7ml" typo → should be "0.7L")
                    pricePerMl = s.averageUnitCost / sizeNorm.qty;
                } else if (sizeNorm.base === 'ml' && sizeNorm.qty < 10) {
                    // Likely a typo: "0.7ML" meant "0.7L" → treat as liters
                    console.warn(`[COSTEO] "${ing.nombre}": tamaño ${sizeNorm.qty}ml parece erróneo — tratando como ${sizeNorm.qty * 1000}ml`);
                    pricePerMl = s.averageUnitCost / (sizeNorm.qty * 1000);
                } else if (sizeNorm.base === 'g') {
                    pricePerG = s.averageUnitCost / sizeNorm.qty;
                } else {
                    pricePerUnd = s.averageUnitCost; // size in 'und'
                }
            } else {
                // No size in name: treat as per-unit (€/botella, etc.)
                pricePerUnd = s.averageUnitCost;
            }
        }

        // Inject as standardPrice with standardUnit so resolvePricePerBase uses it directly
        if (pricePerMl !== null) {
            return { ...ing, standardPrice: pricePerMl, standardUnit: 'ml' } as Ingredient;
        } else if (pricePerG !== null) {
            return { ...ing, standardPrice: pricePerG, standardUnit: 'g' } as Ingredient;
        } else if (pricePerUnd !== null) {
            // Store as per-unit; the calculator will apply guessUnitSize for volume usage
            return { ...ing, precioCompra: pricePerUnd, standardQuantity: 0 } as Ingredient;
        }

        return ing;
    });
};

/**
 * Cuánto de un ingrediente consume una línea, **expresado en la unidad en la
 * que está su precio**. Es la pieza que reconcilia las unidades.
 *
 * Sin esto, «50 g de VAINILLA EN RAMA» a un precio de 2,17 € **por unidad** se
 * calculaba como 50 × 2,17 = 108,50 €. Con la conversión, 50 g de un envase de
 * 100 g son 0,5 unidades: 1,09 €.
 *
 * Los cuatro casos son los que el motor ya aplicaba; lo único nuevo es que
 * ahora viven en una función con nombre, para que **la exportación a Sheets use
 * exactamente la misma** en vez de una versión simplificada suya. Esa versión
 * simplificada —multiplicar cantidad por precio y ya— es la que produjo un
 * cóctel de 42,92 €.
 *
 * Devuelve también el `factor`: cuántas unidades de precio equivale una unidad
 * de la receta. La hoja lo necesita para escribir una fórmula que siga siendo
 * correcta si alguien cambia la cantidad.
 */
export const equivalenciaDeLinea = (
    lineItem: { cantidad?: number; unidad?: string },
    ingredient: Ingredient,
): { cantidad: number; precioPorBase: number; base: 'ml' | 'g' | 'und'; factor: number; nota?: string } | null => {
    const priceInfo = resolvePricePerBase(ingredient);
    const usageNorm = normalizeToBase(lineItem.cantidad || 0, lineItem.unidad || 'und');
    if (!priceInfo || usageNorm.base === 'unknown') return null;

    const salida = (cantidad: number, factor: number, nota?: string) =>
        ({ cantidad, precioPorBase: priceInfo.pricePerBase, base: priceInfo.base, factor, nota });

    if (priceInfo.base === usageNorm.base) return salida(usageNorm.qty, 1);

    // Densidad ≈ 1: 1 ml ≈ 1 g. La misma suposición que hace todo el motor.
    if ((priceInfo.base === 'g' && usageNorm.base === 'ml') || (priceInfo.base === 'ml' && usageNorm.base === 'g')) {
        return salida(usageNorm.qty, 1, 'Se asume densidad 1: 1 ml ≈ 1 g.');
    }

    // Se compra por unidades y se usa por volumen o peso.
    if (priceInfo.base === 'und' && (usageNorm.base === 'ml' || usageNorm.base === 'g')) {
        const size = guessUnitSize(ingredient.nombre);
        if (!(size > 0)) return null;
        return salida(usageNorm.qty / size, 1 / size, `Se compra por unidades de ~${size} ${usageNorm.base}.`);
    }

    // Se compra por volumen o peso y se usa «por unidad».
    if ((priceInfo.base === 'ml' || priceInfo.base === 'g') && usageNorm.base === 'und') {
        const size = guessUnitSize(ingredient.nombre);
        if (!(size > 0)) return null;
        return salida(usageNorm.qty * size, size, `Se estima 1 unidad ≈ ${size} ${priceInfo.base}.`);
    }

    return null;
};

export const calculateRecipeCost = (
    recipe: Partial<Recipe>,
    allIngredients: Ingredient[],
    purchaseHistory?: PurchaseEvent[],
    allRecipes: Recipe[] = [],
    _seen: Set<string> = new Set()
): RecipeCostResult => {
    const ingredients = purchaseHistory?.length
        ? enrichIngredientsWithPurchases(allIngredients, purchaseHistory)
        : allIngredients;

    if (!recipe.ingredientes || recipe.ingredientes.length === 0) {
        return { costoTotal: 0, costoPorIngrediente: [] };
    }

    // Track this recipe in the recursion chain to guard against circular sub-recipes
    if (recipe.id) _seen.add(recipe.id);

    // Name index for legacy recipes that have no ingredientId
    const byName = new Map<string, Ingredient>();
    for (const ing of ingredients) {
        if (ing.nombre) byName.set(ing.nombre.trim().toLowerCase(), ing);
    }

    /**
     * Índice para resolver el producto maestro.
     *
     * Antes esto buscaba `ingredients.find(i => i.id === lineItem.ingredientId)`
     * a secas. Como fusionar **no borra** el documento absorbido, la receta lo
     * encontraba igual y seguía costeando desde el alias: no se rompía, se
     * separaba en silencio. El día que se actualizara el precio en el maestro
     * —el único que Mercado enseña— la receta se quedaba con el viejo y nada se
     * quejaba. Un número tranquilo y equivocado, que es la peor clase.
     *
     * Con el catálogo sin alias, `resolverMaestro` devuelve el mismo id que
     * recibe: el resultado es idéntico al de antes, ficha por ficha.
     *
     * **El alias sigue siendo un camino válido de entrada**, no un error: la
     * receta que apunta a él es correcta. Lo que cambia es de dónde sale el
     * precio, que pasa a ser el del producto, no el de una de sus fichas.
     */
    const porId = indicePorId(ingredients);

    const costoPorIngrediente: CostedIngredient[] = [];
    let costoTotal = 0;

    for (const lineItem of recipe.ingredientes as IngredientLineItem[]) {
        // --- SUB-RECIPE line: a batch prorated by the ml used. The batch is either an
        //     inline `subItems` list OR a referenced reusable sub-recipe (`subRecipeId`). ---
        if (lineItem.isSubRecipe || lineItem.isGarnish || lineItem.subItems || lineItem.subRecipeId) {
            let itemCost = 0;

            // Prefer inline items; otherwise resolve the referenced reusable sub-recipe.
            let batchList = (lineItem.subItems || []) as IngredientLineItem[];
            let refId: string | undefined;
            if (batchList.length === 0 && lineItem.subRecipeId) {
                const ref = allRecipes.find(r => r.id === lineItem.subRecipeId);
                // Guard against circular references (a sub-recipe using itself, directly or indirectly)
                if (ref && !_seen.has(ref.id)) {
                    batchList = (ref.ingredientes || []) as IngredientLineItem[];
                    refId = ref.id;
                }
            }

            if (batchList.length > 0) {
                const seen = new Set(_seen);
                if (refId) seen.add(refId);
                const batch = calculateRecipeCost({ id: refId, ingredientes: batchList }, allIngredients, purchaseHistory, allRecipes, seen);
                const batchVolume = recipeTotalVolume({ ingredientes: batchList });
                const usageNorm = normalizeToBase(lineItem.cantidad || 0, lineItem.unidad || 'ml');
                const usedQty = usageNorm.base === 'unknown' ? (lineItem.cantidad || 0) : usageNorm.qty;
                if (batchVolume > 0) itemCost = (batch.costoTotal / batchVolume) * usedQty;
            }
            costoPorIngrediente.push({ ...lineItem, costo: itemCost });
            costoTotal += itemCost;
            continue;
        }

        // Match by id first, then fall back to name (fixes legacy/imported recipes)
        let ingredient = lineItem.ingredientId
            ? porId.get(resolverMaestro(lineItem.ingredientId, porId))
              // Si el id no está en el catálogo, no se pierde la línea: se
              // intenta tal cual antes de caer al nombre.
              || ingredients.find(i => i.id === lineItem.ingredientId)
            : undefined;
        if (!ingredient && lineItem.nombre) {
            ingredient = byName.get(lineItem.nombre.trim().toLowerCase());
        }

        let itemCost = 0;

        if (ingredient) {
            const eq = equivalenciaDeLinea(lineItem, ingredient);
            if (eq) itemCost = eq.cantidad * eq.precioPorBase;

        }

        costoPorIngrediente.push({ ...lineItem, costo: itemCost });
        costoTotal += itemCost;
    }

    return { costoTotal: Math.round(costoTotal * 10000) / 10000, costoPorIngrediente };
};

/**
 * Total volume a recipe yields, in its base unit (ml/g), used to prorate a sub-recipe's cost.
 * Sums the normalized quantities of its own ingredient lines. Sub-recipe lines contribute
 * the volume actually used (their cantidad), so nesting stays consistent.
 */
export const recipeTotalVolume = (recipe: Partial<Recipe>): number => {
    if (!recipe?.ingredientes) return 0;
    let total = 0;
    for (const line of recipe.ingredientes as IngredientLineItem[]) {
        const norm = normalizeToBase(line.cantidad || 0, line.unidad || 'ml');
        total += norm.base === 'unknown' ? (line.cantidad || 0) : norm.qty;
    }
    return total;
};

const toNum = (v: any): number => {
    if (v === undefined || v === null || v === '') return 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
};

// Reads the purchase/pack price from ANY of the fields the app uses across
// manual entry, CSV imports and supplier data.
const getAnyPackPrice = (ing: any): number => {
    for (const v of [ing.precioCompra, ing.costo, ing.cost, ing.price, ing.unitPrice, ing.lastPrice, ing.averageUnitCost]) {
        const n = toNum(v);
        if (n > 0) return n;
    }
    if (ing.supplierData) {
        const first: any = Object.values(ing.supplierData)[0];
        if (first && toNum(first.price) > 0) return toNum(first.price);
    }
    return 0;
};

// Resolves an ingredient's price PER BASE UNIT (€/ml, €/g, €/und), applying
// waste/merma. Reads price from any known field and infers pack size from the
// name when not stored explicitly.
/**
 * EXPORTADA a propósito. La usa la exportación de escandallos a Sheets para
 * escribir en «Materia Prima» **exactamente el mismo precio** que usa este
 * motor: ya ajustado por merma, y por unidad base.
 *
 * Copiarla allí habría creado una segunda fórmula de coste, que es lo único que
 * este proyecto no se puede permitir. Si esta cambia, la hoja cambia con ella.
 */
export const resolvePricePerBase = (ingredient: Ingredient): { pricePerBase: number; base: 'ml' | 'g' | 'und' } | null => {
    const ing = ingredient as any;
    const waste = (ing.merma ?? ing.wastePercentage ?? 0);
    const yieldFactor = Math.max(0.01, 1 - waste / 100);
    let stdUnit = ing.standardUnit || ing.unidadCompra || ing.unidad || 'und';

    // 1) Pre-computed standardPrice (price per standard unit, already waste-adjusted)
    const stdPrice = toNum(ing.standardPrice);
    if (stdPrice > 0) {
        const oneStd = normalizeToBase(1, stdUnit);
        if (oneStd.base !== 'unknown' && oneStd.qty > 0) {
            return { pricePerBase: stdPrice / oneStd.qty, base: oneStd.base };
        }
    }

    // 2) Pack price (any field) ÷ pack quantity
    const packPrice = getAnyPackPrice(ing);
    if (packPrice > 0) {
        // Determine pack quantity + unit (stored → supplierData format → parsed from name → sensible default)
        let qty = toNum(ing.standardQuantity);
        if (ing.supplierData) {
            const first: any = Object.values(ing.supplierData)[0];
            if (first?.formatQty) { qty = toNum(first.formatQty); stdUnit = first.formatUnit || stdUnit; }
        }
        if (qty <= 0) {
            const parsed = parsePackFromName(ing.nombre);
            if (parsed) { qty = parsed.qty; stdUnit = parsed.unit; }
        }
        if (qty <= 0) {
            // IMPORTANT: reset stdUnit to the base unit to avoid double-conversion
            // e.g. qty=700 with stdUnit="L" would give 700L = 700000ml — wrong!
            const baseGuess = normalizeToBase(1, stdUnit).base;
            if (baseGuess === 'g') { qty = 1000; stdUnit = 'g'; }
            else if (baseGuess === 'und') { qty = 1; stdUnit = 'und'; }
            else { qty = 700; stdUnit = 'ml'; } // default 700ml bottle
        }
        const packNorm = sanePackSizeShared(normalizeToBase(qty, stdUnit));
        if (packNorm.base !== 'unknown' && packNorm.qty > 0) {
            return { pricePerBase: (packPrice / packNorm.qty) / yieldFactor, base: packNorm.base };
        }
    }

    return null;
};

// Bottle/pack size (ml/g) heuristic when an ingredient is sold by 'und' but used by volume/weight.
const guessUnitSize = (name: string): number => {
    const parsed = parsePackFromName(name);
    if (parsed && (parsed.unit === 'ml' || parsed.unit === 'l' || parsed.unit === 'cl')) {
        return normalizeToBase(parsed.qty, parsed.unit).qty;
    }
    return 1000; // default 1 L / 1 Kg
};

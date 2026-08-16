/**
 * Canonical pack-size normalization — single source of truth for converting any
 * supplier/manual format into consistent base units (ml / g / und).
 *
 * Used at INGEST time (CSV import + manual ingredient form) so every product is
 * stored with a normalized `standardUnit` (ml|g|und) + `standardQuantity`,
 * regardless of how the source wrote it ("0,7 L", "700ml", "70cl" → 700 ml).
 *
 * The costing engine (src/core/costing/costCalculator.ts) re-exports
 * `normalizeToBase` from here so import and calculation never diverge.
 */

export type BaseUnit = 'ml' | 'g' | 'und';

// --- Conversion factors to a base unit ---
const UNIT_CONVERSIONS: { [key: string]: { to: BaseUnit; factor: number } } = {
    // Volume → ml
    'cl': { to: 'ml', factor: 10 },
    'l': { to: 'ml', factor: 1000 },
    'oz': { to: 'ml', factor: 29.57 },
    'gal': { to: 'ml', factor: 3785.41 },
    'dash': { to: 'ml', factor: 0.9 },
    'dashes': { to: 'ml', factor: 0.9 },
    'drop': { to: 'ml', factor: 0.05 },
    'barspoon': { to: 'ml', factor: 5 },
    'tsp': { to: 'ml', factor: 5 },
    'tbsp': { to: 'ml', factor: 15 },
    'botella70': { to: 'ml', factor: 700 },
    'botella75': { to: 'ml', factor: 750 },
    // Weight → g
    'kg': { to: 'g', factor: 1000 },
    'lb': { to: 'g', factor: 453.59 },
    'oz_weight': { to: 'g', factor: 28.35 },
    // Count → und
    'pieza': { to: 'und', factor: 1 },
    'rebanada': { to: 'und', factor: 1 },
    'rodaja': { to: 'und', factor: 1 },
    'slice': { to: 'und', factor: 1 },
    'hoja': { to: 'und', factor: 1 },
};

// Aliases → canonical short unit
const ALIASES: { [key: string]: string } = {
    'litro': 'l', 'litros': 'l', 'lt': 'l', 'l': 'l',
    'ml': 'ml', 'mililitro': 'ml', 'mililitros': 'ml',
    'oz': 'oz', 'onza': 'oz', 'onzas': 'oz',
    'cl': 'cl', 'centilitro': 'cl', 'centilitros': 'cl',
    'g': 'g', 'gramo': 'g', 'gramos': 'g', 'gr': 'g',
    'kg': 'kg', 'kilo': 'kg', 'kilos': 'kg', 'kilogramo': 'kg',
    'lb': 'lb', 'libra': 'lb',
    'gal': 'gal', 'galon': 'gal',
    'und': 'und', 'unidad': 'und', 'unidades': 'und', 'pieza': 'und',
    'ud': 'und', 'uds': 'und', 'u': 'und', 'pza': 'und', 'caja': 'und', 'botella': 'und',
};

/**
 * Normalize a (quantity, unit) pair to its base unit (ml | g | und).
 * Returns base 'unknown' if the unit can't be resolved.
 */
export const normalizeToBase = (
    quantity: number,
    unit: string
): { qty: number; base: BaseUnit | 'unknown' } => {
    const u = ALIASES[(unit || '').toLowerCase().trim()] || (unit || '').toLowerCase().trim();

    if (u === 'ml') return { qty: quantity, base: 'ml' };
    if (u === 'g') return { qty: quantity, base: 'g' };
    if (u === 'und') return { qty: quantity, base: 'und' };

    const conv = UNIT_CONVERSIONS[u];
    if (conv) return { qty: quantity * conv.factor, base: conv.to };

    return { qty: quantity, base: 'unknown' };
};

/**
 * Extract a pack size (qty + raw unit) from free text such as an ingredient name
 * or a "unidad de compra" string.
 *   "FEVERTREE SODA 0,200 LT"  → { qty: 0.2, unit: 'l' }
 *   "Botella 700ml"            → { qty: 700, unit: 'ml' }
 *   "CAJA 1000 UD"             → { qty: 1000, unit: 'und' }
 *   "70cl"                     → { qty: 70, unit: 'cl' }
 */
export const parsePackFromText = (text: string): { qty: number; unit: string } | null => {
    const n = (text || '').toLowerCase().replace(',', '.');

    // qty + explicit unit (volume/weight).
    // `grs`, `gramos` y `kgs` entran aquí porque el catálogo real los escribe
    // así: «ALGA ... SALAZON 200 GRS», «CAVIAR ... BANDEJA 100 GRS». Sin ellos
    // pasaban dos cosas, las dos malas y ninguna visible:
    //   · 200 y 500 caían en la lista de tamaños de botella y se leían como
    //     MILILITROS — número bueno, unidad equivocada;
    //   · 100 y 400 no caían en ninguna parte y `resolveStandardPack` aplicaba
    //     su valor por defecto de 700 ml, así que una bandeja de 100 g salía
    //     costando como si trajera 700: SIETE VECES más barata de lo real.
    // El orden importa: las formas largas van antes que las cortas, o `g`
    // consumiría la `g` de `grs` y dejaría la `rs` colgando.
    let m = n.match(/([\d.]+)\s*(ml|cl|lt|l|kgs|kg|gramos|gramo|grs|gr|g)\b/);
    if (m) {
        const q = parseFloat(m[1]);
        const u = m[2];
        const unidad = u === 'lt' ? 'l'
            : u === 'kgs' ? 'kg'
            : (u === 'gr' || u === 'grs' || u === 'gramo' || u === 'gramos') ? 'g'
            : u;
        return { qty: q, unit: unidad };
    }
    // qty + count unit
    m = n.match(/([\d.]+)\s*(uds|unidades|und|ud|pieza|caja)\b/);
    if (m) return { qty: parseFloat(m[1]), unit: 'und' };
    // bare common bottle/can sizes (assume ml)
    m = n.match(/\b(1500|1000|750|700|500|355|330|250|200|187)\b/);
    if (m) return { qty: parseFloat(m[1]), unit: 'ml' };

    return null;
};

/**
 * Guards against the classic data error of a pack size stored in liters/kilos but
 * labelled ml/g (e.g. "0.7 ml" instead of 0.7 L = 700ml). No real ingredient is
 * sold in a pack smaller than ~10 ml / 10 g, so anything below that is off by ×1000.
 */
export const sanePackSize = (
    norm: { qty: number; base: BaseUnit | 'unknown' }
): { qty: number; base: BaseUnit | 'unknown' } => {
    if ((norm.base === 'ml' || norm.base === 'g') && norm.qty > 0 && norm.qty < 10) {
        return { qty: norm.qty * 1000, base: norm.base };
    }
    return norm;
};

/**
 * Resolve a canonical { standardUnit, standardQuantity } from whatever the source
 * provides: an explicit unit/qty, a "unidad de compra" string, and/or the name.
 * This is what should be persisted on every ingredient so the costing engine
 * never has to guess.
 */
export const resolveStandardPack = (input: {
    name?: string;
    unitText?: string;        // e.g. "Botella 700ml", "0,7 L", "70cl", "kg", "und"
    explicitQty?: number;     // optional numeric quantity if known
    explicitUnit?: string;    // optional unit paired with explicitQty
}): { standardUnit: BaseUnit; standardQuantity: number } => {
    const { name, unitText, explicitQty, explicitUnit } = input;

    // 1) Explicit qty + unit wins
    if (explicitQty && explicitQty > 0 && explicitUnit) {
        const norm = sanePackSize(normalizeToBase(explicitQty, explicitUnit));
        if (norm.base !== 'unknown') return { standardUnit: norm.base, standardQuantity: norm.qty };
    }

    // 2) Parse from the unit-of-purchase text ("Botella 700ml", "0,7 L"…)
    const fromUnitText = unitText ? parsePackFromText(unitText) : null;
    if (fromUnitText) {
        const norm = sanePackSize(normalizeToBase(fromUnitText.qty, fromUnitText.unit));
        if (norm.base !== 'unknown') return { standardUnit: norm.base, standardQuantity: norm.qty };
    }

    // 3) Parse from the ingredient name
    const fromName = name ? parsePackFromText(name) : null;
    if (fromName) {
        const norm = sanePackSize(normalizeToBase(fromName.qty, fromName.unit));
        if (norm.base !== 'unknown') return { standardUnit: norm.base, standardQuantity: norm.qty };
    }

    // 4) A bare unit with no quantity ("kg", "l", "und") → 1 of that base
    if (unitText) {
        const bareNorm = normalizeToBase(1, unitText);
        if (bareNorm.base === 'g') return { standardUnit: 'g', standardQuantity: 1000 };  // assume 1kg pack
        if (bareNorm.base === 'ml') return { standardUnit: 'ml', standardQuantity: 700 }; // assume 700ml bottle
        if (bareNorm.base === 'und') return { standardUnit: 'und', standardQuantity: 1 };
    }

    // 5) Sensible default: a 700ml bottle (most common in a bar inventory)
    return { standardUnit: 'ml', standardQuantity: 700 };
};

/** Human-friendly display, e.g. (700,'ml') → "700 ml", (1000,'g') → "1 kg". */
export const formatPackDisplay = (qty: number, unit: BaseUnit | string): string => {
    if (!qty || qty <= 0) return '—';
    if (unit === 'ml' && qty >= 1000 && qty % 100 === 0) return `${qty / 1000} L`;
    if (unit === 'g' && qty >= 1000 && qty % 100 === 0) return `${qty / 1000} kg`;
    return `${qty} ${unit}`;
};

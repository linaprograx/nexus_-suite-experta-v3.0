export const normalizeToBaseUnit = (
    amount: number,
    unit: string,
    targetBase: 'g' | 'ml' | 'units' = 'units'
): number => {
    if (!amount || amount <= 0) return 0;

    const u = unit.toLowerCase().trim();

    // Mass: Target 'g'
    if (targetBase === 'g') {
        if (u === 'kg' || u === 'kilo' || u === 'kilogramo') return amount * 1000;
        if (u === 'mg') return amount / 1000;
        if (u === 'g' || u === 'gr' || u === 'gramo') return amount;
        // Fallback for volumetric mapping if density ~1 (water)
        if (u === 'l' || u === 'litro') return amount * 1000;
        if (u === 'ml') return amount;
    }

    // Volume: Target 'ml'
    if (targetBase === 'ml') {
        if (u === 'l' || u === 'litro' || u === 'liter') return amount * 1000;
        if (u === 'cl') return amount * 10;
        if (u === 'dl') return amount * 100;
        if (u === 'ml') return amount;
        // Fallback via density=1
        if (u === 'kg') return amount * 1000;
        if (u === 'g') return amount;
    }

    // Fallback: return raw amount
    return amount;
};

export const calculateNormalizedUnitPrice = (
    price: number,
    qty: number,
    unit: string,
    base: 'g' | 'ml' | 'units'
): number | null => {
    if (!price || price <= 0) return null;
    const normalizedQty = normalizeToBaseUnit(qty, unit, base);
    if (normalizedQty <= 0) return null;
    return price / normalizedQty;
};

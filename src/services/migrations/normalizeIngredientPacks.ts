import { Firestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { resolveStandardPack } from '../../utils/packNormalization';
import { calculateIngredientPrice } from '../../utils/costCalculator';

export interface MigrationResult {
    total: number;
    updated: number;
    skipped: number;
    errors: number;
}

const toNum = (v: any): number => {
    if (v === undefined || v === null || v === '') return 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
};

/**
 * One-shot migration: walk the entire ingredient catalog and backfill canonical
 * `standardUnit` + `standardQuantity` (+ `standardPrice` when a price exists) for
 * every product, using the same normalization the importer/form now apply.
 *
 * Idempotent: rows that already have a sane standardUnit+standardQuantity in a
 * base unit (ml|g|und) and matching standardPrice are left untouched.
 */
export const normalizeIngredientPacks = async (
    db: Firestore,
    appId: string,
    userId: string
): Promise<MigrationResult> => {
    const colPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const snap = await getDocs(collection(db, colPath));

    const result: MigrationResult = { total: snap.size, updated: 0, skipped: 0, errors: 0 };

    // Firestore batches cap at 500 writes — chunk them.
    let batch = writeBatch(db);
    let opsInBatch = 0;
    const commits: Promise<void>[] = [];

    const BASE_UNITS = new Set(['ml', 'g', 'und']);

    for (const d of snap.docs) {
        try {
            const ing: any = d.data();

            const curUnit = (ing.standardUnit || '').toLowerCase();
            const curQty = toNum(ing.standardQuantity);
            const alreadyCanonical = BASE_UNITS.has(curUnit) && curQty >= 10 || (curUnit === 'und' && curQty >= 1);

            // Resolve canonical pack from whatever the row has
            const { standardUnit, standardQuantity } = resolveStandardPack({
                name: ing.nombre,
                unitText: ing.unidadCompra || ing.standardUnit,
                explicitQty: curQty,
                explicitUnit: ing.standardUnit,
            });

            const price = toNum(ing.precioCompra) || toNum(ing.costo) || toNum(ing.standardPrice && standardQuantity ? ing.standardPrice * standardQuantity : 0);
            const waste = toNum(ing.merma ?? ing.wastePercentage ?? 0);
            const standardPrice = price > 0 ? calculateIngredientPrice(price, standardQuantity, waste) : toNum(ing.standardPrice);

            const needsUpdate =
                !alreadyCanonical ||
                ing.standardUnit !== standardUnit ||
                curQty !== standardQuantity ||
                (price > 0 && Math.abs(toNum(ing.standardPrice) - standardPrice) > 1e-9);

            if (!needsUpdate) {
                result.skipped++;
                continue;
            }

            const updates: any = { standardUnit, standardQuantity };
            if (standardPrice > 0) updates.standardPrice = standardPrice;

            batch.update(doc(db, colPath, d.id), updates);
            opsInBatch++;
            result.updated++;

            if (opsInBatch >= 450) {
                commits.push(batch.commit());
                batch = writeBatch(db);
                opsInBatch = 0;
            }
        } catch (e) {
            console.error('[MIGRATION] error en ingrediente', d.id, e);
            result.errors++;
        }
    }

    if (opsInBatch > 0) commits.push(batch.commit());
    await Promise.all(commits);

    return result;
};

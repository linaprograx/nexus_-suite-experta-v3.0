import { Firestore, collection, doc, getDocs, writeBatch } from 'firebase/firestore';

/**
 * Correcciones exclusivamente editoriales y de taxonomía inequívoca.
 *
 * No hay fuzzy matching: una fila solo cambia cuando su categoría coincide de
 * forma exacta con una clave de este mapa. Los casos que requieren entender el
 * producto (por ejemplo `SEC`, `ESPECIALES KOPPER` o `Importado`) quedan fuera.
 */
export const CATEGORY_NORMALIZATION_MAP: Readonly<Record<string, string>> = {
    'ALGAS FRESCOS': 'Algas frescas',
    'AZUCAR': 'Azúcar',
    'CACHAZA': 'Cachaça',
    'ESPECIALES BROTES': 'Brotes',
    'ESPECIALES FLORES': 'Flores',
    'ESPECIALES GERMINADOS': 'Germinados',
    'ESPECIALES HOJAS': 'Hojas',
    'ESPECIALES MICROS': 'Microbrotes',
    'ESPECIALES SUCULENTAS': 'Suculentas',
    'FRUTAS CITRICOS': 'Cítricos',
    'FRUTAS FRESCOS': 'Frutas frescas',
    'FRUTOS ROJOS FRESCOS': 'Frutos rojos',
    'FRUTOS SECOS FRUTOS SECOS': 'Frutos secos',
    'HIERBAS AROMATICAS FRESCOS': 'Hierbas frescas',
    'HORTALIZAS FRESCOS': 'Hortalizas frescas',
    'LECHUGAS Y ENSALADAS FRESCOS': 'Ensaladas frescas',
    'LICOR': 'Licores',
    'PATATAS, RAICES Y TUBERCULOS FRESCOS': 'Tubérculos frescos',
    'PURE': 'Purés',
    'PURÉ': 'Purés',
    'REFRESCO': 'Refrescos',
    'SETAS Y HONGOS FRESCOS': 'Setas frescas',
    'SIROPE': 'Siropes',
    'TROPICALES FRESCOS': 'Frutas tropicales',
    'VERDURAS CORTADOS': 'Verduras cortadas',
    'VERDURAS FRESCOS': 'Verduras frescas',
    'botánicos y especias': 'Botánicos y especias',
    'botánicos y hierbas': 'Botánicos y hierbas',
    'destilados': 'Destilados',
    'frutas y cítricos': 'Frutas y cítricos',
    'licores': 'Licores',
    'refrescos': 'Refrescos',
    'siropes': 'Siropes',
    'texturizantes': 'Texturizantes',
};

export interface CategoryNormalizationPreview {
    total: number;
    affected: number;
    byChange: Array<{ from: string; to: string; count: number }>;
}

export interface CategoryNormalizationResult extends CategoryNormalizationPreview {
    updated: number;
    skipped: number;
    errors: number;
}

const buildPreview = (rows: Array<{ categoria?: string }>): CategoryNormalizationPreview => {
    const counts = new Map<string, number>();

    rows.forEach(({ categoria }) => {
        const replacement = categoria ? CATEGORY_NORMALIZATION_MAP[categoria] : undefined;
        if (!replacement || replacement === categoria) return;
        const key = `${categoria}\u0000${replacement}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const byChange = Array.from(counts, ([key, count]) => {
        const [from, to] = key.split('\u0000');
        return { from, to, count };
    }).sort((a, b) => a.from.localeCompare(b.from, 'es'));

    return {
        total: rows.length,
        affected: byChange.reduce((sum, change) => sum + change.count, 0),
        byChange,
    };
};

export const previewIngredientCategoryNormalization = (
    ingredients: Array<{ categoria?: string }>,
): CategoryNormalizationPreview => buildPreview(ingredients);

/**
 * Applies the approved editorial category cleanup in Firestore-safe chunks.
 * Each updated row keeps its exact previous value in `categoriaAntesDeNormalizar`
 * so a rollback remains possible without touching recipes, stock or prices.
 */
export const normalizeIngredientCategories = async (
    db: Firestore,
    appId: string,
    userId: string,
): Promise<CategoryNormalizationResult> => {
    const colPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const snapshot = await getDocs(collection(db, colPath));
    const rows = snapshot.docs.map(row => row.data() as { categoria?: string });
    const preview = buildPreview(rows);
    const result: CategoryNormalizationResult = {
        ...preview,
        updated: 0,
        skipped: 0,
        errors: 0,
    };

    let batch = writeBatch(db);
    let operations = 0;
    const commits: Promise<void>[] = [];

    for (const row of snapshot.docs) {
        const categoria = (row.data() as { categoria?: string }).categoria;
        const replacement = categoria ? CATEGORY_NORMALIZATION_MAP[categoria] : undefined;

        if (!replacement || replacement === categoria) {
            result.skipped++;
            continue;
        }

        try {
            batch.update(doc(db, colPath, row.id), {
                categoria: replacement,
                categoriaAntesDeNormalizar: categoria,
            });
            operations++;
            result.updated++;

            // Firestore allows 500 operations; retain margin for safety.
            if (operations >= 450) {
                commits.push(batch.commit());
                batch = writeBatch(db);
                operations = 0;
            }
        } catch (error) {
            console.error('[CATEGORY_NORMALIZATION] error en ingrediente', row.id, error);
            result.errors++;
        }
    }

    if (operations > 0) commits.push(batch.commit());
    await Promise.all(commits);
    return result;
};

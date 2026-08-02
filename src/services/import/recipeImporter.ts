import { collection, doc, writeBatch, serverTimestamp, Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Recipe, Ingredient } from '../../types';
import { parseMultipleRecipes } from '../../utils/recipeImporter';
import { parseCsvRecipes } from '../../utils/csvRecipeImporter';
import { importPdfRecipes } from '../../lib/pdf/importPdfRecipes';
import { parseEuroNumber } from "../../utils/parseEuroNumber";
import { resolveStandardPack } from "../../utils/packNormalization";
import { calculateIngredientPrice } from "../../utils/costCalculator";

/**
 * Parse one CSV line respecting quoted fields (so a value like
 * "Ron Bacardi, Carta Blanca" doesn't get split on its inner comma).
 */
const parseCsvLine = (line: string, delimiter: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
            else inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
            out.push(cur); cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out.map(s => s.trim().replace(/^"|"$/g, ''));
};

/** Detect the delimiter from the header row (; preferred for ES Excel, else ,). */
const detectDelimiter = (headerLine: string): string => {
    const semi = (headerLine.match(/;/g) || []).length;
    const comma = (headerLine.match(/,/g) || []).length;
    const tab = (headerLine.match(/\t/g) || []).length;
    if (tab > semi && tab > comma) return '\t';
    return semi >= comma ? ';' : ',';
};

/** Map a header cell to a known logical column. Accent/case-insensitive. */
const normalizeHeader = (h: string): string =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Service to handle all Recipe and Ingredient import logic.
 * Decouples huge blocks of code from GrimoriumView.
 */
export const recipeImporter = {

    /**
     * Import Recipes from a TXT file (Gemini Format).
     */
    async importFromTxt(
        file: File,
        db: Firestore,
        userId: string,
        allIngredients: Ingredient[]
    ): Promise<number> {
        const text = await file.text();
        const newRecipes = parseMultipleRecipes(text, allIngredients);

        if (newRecipes.length === 0) return 0;

        const batch = writeBatch(db);
        const recipesCollection = collection(db, `users/${userId}/grimorio`);
        newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
        await batch.commit();

        return newRecipes.length;
    },

    /**
     * Import Recipes from PDF (with OCR option).
     */
    async importFromPdf(
        file: File,
        db: Firestore,
        storage: FirebaseStorage,
        userId: string,
        allIngredients: Ingredient[],
        useOcr: boolean
    ): Promise<number> {
        const newRecipes = await importPdfRecipes(file, db, storage, userId, allIngredients, useOcr);

        if (newRecipes.length === 0) return 0;

        const batch = writeBatch(db);
        const recipesCollection = collection(db, `users/${userId}/grimorio`);
        newRecipes.forEach(recipe => batch.set(doc(recipesCollection), recipe));
        await batch.commit();

        return newRecipes.length;
    },

    /**
     * Import Ingredients from CSV (Ingredients Mode).
     */
    async importIngredientsFromCsv(
        file: File,
        db: Firestore,
        appId: string,
        userId: string,
        allIngredients: Ingredient[],
        supplierId: string = ""
    ): Promise<{ created: number; updated: number }> {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) return { created: 0, updated: 0 };

        const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
        const delimiter = detectDelimiter(lines[0]);

        // --- Header detection: map logical columns to indices ---
        // Supports both labelled headers and the legacy positional format
        // (col0=nombre, col1=categoria, col2=precio, col3=unidad).
        const headerCells = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
        const findCol = (...aliases: string[]) =>
            headerCells.findIndex(h => aliases.some(a => h === a || h.includes(a)));

        const looksLikeHeader = headerCells.some(h =>
            ['nombre', 'producto', 'precio', 'price', 'categoria', 'unidad', 'formato'].some(k => h.includes(k))
        );

        const idx = looksLikeHeader
            ? {
                name: Math.max(0, findCol('nombre', 'producto', 'articulo', 'descripcion')),
                category: findCol('categoria', 'familia', 'tipo'),
                price: findCol('precio', 'price', 'coste', 'costo', 'pvp'),
                unit: findCol('unidad', 'formato', 'envase', 'presentacion'),
            }
            : { name: 0, category: 1, price: 2, unit: 3 };

        const dataLines = looksLikeHeader ? lines.slice(1) : lines;

        const batch = writeBatch(db);
        let count = 0;
        let updatedCount = 0;
        const existingMap = new Map(allIngredients.map(i => [i.nombre.toLowerCase().trim(), i]));

        for (const line of dataLines) {
            const cols = parseCsvLine(line, delimiter);
            const name = (cols[idx.name] || '').trim();
            if (!name) continue;

            const normalizedName = name.toLowerCase();
            const price = parseEuroNumber(cols[idx.price] ?? '');
            const unitText = (idx.unit >= 0 ? cols[idx.unit] : '')?.trim() || '';
            const category = (idx.category >= 0 ? cols[idx.category] : '')?.trim() || 'General';

            // --- NORMALIZE pack into canonical standardUnit + standardQuantity ---
            // Handles "0,7 L", "700ml", "70cl", "kg", "und" → always ml/g/und.
            const { standardUnit, standardQuantity } = resolveStandardPack({
                name,
                unitText,
            });
            // Per-base price (€/ml, €/g, €/und), already used by the costing engine.
            const standardPrice = calculateIngredientPrice(price, standardQuantity, 0);

            const existingIngredient = existingMap.get(normalizedName);

            if (existingIngredient) {
                const ingredientRef = doc(db, ingredientsColPath, existingIngredient.id);
                const updates: any = {};
                let needsUpdate = false;

                if (supplierId && !existingIngredient.proveedores?.includes(supplierId)) {
                    const currentSuppliers = existingIngredient.proveedores || [];
                    updates.proveedores = [...currentSuppliers, supplierId];
                    needsUpdate = true;
                }

                if (supplierId) {
                    const currentSupplierData = existingIngredient.supplierData || {};
                    updates.supplierData = {
                        ...currentSupplierData,
                        [supplierId]: {
                            price, unit: unitText || existingIngredient.unidadCompra || 'und',
                            formatQty: standardQuantity, formatUnit: standardUnit,
                            lastUpdated: serverTimestamp()
                        }
                    };
                    needsUpdate = true;
                }

                // Refresh price + canonical pack if missing or stale
                if (price > 0 && (!existingIngredient.precioCompra || existingIngredient.precioCompra === 0)) {
                    updates.precioCompra = price;
                }
                if (!existingIngredient.standardQuantity || !existingIngredient.standardUnit) {
                    updates.standardUnit = standardUnit;
                    updates.standardQuantity = standardQuantity;
                    if (standardPrice > 0) updates.standardPrice = standardPrice;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    batch.update(ingredientRef, updates);
                    updatedCount++;
                }
            } else {
                const newDocRef = doc(collection(db, ingredientsColPath));
                const dataToSave: any = {
                    nombre: name,
                    categoria: category,
                    precioCompra: price,
                    unidadCompra: unitText || `${standardQuantity} ${standardUnit}`,
                    // Canonical normalized pack — costing never has to guess again
                    standardUnit,
                    standardQuantity,
                    standardPrice: standardPrice > 0 ? standardPrice : undefined,
                    proveedores: supplierId ? [supplierId] : [],
                    supplierData: supplierId ? {
                        [supplierId]: {
                            price, unit: unitText || 'und',
                            formatQty: standardQuantity, formatUnit: standardUnit,
                            lastUpdated: serverTimestamp()
                        }
                    } : {}
                };
                // Firestore rejects `undefined` — strip it
                Object.keys(dataToSave).forEach(k => dataToSave[k] === undefined && delete dataToSave[k]);
                batch.set(newDocRef, dataToSave);
                count++;
            }
        }
        await batch.commit();
        return { created: count, updated: updatedCount };
    },

    /**
     * Import Recipes from CSV (Recipes Mode).
     * Handles ingredient creation on the fly.
     */
    async importRecipesFromCsv(
        file: File,
        db: Firestore,
        appId: string,
        userId: string,
        allIngredients: Ingredient[]
    ): Promise<{ recipesCount: number; ingredientsCount: number }> {
        const text = await file.text();
        const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

        // 1. Parse
        const { recipes, newIngredients } = parseCsvRecipes(text, allIngredients);

        if (recipes.length === 0) return { recipesCount: 0, ingredientsCount: 0 };

        const batch = writeBatch(db);
        const createdIngredientIds = new Map<string, string>(); // name -> id

        // 2. Create Missing Ingredients
        if (newIngredients.length > 0) {
            for (const name of newIngredients) {
                const newDocRef = doc(collection(db, ingredientsColPath));
                batch.set(newDocRef, {
                    nombre: name,
                    categoria: 'Importado',
                    precioCompra: 0,
                    unidadCompra: 'und',
                    stockActual: 0,
                    proveedores: []
                });
                createdIngredientIds.set(name.toLowerCase(), newDocRef.id);
            }
        }

        // 3. Create Recipes
        const recipesCollection = collection(db, `users/${userId}/grimorio`);
        recipes.forEach(recipe => {
            const newRecipeRef = doc(recipesCollection);

            // Link ingredients
            const fixedIngredients = recipe.ingredientes?.map(line => {
                if (!line.ingredientId && line.nombre) {
                    const newId = createdIngredientIds.get(line.nombre.toLowerCase());
                    if (newId) return { ...line, ingredientId: newId };
                }
                return line;
            });

            batch.set(newRecipeRef, {
                ...recipe,
                ingredientes: fixedIngredients,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
        return { recipesCount: recipes.length, ingredientsCount: newIngredients.length };
    }
};

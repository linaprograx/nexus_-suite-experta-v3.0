import { collection, doc, writeBatch, serverTimestamp, Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Recipe, Ingredient } from '../../types';
import { parseMultipleRecipes } from '../../utils/recipeImporter';
import { parseCsvRecipes } from '../../utils/csvRecipeImporter';
import { importPdfRecipes } from '../../lib/pdf/importPdfRecipes';
import { parseEuroNumber } from "../../utils/parseEuroNumber";

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
        const rows = text.split('\n').slice(1);
        const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

        const batch = writeBatch(db);
        let count = 0;
        let updatedCount = 0;
        const existingMap = new Map(allIngredients.map(i => [i.nombre.toLowerCase().trim(), i]));

        for (const row of rows) {
            if (!row.trim()) continue;
            const cols = row.split(text.includes(';') ? ';' : ',');
            if (!cols[0]) continue;

            const name = cols[0].trim();
            const normalizedName = name.toLowerCase();
            const price = parseEuroNumber(cols[2]);
            const unit = cols[3]?.trim() || 'und';
            const category = cols[1]?.trim() || 'General';

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
                        [supplierId]: { price: price, unit: unit, lastUpdated: serverTimestamp() }
                    };
                    // Update global price if 0 or new
                    if (!existingIngredient.precioCompra || existingIngredient.precioCompra === 0) {
                        updates.precioCompra = price;
                    }
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
                    unidadCompra: unit,
                    proveedores: supplierId ? [supplierId] : [],
                    supplierData: supplierId ? {
                        [supplierId]: { price: price, unit: unit, lastUpdated: serverTimestamp() }
                    } : {}
                };
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

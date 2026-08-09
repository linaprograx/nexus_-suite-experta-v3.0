import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import { Firestore } from 'firebase/firestore';

export const grimoriumService = {
    // --- RECIPES ---
    addRecipe: async (db: Firestore, userId: string, recipeData: Partial<Recipe>) => {
        const collectionRef = collection(db, `users/${userId}/grimorio`);
        const docRef = await addDoc(collectionRef, {
            ...recipeData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateRecipe: async (db: Firestore, userId: string, recipeId: string, updates: Partial<Recipe>) => {
        const docRef = doc(db, `users/${userId}/grimorio`, recipeId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    deleteRecipe: async (db: Firestore, userId: string, recipeId: string) => {
        const docRef = doc(db, `users/${userId}/grimorio`, recipeId);
        await deleteDoc(docRef);
    },

    // --- INGREDIENTS ---
    //
    // ⚠️ CUIDADO: estas cinco funciones apuntan a `users/{uid}/ingredients`, que
    // NO existe. Los ingredientes viven en
    // `artifacts/{appId}/users/{uid}/grimorio-ingredients`, y para construir esa
    // ruta hace falta `appId`, que estas firmas no reciben.
    //
    // Hoy no las llama nadie, así que no hacen daño — pero si alguien las usa,
    // escribirá en el vacío sin ningún error, igual que le pasaba a
    // `deleteRecipe`. Antes de usarlas hay que corregir la ruta Y la firma.
    addIngredient: async (db: Firestore, userId: string, ingredientData: Partial<Ingredient>) => {
        const collectionRef = collection(db, `users/${userId}/ingredients`);
        const docRef = await addDoc(collectionRef, {
            ...ingredientData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateIngredient: async (db: Firestore, userId: string, ingredientId: string, updates: Partial<Ingredient>) => {
        const docRef = doc(db, `users/${userId}/ingredients`, ingredientId);
        await updateDoc(docRef, updates);
    },

    deleteIngredient: async (db: Firestore, userId: string, ingredientId: string) => {
        const docRef = doc(db, `users/${userId}/ingredients`, ingredientId);
        await deleteDoc(docRef);
    },

    // --- BATCH OPERATIONS ---
    batchAddIngredients: async (db: Firestore, userId: string, ingredients: Partial<Ingredient>[]) => {
        const batch = writeBatch(db);
        const collectionRef = collection(db, `users/${userId}/ingredients`);

        ingredients.forEach(ing => {
            const docRef = doc(collectionRef); // Generate new ID
            batch.set(docRef, {
                ...ing,
                createdAt: serverTimestamp()
            });
        });

        await batch.commit();
    },

    batchUpdateIngredients: async (db: Firestore, userId: string, updates: { id: string, data: Partial<Ingredient> }[]) => {
        const batch = writeBatch(db);

        updates.forEach(({ id, data }) => {
            const docRef = doc(db, `users/${userId}/ingredients`, id);
            batch.update(docRef, data);
        });

        await batch.commit();
    }
};

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import { Firestore } from 'firebase/firestore';

export const grimoriumService = {
    // --- RECIPES ---
    addRecipe: async (db: Firestore, userId: string, recipeData: Partial<Recipe>) => {
        const collectionRef = collection(db, `users/${userId}/recipes`);
        const docRef = await addDoc(collectionRef, {
            ...recipeData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateRecipe: async (db: Firestore, userId: string, recipeId: string, updates: Partial<Recipe>) => {
        const docRef = doc(db, `users/${userId}/recipes`, recipeId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    deleteRecipe: async (db: Firestore, userId: string, recipeId: string) => {
        const docRef = doc(db, `users/${userId}/recipes`, recipeId);
        await deleteDoc(docRef);
    },

    // --- INGREDIENTS ---
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
    }
};

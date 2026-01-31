import { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '../types';
import { calculateEscandallo } from '../core/finance/cost.engine';
import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

interface UseEscandallatorProps {
    db: Firestore;
    userId: string;
    allIngredients: Ingredient[];
}

export const useEscandallator = ({ db, userId, allIngredients }: UseEscandallatorProps) => {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = useState<number>(0);

    const escandalloData = useMemo(() => {
        return calculateEscandallo(selectedRecipe, precioVenta, allIngredients);
    }, [selectedRecipe, precioVenta, allIngredients]);

    const saveToHistory = async (reportData: any) => {
        if (!selectedRecipe) return;
        const escandallosColPath = `users/${userId}/escandallo-history`;
        const { baseImponible, ...dataToSave } = reportData;

        await addDoc(collection(db, escandallosColPath), {
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.nombre,
            ...dataToSave,
            createdAt: serverTimestamp()
        });
    };

    const loadFromHistory = (item: any, allRecipes: Recipe[]) => {
        const recipe = allRecipes.find(r => r.id === item.recipeId) || null;
        if (recipe) {
            setSelectedRecipe(recipe);
            setPrecioVenta(item.precioVenta);
        }
    };

    return {
        selectedRecipe,
        setSelectedRecipe,
        precioVenta,
        setPrecioVenta,
        escandalloData,
        saveToHistory,
        loadFromHistory
    };
};

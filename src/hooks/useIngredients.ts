import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { Ingredient } from '../types';

export const useIngredients = () => {
    const { db, userId, appId } = useApp();
    const enabled = !!db && !!userId && !!appId;

    const { data: ingredients, isLoading, error } = useQuery({
        queryKey: ['ingredients', appId, userId],
        queryFn: async () => {
            if (!db || !userId || !appId) return [];
            const q = query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient));
        },
        enabled,
        staleTime: 1000 * 60 * 5,
    });

    return {
        ingredients: ingredients || [],
        isLoading,
        error
    };
};

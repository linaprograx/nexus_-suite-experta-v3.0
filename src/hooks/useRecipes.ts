import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { Recipe } from '../types';

export const useRecipes = () => {
    const { db, userId } = useApp();
    const enabled = !!db && !!userId;

    const { data: recipes, isLoading, error } = useQuery({
        queryKey: ['recipes', userId],
        queryFn: async () => {
            if (!db || !userId) return [];
            const q = query(collection(db, `users/${userId}/grimorio`), orderBy('nombre'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as Recipe));
        },
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        recipes: recipes || [],
        isLoading,
        error
    };
};

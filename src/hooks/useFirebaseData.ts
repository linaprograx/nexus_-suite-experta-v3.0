import { useMemo } from 'react';
import { Firestore, collection, query, orderBy, limit, doc, getDocs, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Recipe, Ingredient, PizarronTask, AppNotification, UserProfile } from '../types';
import { safeNormalizeTask } from '../utils/taskHelpers';

// --- Query Keys & Fetchers ---

export const QUERY_KEYS = {
    recipes: (userId: string) => ['recipes', userId],
    ingredients: (appId: string, userId: string) => ['ingredients', appId, userId],
    tasks: (appId: string) => ['tasks', appId],
    notifications: (appId: string, userId: string) => ['notifications', appId, userId],
    profile: (userId: string) => ['profile', userId],
    boards: (appId: string) => ['boards', appId],
};

export const fetchRecipes = async (db: Firestore, userId: string) => {
    const q = query(collection(db, `users/${userId}/grimorio`), orderBy('nombre'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Recipe));
};

export const fetchIngredients = async (db: Firestore, appId: string, userId: string) => {
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient));
};

export const fetchTasks = async (db: Firestore, appId: string) => {
    const q = query(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => safeNormalizeTask({ ...d.data(), id: d.id }));
};

const fetchNotifications = async (db: Firestore, appId: string, userId: string) => {
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/notifications`), orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
};

const fetchProfile = async (db: Firestore, userId: string) => {
    const ref = doc(db, `users/${userId}/profile`, 'main');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as Partial<UserProfile> : {};
};

const fetchBoards = async (db: Firestore, appId: string) => {
    const q = collection(db, `artifacts/${appId}/public/data/pizarron-boards`);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- Hook ---

export const useFirebaseData = (
    db: Firestore | null,
    userId: string | null,
    appId: string
) => {
    const enabled = !!db && !!userId && !!appId;

    const recipesQuery = useQuery({
        queryKey: QUERY_KEYS.recipes(userId || ''),
        queryFn: () => fetchRecipes(db!, userId!),
        enabled,
    });

    const ingredientsQuery = useQuery({
        queryKey: QUERY_KEYS.ingredients(appId, userId || ''),
        queryFn: () => fetchIngredients(db!, appId, userId!),
        enabled,
    });

    const tasksQuery = useQuery({
        queryKey: QUERY_KEYS.tasks(appId),
        queryFn: () => fetchTasks(db!, appId),
        enabled,
        refetchInterval: 1000 * 30, // Polling every 30s for tasks
    });

    const notificationsQuery = useQuery({
        queryKey: QUERY_KEYS.notifications(appId, userId || ''),
        queryFn: () => fetchNotifications(db!, appId, userId!),
        enabled,
        refetchInterval: 1000 * 60, // Polling every 60s
    });

    const profileQuery = useQuery({
        queryKey: QUERY_KEYS.profile(userId || ''),
        queryFn: () => fetchProfile(db!, userId!),
        enabled,
    });

    const boardsQuery = useQuery({
        queryKey: QUERY_KEYS.boards(appId),
        queryFn: () => fetchBoards(db!, appId),
        enabled,
    });

    // Derived State
    const activeBoardId = useMemo(() => {
        if (!boardsQuery.data || boardsQuery.data.length === 0) return 'general';
        return boardsQuery.data[0].id; // Logic from previous hook
    }, [boardsQuery.data]);

    const loading = recipesQuery.isLoading || ingredientsQuery.isLoading || tasksQuery.isLoading || profileQuery.isLoading;

    return {
        allRecipes: recipesQuery.data || [],
        allIngredients: ingredientsQuery.data || [],
        allPizarronTasks: tasksQuery.data || [],
        notifications: notificationsQuery.data || [],
        userProfile: profileQuery.data || {},
        activeBoardId,
        loading
    };
};

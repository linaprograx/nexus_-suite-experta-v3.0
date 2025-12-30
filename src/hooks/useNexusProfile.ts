import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { AppNotification, UserProfile } from '../types';

export const useNexusProfile = (db: any, userId: any, appId: any) => {
    const enabled = !!db && !!userId;

    // Fetch Profile
    const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!db || !userId) return {};
            const ref = doc(db, `users/${userId}/profile`, 'main');
            const snap = await getDoc(ref);
            return snap.exists() ? snap.data() as Partial<UserProfile> : {};
        },
        enabled,
    });

    // Fetch Notifications
    const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
        queryKey: ['notifications', appId, userId],
        queryFn: async () => {
            if (!db || !userId || !appId) return [];
            const q = query(collection(db, `artifacts/${appId}/users/${userId}/notifications`), orderBy('createdAt', 'desc'), limit(20));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as AppNotification));
        },
        enabled,
        refetchInterval: 1000 * 60, // Poll every 60s
    });

    return {
        userProfile: userProfile || {},
        notifications: notifications || [],
        isLoading: isLoadingProfile || isLoadingNotifications
    };
};

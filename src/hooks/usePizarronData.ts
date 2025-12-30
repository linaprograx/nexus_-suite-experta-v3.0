import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
// import { PizarronTask } from '../types'; // Removed import to avoid lint error if safeNormalizeTask handles it
import { safeNormalizeTask } from '../utils/taskHelpers';

export const usePizarronData = () => {
    const { db, appId } = useApp();
    const enabled = !!db && !!appId;

    // Fetch Tasks
    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['tasks', appId],
        queryFn: async () => {
            if (!db || !appId) return [];
            const q = query(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            return snap.docs.map(d => safeNormalizeTask({ ...d.data(), id: d.id }));
        },
        enabled,
        refetchInterval: 1000 * 30, // Poll every 30s
    });

    // Fetch Boards (Optional for now, but good to have)
    const { data: boards, isLoading: isLoadingBoards } = useQuery({
        queryKey: ['boards', appId],
        queryFn: async () => {
            if (!db || !appId) return [];
            const q = collection(db, `artifacts/${appId}/public/data/pizarron-boards`);
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        enabled,
    });

    const activeBoardId = boards && boards.length > 0 ? boards[0].id : 'general';

    return {
        tasks: tasks || [],
        boards: boards || [],
        activeBoardId,
        isLoading: isLoadingTasks || isLoadingBoards
    };
};

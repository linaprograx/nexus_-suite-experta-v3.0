import { Firestore } from 'firebase/firestore';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, fetchRecipes, fetchTasks, fetchIngredients } from '../../hooks/useFirebaseData';

const STORAGE_KEY = 'nexus_ai_prefetch_interactions';

interface InteractionData {
    transitions: Record<string, Record<string, number>>;
    lastView: string | null;
}

export class AIPrefetchEngine {
    private data: InteractionData;

    constructor() {
        this.data = this.loadData();
    }

    private loadData(): InteractionData {
        if (typeof window === 'undefined') return { transitions: {}, lastView: null };
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { transitions: {}, lastView: null };
        } catch {
            return { transitions: {}, lastView: null };
        }
    }

    private saveData() {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    /**
     * Track navigation to a view
     */
    public trackView(view: string) {
        if (this.data.lastView && this.data.lastView !== view) {
            // Record transition from Last -> Current
            if (!this.data.transitions[this.data.lastView]) {
                this.data.transitions[this.data.lastView] = {};
            }
            const count = this.data.transitions[this.data.lastView][view] || 0;
            this.data.transitions[this.data.lastView][view] = count + 1;
        }
        this.data.lastView = view;
        this.saveData();
    }

    /**
     * Get most likely next views based on history
     */
    public getPredictedNextViews(currentView: string): string[] {
        const nexts = this.data.transitions[currentView];
        if (!nexts) return [];

        // Sort by frequency
        return Object.entries(nexts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2) // Top 2
            .map(([view]) => view);
    }

    /**
     * Trigger prefetch for a specific view
     */
    public async prefetchForView(
        view: string,
        queryClient: QueryClient,
        db: Firestore,
        userId: string,
        appId: string
    ) {
        const normalizedView = view.startsWith('/') ? view.slice(1) : view;
        const viewKey = normalizedView || 'dashboard';

        console.log(`[AI Prefetch] Prefetching data for predicted view: ${viewKey}`);

        const promises: Promise<void>[] = [];

        // Logic mapping views to data requirements
        if (viewKey === 'grimorium') {
            promises.push(queryClient.prefetchQuery({
                queryKey: QUERY_KEYS.recipes(userId),
                queryFn: () => fetchRecipes(db, userId),
                staleTime: 1000 * 60 * 5 // 5 min
            }));
            promises.push(queryClient.prefetchQuery({
                queryKey: QUERY_KEYS.ingredients(appId, userId),
                queryFn: () => fetchIngredients(db, appId, userId),
                staleTime: 1000 * 60 * 5
            }));
        } else if (viewKey === 'pizarron') {
            promises.push(queryClient.prefetchQuery({
                queryKey: QUERY_KEYS.tasks(appId),
                queryFn: () => fetchTasks(db, appId),
                staleTime: 1000 * 30
            }));
        }
        // Add other views as needed

        await Promise.allSettled(promises);
    }
}

export const aiPrefetcher = new AIPrefetchEngine();

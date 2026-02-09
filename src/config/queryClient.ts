import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

/**
 * TanStack Query Client with Offline Persistence
 * 
 * Features:
 * - Caches query results in localStorage
 * - Persists data across page reloads
 * - Automatic garbage collection
 * - Offline-first architecture
 */

// Create the QueryClient with optimized defaults
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 min
            gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache for 1 day
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnReconnect: true, // Refetch when internet reconnects
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
            retry: 1, // Retry failed mutations once
            retryDelay: 1000, // Wait 1 second before retrying
        },
    },
});

// Create a persister using localStorage
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'NEXUS_QUERY_CACHE', // Unique key for this app
    serialize: JSON.stringify,
    deserialize: JSON.parse,
});

// Persist the query client
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    buster: 'v1', // Increment this to invalidate all cached data
    dehydrateOptions: {
        // Don't persist queries with errors
        shouldDehydrateQuery: (query) => {
            return query.state.status === 'success';
        },
    },
});

/**
 * Clear all cached data
 * Useful for logout or when data becomes stale
 */
export const clearQueryCache = () => {
    queryClient.clear();
    localStorage.removeItem('NEXUS_QUERY_CACHE');
};

/**
 * Invalidate all queries to force refetch
 * Useful when coming back online
 */
export const invalidateAllQueries = () => {
    queryClient.invalidateQueries();
};

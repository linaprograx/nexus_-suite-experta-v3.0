# Offline Support Implementation Guide

## Overview
Nexus Suite implements offline functionality through Firestore persistence and TanStack Query caching. When offline, users can view cached data and the app will automatically sync when reconnected.

## Features Implemented

### 1. Firestore Offline Persistence
- **Automatic caching** of all Firestore data locally using IndexedDB
- **Seamless offline access** to previously loaded data
- **Automatic sync** when connection is restored
- **Multi-tab handling** with appropriate warnings

### 2. TanStack Query Persistence
- **localStorage caching** of all query results
- **24-hour cache retention** for optimal performance
- **Automatic garbage collection** of stale data
- **Smart refetching** when connection is restored

### 3. Connection Status Monitoring
- **Visual indicator** when offline (amber badge at top)
- **Success message** when connection is restored (green badge)
- **Automatic detection** of network state changes
- **Non-intrusive UI** that doesn't block user workflow

## Technical Implementation

### Files Created

#### `src/config/queryClient.ts`
Configures TanStack Query with localStorage persistence

#### `src/components/ui/ConnectionStatus.tsx`
Visual indicator for network status

### Files Modified

#### `src/config/firebaseApp.ts`
Added Firestore offline persistence with `enableIndexedDbPersistence`

#### `src/App.tsx`
Integrated offline support components

## How It Works

### Offline Flow
1. **User goes offline** → ConnectionStatus shows amber badge
2. **User continues working** → Data served from cache
3. **Connection restored** → Green badge appears
4. **Automatic sync** → Data refetched from server

## Testing Offline Support

### Manual Testing Steps

1. **Open the app** in Chrome DevTools
2. **Navigate** to Network tab
3. **Set throttling** to "Offline"
4. **Verify** amber badge appears: "Sin conexión - Trabajando offline"
5. **Navigate** through the app - data should still load from cache
6. **Go back online** - green badge appears: "Conexión restaurada"  
7. **Verify** data syncs automatically

## Configuration

### Cache Duration
Modify in `src/config/queryClient.ts`:
```typescript
staleTime: 1000 * 60 * 5,  // 5 minutes
gcTime: 1000 * 60 * 60 * 24, // 24 hours
```

### Retry Logic
```typescript
retry: 2, // Number of retries
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

## Troubleshooting

### "Firestore persistence failed: Multiple tabs open"
**Cause**: Firestore persistence can only be enabled in one tab at a time.  
**Solution**: This is expected behavior. The app will still work.

### Cache not persisting
**Solution**: 
1. Check browser settings for localStorage
2. Clear old data: `localStorage.clear()`
3. Check available storage quota

### Offline indicator not appearing
**Solution**:
1. Use DevTools Network tab → Offline
2. Check `navigator.onLine` in console
3. Verify ConnectionStatus component is rendered

## API Reference

### queryClient Utilities

```typescript
import { queryClient, clearQueryCache, invalidateAllQueries } from './config/queryClient';

// Clear all cached data
clearQueryCache();

// Force refetch all queries
invalidateAllQueries();
```

## Security Notes

✅ **Data encrypted at rest** - IndexedDB and localStorage are browser-secure  
✅ **Automatic expiration** - Old data removed after 24 hours  
⚠️ **Shared device risk** - Clear cache on logout for shared devices

---

**Implementation Date**: February 2026  
**Version**: 2.0  
**Status**: ⚠️ Read-Only Caching


# 🚀 Implementation Guide: Production Readiness

This guide provides step-by-step instructions for implementing the critical fixes identified in the Production Audit.

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Error Boundaries & Monitoring

#### Step 1: Install Sentry
```bash
npm install @sentry/react @sentry/vite-plugin
```

#### Step 2: Configure Sentry
```typescript
// src/config/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Step 3: Create Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Algo salió mal
            </h1>
            <p className="text-slate-600 mb-6">
              Hemos registrado el error y lo resolveremos pronto.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Step 4: Wrap App
```typescript
// src/main.tsx
import { ErrorBoundary } from './components/ErrorBoundary';
import './config/sentry';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

---

### 1.2 Authentication Enhancement

#### Step 1: Install OAuth Dependencies
```bash
npm install firebase-admin
```

#### Step 2: Configure Google OAuth
```typescript
// src/config/firebase.ts
import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
```

#### Step 3: Create OAuth Login Component
```typescript
// src/components/auth/OAuthButtons.tsx
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';

export const OAuthButtons = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
      <span>Continuar con Google</span>
    </button>
  );
};
```

---

### 1.3 Offline Support

#### Step 1: Enable Firestore Offline Persistence
```typescript
// src/config/firebase.ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence only in one tab');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});
```

#### Step 2: Add TanStack Query Persistence
```bash
npm install @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
```

```typescript
// src/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

export { queryClient, persister };
```

#### Step 3: Wrap App with Persister
```typescript
// src/main.tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from './config/queryClient';

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  <App />
</PersistQueryClientProvider>
```

---

## Phase 2: Performance (Weeks 3-4)

### 2.1 Code Splitting

#### Step 1: Lazy Load Routes
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const GrimoriumView = lazy(() => import('./views/GrimoriumView'));
const CerebrityView = lazy(() => import('./views/CerebrityView'));
const PizarronView = lazy(() => import('./views/PizarronView'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/grimorium" element={<GrimoriumView />} />
        <Route path="/cerebrity" element={<CerebrityView />} />
        <Route path="/pizarron" element={<PizarronView />} />
      </Routes>
    </Suspense>
  );
}
```

#### Step 2: Create Loading Screen
```typescript
// src/components/LoadingScreen.tsx
export const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
  </div>
);
```

---

### 2.2 Image Optimization

#### Step 1: Install Vite Image Plugin
```bash
npm install vite-plugin-image-optimizer
```

#### Step 2: Configure Vite
```typescript
// vite.config.ts
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 }
    })
  ]
});
```

#### Step 3: Create Optimized Image Component
```typescript
// src/components/ui/OptimizedImage.tsx
interface Props {
  src: string;
  alt: string;
  className?: string;
}

export const OptimizedImage = ({ src, alt, className }: Props) => (
  <img
    src={src}
    alt={alt}
    className={className}
    loading="lazy"
    decoding="async"
  />
);
```

---

## Phase 3: Native Setup (Weeks 5-6)

### 3.1 Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

### 3.2 Add Platforms

```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### 3.3 Configure Capacitor

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexus.suite',
  appName: 'Nexus Suite',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      showSpinner: false
    }
  }
};

export default config;
```

### 3.4 Add Push Notifications

```bash
npm install @capacitor/push-notifications
```

```typescript
// src/services/notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // Send to backend
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });
};
```

---

## Phase 4: Testing (Weeks 7-8)

### 4.1 Install Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 4.2 Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### 4.3 Write First Test

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## Verification Checklist

After implementing each phase, verify:

### Phase 1
- [ ] Errors are caught and logged to Sentry
- [ ] Google OAuth login works
- [ ] App works offline (test by disabling network)
- [ ] Data persists after refresh

### Phase 2
- [ ] Bundle size reduced (check with `npm run build`)
- [ ] Routes load lazily (check Network tab)
- [ ] Images are optimized (check file sizes)

### Phase 3
- [ ] iOS app builds successfully
- [ ] Android app builds successfully
- [ ] Push notifications work on device
- [ ] Camera access works

### Phase 4
- [ ] Tests run with `npm test`
- [ ] Coverage > 70%
- [ ] CI/CD pipeline passes

---

**Next Steps**: After completing all phases, proceed to the Launch Checklist in `PRODUCTION_AUDIT.md`.

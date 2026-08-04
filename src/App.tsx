import * as React from 'react';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';


import { AppProvider, useApp } from './context/AppContext';
import { UIProvider, useUI } from './context/UIContext';

import { Spinner } from './components/ui/Spinner';
import { Sidebar } from './components/layout/Sidebar';
// import { ContentView } from './src/views/ContentView'; // DEPRECATED
import { AppRoutes } from './routes';
import { RecipeFormModal } from './components/grimorium/RecipeFormModal';

import { NotificationsDrawer } from './components/dashboard/NotificationsDrawer';
import { ChatbotWidget } from './components/ui/ChatbotWidget';
import { AuthComponent } from './components/auth/AuthComponent';
import { PrintStyles } from './components/ui/PrintStyles';
import { aiPrefetcher } from './features/prefetch/aiPrefetchEngine';

import { useIngredients } from './hooks/useIngredients';
import { useRecipes } from './hooks/useRecipes';
import { computeGrimorioAlerts } from './utils/grimorioAlerts';
import { useGrimorioAlertSync } from './hooks/useGrimorioAlertSync';
import { useActiveMenu } from './hooks/useActiveMenu';
import { queryClient } from './config/queryClient';
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import { useNexusProfile } from './hooks/useNexusProfile';
import FloatingBottomNav from './ui/mobile/components/FloatingBottomNav';

// ... (other imports remain, but useFirebaseData is gone)
import { useUIStore } from './store/uiStore';

const MainAppContent: React.FC = () => {
    const { db, userId, auth, storage, appId } = useApp();
    const { isSidebarCollapsed } = useUI();

    // Modular Hooks
    const { notifications } = useNexusProfile(db, userId, appId);
    const { ingredients: allIngredients } = useIngredients();
    const { recipes: allRecipes } = useRecipes();

    if (!db || !userId || !auth || !storage || !appId) {
        return <div className='flex h-screen items-center justify-center'><Spinner className='w-12 h-12' /></div>;
    }

    return (
        <BrowserRouter>
            <AppLayout
                db={db} userId={userId} auth={auth} storage={storage} appId={appId}
                allIngredients={allIngredients} allRecipes={allRecipes} notifications={notifications}
                isSidebarCollapsed={isSidebarCollapsed}
            />
        </BrowserRouter>
    );
};

// Internal component to use router hooks
const AppLayout: React.FC<any> = ({
    db, userId, auth, storage, appId,
    allIngredients, allRecipes, notifications,
    isSidebarCollapsed
}) => {
    const { 
        showRecipeModal, recipeToEdit, setShowRecipeModal,
        setTaskToOpen,
        showNotificationsDrawer, setShowNotificationsDrawer,
        isMobileSidebarOpen, setIsMobileSidebarOpen
    } = useUIStore();

    // We can't use currentView state anymore, passing navigate logic down to sidebar requires changes in Sidebar
    // For now, let's just render the router.

    const navigate = useNavigate();
    const location = useLocation();

    // #18 · Push Grimorio business alerts into the app-wide notification tray
    const { menu: activeMenu } = useActiveMenu();
    const grimorioAlerts = React.useMemo(
        () => computeGrimorioAlerts(allRecipes || [], allIngredients || [], activeMenu),
        [allRecipes, allIngredients, activeMenu]
    );
    useGrimorioAlertSync(grimorioAlerts, notifications || [], db, userId, appId);

    // AI Prefetch Integration
    React.useEffect(() => {
        if (!userId || !appId) return;

        const currentPath = location.pathname;
        const viewName = currentPath === '/' ? 'dashboard' : currentPath.substring(1).split('/')[0];

        // Track
        aiPrefetcher.trackView(viewName);

        // Predict & Prefetch
        const nextViews = aiPrefetcher.getPredictedNextViews(viewName);
        nextViews.forEach(v => {
            aiPrefetcher.prefetchForView(v, queryClient, db, userId, appId);
        });

    }, [location.pathname, userId, appId, db]);


    return (
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased flex'>
            <Sidebar
                onShowNotifications={() => setShowNotificationsDrawer(true)}
                unreadNotifications={notifications && (notifications as any).some ? (notifications as any).some((n: any) => !n.read) : false}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} w-full`}>
                
                {/* No mobile header: it spent ~64px on a title every view already
                    renders itself, and hid navigation behind a hamburger. Navigation
                    now lives in the bottom bar, which is reachable by thumb. */}

                {/* The pb-[…] reserves the bottom bar's footprint so the last row of
                    any list stays tappable instead of sitting under the glass. Dropped
                    at lg, where the bar is hidden and the sidebar takes over. */}
                <main className="flex-1 overflow-y-auto p-2 sm:p-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] lg:pt-4 pb-[calc(60px_+_env(safe-area-inset-bottom)_+_0.5rem)] lg:pb-4">
                    <AppRoutes
                        db={db} userId={userId} appId={appId} auth={auth} storage={storage}
                    />
                </main>
            </div>

            {showNotificationsDrawer && <NotificationsDrawer isOpen={showNotificationsDrawer} onClose={() => setShowNotificationsDrawer(false)} notifications={notifications} db={db} userId={userId} appId={appId} onTaskClick={(id) => { if (id && id.startsWith('/')) { navigate(id); } else { navigate('/pizarron'); setTaskToOpen(id); } }} />}

            {/* Global Recipe form modal (create/edit) — driven by the UI store */}
            {showRecipeModal && (
                <RecipeFormModal
                    isOpen={showRecipeModal}
                    onClose={() => setShowRecipeModal(false)}
                    db={db}
                    userId={userId}
                    initialData={recipeToEdit}
                    allIngredients={allIngredients}
                    allRecipes={allRecipes}
                />
            )}
            
            {/* Mobile navigation. Reads its destinations from APP_SECTIONS + the
                sections store, so it mirrors the desktop sidebar and honours the
                on/off toggles in Personal → Configuración with no second list. */}
            <FloatingBottomNav />

            <ChatbotWidget />
        </div>
    );
};



const AppContent: React.FC = () => {
    const { isAuthReady, user } = useApp();

    if (!isAuthReady) return <div className='flex h-screen items-center justify-center'><Spinner className='w-12 h-12' /></div>;
    if (!user) return <AuthComponent />;

    return (
        <>
            <ConnectionStatus />
            <PrintStyles />
            <MainAppContent />
        </>
    );
};


const App: React.FC = () => {
    return (
        <AppProvider>
            <UIProvider>
                <ErrorBoundary>
                    <QueryClientProvider client={queryClient}>
                        <AppContent />
                    </QueryClientProvider>
                </ErrorBoundary>
            </UIProvider>
        </AppProvider>
    );
};

export default App;

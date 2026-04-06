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
import { AddTaskModal } from './components/pizarron/AddTaskModal';
import { aiPrefetcher } from './features/prefetch/aiPrefetchEngine';

import { useIngredients } from './hooks/useIngredients';
import { queryClient } from './config/queryClient';
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import { useNexusProfile } from './hooks/useNexusProfile';
import FloatingBottomNav from './ui/mobile/components/FloatingBottomNav';
import { PageName } from './ui/mobile/types';

// ... (other imports remain, but useFirebaseData is gone)
import { useUIStore } from './store/uiStore';

const MainAppContent: React.FC = () => {
    const { db, userId, auth, storage, appId } = useApp();
    const { isSidebarCollapsed } = useUI();

    // Modular Hooks
    const { notifications } = useNexusProfile(db, userId, appId);
    const { ingredients: allIngredients } = useIngredients();

    if (!db || !userId || !auth || !storage || !appId) {
        return <div className='flex h-screen items-center justify-center'><Spinner className='w-12 h-12' /></div>;
    }

    return (
        <BrowserRouter>
            <AppLayout
                db={db} userId={userId} auth={auth} storage={storage} appId={appId}
                allIngredients={allIngredients} notifications={notifications}
                isSidebarCollapsed={isSidebarCollapsed}
            />
        </BrowserRouter>
    );
};

// Internal component to use router hooks
const AppLayout: React.FC<any> = ({
    db, userId, auth, storage, appId,
    allIngredients, notifications,
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

    // Derive current section name from route for mobile header
    const sectionName = React.useMemo(() => {
        const path = location.pathname;
        const map: Record<string, string> = {
            '/': 'Dashboard',
            '/grimorium': 'Grimorium',
            '/pizarron': 'Pizarrón',
            '/cerebrity': 'CerebrIty',
            '/trend-locator': 'Trend Locator',
            '/avatar': 'Avatar',
            '/make-menu': 'Make Menu',
            '/colegium': 'Colegium',
            '/collegium': 'Colegium',
            '/personal': 'Mi Perfil',
        };
        return map[path] || Object.entries(map).find(([k]) => k !== '/' && path.startsWith(k))?.[1] || 'Nexus Suite';
    }, [location.pathname]);

    return (
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased flex'>
            <Sidebar
                onShowNotifications={() => setShowNotificationsDrawer(true)}
                unreadNotifications={notifications && (notifications as any).some ? (notifications as any).some((n: any) => !n.read) : false}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} w-full`}>
                
                {/* Mobile Header — Shows current section name */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{sectionName}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nexus Suite</span>
                        </div>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-2 sm:p-4">
                    <AppRoutes
                        db={db} userId={userId} appId={appId} auth={auth} storage={storage}
                    />
                </main>
            </div>

            {showNotificationsDrawer && <NotificationsDrawer isOpen={showNotificationsDrawer} onClose={() => setShowNotificationsDrawer(false)} notifications={notifications} db={db} userId={userId} appId={appId} onTaskClick={(id) => { navigate('/pizarron'); setTaskToOpen(id); }} />}
            
            {/* Unified Bottom Nav for Mobile viewports - Solves the Shell Split/Redirect issue */}
            <div className="md:hidden">
                <FloatingBottomNav 
                    currentPage={sectionName.toLowerCase() as any} 
                    onNavigate={(page) => {
                        // Bridge PageName to Route
                        const routeMap: Record<string, string> = {
                            [PageName.Dashboard]: '/',
                            [PageName.GrimorioRecipes]: '/grimorium',
                            [PageName.CerebritySynthesis]: '/cerebrity',
                            [PageName.Pizarron]: '/pizarron',
                            [PageName.AvatarCore]: '/avatar',
                            [PageName.Colegium]: '/colegium',
                            [PageName.Personal]: '/personal',
                        };
                        navigate(routeMap[page] || '/');
                    }} 
                />
            </div>

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

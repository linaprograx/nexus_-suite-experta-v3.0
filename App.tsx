import * as React from 'react';
import { ViewName, Recipe, Ingredient, PizarronTask, AppNotification } from './types';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AppProvider, useApp } from './src/context/AppContext';
import { UIProvider, useUI } from './src/context/UIContext';

import { Spinner } from './src/components/ui/Spinner';
import { Sidebar } from './src/components/layout/Sidebar';
import { Topbar } from './src/components/layout/Topbar';
// import { ContentView } from './src/views/ContentView'; // DEPRECATED
import { AppRouter } from './src/router/AppRouter';
import { RecipeFormModal } from './src/components/grimorium/RecipeFormModal';
import { NotificationsDrawer } from './src/components/dashboard/NotificationsDrawer';
import { ChatbotWidget } from './src/components/ui/ChatbotWidget';
import { AuthComponent } from './src/components/auth/AuthComponent';
import { PrintStyles } from './src/components/ui/PrintStyles';
import { AddTaskModal } from './src/components/pizarron/AddTaskModal';
import { useFirebaseData } from './src/hooks/useFirebaseData';
import { aiPrefetcher } from './src/features/prefetch/aiPrefetchEngine';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const MainAppContent: React.FC = () => {
    const { db, userId, auth, storage, appId, userProfile } = useApp();
    const { isSidebarCollapsed } = useUI();

    const {
        allRecipes,
        allIngredients,
        allPizarronTasks,
        notifications,
        userProfile: firebaseUserProfile,
        activeBoardId,
        loading: firebaseLoading,
    } = useFirebaseData(db, userId, appId || 'default-app-id');

    // Prefer profile from hook, fallback to context
    const effectiveUserProfile = firebaseUserProfile && Object.keys(firebaseUserProfile).length > 0
        ? firebaseUserProfile
        : userProfile;
    const [showNotificationsDrawer, setShowNotificationsDrawer] = React.useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

    const [showRecipeModal, setShowRecipeModal] = React.useState(false);
    const [recipeToEdit, setRecipeToEdit] = React.useState<Partial<Recipe> | null>(null);
    const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
    // const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null); // REPLACED BY HOOK

    const [taskToOpen, setTaskToOpen] = React.useState<string | null>(null);
    const [draggingRecipe, setDraggingRecipe] = React.useState<Recipe | null>(null);
    const [draggingTask, setDraggingTask] = React.useState<string | null>(null);
    const [textToAnalyze, setTextToAnalyze] = React.useState<string | null>('');



    if (!db || !userId || !auth || !storage || !appId) {
        return <div className='flex h-screen items-center justify-center'><Spinner className='w-12 h-12' /></div>;
    }

    return (
        <BrowserRouter>
            <AppLayout
                db={db} userId={userId} auth={auth} storage={storage} appId={appId}
                allRecipes={allRecipes} allIngredients={allIngredients} allPizarronTasks={allPizarronTasks} notifications={notifications}
                effectiveUserProfile={effectiveUserProfile}
                isSidebarCollapsed={isSidebarCollapsed}
                showNotificationsDrawer={showNotificationsDrawer} setShowNotificationsDrawer={setShowNotificationsDrawer}
                isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                recipeToEdit={recipeToEdit} setRecipeToEdit={setRecipeToEdit} setShowRecipeModal={setShowRecipeModal} showRecipeModal={showRecipeModal}
                taskToOpen={taskToOpen} setTaskToOpen={setTaskToOpen}
                draggingRecipe={draggingRecipe} setDraggingRecipe={setDraggingRecipe}
                draggingTask={draggingTask} setDraggingTask={setDraggingTask}
                textToAnalyze={textToAnalyze} setTextToAnalyze={setTextToAnalyze}
            />
        </BrowserRouter>
    );
};

// Internal component to use router hooks
const AppLayout: React.FC<any> = ({
    db, userId, auth, storage, appId,
    allRecipes, allIngredients, allPizarronTasks, notifications,
    effectiveUserProfile, isSidebarCollapsed,
    showNotificationsDrawer, setShowNotificationsDrawer,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    recipeToEdit, setRecipeToEdit, setShowRecipeModal, showRecipeModal,
    taskToOpen, setTaskToOpen,
    draggingRecipe, setDraggingRecipe,
    draggingTask, setDraggingTask,
    textToAnalyze, setTextToAnalyze
}) => {

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

    return (
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased'>
            <Sidebar
                // Passing a fake setCurrentView that uses navigate
                currentView={"" as any} // Requires Sidebar update to read from URL
                setCurrentView={(view) => {
                    // Simple mapping for now, ideally Sidebar links should be <Link>
                    if (view === 'dashboard') navigate('/');
                    else navigate('/' + view);
                }}
                onShowNotifications={() => setShowNotificationsDrawer(true)}
                unreadNotifications={notifications.some((n: any) => !n.read)}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <Topbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} onShowNotifications={() => setShowNotificationsDrawer(true)} unreadNotifications={notifications.some((n: any) => !n.read)} title='Nexus Suite' />

                <main className='flex-1 overflow-y-auto p-4'>
                    <AppRouter
                        db={db} userId={userId} appId={appId} auth={auth} storage={storage}
                        allRecipes={allRecipes} allIngredients={allIngredients} allPizarronTasks={allPizarronTasks}
                        notifications={notifications} userProfile={effectiveUserProfile}
                        onOpenRecipeModal={(r: any) => { setRecipeToEdit(r); setShowRecipeModal(true); }}
                        taskToOpen={taskToOpen} onTaskOpened={() => setTaskToOpen(null)}
                        draggingRecipe={draggingRecipe} onDragRecipeStart={setDraggingRecipe}
                        draggingTask={draggingTask} onDragTaskStart={setDraggingTask}
                        onDropEnd={() => { setDraggingRecipe(null); setDraggingTask(null); }}
                        onAnalyze={(t: any) => { setTextToAnalyze(t); navigate('/cerebrity'); }}
                        initialText={textToAnalyze} onAnalysisDone={() => setTextToAnalyze('')}

                    />
                </main>
            </div>

            {showRecipeModal && <RecipeFormModal isOpen={showRecipeModal} onClose={() => setShowRecipeModal(false)} db={db} userId={userId} initialData={recipeToEdit} allIngredients={allIngredients} />}
            {showNotificationsDrawer && <NotificationsDrawer isOpen={showNotificationsDrawer} onClose={() => setShowNotificationsDrawer(false)} notifications={notifications} db={db} userId={userId} appId={appId} onTaskClick={(id) => { navigate('/pizarron'); setTaskToOpen(id); }} />}
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
            <PrintStyles />
            <MainAppContent />
        </>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <UIProvider>
                <QueryClientProvider client={queryClient}>
                    <AppContent />
                    <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
            </UIProvider>
        </AppProvider>
    );
};

export default App;

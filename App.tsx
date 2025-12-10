import * as React from 'react';
import { ViewName, Recipe, Ingredient, PizarronTask, AppNotification } from './types';

import { AppProvider, useApp } from './src/context/AppContext';
import { UIProvider, useUI } from './src/context/UIContext';

import { Spinner } from './src/components/ui/Spinner';
import { Sidebar } from './src/components/layout/Sidebar';
import { Topbar } from './src/components/layout/Topbar';
import { ContentView } from './src/views/ContentView';
import { RecipeFormModal } from './src/components/grimorium/RecipeFormModal';
import { NotificationsDrawer } from './src/components/dashboard/NotificationsDrawer';
import { ChatbotWidget } from './src/components/ui/ChatbotWidget';
import { AuthComponent } from './src/components/auth/AuthComponent';
import { PrintStyles } from './src/components/ui/PrintStyles';
import { AddTaskModal } from './src/components/pizarron/AddTaskModal';
import { useFirebaseData } from './src/hooks/useFirebaseData';

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

    const [currentView, setCurrentView] = React.useState<ViewName>('dashboard');
    // const [allRecipes, setAllRecipes] = React.useState<Recipe[]>([]); // REPLACED BY HOOK
    // const [allIngredients, setAllIngredients] = React.useState<Ingredient[]>([]); // REPLACED BY HOOK
    // const [allPizarronTasks, setAllPizarronTasks] = React.useState<PizarronTask[]>([]); // REPLACED BY HOOK
    // const [notifications, setNotifications] = React.useState<AppNotification[]>([]); // REPLACED BY HOOK

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
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased'>
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} onShowNotifications={() => setShowNotificationsDrawer(true)} unreadNotifications={notifications.some(n => !n.read)} isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />

            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <Topbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} onShowNotifications={() => setShowNotificationsDrawer(true)} unreadNotifications={notifications.some(n => !n.read)} title='Nexus Suite' />

                <main className='flex-1 overflow-y-auto p-4'>
                    <ContentView currentView={currentView} setCurrentView={setCurrentView} db={db} auth={auth} storage={storage} userId={userId} appId={appId} allRecipes={allRecipes} allIngredients={allIngredients} allPizarronTasks={allPizarronTasks} onOpenRecipeModal={(r) => { setRecipeToEdit(r); setShowRecipeModal(true); }} taskToOpen={taskToOpen} onTaskOpened={() => setTaskToOpen(null)} draggingRecipe={draggingRecipe} onDragRecipeStart={setDraggingRecipe} draggingTask={draggingTask} onDragTaskStart={setDraggingTask} onDropEnd={() => { setDraggingRecipe(null); setDraggingTask(null); }} onAnalyze={(t) => { setTextToAnalyze(t); setCurrentView('cerebrity'); }} initialText={textToAnalyze} onAnalysisDone={() => setTextToAnalyze('')} userProfile={effectiveUserProfile} />
                </main>
            </div>

            {showRecipeModal && <RecipeFormModal isOpen={showRecipeModal} onClose={() => setShowRecipeModal(false)} db={db} userId={userId} initialData={recipeToEdit} allIngredients={allIngredients} />}
            {showNotificationsDrawer && <NotificationsDrawer isOpen={showNotificationsDrawer} onClose={() => setShowNotificationsDrawer(false)} notifications={notifications} db={db} userId={userId} appId={appId} onTaskClick={(id) => { setCurrentView('pizarron'); setTaskToOpen(id); }} />}
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
                <AppContent />
            </UIProvider>
        </AppProvider>
    );
};

export default App;

import * as React from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { ViewName, Recipe, Ingredient, PizarronTask, AppNotification } from './types';

// Providers & Context
import { AppProvider, useApp } from './src/context/AppContext';
import { UIProvider, useUI } from './src/context/UIContext';

// Components
import { Spinner } from './src/components/ui/Spinner';
import { Sidebar } from './src/components/layout/Sidebar';
import { Topbar } from './src/components/layout/Topbar';
import { ContentView } from './src/views/ContentView';
import { RecipeFormModal } from './src/components/grimorium/RecipeFormModal';
import { NotificationsDrawer } from './src/components/dashboard/NotificationsDrawer';
import { ChatbotWidget } from './src/components/ui/ChatbotWidget';
import { AuthComponent } from './src/components/auth/AuthComponent';
import { PrintStyles } from './src/components/ui/PrintStyles';

// --- MAIN APP COMPONENT ---
const MainAppContent = () => {
    const { db, userId, auth, storage, appId, userProfile } = useApp();
    const { isSidebarCollapsed } = useUI();
    
    const [currentView, setCurrentView] = React.useState<ViewName>('dashboard');
    const [allRecipes, setAllRecipes] = React.useState<Recipe[]>([]);
    const [allIngredients, setAllIngredients] = React.useState<Ingredient[]>([]);
    const [allPizarronTasks, setAllPizarronTasks] = React.useState<PizarronTask[]>([]);
    
    const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
    const [showNotificationsDrawer, setShowNotificationsDrawer] = React.useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

    const [showRecipeModal, setShowRecipeModal] = React.useState(false);
    const [recipeToEdit, setRecipeToEdit] = React.useState<Partial<Recipe> | null>(null);

    // --- Vinculación States ---
    const [taskToOpen, setTaskToOpen] = React.useState<string | null>(null);
    const [draggingRecipe, setDraggingRecipe] = React.useState<Recipe | null>(null);
    const [draggingTask, setDraggingTask] = React.useState<string | null>(null);
    const [textToAnalyze, setTextToAnalyze] = React.useState<string | null>('');

    React.useEffect(() => {
        if (!db || !userId) return;
        const recipeUnsub = onSnapshot(query(collection(db, `users/${userId}/grimorio`), orderBy('nombre')), snap => setAllRecipes(snap.docs.map(d => ({ ...d.data(), id: d.id } as Recipe))));
        const ingredientUnsub = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre')), snap => setAllIngredients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient))));
        const taskUnsub = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), orderBy('createdAt', 'desc')), snap => setAllPizarronTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as PizarronTask))));
        
        const notifPath = `artifacts/${appId}/users/${userId}/notifications`;
        const q = query(collection(db, notifPath), orderBy('createdAt', 'desc'), limit(20));
        const notifUnsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification));
            setNotifications(data);
        });

        return () => { recipeUnsub(); ingredientUnsub(); taskUnsub(); notifUnsub(); };
    }, [db, userId, appId]);

    const handleOpenRecipeModal = (recipe: Partial<Recipe> | null) => { setRecipeToEdit(recipe); setShowRecipeModal(true); };
    
    const handleDropEnd = () => {
        setDraggingTask(null);
        setDraggingRecipe(null);
    };

    const handleAnalyzeRequest = (text: string) => {
        setTextToAnalyze(text);
        setCurrentView('cerebrIty');
    };

    if (!db || !userId || !auth || !storage || !appId) return <div className="flex h-screen items-center justify-center"><Spinner className="w-12 h-12"/></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased selection:bg-indigo-500/30">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                onShowNotifications={() => setShowNotificationsDrawer(true)}
                unreadNotifications={notifications.some(n => !n.read)}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
            
            <div className={`flex-1 flex flex-col transition-all duration-300 h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <Topbar 
                    onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
                    onShowNotifications={() => setShowNotificationsDrawer(true)}
                    unreadNotifications={notifications.some(n => !n.read)}
                    title="Nexus Suite"
                />
                
                <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <ContentView 
                        currentView={currentView} 
                        setCurrentView={setCurrentView}
                        db={db}
                        auth={auth}
                        storage={storage}
                        userId={userId}
                        appId={appId}
                        allRecipes={allRecipes}
                        allIngredients={allIngredients}
                        allPizarronTasks={allPizarronTasks}
                        onOpenRecipeModal={handleOpenRecipeModal}
                        taskToOpen={taskToOpen}
                        onTaskOpened={() => setTaskToOpen(null)}
                        draggingRecipe={draggingRecipe}
                        onDragRecipeStart={setDraggingRecipe}
                        draggingTask={draggingTask}
                        onDragTaskStart={setDraggingTask}
                        onDropEnd={handleDropEnd}
                        onAnalyze={handleAnalyzeRequest}
                        initialText={textToAnalyze}
                        onAnalysisDone={() => setTextToAnalyze('')}
                        userProfile={userProfile}
                    />
                </main>
            </div>

            {showRecipeModal && <RecipeFormModal isOpen={showRecipeModal} onClose={() => setShowRecipeModal(false)} db={db} userId={userId} initialData={recipeToEdit} allIngredients={allIngredients}/>}
            {showNotificationsDrawer && (
                <NotificationsDrawer
                    isOpen={showNotificationsDrawer}
                    onClose={() => setShowNotificationsDrawer(false)}
                    notifications={notifications}
                    db={db}
                    userId={userId}
                    appId={appId}
                    onTaskClick={(taskId: string) => {
                        setCurrentView('pizarron');
                        setTaskToOpen(taskId);
                    }}
                />
            )}
            <ChatbotWidget />
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isAuthReady, user } = useApp();

    if (!isAuthReady) {
        return <div className="flex h-screen items-center justify-center"><Spinner className="w-12 h-12"/></div>;
    }

    return (
      <>
        <PrintStyles />
        {user ? <MainAppContent /> : <AuthComponent />}
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

import { create } from 'zustand';
import { Recipe } from '../types';

interface UIStoreState {
    showRecipeModal: boolean;
    recipeToEdit: Partial<Recipe> | null;
    showAddTaskModal: boolean;
    taskToOpen: string | null;
    draggingRecipe: Recipe | null;
    draggingTask: string | null;
    textToAnalyze: string | null;

    showNotificationsDrawer: boolean;
    isMobileSidebarOpen: boolean;

    setShowRecipeModal: (show: boolean, recipe?: Partial<Recipe> | null) => void;
    setShowAddTaskModal: (show: boolean) => void;
    setTaskToOpen: (taskId: string | null) => void;
    setDraggingRecipe: (recipe: Recipe | null) => void;
    setDraggingTask: (taskId: string | null) => void;
    setTextToAnalyze: (text: string | null) => void;
    setShowNotificationsDrawer: (show: boolean) => void;
    setIsMobileSidebarOpen: (show: boolean) => void;
    
    // Helper para resetear estado al arrastrar/soltar
    onDropEnd: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
    showRecipeModal: false,
    recipeToEdit: null,
    showAddTaskModal: false,
    taskToOpen: null,
    draggingRecipe: null,
    draggingTask: null,
    textToAnalyze: '',
    showNotificationsDrawer: false,
    isMobileSidebarOpen: false,

    setShowRecipeModal: (show: boolean, recipe: Partial<Recipe> | null = null) => set({ showRecipeModal: show, recipeToEdit: recipe }),
    setShowAddTaskModal: (show: boolean) => set({ showAddTaskModal: show }),
    setTaskToOpen: (taskId: string | null) => set({ taskToOpen: taskId }),
    setDraggingRecipe: (recipe: Recipe | null) => set({ draggingRecipe: recipe }),
    setDraggingTask: (taskId: string | null) => set({ draggingTask: taskId }),
    setTextToAnalyze: (text: string | null) => set({ textToAnalyze: text }),
    setShowNotificationsDrawer: (show: boolean) => set({ showNotificationsDrawer: show }),
    setIsMobileSidebarOpen: (show: boolean) => set({ isMobileSidebarOpen: show }),
    onDropEnd: () => set({ draggingRecipe: null, draggingTask: null })
}));

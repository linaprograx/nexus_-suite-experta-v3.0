import { useState, useMemo } from 'react';
import { PizarronTask, PizarronBoard, UserProfile } from '../../types';
import { pizarronService } from './pizarronService';
import { Firestore } from 'firebase/firestore';

interface UsePizarronProps {
    db: Firestore;
    appId: string;
    allTasks: PizarronTask[];
    allBoards?: PizarronBoard[];
    userProfile?: Partial<UserProfile>;
}

export const usePizarron = ({ db, appId, allTasks, allBoards = [], userProfile }: UsePizarronProps) => {
    // --- State ---
    const [activeBoardId, setActiveBoardId] = useState<string>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'gantt'>('kanban');

    // Modal State
    const [editingTask, setEditingTask] = useState<PizarronTask | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // --- Filtering ---
    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const matchesBoard = task.boardId === activeBoardId || (!task.boardId && activeBoardId === 'general');
            const matchesSearch = task.texto.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' || task.category === selectedCategory;

            return matchesBoard && matchesSearch && matchesCategory;
        });
    }, [allTasks, activeBoardId, searchQuery, selectedCategory]);

    const stats = useMemo(() => {
        return {
            total: filteredTasks.length,
            todo: filteredTasks.filter(t => t.status === 'Ideas').length,
            inProgress: filteredTasks.filter(t => t.status === 'En Progreso').length,
            done: filteredTasks.filter(t => t.status === 'Completada').length
        };
    }, [filteredTasks]);

    // --- Actions ---
    const handleOpenTaskModal = (task: PizarronTask | null = null) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setEditingTask(null);
        setIsTaskModalOpen(false);
    };

    const handleSaveTask = async (taskData: Partial<PizarronTask>) => {
        try {
            if (editingTask) {
                await pizarronService.updateTask(db, appId, editingTask.id, taskData);
            } else {
                await pizarronService.addTask(db, appId, {
                    ...taskData,
                    boardId: activeBoardId,
                    authorName: userProfile?.displayName || 'Usuario'
                });
            }
            handleCloseTaskModal();
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta tarea?")) {
            try {
                await pizarronService.deleteTask(db, appId, taskId);
                if (editingTask?.id === taskId) {
                    handleCloseTaskModal();
                }
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const handleMoveTask = async (taskId: string, newStatus: string) => {
        try {
            await pizarronService.updateTask(db, appId, taskId, { status: newStatus as any });
        } catch (error) {
            console.error("Error moving task:", error);
        }
    };

    return {
        // State
        activeBoardId,
        setActiveBoardId,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        viewMode,
        setViewMode,
        isTaskModalOpen,
        editingTask,

        // Data
        filteredTasks,
        stats,
        availableBoards: allBoards, // Assuming Boards are managed externally or passed in

        // Actions
        handleOpenTaskModal,
        handleCloseTaskModal,
        handleSaveTask,
        handleDeleteTask,
        handleMoveTask
    };
};

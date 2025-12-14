import React, { useState, useCallback } from 'react';
import { PanZoomCanvas } from '../../../components/pizarron/PanZoomCanvas';
import { CanvasBoard } from './CanvasBoard';
import { BoardTopbar } from './BoardTopbar'; // We'll update this import location or ensure it matches
import { PizarronTask, Tag, UserProfile, PizarronBoard } from '../../../types';
import { PizarronControls } from '../../../components/pizarron/PizarronControls'; // If we need parts of it, or we implement directly
import { Firestore, addDoc, collection, doc, deleteDoc } from 'firebase/firestore';

interface PizarronWorkspaceProps {
    tasks: PizarronTask[];
    tags: Tag[];
    activeBoard: PizarronBoard | undefined;
    onUpdateTaskPosition: (taskId: string, pos: { x: number, y: number }) => void;
    onOpenTaskDetail: (task: PizarronTask) => void;
    onAddTask: (status?: string, category?: string) => void;
    // Props needed for Topbar tools
    db: Firestore;
    userId: string;
    appId: string;
    filters: any;
    setFilters: (filters: any) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onAddBoard: () => void; // For board switching if we keep it
    setActiveBoardId: (id: string) => void;
    boards: PizarronBoard[];
    userProfile: Partial<UserProfile>;
}

export const PizarronWorkspace: React.FC<PizarronWorkspaceProps> = ({
    tasks,
    tags,
    activeBoard,
    onUpdateTaskPosition,
    onOpenTaskDetail,
    onAddTask,
    db,
    userId,
    appId,
    filters,
    setFilters,
    searchQuery,
    onSearchChange,
    onAddBoard,
    setActiveBoardId,
    boards,
    userProfile
}) => {
    // Local State for high-performance canvas (avoids re-rendering parent Layout)
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState<string>('pointer'); // 'pointer', 'hand', 'shape', 'text', 'line', 'eraser'

    const handleResetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const handleAddCanvasItem = useCallback(async (itemAttrs: Partial<PizarronTask>) => {
        try {
            const collectionRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);
            await addDoc(collectionRef, {
                ...itemAttrs,
                boardId: activeBoard?.id || 'general', // Default to current board
                createdAt: new Date(),
                status: 'ideas', // Default status for visibility
                position: itemAttrs.position || { x: pan.x * -1 + 100 + Math.random() * 50, y: pan.y * -1 + 100 + Math.random() * 50 }, // Center in view if not provided
                // Default styles if not provided
                style: itemAttrs.style || {},
                zIndex: itemAttrs.type === 'frame' ? 0 : 10,
                authorName: userProfile.displayName || 'User',
                authorPhotoURL: userProfile.photoURL || '',
            });
        } catch (error) {
            console.error("Error creating canvas item:", error);
        }
    }, [db, appId, activeBoard, pan, userProfile]);

    const handleCreateIdea = useCallback(() => {
        handleAddCanvasItem({ type: 'task', category: 'Idea', status: 'ideas', texto: 'Nueva Idea' });
    }, [handleAddCanvasItem]);

    const handleCreateTask = useCallback(() => {
        handleAddCanvasItem({ type: 'task', category: 'General', status: 'ideas', texto: 'Nueva Tarea' });
    }, [handleAddCanvasItem]);

    const handleDeleteCanvasItem = useCallback(async (id: string) => {
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/pizarron-tasks`, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting canvas item:", error);
        }
    }, [db, appId]);

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900">

            {/* Topbar: Fixed, High Z-Index, Always Interactive */}
            <BoardTopbar
                // Core Props
                board={activeBoard}
                currentView="kanban"
                onViewChange={() => { }}

                // Tools
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                zoom={zoom}
                setZoom={setZoom}
                onResetView={handleResetView}

                // Data
                tasks={tasks}
                tags={tags}
                filters={filters}
                setFilters={setFilters}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                db={db}
                userId={userId}
                appId={appId}

                // Creation Handlers
                onAddTask={handleCreateTask}
                onCreateIdea={handleCreateIdea}
                onAddCanvasItem={handleAddCanvasItem}

                // Board Management
                boards={boards}
                setActiveBoardId={setActiveBoardId}
                onAddBoard={onAddBoard}
                userProfile={userProfile}
            />

            {/* Canvas Layer - Clipped and Rounded */}
            <div className="flex-1 w-full h-full relative overflow-hidden rounded-tl-3xl">
                <PanZoomCanvas
                    zoom={zoom}
                    setZoom={setZoom}
                    pan={pan}
                    setPan={setPan}
                    className="w-full h-full"
                    activeTool={activeTool}
                >
                    <CanvasBoard
                        filteredTasks={tasks}
                        tags={tags}
                        activeTool={activeTool}
                        onOpenTaskDetail={onOpenTaskDetail}
                        onUpdateTaskPosition={onUpdateTaskPosition}
                        onAddCanvasItem={handleAddCanvasItem}
                        onDeleteCanvasItem={handleDeleteCanvasItem}
                    />
                </PanZoomCanvas>
            </div>

            {/* Optional: Status Bar / Zoom Indicator at bottom right if needed */}
        </div>
    );
};

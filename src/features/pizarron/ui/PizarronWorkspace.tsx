import React, { useState, useCallback } from 'react';
import { PanZoomCanvas } from '../../../components/pizarron/PanZoomCanvas';
import { CanvasBoard } from './CanvasBoard';
import { BoardTopbar } from './BoardTopbar'; // We'll update this import location or ensure it matches
import { PizarronTask, Tag, UserProfile, PizarronBoard } from '../../../types';
import { PizarronControls } from '../../../components/pizarron/PizarronControls'; // If we need parts of it, or we implement directly
import { Firestore } from 'firebase/firestore';

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

    const handleCreateIdea = useCallback(() => {
        onAddTask('ideas', 'Brainstorming'); // Example defaults
    }, [onAddTask]);

    const handleCreateTask = useCallback(() => {
        onAddTask('ideas', 'General');
    }, [onAddTask]);

    return (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-tl-3xl">

            {/* Topbar Absolute Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                {/* Topbar needs pointer-events-auto on its interactive children */}
                <BoardTopbar
                    // Core Props
                    board={activeBoard}
                    currentView="kanban" // Forced to kanban/canvas for now
                    onViewChange={() => { }} // Maybe allow switching view types later

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
                    onCreateIdea={handleCreateIdea} // We need to add this prop to BoardTopbar

                    // Board Management (If we integrate board switcher in topbar)
                    boards={boards}
                    setActiveBoardId={setActiveBoardId}
                    onAddBoard={onAddBoard}
                    userProfile={userProfile}
                />
            </div>

            {/* Canvas Layer */}
            <div className="flex-1 w-full h-full">
                <PanZoomCanvas
                    zoom={zoom}
                    setZoom={setZoom}
                    pan={pan}
                    setPan={setPan}
                    className="w-full h-full"
                >
                    <CanvasBoard
                        filteredTasks={tasks}
                        tags={tags}
                        activeTool={activeTool}
                        onOpenTaskDetail={onOpenTaskDetail}
                        onUpdateTaskPosition={onUpdateTaskPosition}
                    />
                </PanZoomCanvas>
            </div>

            {/* Optional: Status Bar / Zoom Indicator at bottom right if needed */}
        </div>
    );
};

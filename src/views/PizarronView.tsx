import React from 'react';
import { Firestore, collection, onSnapshot, addDoc, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { PremiumLayout } from '../components/layout/PremiumLayout';
import { ICONS } from '../components/ui/icons';
import { AddTaskModal } from '../components/pizarron/AddTaskModal';
import { TaskDetailModal } from '../components/pizarron/TaskDetailModal';
import { PizarronCalendarView } from './PizarronCalendarView';
import { TopIdeasDrawer } from '../components/pizarron/TopIdeasDrawer';
import { StatsDrawer } from '../components/pizarron/StatsDrawer';
import { CreateBoardModal } from '../components/pizarron/CreateBoardModal';
import { PizarronSidebar } from '../components/pizarron/PizarronSidebar';
import { PizarronControls } from '../components/pizarron/PizarronControls';
import { GlobalSearchModal } from '../components/pizarron/GlobalSearchModal';
import { TemplateSelectorModal } from '../components/pizarron/TemplateSelectorModal';
import { createBoardFromTemplate } from '../features/pizarron-templates/createBoard';
import { useUI } from '../context/UIContext';
import { usePizarron } from '../features/pizarron/usePizarron';
import { pizarronService } from '../features/pizarron/pizarronService';
import { PizarronTask, Recipe, PizarronBoard, UserProfile, Tag } from '../types';
import { BoardColumns } from '../features/pizarron/ui/BoardColumns';
import { BoardTopbar } from '../features/pizarron/ui/BoardTopbar';
import { SmartViewPanel } from '../features/pizarron/ui/SmartViewPanel';
import { ListView } from '../features/pizarron/views/ListView';
import { TimelineView } from '../features/pizarron/views/TimelineView';
import { DocumentView } from '../features/pizarron/views/DocumentView';
import { createDraftRecipeFromTask, runAutomations } from '../features/automations/pizarronAutomations';
import { usePizarraStore } from '../store/pizarraStore';

import { usePizarronData } from '../hooks/usePizarronData';

import { PanZoomCanvas } from '../components/pizarron/PanZoomCanvas';
import { CanvasBoard } from '../features/pizarron/ui/CanvasBoard';
import { PizarronWorkspace } from '../features/pizarron/ui/PizarronWorkspace';

interface PizarronViewProps {
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  // allPizarronTasks: PizarronTask[]; // Removed
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: Recipe | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
  userProfile: Partial<UserProfile>;
}

export default function PizarronView(props: PizarronViewProps) {
  const {
    db, userId, appId, auth, storage,
    taskToOpen, onTaskOpened,
    draggingRecipe, draggingTask, onDropEnd,
    onDragTaskStart, onAnalyze, userProfile
  } = props;

  // Fetch Data
  const { tasks: allPizarronTasks } = usePizarronData();
  const [boards, setBoards] = React.useState<PizarronBoard[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);

  // UI State
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
  const [initialStatusForModal, setInitialStatusForModal] = React.useState<string>('ideas');
  const [initialCategoryForModal, setInitialCategoryForModal] = React.useState<string>('General');
  const [selectedTask, setSelectedTask] = React.useState<PizarronTask | null>(null);
  const [showAddBoard, setShowAddBoard] = React.useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = React.useState(false);
  const [editingBoard, setEditingBoard] = React.useState<PizarronBoard | null>(null);

  // Hook Data
  const {
    activeBoardId,
    setActiveBoardId,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredTasks,
  } = usePizarron({
    db,
    appId,
    allTasks: allPizarronTasks,
    allBoards: boards,
    userProfile
  });

  const activeBoard = boards.find(b => b.id === activeBoardId);

  // Load Boards & Tags
  const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;
  const tagsColPath = `labels/${userId}/tags`;
  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, tagsColPath), (snap) => {
      const tagsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      setTags(tagsData);
    });
    return () => unsub();
  }, [db, tagsColPath]);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, boardsColPath), async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PizarronBoard));
      if (data.length === 0) {
        await setDoc(doc(db, boardsColPath, 'general'), { name: 'General', columns: ['Ideas', 'Pruebas', 'Aprobado'] });
        return;
      }
      setBoards(data);
      if (!activeBoardId && data.length > 0) setActiveBoardId(data[0].id);
    });
    return () => unsub();
  }, [db, boardsColPath, activeBoardId, setActiveBoardId]);

  // Handlers
  const handleAddTask = (status?: string, category?: string) => {
    setInitialStatusForModal(status || 'ideas');
    setInitialCategoryForModal(category || 'General');
    setShowAddTaskModal(true);
  };

  const handleUpdateTaskPosition = async (taskId: string, pos: { x: number, y: number }) => {
    try {
      await updateDoc(doc(db, pizarronColPath, taskId), { position: pos });
    } catch (e) {
      console.error("Position update failed", e);
    }
  };

  const handleCreateBoard = async (boardData: Partial<PizarronBoard>) => {
    try {
      if (boardData.id) {
        await pizarronService.updateBoard(db, appId, boardData.id, boardData);
      } else {
        await pizarronService.addBoard(db, appId, boardData);
      }
      setShowAddBoard(false);
      setEditingBoard(null);
    } catch (e) { console.error(e); }
  };

  const handleCreateFromTemplate = async (tId: string) => {
    try {
      const newId = await createBoardFromTemplate(db, appId, tId);
      setShowTemplateSelector(false);
      setActiveBoardId(newId);
    } catch (e) { console.error(e); }
  };

  return (
    <PremiumLayout
      gradientTheme="amber" // Orange/Amber theme for Pizarron Zen
      layoutMode="zen"
      leftSidebar={null} // Removed Sidebar
      rightSidebar={null} // Removed Sidebar (Controls integrated in Topbar)
      mainContent={
        <PizarronWorkspace
          tasks={filteredTasks}
          tags={tags}
          activeBoard={activeBoard}
          onUpdateTaskPosition={handleUpdateTaskPosition}
          onOpenTaskDetail={setSelectedTask}
          onAddTask={handleAddTask}

          db={db}
          userId={userId}
          appId={appId}

          filters={filters}
          setFilters={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}

          boards={boards}
          setActiveBoardId={setActiveBoardId}
          onAddBoard={() => setShowAddBoard(true)}
          userProfile={userProfile}
        />
      }
    >
      {/* Modals & Drawers */}
      {showAddTaskModal && activeBoardId && (
        <AddTaskModal
          isOpen={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          db={db}
          appId={appId}
          userId={userId}
          auth={auth}
          initialStatus={initialStatusForModal}
          activeBoardId={activeBoardId}
          userProfile={userProfile}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          db={db}
          userId={userId}
          appId={appId}
          auth={auth}
          storage={storage}
          onAnalyze={onAnalyze}
        />
      )}
      {showAddBoard && (
        <CreateBoardModal
          isOpen={showAddBoard}
          onClose={() => { setShowAddBoard(false); setEditingBoard(null); }}
          onCreate={handleCreateBoard}
          boardToEdit={editingBoard}
        />
      )}
      {showTemplateSelector && (
        <TemplateSelectorModal
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelectTemplate={handleCreateFromTemplate}
        />
      )}
    </PremiumLayout>
  );
}

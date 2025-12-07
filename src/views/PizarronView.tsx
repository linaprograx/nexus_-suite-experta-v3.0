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
import { PizarronTask, Recipe, PizarronBoard, UserProfile, Tag } from '../../types';
import { BoardColumns } from '../features/pizarron/ui/BoardColumns';
import { BoardTopbar } from '../features/pizarron/ui/BoardTopbar';
import { SmartViewPanel } from '../features/pizarron/ui/SmartViewPanel';
import { ListView } from '../features/pizarron/views/ListView';
import { TimelineView } from '../features/pizarron/views/TimelineView';
import { DocumentView } from '../features/pizarron/views/DocumentView';
import { createDraftRecipeFromTask, runAutomations } from '../features/automations/pizarronAutomations';
import { usePizarraStore } from '../store/pizarraStore';

interface PizarronViewProps {
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth;
  storage: FirebaseStorage;
  allPizarronTasks: PizarronTask[];
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: Recipe | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
  userProfile: Partial<UserProfile>;
}

const PizarronView: React.FC<PizarronViewProps> = ({ db, userId, appId, auth, storage, allPizarronTasks, taskToOpen, onTaskOpened, draggingRecipe, draggingTask, onDropEnd, onDragTaskStart, onAnalyze, userProfile }) => {
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
  const [initialStatusForModal, setInitialStatusForModal] = React.useState<string>('ideas');
  const [selectedTask, setSelectedTask] = React.useState<PizarronTask | null>(null);

  const [boards, setBoards] = React.useState<PizarronBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);
  const [showAddBoard, setShowAddBoard] = React.useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = React.useState(false);
  const [tags, setTags] = React.useState<Tag[]>([]);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [showTopIdeasDrawer, setShowTopIdeasDrawer] = React.useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = React.useState(false);
  const [showSmartView, setShowSmartView] = React.useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = React.useState(false);
  const [filters, setFilters] = React.useState<any>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focusedColumn, setFocusedColumn] = React.useState<string | null>(null);

  const [currentView, setCurrentView] = React.useState<'kanban' | 'list' | 'timeline' | 'document'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_pizarron_default_view') as any || 'kanban';
    }
    return 'kanban';
  });

  const handleViewChange = (view: 'kanban' | 'list' | 'timeline' | 'document') => {
    setCurrentView(view);
    localStorage.setItem('nexus_pizarron_default_view', view);
  };

  const { compactMode, toggleCompactMode } = useUI();
  const { focusMode } = usePizarraStore();

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;
  const tagsColPath = `labels/${userId}/tags`;

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, tagsColPath), (snap) => {
      const tagsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      setTags(tagsData);
    });
    return () => unsub();
  }, [db, tagsColPath]);

  React.useEffect(() => {
    if (taskToOpen && allPizarronTasks.length > 0) {
      const task = allPizarronTasks.find(t => t.id === taskToOpen);
      if (task) {
        setSelectedTask(task);
      }
      onTaskOpened();
    }
  }, [taskToOpen, allPizarronTasks, onTaskOpened, setSelectedTask]);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, boardsColPath), async (snap) => {
      const boardsData = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as PizarronBoard));

      if (boardsData.length === 0) {
        await setDoc(doc(db, boardsColPath, 'general'), { name: 'General', columns: ['Ideas', 'Pruebas', 'Aprobado'] });
        return;
      }
      setBoards(boardsData);
      if (!activeBoardId && boardsData.length > 0) {
        setActiveBoardId(boardsData[0].id);
      }
    });
    return () => unsub();
  }, [db, boardsColPath, activeBoardId]);

  const [editingBoard, setEditingBoard] = React.useState<PizarronBoard | null>(null);

  const handleCreateBoard = async (boardData: Partial<PizarronBoard>) => {
    if (!boardData.name) return;

    if (boardData.id) {
      // Update
      try {
        await updateDoc(doc(db, boardsColPath, boardData.id), {
          name: boardData.name,
          category: boardData.category,
          themeColor: boardData.themeColor,
          icon: boardData.icon,
          description: boardData.description,
          ...(boardData.columns ? { columns: boardData.columns } : {})
        });
      } catch (e) {
        console.error("Error updating board", e);
      }
    } else {
      // Create
      await addDoc(collection(db, boardsColPath), {
        name: boardData.name,
        filters: {},
        category: boardData.category || 'general',
        themeColor: boardData.themeColor || '#60A5FA',
        icon: boardData.icon || 'layout',
        description: boardData.description || '',
        columns: boardData.columns || ['Ideas', 'Pruebas', 'Aprobado'],
        createdAt: serverTimestamp()
      });
    }
    setShowAddBoard(false);
    setEditingBoard(null);
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (confirm("¿Estás seguro de eliminar este tablero?")) {
      try {
        await deleteDoc(doc(db, boardsColPath, boardId));
        if (activeBoardId === boardId) setActiveBoardId(null);
      } catch (e) {
        console.error("Error deleting board", e);
      }
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const newBoardId = await createBoardFromTemplate(db, appId, templateId);
      setShowTemplateSelector(false);
      setActiveBoardId(newBoardId);
    } catch (error) {
      console.error("Error creating board from template:", error);
      alert("Error al crear el tablero desde la plantilla.");
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    onDragTaskStart(taskId);
  };

  const handleDropOnColumn = async (newStatus: string) => {
    if (draggingTask) {
      const taskDocRef = doc(db, pizarronColPath, draggingTask);

      const task = allPizarronTasks.find(t => t.id === draggingTask);
      const sourceColumn = task?.status;

      await updateDoc(taskDocRef, { status: newStatus });

      // Automation: Create draft recipe if moved to 'Aprobado'
      if (newStatus === 'Aprobado') {
        createDraftRecipeFromTask(db, userId, draggingTask, appId);
      }

      const { automationsEnabled } = usePizarraStore.getState();
      if (automationsEnabled && task && sourceColumn) {
        runAutomations(task, sourceColumn, newStatus);
      }
    } else if (draggingRecipe) {
      const newTask: Omit<PizarronTask, 'id'> = {
        texto: `TESTEO: ${draggingRecipe.nombre}`,
        status: newStatus,
        category: 'Desarrollo',
        createdAt: serverTimestamp(),
        boardId: activeBoardId || 'general',
        labels: ['Grimorio', ...(draggingRecipe.categorias || [])],
        tags: [],
        priority: 'media',
        upvotes: [],
        starRating: {},
        attachments: draggingRecipe.imageUrl ? [{ name: 'Imagen de referencia', url: draggingRecipe.imageUrl, type: 'image' }] : [],
        assignees: [userId],
        dueDate: null,
        authorName: userProfile.displayName || 'Unknown Author',
        authorPhotoURL: userProfile.photoURL || ''
      };
      await addDoc(collection(db, pizarronColPath), newTask);
    }
    onDropEnd();
  };

  const handleDropOnCalendar = async (date: Date) => {
    if (!draggingTask) return;
    const taskDocRef = doc(db, pizarronColPath, draggingTask);
    await updateDoc(taskDocRef, { dueDate: date });
    onDropEnd();
  };

  const handleSuggestSlots = () => {
    // Placeholder for AI Suggestion Logic
    alert("CerebrIty AI: Analizando patrones de trabajo para sugerir slots óptimos...");
    // Here we would call the Gemini API to analyze task distribution and suggest dates
  };

  const filteredTasks = React.useMemo(() => {
    if (!activeBoardId) return [];

    let tasks = allPizarronTasks.filter(task => task.boardId === activeBoardId);

    // Focus Mode
    if (focusMode) {
      tasks = tasks.filter(t => t.assignees?.includes(userId));
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.texto.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
    }

    // Filters
    if (filters.categories && filters.categories.length > 0) {
      tasks = tasks.filter(t => filters.categories.includes(t.category));
    }
    if (filters.priorities && filters.priorities.length > 0) {
      tasks = tasks.filter(t => filters.priorities.includes(t.priority || 'media'));
    }
    if (filters.tags && filters.tags.length > 0) {
      tasks = tasks.filter(t => t.tags?.some(tagId => filters.tags.includes(tagId)));
    }

    return tasks;
  }, [allPizarronTasks, activeBoardId, searchQuery, filters]);

  const handleColumnHeaderClick = (status: string) => {
    if (focusMode) {
      setFocusedColumn(focusedColumn === status ? null : status);
    }
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);
  const columns = activeBoard?.columns || ['Ideas', 'Pruebas', 'Aprobado'];
  const boardThemeColor = activeBoard?.themeColor || '#60A5FA';

  if (!db || !userId || !auth || !storage) return <Spinner />;

  return (
    <PremiumLayout
      gradientTheme="amber"
      leftSidebar={
        isLeftPanelOpen ? (
          <PizarronSidebar
            boards={boards}
            activeBoardId={activeBoardId}
            setActiveBoardId={setActiveBoardId}
            onAddBoard={() => setShowAddBoard(true)}
            onSelectTemplate={() => setShowTemplateSelector(true)}
            onEditBoard={(board) => {
              setEditingBoard(board);
              setShowAddBoard(true);
            }}
            onDeleteBoard={handleDeleteBoard}
          />
        ) : null
      }
      mainContent={
        <div
          className="flex flex-col h-full rounded-tl-3xl transition-colors duration-500"
          style={{ background: `linear-gradient(to bottom, ${boardThemeColor}15, ${boardThemeColor}05, transparent)` }}
        >
          <BoardTopbar
            isLeftPanelOpen={isLeftPanelOpen}
            onToggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            db={db}
            userId={userId}
            tags={tags}
            compactMode={compactMode}
            onToggleCompactMode={toggleCompactMode}
            onShowStats={() => setShowStatsDrawer(true)}
            onShowTopIdeas={() => setShowTopIdeasDrawer(true)}
            onShowSmartView={() => setShowSmartView(true)}
            currentView={currentView}
            onViewChange={handleViewChange}
            boardName={activeBoard?.name || 'Pizarrón'}
            boardDescription={activeBoard?.description}
          />

          <div className="flex-1 flex flex-col min-h-0 relative mt-4">
            {currentView === 'kanban' && (
              <BoardColumns
                activeBoard={activeBoard}
                filteredTasks={filteredTasks}
                focusedColumn={focusedColumn}
                focusMode={focusMode}
                tags={tags}
                onAddTask={(s) => { setInitialStatusForModal(s); setShowAddTaskModal(true); }}
                onDragStart={(e, taskId) => onDragTaskStart(taskId)}
                onDropOnColumn={onDropEnd}
                onOpenTaskDetail={setSelectedTask}
                onColumnHeaderClick={handleColumnHeaderClick}
                boardThemeColor={boardThemeColor}
              />
            )}
            {currentView === 'list' && (
              <ListView
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
              />
            )}
            {currentView === 'timeline' && (
              <TimelineView
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
              />
            )}
            {currentView === 'document' && (
              <DocumentView
                tasks={filteredTasks}
                columns={columns}
                onTaskClick={setSelectedTask}
              />
            )}
            <div className="border-t border-white/10 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-10 transition-all duration-300 mt-auto">
              <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full p-2 text-sm font-medium flex justify-center items-center gap-2 hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors">
                <Icon svg={ICONS.calendar} className="h-5 w-5" /> Calendario Inteligente {isCalendarOpen && <span className="text-xs bg-indigo-500 text-white px-1.5 rounded-full">AI</span>} <Icon svg={isCalendarOpen ? ICONS.chevronDown : ICONS.upArrow} className="h-4 w-4" />
              </button>
              {isCalendarOpen && (
                <div className="h-[500px] overflow-y-auto custom-scrollbar">
                  <PizarronCalendarView tasks={filteredTasks} onDropTask={handleDropOnCalendar} onTaskClick={setSelectedTask} onSuggestSlots={handleSuggestSlots} />
                </div>
              )}
            </div>
          </div>
        </div>
      }
      rightSidebar={
        <PizarronControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          db={db}
          userId={userId}
          tags={tags}
          onShowStats={() => setShowStatsDrawer(true)}
          onShowTopIdeas={() => setShowTopIdeasDrawer(true)}
          onShowSmartView={() => setShowSmartView(true)}
          onGlobalSearch={() => setShowGlobalSearch(true)}
        />
      }
    >
      {showGlobalSearch && <GlobalSearchModal isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} db={db} appId={appId} onOpenTask={(t) => setSelectedTask(t)} />}
      {showAddTaskModal && activeBoardId && <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} db={db} appId={appId} userId={userId} auth={auth} initialStatus={initialStatusForModal} activeBoardId={activeBoardId} userProfile={userProfile} />}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} db={db} userId={userId} appId={appId} auth={auth} storage={storage} onAnalyze={onAnalyze} />}
      {showTopIdeasDrawer && <TopIdeasDrawer isOpen={showTopIdeasDrawer} onClose={() => setShowTopIdeasDrawer(false)} tasks={filteredTasks} onTaskClick={setSelectedTask} />}
      <StatsDrawer isOpen={showStatsDrawer} onClose={() => setShowStatsDrawer(false)} tasks={filteredTasks} />
      {showAddBoard && <CreateBoardModal isOpen={showAddBoard} onClose={() => { setShowAddBoard(false); setEditingBoard(null); }} onCreate={handleCreateBoard} boardToEdit={editingBoard} />}
      {showTemplateSelector && <TemplateSelectorModal isOpen={showTemplateSelector} onClose={() => setShowTemplateSelector(false)} onSelectTemplate={handleCreateFromTemplate} />}
      <SmartViewPanel isOpen={showSmartView} onClose={() => setShowSmartView(false)} tasks={filteredTasks} columns={columns} />
    </PremiumLayout>
  );
};

export default PizarronView;

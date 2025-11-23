import React from 'react';
import { Firestore, collection, onSnapshot, addDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ICONS } from '../components/ui/icons';
import { AddTaskModal } from '../components/pizarron/AddTaskModal';
import { TaskDetailModal } from '../components/pizarron/TaskDetailModal';
import { KanbanColumn } from '../components/pizarron/KanbanColumn';
import { PizarronCalendarView } from './PizarronCalendarView';
import { TopIdeasDrawer } from '../components/pizarron/TopIdeasDrawer';
import { FiltersBar } from '../components/pizarron/FiltersBar';
import { StatsDrawer } from '../components/pizarron/StatsDrawer';
import { CreateBoardModal } from '../components/pizarron/CreateBoardModal';
import { useUI } from '../context/UIContext';
import { PizarronTask, Recipe, PizarronBoard, PizarronStatus, UserProfile, Tag } from '../../types';

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
  const [initialStatusForModal, setInitialStatusForModal] = React.useState<PizarronStatus>('ideas');
  const [selectedTask, setSelectedTask] = React.useState<PizarronTask | null>(null);

  const [boards, setBoards] = React.useState<PizarronBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);
  const [showAddBoard, setShowAddBoard] = React.useState(false);
  const [tags, setTags] = React.useState<Tag[]>([]);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [showTopIdeasDrawer, setShowTopIdeasDrawer] = React.useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = React.useState(false);
  const [filters, setFilters] = React.useState<any>({});
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focusedColumn, setFocusedColumn] = React.useState<string | null>(null);

  const { compactMode, toggleCompactMode, focusMode, toggleFocusMode } = useUI();
  
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
          name: d.data().name || 'Tablero sin nombre',
          filters: d.data().filters || {}
        } as PizarronBoard));
        if (boardsData.length === 0) {
            await setDoc(doc(db, boardsColPath, 'general'), { name: 'General' });
            return;
        }
        setBoards(boardsData);
        if (!activeBoardId && boardsData.length > 0) {
            setActiveBoardId(boardsData[0].id);
        }
    });
    return () => unsub();
  }, [db, boardsColPath, activeBoardId]);
  
  const handleCreateBoard = async (boardData: Partial<PizarronBoard>) => {
    if (!boardData.name) return;
    await addDoc(collection(db, boardsColPath), {
      name: boardData.name,
      filters: {},
      category: boardData.category || 'general',
      themeColor: boardData.themeColor || '#60A5FA',
      icon: boardData.icon || 'layout',
      description: boardData.description || ''
    });
    setShowAddBoard(false);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    onDragTaskStart(taskId);
  };

  const handleDropOnColumn = async (newStatus: 'ideas' | 'pruebas' | 'aprobado') => {
    if (draggingTask) {
        const taskDocRef = doc(db, pizarronColPath, draggingTask);
        await updateDoc(taskDocRef, { status: newStatus });
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

  if (!db || !userId || !auth || !storage) return <Spinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 lg:px-6 py-2 gap-4 border-b border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4 w-full md:w-auto">
                {!isLeftPanelOpen && <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(true)}><Icon svg={ICONS.chevronRight} /></Button>}
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Pizarrón</h1>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-1 justify-center max-w-xl">
               <div className="relative w-full">
                  <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar tareas..." 
                    className="pl-9 bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/30 backdrop-blur-sm focus:ring-2 focus:ring-purple-500/50" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end items-center">
                <FiltersBar filters={filters} setFilters={setFilters} db={db} userId={userId} tags={tags} />
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button variant={compactMode ? "secondary" : "ghost"} size="sm" onClick={toggleCompactMode} title="Modo Compacto">
                    <Icon svg={ICONS.list} className="h-4 w-4" />
                </Button>
                <Button variant={focusMode ? "secondary" : "ghost"} size="sm" onClick={toggleFocusMode} title="Modo Focus">
                    <Icon svg={ICONS.eye} className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowStatsDrawer(true)}>
                    <Icon svg={ICONS.chart} className="h-5 w-5" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => setShowTopIdeasDrawer(true)}>
                    <Icon svg={ICONS.trendingUp} className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="flex flex-1 min-h-0 relative">
            <div className={`bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-r border-white/10 dark:border-slate-700/30 overflow-y-auto flex-shrink-0 transition-all duration-300 ${isLeftPanelOpen ? 'w-64 p-4' : 'w-0 p-0 hidden'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">Tableros</h2>
                  <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(false)}><Icon svg={ICONS.chevronLeft} /></Button>
                </div>
                {boards.map(board => (
                    <Button key={board.id} variant={activeBoardId === board.id ? "secondary" : "ghost"} className={`w-full justify-start mb-1 ${activeBoardId === board.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : ''}`} onClick={() => setActiveBoardId(board.id)}>{board.name}</Button>
                ))}
                <Button size="sm" variant="outline" className="w-full mt-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500" onClick={() => setShowAddBoard(true)}><Icon svg={ICONS.plus} className="h-4 w-4 mr-2"/>Nuevo Tablero</Button>
            </div>

            <main className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex-1 flex p-4 gap-4 overflow-x-auto scroll-snap-x snap-mandatory">
                    {(['ideas', 'pruebas', 'aprobado'] as const).map(status => {
                        const isFocused = focusedColumn === status;
                        const isHidden = focusMode && focusedColumn && !isFocused;
                        
                        if (isHidden) return null;

                        return (
                            <KanbanColumn
                                key={status}
                                title={status.charAt(0).toUpperCase() + status.slice(1)}
                                status={status}
                                tasks={filteredTasks.filter(t => t.status === status)}
                                onAddTask={(s) => { setInitialStatusForModal(s); setShowAddTaskModal(true); }}
                                onDragStart={handleDragStart}
                                onDropOnColumn={handleDropOnColumn}
                                onOpenTaskDetail={setSelectedTask}
                                isFocused={isFocused}
                                onHeaderClick={() => handleColumnHeaderClick(status)}
                                allTags={tags}
                            />
                        );
                    })}
                </div>
                <div className="border-t border-white/10 dark:border-slate-700/30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-10 transition-all duration-300">
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full p-2 text-sm font-medium flex justify-center items-center gap-2 hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors">
                        <Icon svg={ICONS.calendar} className="h-5 w-5" /> Calendario Inteligente {isCalendarOpen && <span className="text-xs bg-indigo-500 text-white px-1.5 rounded-full">AI</span>} <Icon svg={isCalendarOpen ? ICONS.chevronDown : ICONS.upArrow} className="h-4 w-4" />
                    </button>
                    {isCalendarOpen && (
                        <div className="h-[500px]">
                            <PizarronCalendarView tasks={filteredTasks} onDropTask={handleDropOnCalendar} onTaskClick={setSelectedTask} onSuggestSlots={handleSuggestSlots} />
                        </div>
                    )}
                </div>
            </main>
        </div>

        {showAddTaskModal && activeBoardId && <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} db={db} appId={appId} userId={userId} auth={auth} initialStatus={initialStatusForModal} activeBoardId={activeBoardId} userProfile={userProfile} />}
        {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} db={db} userId={userId} appId={appId} auth={auth} storage={storage} onAnalyze={onAnalyze} />}
        {showTopIdeasDrawer && <TopIdeasDrawer isOpen={showTopIdeasDrawer} onClose={() => setShowTopIdeasDrawer(false)} tasks={filteredTasks} onTaskClick={setSelectedTask} />}
        <StatsDrawer isOpen={showStatsDrawer} onClose={() => setShowStatsDrawer(false)} tasks={filteredTasks} />
        {showAddBoard && <CreateBoardModal isOpen={showAddBoard} onClose={() => setShowAddBoard(false)} onCreate={handleCreateBoard} />}
    </div>
  );
};

export default PizarronView;

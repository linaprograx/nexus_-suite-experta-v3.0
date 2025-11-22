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
import { CalendarView } from '../components/pizarron/CalendarView';
import { TopIdeasDrawer } from '../components/pizarron/TopIdeasDrawer';
import { PizarronTask, Recipe, PizarronBoard, PizarronStatus, UserProfile } from '../../types';

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
  const [newBoardName, setNewBoardName] = React.useState("");

  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [showTopIdeasDrawer, setShowTopIdeasDrawer] = React.useState(false);
  
  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;

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
  
  const handleAddBoard = async () => {
    if (!newBoardName.trim()) return;
    await addDoc(collection(db, boardsColPath), { name: newBoardName, filters: {} });
    setNewBoardName("");
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
  
  const filteredTasks = React.useMemo(() => {
      if (!activeBoardId) return [];
      const activeBoard = boards.find(b => b.id === activeBoardId);
      if (!activeBoard) return [];
      return allPizarronTasks.filter(task => task.boardId === activeBoardId);
  }, [allPizarronTasks, activeBoardId, boards]);

  if (!db || !userId || !auth || !storage) return <Spinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-4 lg:px-8">
            <div className="flex items-center gap-2">
                {!isLeftPanelOpen && <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(true)}><Icon svg={ICONS.chevronRight} /></Button>}
                <h1 className="text-2xl font-semibold">Pizarrón Creativo</h1>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowTopIdeasDrawer(true)}>
                    <Icon svg={ICONS.trendingUp} className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="flex flex-1 min-h-0">
            <div className={`bg-background border-r overflow-y-auto flex-shrink-0 transition-all duration-300 ${isLeftPanelOpen ? 'w-64 p-4' : 'w-0 p-0 hidden'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Tableros</h2>
                  <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(false)}><Icon svg={ICONS.chevronLeft} /></Button>
                </div>
                {boards.map(board => (
                    <Button key={board.id} variant={activeBoardId === board.id ? "secondary" : "ghost"} className="w-full justify-start mb-1" onClick={() => setActiveBoardId(board.id)}>{board.name}</Button>
                ))}
                {showAddBoard ? (
                    <div className="mt-2 space-y-2">
                        <Input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="Nombre del tablero..." />
                        <div className="flex gap-2"><Button size="sm" onClick={handleAddBoard}>Crear</Button><Button size="sm" variant="ghost" onClick={() => setShowAddBoard(false)}>Cancelar</Button></div>
                    </div>
                ) : <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowAddBoard(true)}><Icon svg={ICONS.plus} className="h-4 w-4 mr-2"/>Nuevo Tablero</Button>}
            </div>

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex p-4 gap-4 overflow-x-auto">
                    {(['ideas', 'pruebas', 'aprobado'] as const).map(status => (
                        <KanbanColumn
                            key={status}
                            title={status.charAt(0).toUpperCase() + status.slice(1)}
                            status={status}
                            tasks={filteredTasks.filter(t => t.status === status)}
                            onAddTask={(s) => { setInitialStatusForModal(s); setShowAddTaskModal(true); }}
                            onDragStart={handleDragStart}
                            onDropOnColumn={handleDropOnColumn}
                            onOpenTaskDetail={setSelectedTask}
                        />
                    ))}
                </div>
                <div className="border-t">
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full p-2 text-sm font-medium flex justify-center items-center gap-2 hover:bg-secondary">
                        <Icon svg={ICONS.calendar} className="h-5 w-5" /> Calendario <Icon svg={isCalendarOpen ? ICONS.chevronDown : ICONS.upArrow} className="h-4 w-4" />
                    </button>
                    {isCalendarOpen && (
                        <div className="h-96">
                            <CalendarView tasks={filteredTasks} onDropTask={handleDropOnCalendar} onTaskClick={setSelectedTask} />
                        </div>
                    )}
                </div>
            </main>
        </div>

        {showAddTaskModal && activeBoardId && <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} db={db} appId={appId} userId={userId} auth={auth} initialStatus={initialStatusForModal} activeBoardId={activeBoardId} userProfile={userProfile} />}
        {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} db={db} userId={userId} appId={appId} auth={auth} storage={storage} onAnalyze={onAnalyze} />}
        {showTopIdeasDrawer && <TopIdeasDrawer isOpen={showTopIdeasDrawer} onClose={() => setShowTopIdeasDrawer(false)} tasks={filteredTasks} onTaskClick={setSelectedTask} />}
    </div>
  );
};

export default PizarronView;

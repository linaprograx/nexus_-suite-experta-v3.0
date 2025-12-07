import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, TaskCategory, UserProfile } from '../../../types';
import { IngredientSelector } from './IngredientSelector';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Firestore;
  appId: string;
  userId: string;
  auth: Auth;
  initialStatus: string;
  activeBoardId: string | null;
  userProfile: Partial<UserProfile>;
  enabledTools?: string[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, db, appId, userId, auth, initialStatus, activeBoardId, userProfile, enabledTools = [] }) => {
  const [texto, setTexto] = React.useState('');
  const [category, setCategory] = React.useState<TaskCategory>('Ideas');
  const [priority, setPriority] = React.useState<'baja' | 'media' | 'alta'>('media');
  const [labels, setLabels] = React.useState('');

  // Grimorium Integration
  const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);

  // Tag system
  const [availableTags, setAvailableTags] = React.useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [newTagName, setNewTagName] = React.useState('');
  const [newTagColor, setNewTagColor] = React.useState('#60A5FA');
  const [showTagInput, setShowTagInput] = React.useState(false);

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const tagsColPath = `labels/${userId}/tags`;

  const tagColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899'];

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, tagsColPath), (snap) => {
      const tags = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag));
      setAvailableTags(tags);
    });
    return () => unsub();
  }, [db, tagsColPath]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await addDoc(collection(db, tagsColPath), { name: newTagName, color: newTagColor });
    setNewTagName('');
    setShowTagInput(false);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleAddTask = async () => {
    if (!texto.trim() || !activeBoardId) {
      alert("El texto es obligatorio y debe haber un tablero activo.");
      return;
    };

    const labelsArray = labels.split(',').map(l => l.trim()).filter(l => l);

    const newTask: Omit<PizarronTask, 'id'> = {
      texto: texto,
      status: initialStatus,
      category: category,
      createdAt: serverTimestamp(),
      boardId: activeBoardId,
      labels: labelsArray,
      tags: selectedTags,
      priority: priority,
      upvotes: [],
      starRating: {},
      attachments: [],
      assignees: [auth.currentUser?.email || userId],
      dueDate: null,
      authorName: userProfile.displayName || 'Unknown Author',
      authorPhotoURL: userProfile.photoURL || '',
      linkedIngredients: selectedIngredients
    };

    try {
      await addDoc(collection(db, pizarronColPath), newTask);
      onClose();
      setTexto('');
      setCategory('Ideas');
      setPriority('media');
      setLabels('');
      setSelectedTags([]);
      setSelectedIngredients([]);
    } catch (err) {
      console.error("Error al añadir tarea: ", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-3">
        <div className="bg-orange-600/10 p-2.5 rounded-xl text-orange-600">
          <Icon svg={ICONS.plus} className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-xl text-slate-900 dark:text-slate-100 block leading-tight">Nueva Tarea</span>
          <span className="text-xs text-slate-500 font-medium">Capture your idea quickly</span>
        </div>
      </div>
    }>
      <div className="space-y-6">

        {/* Main Input */}
        <div className="relative group">
          <Textarea
            placeholder="Escribe tu idea aquí..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full h-32 text-xl font-medium bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border-none focus:ring-2 focus:ring-orange-500/20 rounded-2xl p-5 transition-all resize-none placeholder:text-slate-400"
            autoFocus
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Press Enter to skip</div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 flex items-center">
            <div className="p-2 text-slate-400"><Icon svg={ICONS.tag} className="w-4 h-4" /></div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="border-none bg-transparent h-9 text-sm font-medium focus:ring-0 w-full"
            >
              <option value="Ideas">Ideas</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="Marketing">Marketing</option>
              <option value="Admin">Admin</option>
              <option value="Urgente">Urgente</option>
            </Select>
          </div>

          {/* Priority */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 flex">
            {(['baja', 'media', 'alta'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all h-9 ${priority === p
                    ? (p === 'alta' ? 'bg-red-50 text-red-600' : p === 'media' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600')
                    : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* POWERS SECTION (DYNAMIC) */}
        {enabledTools.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Board Powers</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>

            {/* Grimorium Power */}
            {enabledTools.includes('grimorium') && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20 overflow-hidden">
                <div className="px-4 py-3 bg-emerald-100/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Icon svg={ICONS.book} className="w-3.5 h-3.5" /> Grimorium
                  </span>
                  <span className="text-[10px] text-emerald-600/70">{selectedIngredients.length} linked</span>
                </div>
                <div className="p-4">
                  <IngredientSelector
                    appId={appId}
                    selectedIds={selectedIngredients}
                    onToggle={(id) => {
                      setSelectedIngredients(prev =>
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={handleAddTask}
            className="w-full h-14 text-lg font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.01] active:scale-95 transition-all rounded-2xl shadow-xl shadow-slate-900/10"
          >
            Create Task
          </Button>
        </div>

      </div>
    </Modal>
  );
};

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
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, db, appId, userId, auth, initialStatus, activeBoardId, userProfile }) => {
  const [texto, setTexto] = React.useState('');
  const [category, setCategory] = React.useState<TaskCategory>('Ideas');
  const [priority, setPriority] = React.useState<'baja' | 'media' | 'alta'>('media');
  const [labels, setLabels] = React.useState('');

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
      authorPhotoURL: userProfile.photoURL || ''
    };

    try {
      await addDoc(collection(db, pizarronColPath), newTask);
      onClose();
      setTexto('');
      setCategory('Ideas');
      setPriority('media');
      setLabels('');
      setSelectedTags([]);
    } catch (err) {
      console.error("Error al añadir tarea: ", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-2">
        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600">
          <Icon svg={ICONS.plus} className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-slate-800 dark:text-slate-100">Nueva Tarea</span>
      </div>
    }>
      <div className="space-y-6">
        <div className="relative group">
          <Textarea
            placeholder="¿Qué tienes en mente?"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-32 text-xl font-medium resize-none bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 p-4 rounded-2xl transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            autoFocus
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-300">Enter para siguiente línea</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Categoría</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="Ideas">💡 Ideas</option>
              <option value="Desarrollo">🔨 Desarrollo</option>
              <option value="Marketing">📢 Marketing</option>
              <option value="Admin">💼 Admin</option>
              <option value="Urgente">🔥 Urgente</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Prioridad</Label>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-11">
              {(['baja', 'media', 'alta'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 rounded-lg text-xs font-bold uppercase transition-all ${priority === p ?
                    (p === 'alta' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' :
                      p === 'media' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' :
                        'bg-slate-500 text-white shadow-md shadow-slate-500/20')
                    : 'text-slate-500 hover:bg-white/50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Tags */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Icon svg={ICONS.tag} className="w-3 h-3" /> Etiquetas
            </Label>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs hover:text-orange-500 hover:bg-orange-50" onClick={() => setShowTagInput(!showTagInput)}>
              <Icon svg={ICONS.plus} className="h-3 w-3 mr-1" /> Nueva
            </Button>
          </div>

          {showTagInput && (
            <div className="flex flex-col gap-3 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nombre de la etiqueta..."
                  className="h-9 text-sm border-slate-200 focus:border-orange-500"
                />
                <Button size="sm" className="h-9 px-3 bg-slate-800 text-white hover:bg-slate-700" onClick={handleCreateTag}>Crear</Button>
              </div>
              <div className="flex gap-2 items-center overflow-x-auto pb-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">Color:</span>
                {tagColors.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    className={`w-6 h-6 rounded-full shrink-0 transition-transform ${newTagColor === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-300' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 min-h-[30px]">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedTags.includes(tag.id) ? 'ring-2 ring-offset-1 border-transparent shadow-sm scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                style={{
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                  color: selectedTags.includes(tag.id) ? '#fff' : undefined,
                  borderColor: !selectedTags.includes(tag.id) ? undefined : tag.color
                }}
              >
                {tag.name}
              </button>
            ))}
            {availableTags.length === 0 && <span className="text-xs text-slate-400 italic py-1">No hay etiquetas disponibles.</span>}
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 mb-1.5 block">Keywords (IA)</Label>
          <Input
            placeholder="Ej: innovación, verano (separado por comas)"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            className="text-sm h-10 border-slate-200 rounded-xl focus:border-orange-500"
          />
        </div>
        <div className="pt-2">
          <Button onClick={handleAddTask} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-xl shadow-orange-500/20 rounded-xl transition-all hover:scale-[1.01] active:scale-95">
            Guardar Tarea
          </Button>
        </div>
      </div>
    </Modal>
  );
};

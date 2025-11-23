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
  initialStatus: 'ideas' | 'pruebas' | 'aprobado';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nueva Idea">
      <div className="space-y-4">
        <Textarea 
          placeholder="Escribe tu idea aquí..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="h-32 font-medium text-lg"
        />
        <div className="grid grid-cols-2 gap-4">
            <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="Ideas">Ideas</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="Marketing">Marketing</option>
              <option value="Admin">Admin</option>
              <option value="Urgente">Urgente</option>
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="baja">Baja Prioridad</option>
              <option value="media">Media Prioridad</option>
              <option value="alta">Alta Prioridad</option>
            </Select>
        </div>
        
        {/* Dynamic Tags */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <Label>Etiquetas</Label>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setShowTagInput(!showTagInput)}>
                    <Icon svg={ICONS.plus} className="h-3 w-3 mr-1"/> Nueva
                </Button>
            </div>
            
            {showTagInput && (
                <div className="flex gap-2 mb-3 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <Input 
                        value={newTagName} 
                        onChange={(e) => setNewTagName(e.target.value)} 
                        placeholder="Nombre etiqueta" 
                        className="h-8 text-sm"
                    />
                    <div className="flex gap-1">
                        {tagColors.map(c => (
                            <button
                                key={c}
                                onClick={() => setNewTagColor(c)}
                                className={`w-5 h-5 rounded-full ${newTagColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <Button size="sm" className="h-8 px-2" onClick={handleCreateTag}>OK</Button>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-all border ${selectedTags.includes(tag.id) ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                        style={{ 
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                            color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                            borderColor: tag.color
                        }}
                    >
                        {tag.name}
                    </button>
                ))}
                {availableTags.length === 0 && <span className="text-xs text-slate-400 italic">No hay etiquetas. Crea una.</span>}
            </div>
        </div>

        <div>
            <Label htmlFor="labels-input">Keywords (IA)</Label>
            <Input 
                id="labels-input"
                placeholder="Ej: innovación, verano (separado por comas)"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                className="text-sm"
            />
        </div>
        <Button onClick={handleAddTask} className="w-full mt-4">Guardar Tarea</Button>
      </div>
    </Modal>
  );
};

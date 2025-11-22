import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { PizarronTask, TaskCategory, UserProfile } from '../../../types';

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

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;

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
          className="h-32"
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
        <div>
            <Label htmlFor="labels-input">Etiquetas (separadas por coma)</Label>
            <Input 
                id="labels-input"
                placeholder="Ej: innovación, verano, ginebra"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
            />
        </div>
        <Button onClick={handleAddTask} className="w-full">Guardar Tarea</Button>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp, doc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask, PizarronComment } from '../../../types';
import { CommentsPanel } from './CommentsPanel';
import { TaskActivity } from './TaskActivity';

interface TaskDetailModalProps {
  task: PizarronTask;
  onClose: () => void;
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth;
  storage: FirebaseStorage;
  onAnalyze: (text: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, db, userId, appId, auth, storage, onAnalyze }) => {
  const [newLabel, setNewLabel] = React.useState("");
  const [taskText, setTaskText] = React.useState(task.texto);

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const taskDocRef = doc(db, pizarronColPath, task.id);

  const handleUpdate = async (field: string, value: any) => {
    try {
      await updateDoc(taskDocRef, { [field]: value });
    } catch (err) { console.error("Error actualizando: ", err); }
  };

  const handleLabel = async (action: 'add' | 'remove', label: string) => {
    await updateDoc(taskDocRef, { labels: action === 'add' ? arrayUnion(label) : arrayRemove(label) });
    if (action === 'add') setNewLabel("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const storageRef = ref(storage, `${pizarronColPath}/${task.id}/attachments/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    const newAttachment = { name: file.name, url: downloadURL, type: file.type.startsWith('image') ? 'image' : 'pdf' };
    await updateDoc(taskDocRef, { attachments: arrayUnion(newAttachment) });
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} size="3xl">
       <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col h-[80vh]">
            <div className="mb-4">
               <Textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} onBlur={() => handleUpdate('texto', taskText)} className="text-xl font-bold border-none p-0 focus-visible:ring-0 h-auto resize-none bg-transparent" />
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="flex-1 min-h-0">
                    <CommentsPanel taskId={task.id} db={db} auth={auth} userId={userId} appId={appId} />
                </div>
                
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/30">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Icon svg={ICONS.paperclip} className="h-4 w-4" /> Adjuntos
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {task.attachments.map((att, i) => (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1">
                                <Icon svg={ICONS.paperclip} className="h-3 w-3" /> {att.name}
                            </a>
                        ))}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                        <Icon svg={ICONS.upload} className="h-4 w-4" />
                        <span>Subir archivo...</span>
                        <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>
        </div>
        <div className="col-span-1 space-y-4 h-full overflow-y-auto pl-2">
            <div><Label>Estado</Label><Select value={task.status} onChange={(e) => handleUpdate('status', e.target.value)}><option value="ideas">Ideas</option><option value="pruebas">Pruebas</option><option value="aprobado">Aprobado</option></Select></div>
            <div><Label>Categoría</Label><Select value={task.category} onChange={(e) => handleUpdate('category', e.target.value)}><option value="Ideas">Ideas</option><option value="Desarrollo">Desarrollo</option><option value="Marketing">Marketing</option><option value="Admin">Admin</option><option value="Urgente">Urgente</option></Select></div>
            <div><Label>Prioridad</Label><Select value={task.priority} onChange={(e) => handleUpdate('priority', e.target.value)}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></Select></div>
            <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-1">
                    {task.labels.map(label => <div key={label} className="bg-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1">{label} <button onClick={() => handleLabel('remove', label)}>&times;</button></div>)}
                </div>
                <div className="flex gap-2"><Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nueva etiqueta..."/><Button onClick={() => handleLabel('add', newLabel)}>Añadir</Button></div>
            </div>
             <Button variant="outline" onClick={() => onAnalyze(taskText)}>
                <Icon svg={ICONS.brain} className="h-4 w-4 mr-2" />
                Analizar en CerebrIty
             </Button>
             
             <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <TaskActivity taskId={task.id} db={db} appId={appId} />
             </div>
        </div>
       </div>
    </Modal>
  );
};

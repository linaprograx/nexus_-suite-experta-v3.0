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
  const [comments, setComments] = React.useState<PizarronComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [newLabel, setNewLabel] = React.useState("");
  const [taskText, setTaskText] = React.useState(task.texto);

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const taskDocRef = doc(db, pizarronColPath, task.id);

  React.useEffect(() => {
    const commentsPath = `${pizarronColPath}/${task.id}/comments`;
    const q = query(collection(db, commentsPath), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PizarronComment)));
      setLoadingComments(false);
    });
    return () => unsubscribe();
  }, [task.id, pizarronColPath, db]);

  const handleUpdate = async (field: string, value: any) => {
    try {
      await updateDoc(taskDocRef, { [field]: value });
    } catch (err) { console.error("Error actualizando: ", err); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
  
    const commentsPath = `${pizarronColPath}/${task.id}/comments`;
    const userName = auth.currentUser?.email || 'Usuario Anónimo';
  
    await addDoc(collection(db, commentsPath), {
      userId: userId,
      userName: userName,
      text: newComment,
      createdAt: serverTimestamp()
    });
  
    const notificationText = `${userName} comentó en: ${task.texto}`;
    const uniqueAssignees = [...new Set(task.assignees || [])];
  
    for (const assigneeId of uniqueAssignees) {
      if (assigneeId === userId) continue; 
  
      const notifPath = `artifacts/${appId}/users/${assigneeId}/notifications`;
      await addDoc(collection(db, notifPath), {
        text: notificationText,
        taskId: task.id,
        taskText: task.texto,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  
    setNewComment("");
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
        <div className="col-span-2 space-y-4">
            <Textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} onBlur={() => handleUpdate('texto', taskText)} className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto" />
            <div className="space-y-2">
                <h3 className="font-semibold">Comentarios</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {loadingComments ? <p>Cargando...</p> : comments.map(c => (
                        <div key={c.id} className="text-sm bg-secondary p-2 rounded-md">
                            <span className="font-semibold">{c.userName}</span>: {c.text}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Añadir comentario..."/>
                    <Button onClick={handlePostComment}>Enviar</Button>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold">Adjuntos</h3>
                <div className="flex flex-wrap gap-2">
                    {task.attachments.map((att, i) => <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-secondary px-2 py-1 rounded-md">{att.name}</a>)}
                </div>
                <Input type="file" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="col-span-1 space-y-4">
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
        </div>
       </div>
    </Modal>
  );
};

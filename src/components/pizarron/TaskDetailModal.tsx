import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp, doc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
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
import { CommentsPanel } from '../../features/pizarron/ui/comments/CommentsPanel';
import { HistoryPanel } from '../../features/pizarron/ui/history/HistoryPanel';
import { TaskActivity } from './TaskActivity';
import { safeNormalizeTask } from '../../utils/taskHelpers';

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
    const [taskText, setTaskText] = React.useState(task.texto || '');
    const [activeTab, setActiveTab] = React.useState<'comments' | 'history'>('comments');

    const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
    const taskDocRef = doc(db, pizarronColPath, task.id);

    // Check for incomplete data
    const isTaskIncomplete = !task.texto || !task.status || !task.category;

    const handleRestore = async () => {
        const normalized = safeNormalizeTask(task);
        // We need to pass the properties, excluding id if it's in the object but updateDoc doesn't care about extra fields mostly, but better be safe
        // safeNormalizeTask returns PizarronTask which includes id.
        // We should probably strip id or just pass the fields.
        const { id, ...dataToUpdate } = normalized;
        await updateDoc(taskDocRef, dataToUpdate);
    };

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

    if (isTaskIncomplete) {
        return (
            <Modal isOpen={true} onClose={onClose}>
                <div className="p-8 flex flex-col items-center justify-center text-center h-64">
                    <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
                        <Icon svg={ICONS.bell} className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Esta tarea tiene datos incompletos</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        La estructura de datos de esta tarea no es válida. Puedes intentar restaurarla a un estado seguro o eliminarla permanentemente.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={async () => {
                            if (confirm("¿Eliminar tarea permanentemente?")) {
                                await deleteDoc(taskDocRef);
                                onClose();
                            }
                        }} className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">
                            Eliminar
                        </Button>
                        <Button onClick={handleRestore} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                            Restaurar Tarea
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} size="3xl">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 flex flex-col h-[80vh]">
                    <div className="mb-4">
                        <Textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} onBlur={() => handleUpdate('texto', taskText)} className="text-xl font-bold border-none p-0 focus-visible:ring-0 h-auto resize-none bg-transparent" />
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col gap-4">
                        <div className="flex-1 min-h-0 flex flex-col bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/20 dark:border-slate-800/40 overflow-hidden">
                            <div className="flex border-b border-white/10 dark:border-slate-700/30 p-2 gap-2">
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'comments' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-white/10 dark:hover:bg-slate-800/50'}`}
                                >
                                    Comentarios
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-white/10 dark:hover:bg-slate-800/50'}`}
                                >
                                    Historial
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden p-4">
                                {activeTab === 'comments' ? (
                                    <CommentsPanel taskId={task.id} db={db} appId={appId} user={{ uid: userId, displayName: auth.currentUser?.displayName || 'Usuario', photoURL: auth.currentUser?.photoURL || '' }} />
                                ) : (
                                    <HistoryPanel taskId={task.id} db={db} appId={appId} />
                                )}
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/30">
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <Icon svg={ICONS.paperclip} className="h-4 w-4" /> Adjuntos
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {task.attachments.map((att, i) => (
                                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full hover:bg-orange-200 transition-colors flex items-center gap-1">
                                        <Icon svg={ICONS.paperclip} className="h-3 w-3" /> {att.name}
                                    </a>
                                ))}
                            </div>
                            <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg hover:shadow-sm">
                                <Icon svg={ICONS.upload} className="h-4 w-4" />
                                <span>Subir archivo...</span>
                                <input type="file" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="col-span-1 space-y-6 h-full overflow-y-auto pl-2 custom-scrollbar">
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1 block">Estado</Label>
                            <Select value={task.status} onChange={(e) => handleUpdate('status', e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:ring-orange-500/20 focus:border-orange-500">
                                <option value="ideas">💡 Ideas</option>
                                <option value="pruebas">🧪 Pruebas</option>
                                <option value="aprobado">✅ Aprobado</option>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1 block">Categoría</Label>
                            <Select value={task.category} onChange={(e) => handleUpdate('category', e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:ring-orange-500/20 focus:border-orange-500">
                                <option value="Ideas">Ideas</option>
                                <option value="Desarrollo">Desarrollo</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Admin">Admin</option>
                                <option value="Urgente">Urgente</option>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1 block">Prioridad</Label>
                            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                {['baja', 'media', 'alta'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleUpdate('priority', p)}
                                        className={`flex-1 text-xs font-bold uppercase py-1.5 rounded-md transition-all ${task.priority === p ? (p === 'alta' ? 'bg-red-500 text-white shadow-sm' : p === 'media' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-500 text-white shadow-sm') : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                            <Icon svg={ICONS.tag} className="w-3 h-3" /> Etiquetas
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {task.labels.map(label => (
                                <span key={label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                    {label}
                                    <button onClick={() => handleLabel('remove', label)} className="text-slate-400 hover:text-red-500 transition-colors ml-1"><Icon svg={ICONS.x} className="w-3 h-3" /></button>
                                </span>
                            ))}
                            {task.labels.length === 0 && <span className="text-xs text-slate-400 italic">Sin etiquetas</span>}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newLabel}
                                onChange={e => setNewLabel(e.target.value)}
                                placeholder="Añadir..."
                                className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500"
                            />
                            <Button size="sm" onClick={() => handleLabel('add', newLabel)} className="h-8 bg-slate-800 hover:bg-slate-700 text-white"><Icon svg={ICONS.plus} className="w-3 h-3" /></Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => onAnalyze(taskText)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                            <Icon svg={ICONS.brain} className="h-4 w-4 mr-2" />
                            CerebrIty
                        </Button>
                        <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30">
                            <Icon svg={ICONS.sparkles} className="h-4 w-4 mr-2" />
                            Super Poderes
                        </Button>
                        <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30">
                            <Icon svg={ICONS.leaf} className="h-4 w-4 mr-2" />
                            Zero Waste
                        </Button>
                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30">
                            <Icon svg={ICONS.calculator} className="h-4 w-4 mr-2" />
                            Costeo
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <TaskActivity taskId={task.id} db={db} appId={appId} />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={async () => {
                                if (confirm("¿Eliminar tarea permanentemente?")) {
                                    await deleteDoc(taskDocRef);
                                    onClose();
                                }
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Eliminar tarea"
                        >
                            <Icon svg={ICONS.trash} className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

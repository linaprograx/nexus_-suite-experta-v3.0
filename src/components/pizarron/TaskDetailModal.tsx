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
import { IngredientSelector } from './IngredientSelector';
import { RecipeBuilder } from './tools/RecipeBuilder';
import { CostingView } from './tools/CostingView';
import { ZeroWasteView } from './tools/ZeroWasteView';

interface TaskDetailModalProps {
    task: PizarronTask;
    onClose: () => void;
    db: Firestore;
    userId: string;
    appId: string;
    auth: Auth;
    storage: FirebaseStorage;
    onAnalyze: (text: string) => void;
    enabledTools?: string[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, db, userId, appId, auth, storage, onAnalyze, enabledTools = [] }) => {
    // State
    const [title, setTitle] = React.useState(task.title || 'Sin título');
    const [description, setDescription] = React.useState(task.description || '');
    const [priority, setPriority] = React.useState(task.priority || 'medium');
    const [labels, setLabels] = React.useState<string[]>(task.labels || []);
    const [newLabel, setNewLabel] = React.useState("");
    const [commentText, setCommentText] = React.useState("");
    const [activeTool, setActiveTool] = React.useState<'details' | 'recipes' | 'costing' | 'zerowaste'>('details');

    // ... (rest of state)

    const handleLabel = async (action: 'add' | 'remove', label: string) => {
        // Optimistic
        if (action === 'add') {
            if (labels.includes(label)) return;
            setLabels([...labels, label]);
            setNewLabel("");
        } else {
            setLabels(labels.filter(l => l !== label));
        }

        await updateDoc(taskDocRef, { labels: action === 'add' ? arrayUnion(label) : arrayRemove(label) });
    };
    const [taskText, setTaskText] = React.useState(task.texto || ''); // For backward compatibility if needed, though we use description now
    const [activeTab, setActiveTab] = React.useState<'comments' | 'history'>('comments');
    const [allIngredients, setAllIngredients] = React.useState<any[]>([]); // Centralized ingredients for tools

    const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
    const taskDocRef = doc(db, pizarronColPath, task.id);

    // Fetch Ingredients shared by tools
    React.useEffect(() => {
        if (!userId || !appId) return;
        const path = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
        console.log("Fetching ingredients from:", path);
        const q = query(collection(db, path), orderBy('nombre')); // Added orderBy for consistency
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Ingredients snapshot size:", snapshot.size);
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // console.log("First ingredient sample:", loaded[0]);
            setAllIngredients(loaded as any[]);
        }, (error) => {
            console.error("Error fetching ingredients:", error);
        });
        return () => unsubscribe();
    }, [db, appId, userId]);

    // Initial sync
    React.useEffect(() => {
        if (task.title) setTitle(task.title);
        if (task.description) setDescription(task.description);
    }, [task.title, task.description]);

    // Check for incomplete data
    const isTaskIncomplete = !task.status || !task.category;

    const handleRestore = async () => {
        const normalized = safeNormalizeTask(task);
        const { id, ...dataToUpdate } = normalized;
        await updateDoc(taskDocRef, dataToUpdate);
    };

    const handleUpdate = async (field: string, value: any) => {
        // Optimistic Update
        if (field === 'priority') setPriority(value);
        if (field === 'title') setTitle(value);
        if (field === 'description') setDescription(value);

        try {
            await updateDoc(taskDocRef, { [field]: value });
        } catch (err) {
            console.error("Error actualizando: ", err);
            // Revert if needed (omitted for brevity, assume success or user refresh)
        }
    };

    const handleExportRecipe = async () => {
        if (!task.recipe) {
            alert("No hay datos de receta para exportar. Crea una receta primero.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/recipes`), {
                ...task.recipe,
                name: title, // Use current title state
                sourceTaskId: task.id,
                createdAt: serverTimestamp(),
                authorId: userId
            });
            alert("✅ Receta exportada al Grimorio exitosamente!");
        } catch (e: any) {
            console.error("Export Error:", e);
            alert(`Error al exportar: ${e.message || "Error desconocido"}`);
        }
    };

    const handleBlur = async (field: 'title' | 'description') => {
        if (field === 'title' && title !== task.title) {
            await handleUpdate('title', title);
        }
        if (field === 'description' && description !== task.description) {
            await handleUpdate('description', description);
        }
    };



    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        try {
            const activityRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks/${task.id}/activity`);
            await addDoc(activityRef, {
                type: 'comment',
                userId: userId,
                userName: auth.currentUser?.displayName || 'Usuario',
                details: commentText,
                timestamp: serverTimestamp()
            });
            setCommentText("");
        } catch (error) {
            console.error("Error sending comment:", error);
        }
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
            {/* Content Grid - Global Scroll Enabled */}
            <div className="flex-1 overflow-y-auto max-h-[85vh] p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 custom-scrollbar">

                {/* -----------------------------
                   LEFT COLUMN (Component: TaskActivity) 
                   History, Logs, Chat
                   ----------------------------- */}
                <div className="bg-slate-50 dark:bg-slate-900/30 flex flex-col h-full min-h-[500px] border-r border-slate-100 dark:border-slate-800 pr-6 -ml-2 pl-4 py-2 rounded-l-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Icon svg={ICONS.activity} className="w-4 h-4" />
                            Actividad
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar mb-4">
                        <TaskActivity taskId={task.id} db={db} appId={appId} />

                        {/* Placeholder visual IF no activity - TaskActivity handles real logic */}
                        <div className="mt-8 text-center opacity-50 hidden">
                            <Icon svg={ICONS.messageSquare} className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No hay más actividad.</p>
                        </div>
                    </div>

                    {/* Simple Comment Input Area */}
                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-orange-500/20 outline-none resize-none mb-2"
                            placeholder="Añadir comentario..."
                        />
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSendComment} className="bg-orange-500 text-white hover:bg-orange-600">
                                Enviar
                            </Button>
                        </div>
                    </div>
                </div>


                {/* -----------------------------
                   RIGHT COLUMN (WIDE - 2 Cols)
                   Content: Title, Desc, Tools, Metadata
                   ----------------------------- */}
                <div className="md:col-span-2 space-y-6 pl-2 pb-6 relative">

                    {activeTool === 'recipes' ? (
                        <RecipeBuilder
                            task={task}
                            appId={appId}
                            db={db}
                            onUpdate={async (data) => {
                                await handleUpdate('recipe', data.recipe);
                            }}
                            onBack={() => setActiveTool('details')}
                            onExport={handleExportRecipe}
                        />
                    ) : activeTool === 'costing' ? (
                        <CostingView
                            task={task}
                            ingredientsData={allIngredients}
                            onBack={() => setActiveTool('details')}
                        />
                    ) : activeTool === 'zerowaste' ? (
                        <ZeroWasteView
                            task={task}
                            onBack={() => setActiveTool('details')}
                        />
                    ) : (
                        <>
                            {/* Header: Title */}
                            <div>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-2xl font-bold border-none px-0 py-2 h-auto focus:ring-0 bg-transparent placeholder:text-gray-300 w-full text-slate-800 dark:text-slate-100"
                                    placeholder="Título de la tarea"
                                    onBlur={() => handleBlur('title')}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 block">
                                    Descripción
                                </Label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-xl p-4 text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                                    placeholder="Añade una descripción detallada..."
                                    onBlur={() => handleBlur('description')}
                                />
                            </div>

                            {/* Metadata Grid (Status, Category, Priority) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Estado</span>
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleUpdate('status', e.target.value)}
                                        className="w-full appearance-none bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                                    >
                                        {['ideas', 'pruebas', 'aprobado'].map(col => <option key={col} value={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</option>)}
                                    </select>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Categoría</span>
                                    <select
                                        value={task.category}
                                        onChange={(e) => handleUpdate('category', e.target.value)}
                                        className="w-full appearance-none bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                                    >
                                        <option value="Ideas">Ideas</option>
                                        <option value="Desarrollo">Desarrollo</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Prioridad</span>
                                    <div className="flex gap-2 mt-1">
                                        {['baja', 'media', 'alta'].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => handleUpdate('priority', p)}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${priority === p ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                style={{ backgroundColor: p === 'alta' ? '#EF4444' : p === 'media' ? '#F59E0B' : '#10B981' }}
                                                title={p}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase">Etiquetas</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {labels && labels.length > 0 ? labels.map(label => (
                                        <span key={label} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded-md flex items-center gap-1">
                                            #{label}
                                            <button onClick={() => handleLabel('remove', label)} className="hover:text-red-500"><Icon svg={ICONS.x} className="w-3 h-3" /></button>
                                        </span>
                                    )) : <span className="text-gray-400 text-xs italic">Sin etiquetas</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newLabel}
                                        onChange={e => setNewLabel(e.target.value)}
                                        placeholder="Añadir etiqueta..."
                                        className="h-8 text-xs bg-gray-50 border-gray-200"
                                    />
                                    <Button size="sm" onClick={() => handleLabel('add', newLabel)} className="h-8 bg-slate-800 hover:bg-slate-700 text-white"><Icon svg={ICONS.plus} className="w-3 h-3" /></Button>
                                </div>
                            </div>

                            {/* GRIMORIUM SECTION */}
                            {enabledTools.includes('grimorium') && (
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Label className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                                        <Icon svg={ICONS.book} className="w-3 h-3" /> Grimorium: Herramientas
                                    </Label>

                                    {/* Grimorium Quick Actions */}
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => setActiveTool('recipes')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors gap-2 hover:scale-105 transform duration-200 shadow-sm border border-emerald-100/50">
                                            <Icon svg={ICONS.book} className="w-5 h-5" />
                                            <span className="text-xs font-medium">Recetas</span>
                                        </button>

                                        <button
                                            onClick={() => document.getElementById('ingredients-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                            className="flex flex-col items-center justify-center p-3 rounded-lg bg-lime-50 hover:bg-lime-100 text-lime-700 transition-colors gap-2 hover:scale-105 transform duration-200 shadow-sm border border-lime-100/50"
                                        >
                                            <Icon svg={ICONS.leaf} className="w-5 h-5" />
                                            <span className="text-xs font-medium">Ingredientes</span>
                                        </button>

                                        <button onClick={() => setActiveTool('costing')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors gap-2 hover:scale-105 transform duration-200 shadow-sm border border-amber-100/50">
                                            <Icon svg={ICONS.dollarSign} className="w-5 h-5" />
                                            <span className="text-xs font-medium">Escandallo</span>
                                        </button>
                                        <button onClick={() => setActiveTool('zerowaste')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors gap-2 hover:scale-105 transform duration-200 shadow-sm border border-teal-100/50">
                                            <Icon svg={ICONS.refreshCw} className="w-5 h-5" />
                                            <span className="text-xs font-medium">Zero Waste</span>
                                        </button>
                                    </div>


                                    <Label className="text-xs font-bold text-slate-500 block mt-4" id="ingredients-section">Buscador de Ingredientes</Label>

                                    {/* Ingredient Selector Component */}
                                    <IngredientSelector
                                        appId={appId}
                                        db={db}
                                        selectedIds={task.linkedIngredients || []}
                                        allIngredients={allIngredients}
                                        onSelect={async (ing, qty, unit) => {
                                            // 1. Update Linked Ingredients (Tags)
                                            const currentLinked = task.linkedIngredients || [];
                                            if (!currentLinked.includes(ing.id)) {
                                                await handleUpdate('linkedIngredients', [...currentLinked, ing.id]);
                                            }

                                            // 2. Update Recipe Ingredients (Detailed)
                                            const currentRecipe = task.recipe || { ingredients: [] };
                                            const currentIngredients = currentRecipe.ingredients || [];

                                            // Check if already in recipe to avoid dupes (or maybe user wants dupes? assume singular for now)
                                            if (!currentIngredients.find(i => i.id === ing.id)) {
                                                const newIngredient = {
                                                    id: ing.id,
                                                    name: ing.name || ing.nombre,
                                                    quantity: qty,
                                                    unit: unit
                                                };
                                                await handleUpdate('recipe', {
                                                    ...currentRecipe,
                                                    ingredients: [...currentIngredients, newIngredient]
                                                });
                                            }
                                        }}
                                        onRemove={async (id) => {
                                            // Remove from Linked
                                            const currentLinked = task.linkedIngredients || [];
                                            await handleUpdate('linkedIngredients', currentLinked.filter(x => x !== id));

                                            // Remove from Recipe
                                            if (task.recipe && task.recipe.ingredients) {
                                                const newIngredients = task.recipe.ingredients.filter(i => i.id !== id);
                                                await handleUpdate('recipe', { ...task.recipe, ingredients: newIngredients });
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* ACTIONS & BOARD POWERS */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                {/* CerebrIty */}
                                {(enabledTools.includes('cerebrity') || enabledTools.length === 0) && (
                                    <Button variant="outline" onClick={() => onAnalyze(description || taskText)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30 justify-start">
                                        <Icon svg={ICONS.brain} className="h-4 w-4 mr-2" />
                                        CerebrIty
                                    </Button>
                                )}

                                {enabledTools.includes('zero_waste') && (
                                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30 justify-start">
                                        <Icon svg={ICONS.leaf} className="h-4 w-4 mr-2" />
                                        Zero Waste
                                    </Button>
                                )}
                                {enabledTools.includes('costeo') && (
                                    <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 justify-start">
                                        <Icon svg={ICONS.dollarSign} className="h-4 w-4 mr-2" />
                                        Escandallo
                                    </Button>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end pb-4">
                                <Button onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800 px-6 shadow-lg hover:shadow-xl transition-all">
                                    Guardar y Cerrar
                                </Button>
                            </div>


                            {/* Delete & Footer Zone */}
                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={async () => {
                                        if (confirm("¿Eliminar tarea permanentemente?")) {
                                            await deleteDoc(taskDocRef);
                                            onClose();
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors text-xs font-medium"
                                    title="Eliminar tarea"
                                >
                                    <Icon svg={ICONS.trash} className="w-4 h-4" />
                                    Eliminar Tarea
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </Modal >
    );
};

import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp, doc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronTask } from '../../../types';
import { TaskActivity } from './TaskActivity';
import { safeNormalizeTask } from '../../utils/taskHelpers';
import { IngredientSelector } from './IngredientSelector';
import { RecipeBuilder } from './tools/RecipeBuilder';
import { CostingView } from './tools/CostingView';
import { ZeroWasteView } from './tools/ZeroWasteView';
import { CerebrityPowers } from './powers/CerebrityPowers';
import { PowerPanel } from './PowerPanel';
import { BatcherPower } from './powers/BatcherPower';
import { StockPower } from './powers/StockPower';
import { TrendPower } from './powers/TrendPower';
import { MenuPower } from './powers/MenuPower';

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
    const [title, setTitle] = React.useState(task.title || task.texto || 'Sin título');
    const [description, setDescription] = React.useState(task.description || '');
    const [priority, setPriority] = React.useState(task.priority || 'media');
    const [labels, setLabels] = React.useState<string[]>(task.labels || []);
    const [newLabel, setNewLabel] = React.useState("");
    const [commentText, setCommentText] = React.useState("");

    // Tools State
    const [activeTool, setActiveTool] = React.useState<'details' | 'cerebrity' | 'grimorium_recipes' | 'grimorium_ingredients' | 'grimorium_costing' | 'grimorium_zerowaste' | 'batcher' | 'stock' | 'trend_locator' | 'make_menu'>('details');

    const [allIngredients, setAllIngredients] = React.useState<any[]>([]);
    const [allRecipes, setAllRecipes] = React.useState<any[]>([]);

    const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
    const taskDocRef = doc(db, pizarronColPath, task.id);

    // Fetch Ingredients and Recipes shared by tools
    React.useEffect(() => {
        if (!userId || !appId) return;
        const ingPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
        const recPath = `artifacts/${appId}/users/${userId}/grimorio-recipes`;

        const unsubIng = onSnapshot(query(collection(db, ingPath), orderBy('nombre')), (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllIngredients(loaded as any[]);
        });

        const unsubRec = onSnapshot(query(collection(db, recPath), orderBy('nombre')), (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllRecipes(loaded as any[]);
        });

        return () => {
            unsubIng();
            unsubRec();
        };
    }, [db, appId, userId]);

    // Check for incomplete data
    const isTaskIncomplete = !task.status || !task.category;

    const handleRestore = async () => {
        const normalized = safeNormalizeTask(task as any);
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
        }
    };

    const handleLabel = async (action: 'add' | 'remove', label: string) => {
        if (action === 'add') {
            if (labels.includes(label)) return;
            const newLabels = [...labels, label];
            setLabels(newLabels);
            setNewLabel("");
            await updateDoc(taskDocRef, { labels: newLabels });
        } else {
            const newLabels = labels.filter(l => l !== label);
            setLabels(newLabels);
            await updateDoc(taskDocRef, { labels: newLabels });
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

    const handleExportRecipe = async () => {
        if (!task.recipe) {
            alert("No hay datos de receta para exportar.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/recipes`), {
                ...task.recipe,
                name: title,
                sourceTaskId: task.id,
                createdAt: serverTimestamp(),
                authorId: userId
            });
            alert("✅ Receta exportada al Grimorio exitosamente!");
        } catch (e: any) {
            console.error("Export Error:", e);
            alert(`Error al exportar: ${e.message}`);
        }
    };

    if (isTaskIncomplete) {
        return (
            <Modal isOpen={true} onClose={onClose}>
                <div className="p-8 flex flex-col items-center justify-center text-center h-64">
                    <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
                        <Icon svg={ICONS.bell} className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tarea Incompleta</h3>
                    <div className="flex gap-4 mt-4">
                        <Button variant="outline" onClick={async () => { if (confirm("¿Eliminar?")) { await deleteDoc(taskDocRef); onClose(); } }}>Eliminar</Button>
                        <Button onClick={handleRestore}>Restaurar Tarea</Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} size="3xl">
            <div className="flex h-[85vh] bg-white dark:bg-slate-900 overflow-hidden rounded-lg">

                {/* LEFT COLUMN: ACTIVITY / CHAT (Fixed 300px) */}
                <div className="w-[300px] min-w-[300px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                    <div className="p-4 border-b border-slate-100/50 dark:border-slate-800/50">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Icon svg={ICONS.activity} className="w-4 h-4" />
                            Actividad y Chat
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2">
                        <TaskActivity taskId={task.id} db={db} appId={appId} />
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-orange-500/20 outline-none resize-none mb-2"
                            placeholder="Escribe un comentario..."
                        />
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSendComment} className="bg-orange-500 text-white hover:bg-orange-600 shadow-sm">Enviar</Button>
                        </div>
                    </div>
                </div>


                {/* RIGHT COLUMN: MAIN CONTENT & POWERS */}
                <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white dark:bg-slate-900">

                    {/* HEADER */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                        <span className="font-bold text-lg text-slate-800 dark:text-slate-200">Editar Tarea</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => { if (confirm("¿Eliminar tarea?")) { await deleteDoc(taskDocRef); onClose(); } }}
                                className="text-slate-400 hover:text-red-500 p-2"
                            >
                                <Icon svg={ICONS.trash} className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><Icon svg={ICONS.x} className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* SCROLLABLE BODY */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                        {/* --- POWER PANELS (Dynamic) --- */}

                        {/* CEREBRITY */}
                        {activeTool === 'cerebrity' && (
                            <PowerPanel
                                title="CerebrIty AI"
                                subtitle="Asistente Creativo Inteligente"
                                icon={ICONS.brain}
                                theme="violet"
                                onClose={() => setActiveTool('details')}
                            >
                                <CerebrityPowers
                                    contextText={title + "\n" + description}
                                    onApplyResult={async (res) => {
                                        const newDesc = description + "\n" + res;
                                        setDescription(newDesc);
                                        await handleUpdate('description', newDesc);
                                    }}
                                />
                            </PowerPanel>
                        )}

                        {/* GRIMORIUM: RECIPES */}
                        {activeTool === 'grimorium_recipes' && (
                            <PowerPanel
                                title="Recetas Grimorium"
                                subtitle="Gestión y vinculación de fichas técnicas"
                                icon={ICONS.book}
                                theme="emerald"
                                onClose={() => setActiveTool('details')}
                            >
                                <RecipeBuilder
                                    task={task}
                                    appId={appId}
                                    db={db}
                                    onUpdate={async (data) => await handleUpdate('recipe', data.recipe)}
                                    onBack={() => setActiveTool('details')}
                                    onExport={handleExportRecipe}
                                />
                            </PowerPanel>
                        )}

                        {/* GRIMORIUM: INGREDIENTS */}
                        {activeTool === 'grimorium_ingredients' && (
                            <PowerPanel
                                title="Selección de Ingredientes"
                                subtitle="Vincula materia prima desde el inventario"
                                icon={ICONS.leaf}
                                theme="lime"
                                onClose={() => setActiveTool('details')}
                            >
                                <IngredientSelector
                                    appId={appId}
                                    db={db}
                                    selectedIds={task.linkedIngredients || []}
                                    allIngredients={allIngredients}
                                    onSelect={async (ing: any, qty: number, unit: string) => {
                                        const currentLinked = task.linkedIngredients || [];
                                        const nextLinked = currentLinked.includes(ing.id) ? currentLinked : [...currentLinked, ing.id];
                                        const currentRecipe = task.recipe || { ingredients: [] };
                                        const currentIngredients = currentRecipe.ingredients || [];

                                        if (!currentIngredients.find(i => i.id === ing.id)) {
                                            const newIngredient = { id: ing.id, name: ing.name || ing.nombre, quantity: qty, unit: unit };
                                            await updateDoc(taskDocRef, {
                                                linkedIngredients: nextLinked,
                                                recipe: { ...currentRecipe, ingredients: [...currentIngredients, newIngredient] }
                                            });
                                        }
                                    }}
                                    onRemove={async (id) => {
                                        const currentLinked = task.linkedIngredients || [];
                                        const currentRecipe = task.recipe || { ingredients: [] };
                                        const newIngredients = currentRecipe.ingredients ? currentRecipe.ingredients.filter(i => i.id !== id) : [];
                                        await updateDoc(taskDocRef, {
                                            linkedIngredients: currentLinked.filter(x => x !== id),
                                            recipe: { ...currentRecipe, ingredients: newIngredients }
                                        });
                                    }}
                                />
                            </PowerPanel>
                        )}

                        {/* GRIMORIUM: COSTING */}
                        {activeTool === 'grimorium_costing' && (
                            <PowerPanel
                                title="Escandallo & Costes"
                                subtitle="Análisis de rentabilidad y precios"
                                icon={ICONS.dollarSign}
                                theme="amber"
                                onClose={() => setActiveTool('details')}
                            >
                                <CostingView
                                    task={task}
                                    ingredientsData={allIngredients}
                                    onBack={() => setActiveTool('details')}
                                />
                            </PowerPanel>
                        )}

                        {/* GRIMORIUM: ZERO WASTE */}
                        {activeTool === 'grimorium_zerowaste' && (
                            <PowerPanel
                                title="Zero Waste Chef"
                                subtitle="Optimización de mermas y sostenibilidad"
                                icon={ICONS.refreshCw}
                                theme="teal"
                                onClose={() => setActiveTool('details')}
                            >
                                <ZeroWasteView
                                    task={task}
                                    onBack={() => setActiveTool('details')}
                                />
                            </PowerPanel>
                        )}


                        {activeTool === 'batcher' && (
                            <PowerPanel
                                title="Batcher & Production"
                                subtitle="Planificación de producción y lotes"
                                icon={ICONS.layers}
                                theme="blue"
                                onClose={() => setActiveTool('details')}
                            >
                                <BatcherPower
                                    db={db}
                                    appId={appId}
                                    allRecipes={allRecipes}
                                />
                            </PowerPanel>
                        )}

                        {activeTool === 'stock' && (
                            <PowerPanel
                                title="Stock & Inventory"
                                subtitle="Gestión de existencias en tiempo real"
                                icon={ICONS.box}
                                theme="orange"
                                onClose={() => setActiveTool('details')}
                            >
                                <StockPower
                                    allRecipes={allRecipes}
                                    allIngredients={allIngredients}
                                />
                            </PowerPanel>
                        )}

                        {activeTool === 'trend_locator' && (
                            <PowerPanel
                                title="Trend Locator"
                                subtitle="Análisis de tendencias de mercado"
                                icon={ICONS.trending}
                                theme="purple"
                                onClose={() => setActiveTool('details')}
                            >
                                <TrendPower
                                    db={db}
                                    appId={appId}
                                    userId={userId}
                                />
                            </PowerPanel>
                        )}

                        {activeTool === 'make_menu' && (
                            <PowerPanel
                                title="Make Menu"
                                subtitle="Diseño inteligente de cartas y menús"
                                icon={ICONS.menu}
                                theme="pink"
                                onClose={() => setActiveTool('details')}
                            >
                                <MenuPower
                                    db={db}
                                    appId={appId}
                                    userId={userId}
                                    allRecipes={allRecipes}
                                    allPizarronTasks={[]} // Would ideally pass all tasks, simplified for now
                                    currentTaskId={task.id}
                                />
                            </PowerPanel>
                        )}


                        {/* --- MAIN EDIT FORM --- */}
                        <div className={activeTool !== 'details' ? 'opacity-50 pointer-events-none filter blur-[1px] transition-all' : 'transition-all'}>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => handleUpdate('title', title)}
                                className="text-2xl font-bold border-none px-0 py-2 h-auto focus:ring-0 bg-transparent placeholder:text-gray-300 w-full text-slate-800 dark:text-slate-100 mb-4"
                                placeholder="Título de la tarea"
                            />

                            <div className="mb-6">
                                <Label className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 block">Descripción</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={() => handleUpdate('description', description)}
                                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-xl p-4 text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                                    placeholder="Detalles, notas, recetas..."
                                />
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Estado</span>
                                    <Select value={task.status} onChange={(e) => handleUpdate('status', e.target.value)} className="w-full border-none bg-transparent font-medium p-0 focus:ring-0 h-auto">
                                        {['ideas', 'pruebas', 'aprobado'].map(col => <option key={col} value={col}>{col.toUpperCase()}</option>)}
                                    </Select>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Categoría</span>
                                    <Select value={task.category} onChange={(e) => handleUpdate('category', e.target.value)} className="w-full border-none bg-transparent font-medium p-0 focus:ring-0 h-auto">
                                        {['Ideas', 'Desarrollo', 'Marketing', 'Admin', 'Urgente'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </Select>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Prioridad</span>
                                    <div className="flex gap-2 mt-1">
                                        {(['baja', 'media', 'alta'] as const).map(p => (
                                            <button key={p} onClick={() => handleUpdate('priority', p)} className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${priority === p ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: p === 'alta' ? '#EF4444' : p === 'media' ? '#F59E0B' : '#10B981' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TAGS */}
                            <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Etiquetas</span>
                                <div className="flex flex-wrap gap-2">
                                    {labels.map(label => (
                                        <span key={label} className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded-md flex items-center gap-1">
                                            #{label}
                                            <button onClick={() => handleLabel('remove', label)} className="hover:text-red-500"><Icon svg={ICONS.x} className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                    <div className="flex gap-2">
                                        <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Añadir..." className="h-7 text-xs w-24" />
                                        <Button size="sm" onClick={() => handleLabel('add', newLabel)} className="h-7 w-7 p-0"><Icon svg={ICONS.plus} className="w-3 h-3" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* --- POWER BUTTONS SECTION --- */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4 block">Herramientas & Poderes</Label>

                                {/* GRIMORIUM */}
                                {enabledTools.includes('grimorium') && (
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-emerald-600 mb-2 block flex items-center gap-1"><Icon svg={ICONS.book} className="w-3 h-3" /> Grimorium</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button onClick={() => setActiveTool('grimorium_recipes')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-emerald-100/50">
                                                <Icon svg={ICONS.book} className="w-5 h-5" /> <span className="text-xs font-medium">Recetas</span>
                                            </button>
                                            <button onClick={() => setActiveTool('grimorium_ingredients')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-lime-50 hover:bg-lime-100 text-lime-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-lime-100/50">
                                                <Icon svg={ICONS.leaf} className="w-5 h-5" /> <span className="text-xs font-medium">Ingredientes</span>
                                            </button>
                                            <button onClick={() => setActiveTool('grimorium_costing')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-amber-100/50">
                                                <Icon svg={ICONS.dollarSign} className="w-5 h-5" /> <span className="text-xs font-medium">Escandallo</span>
                                            </button>
                                            <button onClick={() => setActiveTool('grimorium_zerowaste')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-teal-100/50">
                                                <Icon svg={ICONS.refreshCw} className="w-5 h-5" /> <span className="text-xs font-medium">Zero Waste</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* CEREBRITY */}
                                {enabledTools.includes('cerebrity') && (
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-violet-600 mb-2 block flex items-center gap-1"><Icon svg={ICONS.brain} className="w-3 h-3" /> CerebrIty</span>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button onClick={() => setActiveTool('cerebrity')} className="flex items-center justify-center p-3 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors gap-2 hover:scale-[1.02] transform duration-200 border border-violet-100/50">
                                                <Icon svg={ICONS.sparkles} className="w-5 h-5" /> <span className="font-medium text-sm">Abrir Panel Creativo AI</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* BATCHER, STOCK, TRENDS, MENU */}
                                {(enabledTools.includes('batcher') || enabledTools.includes('stock') || enabledTools.includes('trend_locator') || enabledTools.includes('make_menu')) && (
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-blue-600 mb-2 block flex items-center gap-1"><Icon svg={ICONS.layers} className="w-3 h-3" /> Producción & Gestión</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {enabledTools.includes('batcher') && (
                                                <button onClick={() => setActiveTool('batcher')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-blue-100/50">
                                                    <Icon svg={ICONS.layers} className="w-5 h-5" /> <span className="text-xs font-medium">Batcher</span>
                                                </button>
                                            )}
                                            {enabledTools.includes('stock') && (
                                                <button onClick={() => setActiveTool('stock')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-orange-100/50">
                                                    <Icon svg={ICONS.box} className="w-5 h-5" /> <span className="text-xs font-medium">Stock</span>
                                                </button>
                                            )}
                                            {enabledTools.includes('trend_locator') && (
                                                <button onClick={() => setActiveTool('trend_locator')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-purple-100/50">
                                                    <Icon svg={ICONS.trending} className="w-5 h-5" /> <span className="text-xs font-medium">Trends</span>
                                                </button>
                                            )}
                                            {enabledTools.includes('make_menu') && (
                                                <button onClick={() => setActiveTool('make_menu')} className="flex flex-col items-center justify-center p-3 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors gap-2 hover:scale-105 transform duration-200 border border-pink-100/50">
                                                    <Icon svg={ICONS.menu} className="w-5 h-5" /> <span className="text-xs font-medium">Menu</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex justify-end">
                        <Button onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800 px-8">Guardar y Cerrar</Button>
                    </div>

                </div>
            </div>
        </Modal>
    );
};

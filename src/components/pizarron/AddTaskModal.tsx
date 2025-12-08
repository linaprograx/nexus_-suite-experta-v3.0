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
import { CerebrityPowers } from './powers/CerebrityPowers';
import { PowerPanel } from './PowerPanel';
import { BatcherPower } from './powers/BatcherPower';
import { StockPower } from './powers/StockPower';
import { TrendPower } from './powers/TrendPower';
import { MenuPower } from './powers/MenuPower';
import { Spinner } from '../ui/Spinner';

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
  const [description, setDescription] = React.useState(''); // Separating Title (text) vs Description
  const [category, setCategory] = React.useState<TaskCategory>('Ideas');
  const [priority, setPriority] = React.useState<'baja' | 'media' | 'alta'>('media');
  const [labels, setLabels] = React.useState('');
  const [initialComment, setInitialComment] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTool, setActiveTool] = React.useState<'details' | 'cerebrity' | 'grimorium_recipes' | 'grimorium_ingredients' | 'grimorium_costing' | 'grimorium_zerowaste' | 'batcher' | 'stock' | 'trend_locator' | 'make_menu'>('details');

  // Grimorium Integration
  const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
  const [allIngredients, setAllIngredients] = React.useState<any[]>([]);
  const [allRecipes, setAllRecipes] = React.useState<any[]>([]);

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

  // Fetch Ingredients and Recipes
  React.useEffect(() => {
    if (!userId || !appId) return;
    const ingPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const recPath = `artifacts/${appId}/users/${userId}/grimorio-recipes`;

    const unsubIng = onSnapshot(collection(db, ingPath), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllIngredients(loaded as any[]);
    });

    const unsubRec = onSnapshot(collection(db, recPath), (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRecipes(loaded as any[]);
    });

    return () => {
      unsubIng();
      unsubRec();
    };
  }, [db, appId, userId]);


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
      alert("El título es obligatorio y debe haber un tablero activo.");
      return;
    };

    setIsSaving(true);
    const labelsArray = labels.split(',').map(l => l.trim()).filter(l => l);

    const newTask: Omit<PizarronTask, 'id'> = {
      texto: texto, // Keeping internal field name 'texto' as Title for compatibility
      title: texto,
      description: description,
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
      linkedIngredients: selectedIngredients,
      history: []
    };

    try {
      const docRef = await addDoc(collection(db, pizarronColPath), newTask);

      // Add initial comment if present
      if (initialComment.trim()) {
        await addDoc(collection(db, `${pizarronColPath}/${docRef.id}/activity`), {
          type: 'comment',
          userId: userId,
          userName: auth.currentUser?.displayName || 'Usuario',
          details: initialComment,
          timestamp: serverTimestamp()
        });
      }

      setTexto('');
      setDescription('');
      setCategory('Ideas');
      setPriority('media');
      setLabels('');
      setInitialComment('');
      setSelectedTags([]);
      setSelectedIngredients([]);
      onClose(); // Close strictly after successful save
    } catch (err: any) {
      console.error("Error al añadir tarea: ", err);
      alert("Error al guardar tarea: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <div className="flex h-[85vh] bg-white dark:bg-slate-900 overflow-hidden rounded-lg">

        {/* LEFT COLUMN: ACTIVITY / NOTES */}
        <div className="w-[300px] min-w-[300px] border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-100/50 dark:border-slate-800/50">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Icon svg={ICONS.activity} className="w-4 h-4" />
              Actividad y Chat
            </h3>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-center items-center text-slate-400 opacity-60">
            <Icon svg={ICONS.messageCircle} className="w-12 h-12 mb-2" />
            <p className="text-xs text-center">La actividad comenzará<br />cuando crees la tarea.</p>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <Label className="text-xs font-semibold mb-2 block">Nota Inicial (Opcional)</Label>
            <textarea
              value={initialComment}
              onChange={(e) => setInitialComment(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-orange-500/20 outline-none resize-none"
              placeholder="Escribe un comentario inicial..."
            />
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white dark:bg-slate-900">

          {/* HEADER */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">Nueva Tarea</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Icon svg={ICONS.x} className="w-5 h-5" /></button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

            {/* TOOL: CEREBRITY */}
            {activeTool === 'cerebrity' && (
              <PowerPanel
                title="CerebrIty AI"
                subtitle="Asistente Creativo Inteligente"
                icon={ICONS.brain}
                theme="violet"
                onClose={() => setActiveTool('details')}
              >
                <CerebrityPowers
                  contextText={texto + "\n" + description}
                  onApplyResult={(res) => setDescription(prev => prev + "\n" + res)}
                />
              </PowerPanel>
            )}

            {/* GRIMORIUM RECIPES */}
            {activeTool === 'grimorium_recipes' && (
              <PowerPanel
                title="Recetas Grimorium"
                subtitle="Gestión y vinculación de fichas técnicas"
                icon={ICONS.book}
                theme="emerald"
                onClose={() => setActiveTool('details')}
              >
                <div className="p-8 text-center text-slate-500">
                  <Icon svg={ICONS.book} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Funcionalidad de recetas disponible en el detalle de la tarea tras crearla.</p>
                </div>
              </PowerPanel>
            )}

            {/* GRIMORIUM INGREDIENTS */}
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
                  selectedIds={selectedIngredients}
                  allIngredients={allIngredients || []}
                  onSelect={(ing) => setSelectedIngredients(prev => [...prev, ing.id])}
                  onRemove={(id) => setSelectedIngredients(prev => prev.filter(i => i !== id))}
                />
                <p className="text-center text-xs text-slate-400 mt-4">La vinculación completa estará disponible al guardar la tarea.</p>
              </PowerPanel>
            )}

            {/* GRIMORIUM COSTING */}
            {activeTool === 'grimorium_costing' && (
              <PowerPanel
                title="Escandallo & Costes"
                subtitle="Análisis de rentabilidad y precios"
                icon={ICONS.dollarSign}
                theme="amber"
                onClose={() => setActiveTool('details')}
              >
                <div className="p-8 text-center text-slate-500">
                  <Icon svg={ICONS.dollarSign} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>El escandallo se calcula sobre la receta guardada, disponible en detalle.</p>
                </div>
              </PowerPanel>
            )}

            {/* GRIMORIUM ZERO WASTE */}
            {activeTool === 'grimorium_zerowaste' && (
              <PowerPanel
                title="Zero Waste Chef"
                subtitle="Optimización de mermas y sostenibilidad"
                icon={ICONS.refreshCw}
                theme="teal"
                onClose={() => setActiveTool('details')}
              >
                <div className="p-8 text-center text-slate-500">
                  <Icon svg={ICONS.refreshCw} className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Disponible tras guardar receta e ingredientes.</p>
                </div>
              </PowerPanel>
            )}

            {/* BATCHER */}
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

            {/* STOCK */}
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

            {/* TREND LOCATOR */}
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

            {/* MAKE MENU */}
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
                  allPizarronTasks={[]} // Empty for new task
                  currentTaskId={undefined}
                />
              </PowerPanel>
            )}


            {/* MAIN FORM */}
            <div className={activeTool !== 'details' ? 'opacity-50 pointer-events-none filter blur-[1px] transition-all' : 'transition-all'}>
              <div className="space-y-4">
                <Input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="text-2xl font-bold border-none px-0 py-2 h-auto focus:ring-0 bg-transparent placeholder:text-gray-300 w-full text-slate-800 dark:text-slate-100"
                  placeholder="Título de la tarea"
                  autoFocus
                />

                <div>
                  <Label className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 block">Descripción</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-transparent rounded-xl p-4 text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    placeholder="Detalles, notas, recetas..."
                  />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Categoría</span>
                    <Select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full border-none bg-transparent font-medium p-0 focus:ring-0 h-auto">
                      <option value="Ideas">Ideas</option>
                      <option value="Desarrollo">Desarrollo</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Admin">Admin</option>
                      <option value="Urgente">Urgente</option>
                    </Select>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Prioridad</span>
                    <div className="flex gap-2 mt-1">
                      {(['baja', 'media', 'alta'] as const).map(p => (
                        <button key={p} onClick={() => setPriority(p)} className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${priority === p ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: p === 'alta' ? '#EF4444' : p === 'media' ? '#F59E0B' : '#10B981' }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* POWER BUTTONS (Contextual) */}
                {enabledTools.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4 block">Herramientas & Poderes</Label>

                    {/* GRIMORIUM POWERS */}
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

                    {/* CEREBRITY POWERS */}
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
                )}
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex justify-end items-center z-10">
            <Button onClick={onClose} variant="ghost" className="mr-2">Cancelar</Button>
            <Button onClick={handleAddTask} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800 px-8 flex items-center gap-2">
              {isSaving && <Spinner className="w-4 h-4" />} Crear Tarea
            </Button>
          </div>

        </div>
      </div>
    </Modal>
  );
};

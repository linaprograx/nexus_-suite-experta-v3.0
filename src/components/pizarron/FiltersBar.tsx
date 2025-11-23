import React from 'react';
import { Firestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Checkbox } from '../ui/Checkbox';
import { PizarronSavedView, TaskCategory, Tag } from '../../../types';

interface FiltersBarProps {
  filters: any;
  setFilters: (filters: any) => void;
  db: Firestore;
  userId: string;
  tags: Tag[];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, setFilters, db, userId, tags }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [savedViews, setSavedViews] = React.useState<PizarronSavedView[]>([]);
  const [newViewName, setNewViewName] = React.useState('');
  const [showSaveView, setShowSaveView] = React.useState(false);

  const viewsColPath = `users/${userId}/pizarronViews`;
  const categories: TaskCategory[] = ['Ideas', 'Desarrollo', 'Marketing', 'Admin', 'Urgente'];
  const priorities = ['baja', 'media', 'alta'];

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, viewsColPath), (snap) => {
        setSavedViews(snap.docs.map(d => ({ ...d.data(), id: d.id } as PizarronSavedView)));
    });
    return () => unsub();
  }, [db, viewsColPath]);

  const toggleFilter = (type: 'categories' | 'priorities' | 'tags', value: string) => {
    const current = filters[type] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setFilters({ ...filters, [type]: updated });
  };

  const handleSaveView = async () => {
    if (!newViewName.trim()) return;
    await addDoc(collection(db, viewsColPath), {
        name: newViewName,
        filters,
        createdAt: serverTimestamp(),
        userId
    });
    setNewViewName('');
    setShowSaveView(false);
  };

  const loadView = (view: PizarronSavedView) => {
      setFilters(view.filters);
  };

  const handleDeleteView = async (viewId: string) => {
      await deleteDoc(doc(db, viewsColPath, viewId));
  };

  const activeFiltersCount = (filters.categories?.length || 0) + (filters.priorities?.length || 0) + (filters.tags?.length || 0);

  return (
    <div className="relative">
        <div className="flex gap-2">
            {/* Saved Views Dropdown */}
            <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Icon svg={ICONS.layout} className="h-4 w-4" /> Vistas <Icon svg={ICONS.chevronDown} className="h-3 w-3 opacity-50" />
                </Button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50 p-2">
                    <div className="text-xs font-semibold text-slate-500 mb-2 px-2">Vistas Guardadas</div>
                    {savedViews.length === 0 && <div className="text-xs text-slate-400 px-2 italic">Sin vistas guardadas</div>}
                    {savedViews.map(view => (
                        <div key={view.id} className="flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 py-1">
                            <button onClick={() => loadView(view)} className="text-sm text-left flex-1 truncate">{view.name}</button>
                            <button onClick={() => handleDeleteView(view.id!)} className="text-slate-400 hover:text-red-500"><Icon svg={ICONS.x} className="h-3 w-3" /></button>
                        </div>
                    ))}
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 px-2">
                        {!showSaveView ? (
                            <button onClick={() => setShowSaveView(true)} className="text-xs text-indigo-500 flex items-center gap-1 hover:underline">
                                <Icon svg={ICONS.plus} className="h-3 w-3" /> Guardar vista actual
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <input 
                                    value={newViewName} 
                                    onChange={(e) => setNewViewName(e.target.value)} 
                                    placeholder="Nombre..." 
                                    className="w-full text-xs border rounded px-1"
                                />
                                <button onClick={handleSaveView} className="text-xs bg-indigo-500 text-white px-2 rounded">OK</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Button 
                variant={activeFiltersCount > 0 ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setIsOpen(!isOpen)}
                className={activeFiltersCount > 0 ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300" : ""}
            >
                <Icon svg={ICONS.filter} className="h-4 w-4 mr-2" /> 
                Filtros {activeFiltersCount > 0 && <span className="ml-1 bg-indigo-500 text-white text-[10px] px-1.5 rounded-full">{activeFiltersCount}</span>}
            </Button>
        </div>

        {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-40 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                 <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Prioridad</h4>
                    <div className="flex flex-wrap gap-2">
                        {priorities.map(p => (
                            <button
                                key={p}
                                onClick={() => toggleFilter('priorities', p)}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                    filters.priorities?.includes(p) 
                                    ? 'bg-indigo-500 text-white border-indigo-500' 
                                    : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Categoría</h4>
                    <div className="space-y-1">
                        {categories.map(c => (
                            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                                <Checkbox checked={filters.categories?.includes(c)} onChange={() => toggleFilter('categories', c)} />
                                <span>{c}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-1">
                        {tags.map(t => (
                            <button
                                key={t.id}
                                onClick={() => toggleFilter('tags', t.id)}
                                className={`px-2 py-0.5 text-[10px] rounded-full transition-opacity ${
                                    filters.tags?.includes(t.id) ? 'ring-2 ring-offset-1 ring-slate-400 opacity-100' : 'opacity-60 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: t.color, color: '#fff' }}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <button onClick={() => setFilters({})} className="text-xs text-slate-500 hover:text-red-500">Limpiar todo</button>
                    <button onClick={() => setIsOpen(false)} className="text-xs text-indigo-500 font-semibold">Listo</button>
                </div>
            </div>
        )}
    </div>
  );
};

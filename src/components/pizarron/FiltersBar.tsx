import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Checkbox } from '../ui/Checkbox';
import { TaskCategory, Tag } from '../../types';

interface FiltersBarProps {
    filters: any;
    setFilters: (filters: any) => void;
    db: Firestore;
    userId: string;
    tags: Tag[];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, setFilters, db, userId, tags }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const categories: TaskCategory[] = ['Ideas', 'Desarrollo', 'Marketing', 'Admin', 'Urgente'];
    const priorities = ['baja', 'media', 'alta'];

    const toggleFilter = (type: 'categories' | 'priorities' | 'tags', value: string) => {
        const current = filters[type] || [];
        const updated = current.includes(value)
            ? current.filter((v: string) => v !== value)
            : [...current, value];
        setFilters({ ...filters, [type]: updated });
    };

    const activeFiltersCount = (filters.categories?.length || 0) + (filters.priorities?.length || 0) + (filters.tags?.length || 0);

    return (
        <div className="relative">
            <div className="flex gap-2">
                <Button
                    variant={activeFiltersCount > 0 ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 rounded-xl transition-all ${activeFiltersCount > 0 || isOpen ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200' : 'text-slate-600 hover:bg-white/50 hover:text-orange-500'}`}
                >
                    <Icon svg={ICONS.filter} className="h-4 w-4" />
                    <span className="font-medium">Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm">
                            {activeFiltersCount}
                        </span>
                    )}
                    <Icon svg={ICONS.chevronDown} className={`h-3 w-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-40 p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prioridad</h4>
                            <div className="flex flex-wrap gap-2">
                                {priorities.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => toggleFilter('priorities', p)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${filters.priorities?.includes(p)
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500'
                                            }`}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map(c => (
                                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/10 p-2 rounded-lg transition-colors border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30">
                                        <Checkbox checked={filters.categories?.includes(c)} onChange={() => toggleFilter('categories', c)} className="text-orange-500 focus:ring-orange-500" />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Etiquetas</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => toggleFilter('tags', t.id)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${filters.tags?.includes(t.id) ? 'ring-2 ring-offset-1 ring-slate-400 opacity-100 scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: t.color, color: '#fff' }}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <button onClick={() => setFilters({})} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">Limpiar todo</button>
                            <button onClick={() => setIsOpen(false)} className="text-xs bg-orange-500 text-white px-4 py-1.5 rounded-lg shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all font-bold">Listo</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

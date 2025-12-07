import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RecipeToolbarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;

    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    availableCategories: string[];

    selectedStatus: string;
    onStatusChange: (status: string) => void;
}

export const RecipeToolbar: React.FC<RecipeToolbarProps> = ({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    availableCategories,
    selectedStatus,
    onStatusChange
}) => {

    // Simple Popover logic could be here, or use native Select for MVP speed + reliability 
    // User asked for "Cuadrado pequeño que al tocarse se despliega panel". 
    // For now, styling a Select to look like a custom button is the most robust stateless way.

    return (
        <div className="flex items-center gap-3 w-full mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Search Bar - 50% width or flexible */}
            <div className="relative flex-1 group">
                <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar receta..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
            </div>

            {/* Category Filter */}
            <div className="relative">
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="appearance-none w-32 pl-3 pr-8 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                    <option value="all">Categoría</option> {/* Label when 'all' */}
                    {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-500 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
                <select
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="appearance-none w-28 pl-3 pr-8 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                >
                    <option value="all">Estado</option>
                    <option value="Idea">Idea</option>
                    <option value="Pruebas">Pruebas</option>
                    <option value="Terminado">Carta</option>
                    <option value="Archivada">Archivada</option>
                </select>
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-500 pointer-events-none" />
            </div>
        </div>
    );
};

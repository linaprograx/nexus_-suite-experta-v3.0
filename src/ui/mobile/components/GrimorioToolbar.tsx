import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { Button } from '../../../components/ui/Button';

interface GrimorioToolbarProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    // Categories
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (val: string) => void;
    // Optional Status
    selectedStatus?: string;
    onStatusChange?: (val: string) => void;
    statusOptions?: string[];
    // Actions
    onAdd?: () => void;
    onImport?: () => void;
    onDeleteSelected?: () => void;
    selectedCount?: number;
    // Visuals
    color?: 'orange' | 'red' | 'green' | 'blue' | 'purple';
}

export const GrimorioToolbar: React.FC<GrimorioToolbarProps> = ({
    searchQuery, onSearchChange,
    categories, selectedCategory, onCategoryChange,
    selectedStatus, onStatusChange, statusOptions,
    onAdd, onImport, onDeleteSelected, selectedCount = 0,
    color = 'orange'
}) => {
    const focusColors = {
        orange: 'focus:ring-orange-500/50',
        red: 'focus:ring-red-500/50',
        green: 'focus:ring-emerald-500/50',
        blue: 'focus:ring-blue-500/50',
        purple: 'focus:ring-purple-500/50'
    };
    const focusRing = focusColors[color] || focusColors.orange;

    return (
        <div className="py-4 flex flex-col gap-4 w-full px-5 sticky top-0 z-30">
            {/* Gradient Background for Toolbar Area? No, handled by parent */}

            {/* Search Bar - Full Width */}
            <div className="relative w-full group">
                <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 ${focusRing} hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400`}
                />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 w-full">
                {/* Category Select */}
                <select
                    className={`h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${focusRing} flex-1 min-w-[120px] outline-none`}
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="all">Todas las Categorías</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                {/* Status Select (Optional) */}
                {selectedStatus !== undefined && onStatusChange && (
                    <select
                        className={`h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${focusRing} flex-1 min-w-[120px] outline-none`}
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        {statusOptions?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}

                {/* Delete Button */}
                {selectedCount > 0 && onDeleteSelected && (
                    <Button
                        variant="destructive"
                        className="h-10 px-4 ml-auto whitespace-nowrap"
                        onClick={onDeleteSelected}
                        title="Eliminar seleccionadas"
                    >
                        <Icon svg={ICONS.trash} className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">({selectedCount})</span>
                    </Button>
                )}

                {/* Import Button */}
                {onImport && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onImport}
                        className="h-10 w-10 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                        <Icon svg={ICONS.upload} className="w-4 h-4" />
                    </Button>
                )}

                {/* Add Button */}
                {onAdd && (
                    <Button
                        onClick={onAdd}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 h-10 w-10 p-0 rounded-xl transition-all hover:scale-105 active:scale-95 ml-1"
                    >
                        <Icon svg={ICONS.plus} className="w-5 h-5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

interface IngredientToolbarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;

    selectedCategory: string;
    onCategoryChange: (cat: string) => void;

    selectedStockStatus: string;
    onStatusChange: (status: string) => void;

    onImport?: () => void;
    totalIngredients: number;
}

export const IngredientToolbar: React.FC<IngredientToolbarProps> = ({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    selectedStockStatus,
    onStatusChange,
    onImport
}) => {
    return (
        <div className="flex items-center gap-2 w-full mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Search Bar - Flexible width */}
            <div className="relative flex-1 group">
                <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 transition-all text-sm font-bold text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400/70"
                />
            </div>

            {/* Category Filter */}
            <div className="relative">
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="appearance-none w-32 pl-3 pr-8 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                    <option value="all">Familia</option>
                    <option value="Alcohol Base">Bases</option>
                    <option value="Citrus">Cítricos</option>
                    <option value="Fruits">Frutas</option>
                    <option value="Herbs">Hierbas</option>
                    <option value="Sweeteners">Dulces</option>
                    <option value="Spices">Especias</option>
                    <option value="General">Otros</option>
                </select>
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500 pointer-events-none" />
            </div>

            {/* Stock Status Filter */}
            <div className="relative">
                <select
                    value={selectedStockStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="appearance-none w-32 pl-3 pr-8 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                >
                    <option value="all">Stock</option>
                    <option value="ok">Alto</option>
                    <option value="low">Bajo</option>
                    <option value="out">Agotado</option>
                </select>
                <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-teal-500 pointer-events-none" />
            </div>

            {/* Import Button (New) */}
            {onImport && (
                <Button variant="ghost" size="icon" onClick={onImport} className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                    <Icon svg={ICONS.upload} className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
};

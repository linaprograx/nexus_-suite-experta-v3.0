import React, { useState } from 'react';
import { Ingredient } from '../../types';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Firestore } from 'firebase/firestore';

interface IngredientSelectorProps {
    appId: string;
    selectedIds: string[];
    onSelect: (ingredient: Ingredient, qty: number, unit: string) => void;
    onRemove: (id: string) => void;
    db: Firestore;
    allIngredients: Ingredient[];
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({ appId, selectedIds, onSelect, onRemove, db, allIngredients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [qty, setQty] = useState(30);
    const [unit, setUnit] = useState('ml');

    const filteredIngredients = allIngredients.filter(ing =>
        !selectedIds.includes(ing.id) && (ing.name || ing.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedIngredients = allIngredients.filter(ing => selectedIds.includes(ing.id));

    return (
        <div className="relative w-full">
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <Icon svg={ICONS.search} className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>
                <Input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-20 bg-slate-50 border-slate-200 text-center"
                    placeholder="Cant."
                />
                <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-20 bg-slate-50 border-slate-200 text-center"
                    placeholder="Unidad"
                />
            </div>

            {searchTerm && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                    {filteredIngredients.length > 0 ? (
                        filteredIngredients.map(ing => (
                            <button
                                key={ing.id}
                                onClick={() => {
                                    onSelect(ing, qty, unit);
                                    setSearchTerm("");
                                }}
                                className="w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                <span>{ing.name || ing.nombre || 'Sin nombre'}</span>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                            No se encontraron ingredientes.
                        </div>
                    )}
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIngredients.map(ing => (
                        <span key={ing.id} className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-xs border border-emerald-100 dark:border-emerald-800">
                            <Icon svg={ICONS.leaf} className="w-3 h-3" />
                            {ing.name || ing.nombre}
                            <button onClick={() => onRemove(ing.id)} className="hover:text-red-500"><Icon svg={ICONS.x} className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

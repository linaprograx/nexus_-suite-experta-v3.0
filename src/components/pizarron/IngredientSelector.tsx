import React, { useState, useEffect } from 'react';
import { Ingredient } from '../../types';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

interface IngredientSelectorProps {
    appId: string;
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({ appId, selectedIds, onToggle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Fetch ingredients directly here for simplicity, or we could pass them down
    useEffect(() => {
        const db = getFirestore();
        // Assuming path is consistently: artifacts/{appId}/public/data/ingredients
        // Or checking `ingredientsService` path.
        // Let's assume standard path for now or update after checking service file.
        const path = `artifacts/${appId}/public/data/ingredients`;
        const q = query(collection(db, path), orderBy('nombre'));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ingredient));
            setIngredients(data);
        });

        return () => unsub();
    }, [appId]);

    const filtered = ingredients.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // New state and helper functions for the new UI logic
    const selectedIngredients = ingredients.filter(ing => selectedIds.includes(ing.id));
    const filteredIngredients = ingredients.filter(ing =>
        !selectedIds.includes(ing.id) && ing.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleIngredient = (ing: Ingredient) => {
        onToggle(ing.id);
        // Optionally clear search term or close dropdown if desired after selection
        // setSearchTerm('');
        // setIsOpen(false);
    };

    return (
        <div className="relative">
            <div className="relative">
                <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    type="text"
                    placeholder="Buscar ingrediente en Grimorium..."
                    className="w-full bg-orange-50/30 border border-orange-100 rounded-lg pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && (searchTerm || selectedIds.length > 0) && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 custom-scrollbar">
                        {filteredIngredients.length > 0 ? (
                            filteredIngredients.map(ing => (
                                <div
                                    key={ing.id}
                                    onClick={() => toggleIngredient(ing)}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-300"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{ing.emoji || '🥘'}</span>
                                        <span>{ing.nombre}</span>
                                    </div>
                                    {selectedIds.includes(ing.id) && <Icon svg={ICONS.check} className="h-3 w-3 text-orange-500" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-center">
                                <p className="text-xs text-slate-500 mb-2">No se encontró "{searchTerm}"</p>
                                <button className="text-xs text-orange-600 font-bold hover:underline">
                                    + Crear Ingrediente
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIngredients.map(ing => (
                        <span key={ing.id} className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md text-xs border border-emerald-100 dark:border-emerald-800">
                            <Icon svg={ICONS.leaf} className="h-3 w-3" />
                            {ing.nombre}
                            <button onClick={() => toggleIngredient(ing)} className="hover:text-red-500"><Icon svg={ICONS.x} className="h-3 w-3" /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

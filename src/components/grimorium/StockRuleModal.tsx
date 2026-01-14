import React, { useState, useMemo, useEffect } from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient, StockRule } from '../../types';
import { Modal } from '../ui/Modal';

interface StockRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    allIngredients: Ingredient[];
    onSaveRule: (rule: StockRule) => void;
    initialRule?: StockRule | null; // For editing
}

export const StockRuleModal: React.FC<StockRuleModalProps> = ({
    isOpen,
    onClose,
    allIngredients = [],
    onSaveRule,
    initialRule
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
    const [newRule, setNewRule] = useState<{ minStock: number; reorderQuantity: number }>({ minStock: 0, reorderQuantity: 0 });

    // Reset or Load Initial State
    useEffect(() => {
        if (isOpen) {
            if (initialRule) {
                setNewRule({ minStock: initialRule.minStock, reorderQuantity: initialRule.reorderQuantity });
                const ing = allIngredients.find(i => i.id === initialRule.ingredientId);
                if (ing) setSelectedIngredients([ing]);
            } else {
                setNewRule({ minStock: 0, reorderQuantity: 0 });
                setSelectedIngredients([]);
            }
            setSearchQuery('');
        }
    }, [isOpen, initialRule, allIngredients]);

    const filteredIngredients = useMemo(() => {
        if (!searchQuery) return [];
        return allIngredients.filter(i =>
            i.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allIngredients, searchQuery]);

    const handleSave = () => {
        selectedIngredients.forEach(ing => {
            const ruleObj: StockRule = {
                id: initialRule?.id || Math.random().toString(36).substr(2, 9),
                ingredientId: ing.id,
                ingredientName: ing.nombre,
                minStock: newRule.minStock || 1,
                reorderQuantity: newRule.reorderQuantity || 1,
                active: true
            };
            onSaveRule(ruleObj);
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialRule ? "Editar Regla de Stock" : "Nueva Regla de Stock"}>
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {initialRule ? 'Ingrediente Seleccionado' : `1. Selecciona Ingredientes (${selectedIngredients.length})`}
                    </h4>

                    {!initialRule && (
                        <>
                            <p className="text-xs text-slate-400 mb-2">Solo ingredientes presentes en tu inventario.</p>
                            <Input
                                placeholder="Buscar en inventario..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white dark:bg-slate-800"
                            />
                        </>
                    )}

                    {/* SELECTED TAGS */}
                    {selectedIngredients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                            {selectedIngredients.map(ing => (
                                <div key={ing.id} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <span>{ing.nombre}</span>
                                    {!initialRule && (
                                        <button onClick={() => setSelectedIngredients(prev => prev.filter(i => i.id !== ing.id))} className="hover:text-indigo-900">
                                            <Icon svg={ICONS.x} className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!initialRule && searchQuery && filteredIngredients.length > 0 && (
                        <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-white dark:bg-slate-800 shadow-lg relative z-50">
                            {filteredIngredients.map(ing => {
                                const isSelected = selectedIngredients.some(i => i.id === ing.id);
                                return (
                                    <div
                                        key={ing.id}
                                        className={`p-2 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 last:border-0 flex justify-between items-center ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        onClick={() => {
                                            if (!isSelected) {
                                                setSelectedIngredients(prev => [...prev, ing]);
                                                setSearchQuery('');
                                            }
                                        }}
                                    >
                                        <span>{ing.nombre}</span>
                                        {isSelected && <Icon svg={ICONS.check} className="w-4 h-4 text-indigo-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Mínimo</label>
                        <Input
                            type="number"
                            min={0}
                            step="any"
                            value={newRule.minStock || ''}
                            onChange={(e) => setNewRule(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Alerta si baja de esto</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pedido Auto</label>
                        <Input
                            type="number"
                            min={0}
                            step="any"
                            value={newRule.reorderQuantity || ''}
                            onChange={(e) => setNewRule(prev => ({ ...prev, reorderQuantity: parseFloat(e.target.value) || 0 }))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Cantidad a sugerir</p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={selectedIngredients.length === 0 || !newRule.minStock || !newRule.reorderQuantity} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {initialRule ? 'Actualizar Regla' : 'Guardar Regla'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

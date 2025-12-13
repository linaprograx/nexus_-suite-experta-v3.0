import React, { useState, useMemo } from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient } from '../../types';
import { Modal } from '../ui/Modal';
import { StockItem } from '../../utils/stockUtils';

export interface StockRule {
    id: string;
    ingredientId: string;
    ingredientName: string;
    minStock: number;
    reorderQuantity: number;
    active: boolean;
}

interface StockRulesPanelProps {
    allIngredients: Ingredient[];
    stockItems: StockItem[];
    onQuickBuy: (ingredient: Ingredient) => void;
    // In a real app, these would be async actions
    onSaveRule?: (rule: StockRule) => void;
    onDeleteRule?: (ruleId: string) => void;
}

export const StockRulesPanel: React.FC<StockRulesPanelProps> = ({
    allIngredients = [],
    stockItems = [],
    onQuickBuy,
    onSaveRule,
    onDeleteRule
}) => {
    // Local State for Rules (Simulation)
    const [rules, setRules] = useState<StockRule[]>([
        { id: '1', ingredientId: 'gin1', ingredientName: 'Ginebra Bombay', minStock: 5, reorderQuantity: 6, active: true },
        { id: '2', ingredientId: 'lim1', ingredientName: 'Limones', minStock: 2, reorderQuantity: 5, active: true },
    ]);

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [newRule, setNewRule] = useState<Partial<StockRule>>({ minStock: 1, reorderQuantity: 1 });
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [quickSearchQuery, setQuickSearchQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredIngredients = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return allIngredients.filter(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
    }, [allIngredients, searchQuery]);

    // 1. Low Stock Alerts (Based on Rules)
    const lowStockAlerts = useMemo(() => {
        const alerts: { item: StockItem, rule: StockRule }[] = [];

        rules.forEach(rule => {
            if (!rule.active) return;
            // Match rule to stock item (fuzzy match by name if ID usage is inconsistent, preferably ID)
            const stockItem = stockItems.find(i =>
                i.ingredientId === rule.ingredientId ||
                i.ingredientName.toLowerCase() === rule.ingredientName.toLowerCase()
            );

            if (stockItem && stockItem.quantityAvailable <= rule.minStock) {
                alerts.push({ item: stockItem, rule });
            }
        });
        return alerts;
    }, [rules, stockItems]);


    // -- HANDLERS --

    const handleSaveRule = () => {
        if (!selectedIngredient || !newRule.minStock || !newRule.reorderQuantity) return;

        const rule: StockRule = {
            id: Date.now().toString(),
            ingredientId: selectedIngredient.id,
            ingredientName: selectedIngredient.nombre,
            minStock: Number(newRule.minStock),
            reorderQuantity: Number(newRule.reorderQuantity),
            active: true
        };

        setRules(prev => [...prev, rule]);
        if (onSaveRule) onSaveRule(rule);

        // Reset
        setIsRuleModalOpen(false);
        setNewRule({ minStock: 1, reorderQuantity: 1 });
        setSelectedIngredient(null);
    };

    const handleDelete = (id: string) => {
        setRules(prev => prev.filter(r => r.id !== id));
        if (onDeleteRule) onDeleteRule(id);
    }

    const filteredQuickSearch = useMemo(() => {
        if (!quickSearchQuery.trim()) return [];
        return allIngredients.filter(i => i.nombre.toLowerCase().includes(quickSearchQuery.toLowerCase())).slice(0, 5);
    }, [allIngredients, quickSearchQuery]);


    return (
        <div className="h-full flex flex-col bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-r border-white/20 dark:border-white/5">
            <div className="p-4 border-b border-white/20 dark:border-white/5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Icon svg={ICONS.sliders} className="w-4 h-4 text-indigo-500" />
                    Gestión de Stock
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

                {/* 0. QUICK BUY SEARCH */}
                <div className="relative">
                    <div className="relative">
                        <Icon svg={ICONS.search} className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-9 text-xs"
                            placeholder="Buscar para compra rápida..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Autocomplete Dropdown */}
                    {searchQuery && filteredIngredients.length > 0 && !isRuleModalOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            {filteredIngredients.map(ing => (
                                <div
                                    key={ing.id}
                                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex justify-between items-center group"
                                    onClick={() => {
                                        onQuickBuy(ing);
                                        setSearchQuery('');
                                    }}
                                >
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{ing.nombre}</span>
                                    <Icon svg={ICONS.shoppingCart} className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 1. CRITICAL ALERTS */}
                {lowStockAlerts.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Alertas Críticas ({lowStockAlerts.length})</h4>
                        </div>

                        {lowStockAlerts.map(alert => (
                            <div key={alert.item.ingredientId} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-red-700 dark:text-red-300 text-sm">{alert.item.ingredientName}</span>
                                    <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">
                                        {alert.item.quantityAvailable} {alert.item.unit}
                                    </span>
                                </div>
                                <p className="text-[10px] text-red-500/80 mb-2">Stock debajo del mínimo ({alert.rule.minStock})</p>
                                <Button
                                    size="xs"
                                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 border-none shadow-none text-xs h-7"
                                    onClick={() => onQuickBuy(allIngredients.find(i => i.id === alert.item.ingredientId) as Ingredient)}
                                >
                                    Pedir {alert.rule.reorderQuantity} Uds
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {lowStockAlerts.length === 0 && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600">
                            <Icon svg={ICONS.check} className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Todo en orden</p>
                            <p className="text-[10px] text-emerald-600/70">Niveles de stock saludables</p>
                        </div>
                    </div>
                )}

                <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50"></div>

                {/* 2. RULES LIST */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Automatizaciones Activas</h4>
                    <div className="space-y-3">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 relative group">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{rule.ingredientName}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Icon svg={ICONS.warning} className="w-3 h-3 text-orange-400" />
                                        <span>Si stock &lt; <strong>{rule.minStock}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Icon svg={ICONS.box} className="w-3 h-3 text-indigo-400" />
                                        <span>Pedir <strong>{rule.reorderQuantity}</strong> uds</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Icon svg={ICONS.trash} className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ADD RULE BUTTON */}
                <Button
                    variant="outline"
                    onClick={() => setIsRuleModalOpen(true)}
                    className="w-full border-dashed border-slate-400 text-slate-600 hover:text-indigo-600 hover:border-indigo-500 bg-white/40 hover:bg-white/60 transition-all font-medium text-xs mt-4"
                >
                    <Icon svg={ICONS.plus} className="w-3.5 h-3.5 mr-2" />
                    Nueva Regla de Stock
                </Button>

                {/* Contextual Help */}
                <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                    <div className="flex gap-2">
                        <Icon svg={ICONS.info} className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                            Busca ingredientes en el mercado (arriba) para compra rápida o configura reglas para automatizar pedidos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal for New Rule */}
            <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title="Nueva Regla de Stock">
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">1. Selecciona el Ingrediente</h4>
                        <Input
                            placeholder="Buscar ingrediente (ej. Limones)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white dark:bg-slate-800"
                        />
                        {searchQuery && filteredIngredients.length > 0 && (
                            <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-white dark:bg-slate-800 shadow-lg relative z-50">
                                {filteredIngredients.map(ing => (
                                    <div
                                        key={ing.id}
                                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        onClick={() => { setSelectedIngredient(ing); setSearchQuery(''); }}
                                    >
                                        {ing.nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedIngredient && (
                            <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{selectedIngredient.nombre}</span>
                                <Button size="xs" variant="ghost" onClick={() => setSelectedIngredient(null)} className="h-6 w-6 p-0 text-indigo-500"><Icon svg={ICONS.trash} className="w-3 h-3" /></Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Mínimo</label>
                            <Input
                                type="number"
                                min={1}
                                value={newRule.minStock}
                                onChange={(e) => setNewRule(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Alerta si baja de esto</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pedido Auto</label>
                            <Input
                                type="number"
                                min={1}
                                value={newRule.reorderQuantity}
                                onChange={(e) => setNewRule(prev => ({ ...prev, reorderQuantity: parseInt(e.target.value) || 0 }))}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Cantidad a sugerir</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsRuleModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveRule} disabled={!selectedIngredient || !newRule.minStock || !newRule.reorderQuantity} className="bg-indigo-600 text-white">
                            Guardar Regla
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

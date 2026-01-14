import React, { useState, useMemo } from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient, StockRule } from '../../types';
import { Modal } from '../ui/Modal';
import { StockItem } from '../../types';
import { StockRuleModal } from '../grimorium/StockRuleModal';

interface StockRulesPanelProps {
    allIngredients: Ingredient[];
    stockItems: StockItem[];
    // Lifted State Props
    rules: StockRule[];
    onQuickBuy: (ingredient: Ingredient) => void;
    onSaveRule: (rule: StockRule) => void;
    onDeleteRule: (ruleId: string) => void;
    onBulkOrder?: (ingredients: Ingredient[]) => void;
    onUpdateRules?: (rules: StockRule[]) => void;
    onEditRule?: (rule: StockRule) => void; // New
    onCheckAlert?: (ingredient: Ingredient) => void; // New
}

export const StockRulesPanel: React.FC<StockRulesPanelProps> = ({
    allIngredients = [],
    stockItems = [],
    rules = [],
    onQuickBuy,
    onSaveRule,
    onDeleteRule,
    onBulkOrder,
    onUpdateRules,
    onEditRule,
    onCheckAlert
}) => {
    // Removed local rules state

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [quickSearchQuery, setQuickSearchQuery] = useState('');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null); // New local state for internal edit if no prop provided

    // ... (rest of filtering logic)

    const handleEditRuleClick = (rule: StockRule) => {
        if (onEditRule) {
            onEditRule(rule);
        } else {
            // Local fallback (simplified)
            setEditingRuleId(rule.id);
            setIsRuleModalOpen(true);
        }
    };

    const handleAlertClick = (ingredientId: string) => {
        const ingredient = allIngredients.find(i => i.id === ingredientId);
        if (ingredient && onCheckAlert) {
            onCheckAlert(ingredient);
        } else if (ingredient) {
            onQuickBuy(ingredient);
        }
    };

    // FilteredIngredients memo moved to StockRuleModal

    const filteredQuickSearch = useMemo(() => {
        if (!quickSearchQuery) return [];
        return allIngredients.filter(i => i.nombre.toLowerCase().includes(quickSearchQuery.toLowerCase()));
    }, [allIngredients, quickSearchQuery]);

    const lowStockAlerts = useMemo(() => {
        return rules.map(rule => {
            const stockItem = stockItems.find(i => i.ingredientId === rule.ingredientId);
            const quantity = stockItem ? stockItem.quantityAvailable : 0;

            if (quantity < rule.minStock) {
                // Return a structure compatible with the render
                return {
                    rule,
                    item: stockItem || {
                        ingredientId: rule.ingredientId,
                        ingredientName: rule.ingredientName || 'Desconocido',
                        quantityAvailable: 0,
                        unit: 'Und'
                    }
                };
            }
            return null;
        }).filter(Boolean) as { rule: StockRule, item: any }[];
    }, [rules, stockItems]);

    const handleSaveRule = (newRuleObj: StockRule) => {
        const newRulesList = [...rules];

        // Remove existing if editing (or if ID matches)
        let rulesToSave = editingRuleId ? newRulesList.filter(r => r.id !== editingRuleId) : newRulesList;

        // Add new
        rulesToSave.push(newRuleObj);

        // Call props
        if (onSaveRule) onSaveRule(newRuleObj);
        if (onUpdateRules) onUpdateRules(rulesToSave);

        setIsRuleModalOpen(false);
        setEditingRuleId(null);
    };

    const handleDelete = (id: string) => {
        if (onDeleteRule) onDeleteRule(id);
        if (onUpdateRules) {
            onUpdateRules(rules.filter(r => r.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="pb-4 pt-1 px-1">
                {/* NEW RULE BUTTON - Styled to match 'Nuevo Proveedor' but with Indigo theme for Rules */}
                <button
                    onClick={() => setIsRuleModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/40 dark:bg-slate-800/40 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 text-slate-600 dark:text-slate-300 rounded-xl backdrop-blur-sm transition-all text-xs font-bold border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-500 shadow-sm group"
                >
                    <Icon svg={ICONS.plus} className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Nueva Regla</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

                {/* 0. QUICK BUY SEARCH */}
                <div className="relative">
                    {/* ... (Search unchanged) ... */}
                    <div className="relative">
                        <Icon svg={ICONS.search} className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 h-9 text-xs"
                            placeholder="Buscar para compra rápida..."
                            value={quickSearchQuery}
                            onChange={(e) => setQuickSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Autocomplete Dropdown */}
                    {quickSearchQuery && filteredQuickSearch.length > 0 && !isRuleModalOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            {filteredQuickSearch.map(ing => (
                                <div
                                    key={ing.id}
                                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex justify-between items-center group"
                                    onClick={() => {
                                        onQuickBuy(ing);
                                        setQuickSearchQuery('');
                                    }}
                                >
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{ing.nombre}</span>
                                    <Icon svg={ICONS.shoppingCart} className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 1. CRITICAL ALERTS (CONSOLIDATED) */}
                {lowStockAlerts.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-red-100/50 dark:bg-red-900/40 p-2 px-3 border-b border-red-200 dark:border-red-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Stock Crítico ({lowStockAlerts.length})</h4>
                            </div>
                            <button
                                onClick={() => {
                                    if (onBulkOrder) {
                                        const ingredientsToBuy = lowStockAlerts
                                            .map(a => allIngredients.find(i => i.id === a.item.ingredientId))
                                            .filter(Boolean) as Ingredient[];
                                        onBulkOrder(ingredientsToBuy);
                                    }
                                }}
                                className="text-[10px] bg-white dark:bg-red-900/80 hover:bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 font-bold shadow-sm transition-colors"
                            >
                                Pedir Todo
                            </button>
                        </div>

                        <div className="divide-y divide-red-100 dark:divide-red-800/30">
                            {lowStockAlerts.map(alert => (
                                <div
                                    key={alert.item.ingredientId}
                                    className="p-2 hover:bg-red-100/30 transition-colors flex justify-between items-center group cursor-pointer"
                                    onClick={() => handleAlertClick(alert.item.ingredientId)}
                                >
                                    <div className="min-w-0 flex-1 pr-2">
                                        <div className="flex items-baseline justify-between mb-0.5">
                                            <span className="text-xs font-bold text-red-700 dark:text-red-300 truncate" title={alert.item.ingredientName}>
                                                {alert.item.ingredientName}
                                            </span>
                                            <span className="text-[10px] font-mono text-red-500">
                                                Min: {alert.rule.minStock}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-red-500/80">
                                            <span className="bg-red-200/50 px-1 rounded text-red-700 font-mono">{alert.item.quantityAvailable} {alert.item.unit}</span>
                                            <span>→ Pedir {alert.rule.reorderQuantity}</span>
                                        </div>
                                    </div>
                                    {/* Small individual buy action just in case */}
                                    <button
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onQuickBuy(allIngredients.find(i => i.id === alert.item.ingredientId) as Ingredient);
                                        }}
                                        title="Pedir solo este"
                                    >
                                        <Icon svg={ICONS.shoppingCart} className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
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

                {/* 2. RULES LIST (COMPACT) */}
                <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Reglas Activas</h4>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white/40 dark:bg-slate-800/40">
                        {rules.map((rule, idx) => (
                            <div
                                key={rule.id}
                                className={`flex items-center justify-between p-2 px-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 group transition-colors cursor-pointer ${idx !== rules.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}
                                onClick={() => handleEditRuleClick(rule)}
                            >
                                <div className="flex-1 min-w-0 pr-3 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${rule.active ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={rule.ingredientName}>{rule.ingredientName}</span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Stock Mínimo">
                                        <span className="text-orange-400 font-bold">&lt;{rule.minStock}</span>
                                    </div>
                                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Cantidad a Pedir">
                                        <span className="text-indigo-500 font-bold">+{rule.reorderQuantity}</span>
                                    </div>

                                    {/* Delete Action */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                                        className="ml-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Icon svg={ICONS.trash} className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <div className="p-4 text-center text-[10px] text-slate-400 italic">
                                No hay reglas configuradas.
                            </div>
                        )}
                    </div>
                </div>

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
            {/* Modal for New Rule using Reusable Component */}
            <StockRuleModal
                isOpen={isRuleModalOpen}
                onClose={() => {
                    setIsRuleModalOpen(false);
                    setEditingRuleId(null);
                }}
                allIngredients={allIngredients}
                onSaveRule={handleSaveRule}
                initialRule={editingRuleId ? rules.find(r => r.id === editingRuleId) : undefined}
            />
        </div>
    );
};

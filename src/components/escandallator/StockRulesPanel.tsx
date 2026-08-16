import React, { useState, useMemo, useCallback } from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient, StockRule } from '../../types';
import { Modal } from '../ui/Modal';
import { StockItem } from '../../types';
import { StockRuleModal } from '../grimorium/StockRuleModal';
import { Plegable, UMBRAL_LISTA_LARGA } from '../ui/Plegable';
import { buscar } from '../../core/search/buscador';
import { nivelDeStock } from '../../core/stock/nivelDeStock';
import { maestroDeRegla } from '../../core/stock/reglasPorProducto';

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

    /**
     * Las reglas, agrupadas por la categoría del ingrediente al que apuntan.
     *
     * Por debajo del umbral se deja un solo grupo: partir ocho reglas en cuatro
     * cajones no ordena nada, solo añade clics.
     */
    const gruposDeReglas = React.useMemo(() => {
        if (rules.length <= UMBRAL_LISTA_LARGA) {
            return [{ categoria: 'Reglas Activas', reglas: rules }];
        }
        const porId = new Map(allIngredients.map(i => [i.id, i]));
        const mapa = new Map<string, StockRule[]>();
        for (const r of rules) {
            const cat = porId.get((r as any).ingredientId)?.categoria?.trim() || 'Sin categoría';
            (mapa.get(cat) ?? mapa.set(cat, []).get(cat)!).push(r);
        }
        return [...mapa.entries()]
            .map(([categoria, reglas]) => ({ categoria, reglas }))
            // Los cajones más llenos primero: es donde está lo que se viene a ver.
            .sort((a, b) => b.reglas.length - a.reglas.length || a.categoria.localeCompare(b.categoria));
    }, [rules, allIngredients]);

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
        // Mismo buscador que Mercado, y ordenado por relevancia: en una compra
        // rápida lo que se busca suele estar en las dos primeras sugerencias.
        return buscar(allIngredients, quickSearchQuery, { camposDe: i => [i.nombre, i.categoria] });
    }, [allIngredients, quickSearchQuery]);

    /**
     * Las existencias de una regla, resolviendo el maestro.
     *
     * Cruzar por el id crudo hacía que una regla sobre una ficha fusionada
     * encontrara cero y gritara stock crítico sobre un producto lleno. Estaba
     * pasando de verdad. Ver `core/stock/reglasPorProducto.ts`.
     */
    const existenciasDe = useCallback((rule: StockRule) => {
        const maestro = maestroDeRegla(rule, allIngredients || []);
        return stockItems.find(i => i.ingredientId === maestro)
            || stockItems.find(i => i.ingredientId === rule.ingredientId);
    }, [stockItems, allIngredients]);

    const lowStockAlerts = useMemo(() => {
        return rules.map(rule => {
            const stockItem = existenciasDe(rule);
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
    }, [rules, existenciasDe]);

    /**
     * Lo que sobra. Simétrico a `lowStockAlerts`, y separado a propósito.
     *
     * Sin esta lista el techo no serviría de nada: pones un máximo y lo único
     * que cambia es un punto azul perdido entre 1.326 fichas. Aquí se lee de
     * un vistazo cuánto capital hay parado y en qué.
     *
     * Solo aparece si alguien ha declarado un techo. Hoy no lo tiene ninguna
     * de las 611 reglas, así que la sección no existe hasta que sirva.
     */
    const sobrestock = useMemo(() => {
        return rules.map(rule => {
            const stockItem = existenciasDe(rule);
            const quantity = stockItem ? stockItem.quantityAvailable : 0;
            const nivel = nivelDeStock(rule, quantity);
            if (nivel.nivel !== 'sobrestock') return null;
            return {
                rule,
                nombre: stockItem?.ingredientName || rule.ingredientName || 'Desconocido',
                unidad: stockItem?.unit || 'Und',
                cantidad: quantity,
                exceso: nivel.exceso || 0,
            };
        }).filter(Boolean) as { rule: StockRule; nombre: string; unidad: string; cantidad: number; exceso: number }[];
    }, [rules, existenciasDe]);

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

    const filaDeRegla = (rule: StockRule, ultima: boolean) => (
        <div
            key={rule.id}
            className={`flex items-center justify-between p-2 px-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 group transition-colors cursor-pointer ${ultima ? '' : 'border-b border-slate-100 dark:border-slate-700/50'}`}
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
                {/* El techo solo aparece si existe. Un «>—» en 611 filas sería
                    ruido, y ninguna de ellas tiene máximo todavía. */}
                {rule.maxStock ? (
                    <>
                        <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Stock Máximo">
                            <span className="text-sky-500 font-bold">&gt;{rule.maxStock}</span>
                        </div>
                    </>
                ) : null}
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400" title="Cantidad a Pedir">
                    <span className="text-indigo-500 font-bold">+{rule.reorderQuantity}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                    className="ml-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Icon svg={ICONS.trash} className="w-3 h-3" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="px-3 pt-3 pb-2">
                {/* NEW RULE BUTTON — premium solid gradient */}
                <button
                    onClick={() => setIsRuleModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 group"
                >
                    <Icon svg={ICONS.plus} className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span>Nueva Regla</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-4">

                {/* 0. COMPRA RÁPIDA
                    La explicación vivía en un recuadro al final del panel, a un
                    scroll de distancia de la barra que explicaba. Así no explica
                    nada: para cuando se lee, ya has pasado por encima del campo
                    sin saber para qué era —parecía un buscador más—.
                    Ahora la etiqueta va dentro. El contorno es tenue a propósito:
                    lo justo para que el bloque se lea como una herramienta y no
                    como un campo suelto, sin competir con la alerta de stock
                    crítico, que sí es una urgencia. */}
                <div className="relative rounded-xl border border-emerald-200/70 dark:border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-900/10 p-2.5">
                    <div className="flex items-start gap-2 mb-2">
                        <Icon svg={ICONS.shoppingCart} className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-px" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 leading-none">Compra rápida</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                                Busca cualquier ingrediente del mercado y regístrale una compra al momento, sin crear una regla.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <Icon svg={ICONS.search} className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white dark:bg-slate-800/70 border-emerald-200 dark:border-emerald-500/30 h-9 text-xs"
                            placeholder="Escribe un ingrediente…"
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
                                    className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer flex justify-between items-center group"
                                    onClick={() => {
                                        onQuickBuy(ing);
                                        setQuickSearchQuery('');
                                    }}
                                >
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{ing.nombre}</span>
                                    <Icon svg={ICONS.shoppingCart} className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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

                {/* Azul, no rojo ni ámbar: sobrar no impide servir a nadie, es
                    dinero parado. Ver el porqué en `core/stock/nivelDeStock.ts`.
                    Y sin botón de acción: la acción de «tengo de más» no es
                    comprar ni tirar, es dejar de pedirlo, y eso ya lo hace el
                    recorte de la cantidad sugerida. */}
                {sobrestock.length > 0 && (
                    <div className="p-2 bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Icon svg={ICONS.alertCircle} className="w-3 h-3 text-sky-500" />
                            <h4 className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Sobrestock ({sobrestock.length})</h4>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {sobrestock.map(s => (
                                <div key={s.rule.id} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg hover:bg-sky-100/50 dark:hover:bg-sky-900/20">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={s.nombre}>{s.nombre}</span>
                                    <span className="shrink-0 text-[10px] font-mono text-sky-600 dark:text-sky-400" title={`Tienes ${s.cantidad} ${s.unidad} y tu máximo es ${s.rule.maxStock}`}>
                                        +{s.exceso} {s.unidad}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50"></div>

                {/* 2. REGLAS — plegadas, y agrupadas por categoría si son muchas.
                    Abiertas de par en par empujaban la sección de Proveedores
                    fuera de la pantalla: quedaba a un scroll largo de distancia
                    sin que nada lo indicara. Ver la regla en `Plegable`. */}
                <div className="space-y-2">
                    {rules.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center text-[10px] text-slate-400 italic">
                            No hay reglas configuradas.
                        </div>
                    ) : gruposDeReglas.length === 1 ? (
                        <Plegable titulo="Reglas Activas" insignia={rules.length}>
                            {gruposDeReglas[0].reglas.map((r, i) => filaDeRegla(r, i === gruposDeReglas[0].reglas.length - 1))}
                        </Plegable>
                    ) : (
                        // Dos niveles: el bloque entero se pliega —que es lo que
                        // deja ver Proveedores de un vistazo— y dentro cada
                        // categoría se abre por separado. Con 611 reglas, un
                        // solo nivel seguía siendo un scroll de 49 filas.
                        <Plegable titulo="Reglas Activas" insignia={rules.length}>
                            <div className="p-2 space-y-1.5">
                                {gruposDeReglas.map(g => (
                                    <Plegable key={g.categoria} titulo={g.categoria} insignia={g.reglas.length}>
                                        {g.reglas.map((r, i) => filaDeRegla(r, i === g.reglas.length - 1))}
                                    </Plegable>
                                ))}
                            </div>
                        </Plegable>
                    )}
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

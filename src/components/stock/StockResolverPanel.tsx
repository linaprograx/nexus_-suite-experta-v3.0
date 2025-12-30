import React, { useState } from 'react';
import { Ingredient, PurchaseEvent } from '../../types';
import { UnresolvedPurchase } from '../../features/stock/hooks/useStockResolver';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Select } from '../ui/Select';
// Assuming Select existence or using native select for simplicity since Select might be complex
// Let's use native select to be safe and dependency-free for this specific utility panel

interface StockResolverPanelProps {
    autoFixCount: number;
    manualFixCandidates: UnresolvedPurchase[];
    onApplyAutoFixes: () => void;
    onResolveManual: (purchaseId: string, ingredientId: string) => void;
    allIngredients: Ingredient[];
    isResolving: boolean;
}

export const StockResolverPanel: React.FC<StockResolverPanelProps> = ({
    autoFixCount,
    manualFixCandidates,
    onApplyAutoFixes,
    onResolveManual,
    allIngredients,
    isResolving
}) => {
    const [selectedIngredientId, setSelectedIngredientId] = useState<Record<string, string>>({});
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (autoFixCount === 0 && manualFixCandidates.length === 0) return null;

    return (
        <Card className="mb-6 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <Icon svg={ICONS.alert} className="w-5 h-5" />
                        <h3 className="font-bold">Resolver Conflictos de Stock</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
                        {isCollapsed ? 'Mostrar' : 'Ocultar'}
                    </Button>
                </div>

                {!isCollapsed && (
                    <div className="space-y-4">
                        {/* Auto Fix Section */}
                        {autoFixCount > 0 && (
                            <div className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">
                                        {autoFixCount} compras pueden arreglarse automáticamente.
                                    </p>
                                    <p className="text-xs text-slate-500">Coincidencia exacta de nombre encontrada.</p>
                                </div>
                                <Button
                                    onClick={onApplyAutoFixes}
                                    disabled={isResolving}
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    {isResolving ? 'Aplicando...' : 'Corregir Todo'}
                                </Button>
                            </div>
                        )}

                        {/* Manual Fix Section */}
                        {manualFixCandidates.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Conflictos Manuales ({manualFixCandidates.length})
                                </p>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {manualFixCandidates.map(({ purchase }) => (
                                        <div key={purchase.id} className="flex flex-col sm:flex-row gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate text-sm" title={purchase.ingredientName}>
                                                    "{purchase.ingredientName || 'Desconocido'}"
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.providerName}
                                                </p>
                                            </div>

                                            <select
                                                className="w-full sm:w-48 h-8 text-xs rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                value={selectedIngredientId[purchase.id] || ''}
                                                onChange={(e) => setSelectedIngredientId(prev => ({ ...prev, [purchase.id]: e.target.value }))}
                                            >
                                                <option value="">Seleccionar Ingrediente...</option>
                                                {allIngredients
                                                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                                    .map(ing => (
                                                        <option key={ing.id} value={ing.id}>{ing.nombre}</option>
                                                    ))}
                                            </select>

                                            <Button
                                                size="sm"
                                                disabled={!selectedIngredientId[purchase.id] || isResolving}
                                                onClick={() => {
                                                    const targetId = selectedIngredientId[purchase.id];
                                                    if (targetId) onResolveManual(purchase.id, targetId);
                                                }}
                                            >
                                                Vincular
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

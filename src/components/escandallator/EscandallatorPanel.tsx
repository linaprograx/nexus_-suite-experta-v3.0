import React, { useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe, StockItem } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import EscandalloTab from './EscandalloTab';
import BatcherTab from './BatcherTab';

interface EscandallatorPanelProps {
    db: Firestore;
    appId: string;
    allRecipes: Recipe[];

    // Controlled SubTab
    activeSubTab: 'calculator' | 'production';
    onSubTabChange: (tab: 'calculator' | 'production') => void;

    // Shared/Escandallo Props
    selectedRecipe: Recipe | null;
    precioVenta: number;
    onSelectRecipe: (recipe: Recipe | null) => void;
    onPriceChange: (price: number) => void;

    // Batcher Props
    setBatchResult: (result: any) => void;
    batchSelectedRecipeId: string;
    batchTargetQty: string;
    batchTargetUnit: 'Litros' | 'Botellas';
    batchIncludeDilution: boolean;
    onBatchRecipeChange: (id: string) => void;
    onBatchQuantityChange: (qty: string) => void;
    onBatchUnitChange: (unit: 'Litros' | 'Botellas') => void;
    onBatchDilutionChange: (checked: boolean) => void;

    // Stock Data for Real Cost
    stockItems: StockItem[];
}

const EscandallatorPanel: React.FC<EscandallatorPanelProps> = (props) => {

    // --- REAL COST CALCULATION ---
    const realCost = useMemo(() => {
        if (!props.selectedRecipe || !props.selectedRecipe.ingredientes) return 0;

        let totalRealCost = 0;
        let isComplete = true;

        props.selectedRecipe.ingredientes.forEach(ing => {
            const stockItem = props.stockItems.find(s => s.ingredientId === ing.id);

            if (stockItem && stockItem.averageUnitCost > 0) {
                // Determine Stock Price Per Base Unit
                let metricPrice = 0;

                // Using manual multiplier for now to ensure strict parity with existing logic
                // Phase 5.3 should standardize this to unitConverter.ts universally
                const getMultiplier = (unit: string) => {
                    const u = unit.toLowerCase();
                    if (u === 'l' || u === 'litros' || u === 'litro') return 1000;
                    if (u === 'cl') return 10;
                    if (u === 'oz') return 29.57;
                    if (u === 'ml' || u === 'g' || u === 'gr') return 1;
                    if (u === 'kg' || u === 'kilo') return 1000;
                    return 1;
                };

                const sUnit = stockItem.unit.toLowerCase();
                // Case A: Volume/Weight
                if (['l', 'liter', 'litros', 'litro', 'ml', 'cl', 'oz', 'g', 'gr', 'kg', 'kilo'].includes(sUnit)) {
                    const stockMultiplier = getMultiplier(stockItem.unit);
                    metricPrice = stockItem.averageUnitCost / stockMultiplier;
                }
                // Case B: Unit/Bottle
                else {
                    const volume = ing.standardQuantity || 700;
                    metricPrice = stockItem.averageUnitCost / volume;
                }

                const recipeQty = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : ing.cantidad;
                const recipeMultiplier = getMultiplier(ing.unidad);
                const recipeQtyBase = recipeQty * recipeMultiplier;

                totalRealCost += recipeQtyBase * metricPrice;
            } else {
                // If stock missing, fallback to theoretical? 
                // For "Real Cost", strict mode says missing.
                isComplete = false;
            }
        });

        return isComplete ? totalRealCost : -1;
    }, [props.selectedRecipe, props.stockItems]);


    return (
        <div className="h-full flex flex-col w-full max-w-full overflow-hidden bg-transparent">
            {/* Sub-navigation for Escandallator */}
            <div className="flex items-center justify-center pt-6 pb-4 gap-4 flex-shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-rose-100 dark:border-rose-900/20">
                <button
                    onClick={() => props.onSubTabChange('calculator')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${props.activeSubTab === 'calculator' ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <Icon svg={ICONS.chart} className="w-3.5 h-3.5" />
                        <span>Rentabilidad</span>
                    </div>
                </button>
                <button
                    onClick={() => props.onSubTabChange('production')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${props.activeSubTab === 'production' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <Icon svg={ICONS.layers} className="w-3.5 h-3.5" />
                        <span>Producción</span>
                    </div>
                </button>
            </div>

            {/* Central Scrolling Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="w-full space-y-6">
                    {props.activeSubTab === 'calculator' && (
                        <EscandalloTab
                            allRecipes={props.allRecipes}
                            selectedRecipe={props.selectedRecipe}
                            precioVenta={props.precioVenta}
                            onSelectRecipe={props.onSelectRecipe}
                            onPriceChange={props.onPriceChange}
                            realCost={realCost}
                        />
                    )}
                    {props.activeSubTab === 'production' && (
                        <BatcherTab
                            db={props.db}
                            appId={props.appId}
                            allRecipes={props.allRecipes}
                            setBatchResult={props.setBatchResult}
                            selectedRecipeId={props.batchSelectedRecipeId}
                            targetQuantity={props.batchTargetQty}
                            targetUnit={props.batchTargetUnit}
                            includeDilution={props.batchIncludeDilution}
                            onRecipeChange={props.onBatchRecipeChange}
                            onQuantityChange={props.onBatchQuantityChange}
                            onUnitChange={props.onBatchUnitChange}
                            onDilutionChange={props.onBatchDilutionChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscandallatorPanel;

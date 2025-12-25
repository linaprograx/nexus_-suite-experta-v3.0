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
                // NORMALIZE TO COMMON BASE (ml/g)
                // helper to get multiplier to ml
                const getMultiplier = (unit: string) => {
                    const u = unit.toLowerCase();
                    if (u === 'l' || u === 'litros' || u === 'litro') return 1000;
                    if (u === 'cl') return 10;
                    if (u === 'oz') return 29.57; // Precise oz
                    if (u === 'ml' || u === 'g' || u === 'gr') return 1;
                    if (u === 'kg' || u === 'kilo') return 1000;
                    return 1;
                };

                const recipeQty = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : ing.cantidad;
                const recipeQtyBase = recipeQty * getMultiplier(ing.unidad);

                let stockCostPerBase = 0;

                const sUnit = stockItem.unit.toLowerCase();

                // Debug Log
                // console.log(`[CostCalc] Item: ${ing.nombre} | StockUnit: ${sUnit} | StockAvgCost: ${stockItem.averageUnitCost}`);

                // Case A: Stock is Volume/Weight (L, ml, kg, g, oz, cl)
                if (['l', 'liter', 'litros', 'litro', 'ml', 'cl', 'oz', 'g', 'gr', 'kg', 'kilo'].includes(sUnit)) {
                    const stockMultiplier = getMultiplier(stockItem.unit);
                    // Cost per unit * (1 / multiplier) -> Cost per base
                    // Example: Cost €25 for 1 L (1000ml). Cost per ml = 25 / 1000 = 0.025
                    stockCostPerBase = stockItem.averageUnitCost / stockMultiplier;
                }
                // Case B: Stock is Unit/Bottle (Botella, Unidad, Bote)
                else {
                    // We need to infer the volume of the bottle/unit.
                    // 1. Try ing.standardQuantity (from Market definition)
                    // 2. Default to 700ml (Standard Spirit Bottle)
                    const volume = ing.standardQuantity || 700;
                    stockCostPerBase = stockItem.averageUnitCost / volume;
                }

                totalRealCost += recipeQtyBase * stockCostPerBase;
            } else {
                console.warn(`[CostCalc] Missing Stock for: ${ing.nombre} (ID: ${ing.id})`);
                isComplete = false;
            }
        });

        return isComplete ? totalRealCost : -1;
    }, [props.selectedRecipe, props.stockItems]);


    return (
        <div className="h-full flex flex-col w-full max-w-full overflow-hidden bg-white dark:bg-slate-950">
            {/* Sub-navigation for Escandallator */}
            <div className="flex items-center justify-center pt-6 pb-4 gap-4 flex-shrink-0 bg-white dark:bg-slate-950 sticky top-0 z-20 shadow-sm border-b border-slate-100 dark:border-slate-900/50">
                <button
                    onClick={() => props.onSubTabChange('calculator')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${props.activeSubTab === 'calculator' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-2">
                        <Icon svg={ICONS.chart} className="w-4 h-4" />
                        <span>Rentabilidad</span>
                    </div>
                </button>
                <button
                    onClick={() => props.onSubTabChange('production')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${props.activeSubTab === 'production' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <div className="flex items-center gap-2">
                        <Icon svg={ICONS.layers} className="w-4 h-4" />
                        <span>Producción (Batcher)</span>
                    </div>
                </button>
            </div>

            {/* Central Scrolling Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-7xl">
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

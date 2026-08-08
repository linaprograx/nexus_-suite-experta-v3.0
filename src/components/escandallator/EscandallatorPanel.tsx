import React, { useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe, StockItem } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import EscandalloTab from './EscandalloTab';
import BatcherTab from './BatcherTab';
import { BatcherResultado } from './BatcherResultado';

interface EscandallatorPanelProps {
    db: Firestore;
    appId: string;
    allRecipes: Recipe[];
    /** Necesario para el desglose de coste por ingrediente de Rentabilidad. */
    allIngredients?: any[];

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
    /** El resultado calculado. Sin esto el botón no producía ningún efecto visible. */
    batchResult?: any;
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

    /**
     * Coste real a partir del stock, **con cobertura parcial**.
     *
     * Tenía dos problemas encadenados:
     *
     * 1. Buscaba `s.ingredientId === ing.id`, pero la línea de receta guarda el
     *    identificador en `ingredientId`, no en `id`. `ing.id` era `undefined`
     *    siempre, así que **nunca encontraba stock** y el cartel "No disponible ·
     *    Falta Stock" salía en todas las recetas. No era cierto: la comparación
     *    no podía acertar.
     * 2. Era todo o nada: bastaba un ingrediente sin historial para ocultar el
     *    análisis entero. Con subrecetas —que no tienen `ingredientId`— eso pasa
     *    casi siempre.
     *
     * Ahora se suma lo que se conoce y se informa de **cuánto se conoce**. Un
     * dato parcial declarado como parcial vale más que un cartel que no dice
     * nada, y no obliga a fiarse de un número sin saber de dónde sale.
     */
    const { realCost, realCoverage } = useMemo(() => {
        if (!props.selectedRecipe || !props.selectedRecipe.ingredientes) return { realCost: 0, realCoverage: 0 };

        let totalRealCost = 0;
        let conDato = 0;
        let total = 0;

        props.selectedRecipe.ingredientes.forEach((ing: any) => {
            total++;
            const stockItem = props.stockItems.find(s => s.ingredientId === ing.ingredientId);

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

                const recipeQty = (typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : ing.cantidad) || 0;
                const recipeMultiplier = getMultiplier(ing.unidad);
                const recipeQtyBase = recipeQty * recipeMultiplier;

                totalRealCost += recipeQtyBase * metricPrice;
                conDato++;
            } else {
                // Sin historial de compra para esta línea: se cuenta su coste
                // teórico, para que el total siga siendo comparable, y se anota
                // que no está respaldada por compras reales.
                totalRealCost += Number((ing as any).costo) || 0;
            }
        });

        // Sin ninguna línea respaldada, el número no diría nada: se marca como
        // no disponible, igual que antes, pero ahora es una situación real.
        if (conDato === 0) return { realCost: -1, realCoverage: 0 };
        return { realCost: totalRealCost, realCoverage: total > 0 ? conDato / total : 0 };
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
                        <span>Batcher</span>
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
                            realCoverage={realCoverage}
                            allIngredients={props.allIngredients || []}
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
                    {props.activeSubTab === 'production' && (
                        <div className="mt-4">
                            <BatcherResultado resultado={props.batchResult} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscandallatorPanel;

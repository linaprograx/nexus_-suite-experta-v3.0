import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe } from '../../types';
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
}

const EscandallatorPanel: React.FC<EscandallatorPanelProps> = (props) => {
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

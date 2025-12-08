import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import StockManagerTab from '../../escandallator/StockManagerTab';

interface StockPowerProps {
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

export const StockPower: React.FC<StockPowerProps> = ({ allRecipes, allIngredients }) => {
    const [result, setResult] = React.useState<any[]>([]);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
            <StockManagerTab
                allRecipes={allRecipes}
                allIngredients={allIngredients}
                setShoppingList={setResult}
            />
            {result.length > 0 && (
                <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800/20 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-4 text-center">Lista de Compra Generada</h3>
                    <div className="space-y-2">
                        {result.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-orange-100/50 dark:border-orange-800/10 shadow-sm text-sm">
                                <div>
                                    <span className="font-medium text-slate-800 dark:text-slate-200 block">{item['Ingrediente']}</span>
                                    <span className="text-xs text-slate-400">{item['Unidades (Compra)']}</span>
                                </div>
                                <span className="font-bold text-orange-600 dark:text-orange-400">{item['Total (L/KG)']} L/Kg</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

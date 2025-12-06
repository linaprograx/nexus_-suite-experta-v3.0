import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { exportToCSV } from '../../utils/exportToCSV';

interface StockManagerTabProps {
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const StockManagerTab: React.FC<StockManagerTabProps> = ({ allRecipes, allIngredients }) => {
    const [ventaQuantities, setVentaQuantities] = React.useState<Record<string, string>>({});
    const [shoppingList, setShoppingList] = React.useState<{ 'Ingrediente': string; 'Total (L/KG)': string; 'Unidades (Compra)': string; 'Botellas a Pedir': number }[] | null>(null);

    const handleGenerate = () => {
        const totalIngredientNeeds: Record<string, number> = {};
        Object.entries(ventaQuantities).forEach(([recipeId, cocktailCountStr]) => {
            const cocktailCount = parseInt(cocktailCountStr);
            if (cocktailCount > 0) {
                allRecipes.find(r => r.id === recipeId)?.ingredientes?.forEach(ing => {
                    if (ing.ingredientId) {
                        totalIngredientNeeds[ing.ingredientId] = (totalIngredientNeeds[ing.ingredientId] || 0) + (ing.cantidad * cocktailCount);
                    }
                });
            }
        });

        const finalList = Object.entries(totalIngredientNeeds).map(([ingredientId, totalNeededMlG]) => {
            const ingredientInfo = allIngredients.find(ing => ing.id === ingredientId);
            if (!ingredientInfo) {
                return { 'Ingrediente': `ID Desconocido: ${ingredientId}`, 'Total (L/KG)': `${(totalNeededMlG / 1000).toFixed(2)}`, 'Unidades (Compra)': 'N/A', 'Botellas a Pedir': 0 };
            }

            const unit = ingredientInfo.standardUnit || (ingredientInfo.unidadCompra.toLowerCase().includes('kg') ? 'g' : 'ml');
            const standardQty = ingredientInfo.standardQuantity > 0 ? ingredientInfo.standardQuantity : (unit === 'ml' ? 700 : 1000);

            const bottlesToOrder = Math.ceil(totalNeededMlG / standardQty);
            const unitLabel = `${bottlesToOrder} x (${standardQty}${unit})`;

            return {
                'Ingrediente': ingredientInfo.nombre,
                'Total (L/KG)': (totalNeededMlG / 1000).toFixed(2),
                'Unidades (Compra)': unitLabel,
                'Botellas a Pedir': bottlesToOrder,
            };
        });
        setShoppingList(finalList);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mt-8">
            {/* Projection Card */}
            <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Paso 1: Proyección de Ventas</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Introduce el número de cócteles estimados</p>
                </div>

                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {allRecipes.map(recipe => (
                        <div key={recipe.id} className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
                            <Label htmlFor={`recipe-${recipe.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">{recipe.nombre}</Label>
                            <Input
                                id={`recipe-${recipe.id}`}
                                type="number"
                                className="w-24 h-9 bg-white/60 dark:bg-slate-800/60"
                                placeholder="0"
                                value={ventaQuantities[recipe.id] || ''}
                                onChange={e => setVentaQuantities(prev => ({ ...prev, [recipe.id]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20">
                    <Button onClick={handleGenerate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Icon svg={ICONS.box} className="mr-2 h-5 w-5" />Generar Pedido
                    </Button>
                </div>
            </div>

            {/* Shopping List Card */}
            <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Paso 2: Lista de Compra</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Resumen de ingredientes necesarios</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => shoppingList && exportToCSV(shoppingList, 'lista_compra')} disabled={!shoppingList} className="text-xs">
                        Exportar CSV
                    </Button>
                </div>

                <div className="p-4">
                    {!shoppingList ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Icon svg={ICONS.box} className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">La lista de compra aparecerá aquí</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ingrediente</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total (L/KG)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Unidades</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Botellas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {shoppingList.map((item, index) => (
                                        <tr key={index} className="hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item['Ingrediente']}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item['Total (L/KG)']}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item['Unidades (Compra)']}</td>
                                            <td className="px-4 py-3 font-bold text-lg text-emerald-700 dark:text-emerald-400">{item['Botellas a Pedir']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockManagerTab;


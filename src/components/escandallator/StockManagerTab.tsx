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
    setShoppingList: (list: any) => void;
}

const StockManagerTab: React.FC<StockManagerTabProps> = ({ allRecipes, allIngredients, setShoppingList }) => {
    const [ventaQuantities, setVentaQuantities] = React.useState<Record<string, string>>({});

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
        <div className="flex flex-col gap-6 max-w-4xl mx-auto mt-4 pb-20">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <Icon svg={ICONS.box} className="w-6 h-6 text-emerald-600" />
                    Gestor de Stock
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Proyecta tus necesidades de compra</p>
            </div>

            {/* Step 1: Projection Inputs */}
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border-0 shadow-premium overflow-hidden">
                <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">1. Proyección de Ventas</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Estima cantidades por cóctel</p>
                    </div>
                    <Button onClick={handleGenerate} className="bg-lime-600 hover:bg-lime-700 text-white shadow-premium rounded-xl">
                        <Icon svg={ICONS.calculator} className="mr-2 h-4 w-4" />Generar Pedido
                    </Button>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {allRecipes.map(recipe => (
                        <div key={recipe.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/10 dark:border-white/5 hover:border-emerald-500/50 transition-all">
                            <Label htmlFor={`recipe-${recipe.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">{recipe.nombre}</Label>
                            <div className="relative w-24">
                                <Input
                                    id={`recipe-${recipe.id}`}
                                    type="number"
                                    className="h-9 pr-8 text-right bg-white dark:bg-slate-900 border-white/20"
                                    placeholder="0"
                                    value={ventaQuantities[recipe.id] || ''}
                                    onChange={e => setVentaQuantities(prev => ({ ...prev, [recipe.id]: e.target.value }))}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">ud</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StockManagerTab;


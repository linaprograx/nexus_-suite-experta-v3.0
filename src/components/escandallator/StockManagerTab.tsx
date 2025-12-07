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
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">1. Proyección de Ventas</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Estima cantidades por cóctel</p>
                    </div>
                    <Button onClick={handleGenerate} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
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

            {/* Step 2: Shopping List Results */}
            {shoppingList && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Lista de Compra Generada</h3>
                        <Button variant="outline" size="sm" onClick={() => exportToCSV(shoppingList, 'lista_compra')} className="text-xs bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80">
                            <Icon svg={ICONS.fileText} className="mr-2 h-4 w-4" /> Exportar CSV
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {shoppingList.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Icon svg={ICONS.box} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{item['Ingrediente']}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Necesario: {item['Total (L/KG)']} L/Kg</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {item['Botellas a Pedir']}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        {item['Unidades (Compra)'].replace(/^[0-9]+ x /, '')} / ud
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!shoppingList && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                    <Icon svg={ICONS.list} className="w-12 h-12 mb-3" />
                    <p className="text-sm">Configura la proyección arriba para ver resultados</p>
                </div>
            )}
        </div>
    );
};

export default StockManagerTab;


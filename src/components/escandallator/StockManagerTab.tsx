import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-fit">
                <CardHeader><CardTitle>Paso 1: Proyección de Ventas</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {allRecipes.map(recipe => (
                         <div key={recipe.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary">
                            <Label htmlFor={`recipe-${recipe.id}`}>{recipe.nombre}</Label>
                            <Input 
                                id={`recipe-${recipe.id}`}
                                type="number"
                                className="w-24"
                                placeholder="Nº Cócteles"
                                value={ventaQuantities[recipe.id] || ''}
                                onChange={e => setVentaQuantities(prev => ({...prev, [recipe.id]: e.target.value}))}
                            />
                        </div>
                    ))}
                </CardContent>
                 <CardFooter><Button onClick={handleGenerate} className="w-full"><Icon svg={ICONS.box} className="mr-2 h-5 w-5" />Generar Pedido</Button></CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Paso 2: Lista de Compra</CardTitle> <Button variant="outline" size="sm" onClick={() => shoppingList && exportToCSV(shoppingList, 'lista_compra')}>Exportar CSV</Button></CardHeader>
                <CardContent>
                    {!shoppingList ? <p className="text-muted-foreground">La lista de compra aparecerá aquí.</p> :
                    (<table className="w-full text-sm text-left"><thead className="text-xs uppercase bg-secondary"><tr><th className="px-6 py-3">Ingrediente</th><th className="px-6 py-3">Total (L/KG)</th><th className="px-6 py-3">Unidades (Compra)</th><th className="px-6 py-3">Botellas</th></tr></thead><tbody>{shoppingList.map((item, index) => (<tr key={index} className="border-b"><td className="px-6 py-4 font-medium">{item['Ingrediente']}</td><td className="px-6 py-4">{item['Total (L/KG)']}</td><td className="px-6 py-4">{item['Unidades (Compra)']}</td><td className="px-6 py-4 font-bold text-lg text-primary">{item['Botellas a Pedir']}</td></tr>))}</tbody></table>)}
                </CardContent>
            </Card>
        </div>
    );
};

export default StockManagerTab;

import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe, Ingredient } from '../../../types';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import EscandalloSummaryCard from './EscandalloSummaryCard';
import EscandalloHistorySidebar from './EscandalloHistorySidebar';

interface EscandalloTabProps {
    db: Firestore;
    userId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}

const EscandalloTab: React.FC<EscandalloTabProps> = ({ db, userId, allRecipes, allIngredients }) => {
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const [showHistory, setShowHistory] = React.useState(false);
    const escandallosColPath = `users/${userId}/escandallo-history`;

    const handleSaveToHistory = async (reportData: any) => {
        if (!selectedRecipe) return;
        
        const { baseImponible, ...dataToSave} = reportData;
        const newEscandallo = {
            recipeId: selectedRecipe.id,
            recipeName: selectedRecipe.nombre,
            ...dataToSave,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, escandallosColPath), newEscandallo);
        alert('Escandallo guardado en el historial.');
    };
    
    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-grow space-y-1 min-w-[200px]">
                            <Label htmlFor="recipe-select-esc">Seleccionar Receta</Label>
                            <Select id="recipe-select-esc" value={selectedRecipe?.id || ''} onChange={e => {
                                const recipe = allRecipes.find(r => r.id === e.target.value) || null;
                                setSelectedRecipe(recipe);
                                setPrecioVenta(recipe?.precioVenta || 0);
                            }}>
                                <option value="">Seleccionar...</option>
                                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pvp-input">Precio de Venta (PVP)</Label>
                            <Input id="pvp-input" type="number" placeholder="Ej: 12.50" value={precioVenta || ''} onChange={e => setPrecioVenta(parseFloat(e.target.value) || 0)} />
                        </div>
                        <Button variant="outline" onClick={() => setShowHistory(true)}>Ver Historial</Button>
                    </div>
                </CardContent>
            </Card>

            {selectedRecipe && precioVenta > 0 ? (() => {
                const IVA_RATE = 0.21;
                const costo = selectedRecipe.costoReceta || 0;
                const baseImponible = precioVenta > 0 ? precioVenta / (1 + IVA_RATE) : 0;
                const ivaSoportado = precioVenta - baseImponible;
                const margenBruto = baseImponible - costo;
                const rentabilidad = baseImponible > 0 ? (margenBruto / baseImponible) * 100 : 0;
                const reportData = { costo, precioVenta, baseImponible, ivaSoportado, margenBruto, rentabilidad };

                const pieData = [{ name: 'Costo', value: reportData.costo }, { name: 'Margen', value: reportData.margenBruto }, { name: 'IVA', value: reportData.ivaSoportado }];

                return (
                    <EscandalloSummaryCard
                        recipeName={selectedRecipe.nombre}
                        reportData={reportData}
                        pieData={pieData}
                        onSaveHistory={handleSaveToHistory}
                        onExport={() => window.print()}
                    />
                );
            })() : (
                <Card className="flex-1 flex items-center justify-center min-h-[300px]"><CardContent className="p-4 text-center text-muted-foreground"><p>Selecciona una receta e introduce un PVP.</p></CardContent></Card>
            )}
            {showHistory && <EscandalloHistorySidebar db={db} escandallosColPath={escandallosColPath} onLoadHistory={(item) => { setSelectedRecipe(allRecipes.find(r => r.id === item.recipeId) || null); setPrecioVenta(item.precioVenta); setShowHistory(false); }} onClose={() => setShowHistory(false)} />}
        </div>
    );
};

export default EscandalloTab;

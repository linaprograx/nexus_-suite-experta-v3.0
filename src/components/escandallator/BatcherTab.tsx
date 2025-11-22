import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';

interface BatcherTabProps {
    db: Firestore;
    appId: string;
    allRecipes: Recipe[];
}

const BatcherTab: React.FC<BatcherTabProps> = ({ db, appId, allRecipes }) => {
    const [batchSelectedRecipeId, setBatchSelectedRecipeId] = React.useState('');
    const [targetQuantityStr, setTargetQuantityStr] = React.useState('1');
    const [targetUnit, setTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [includeDilution, setIncludeDilution] = React.useState(false);
    const [batchResult, setBatchResult] = React.useState<{ ingredient: string; originalQty: string; batchQty: string; }[] | null>(null);

    const handleCalculateBatch = () => {
        const recipe = allRecipes.find(r => r.id === batchSelectedRecipeId);
        const targetQuantity = parseFloat(targetQuantityStr);

        if (!recipe || !recipe.ingredientes || !targetQuantity || targetQuantity <= 0) {
            setBatchResult(null);
            return;
        };

        const originalVolume = recipe.ingredientes.reduce((acc, ing) => { if (ing.unidad === 'ml' || ing.unidad === 'g') return acc + ing.cantidad; return acc; }, 0);
        if (originalVolume === 0) return;

        const BOTTLE_SIZE_ML = 700;
        const targetVolumeMl = targetUnit === 'Litros' ? targetQuantity * 1000 : targetQuantity * BOTTLE_SIZE_ML;
        const scalingFactor = targetVolumeMl / originalVolume;

        const newBatchData = recipe.ingredientes.map(ing => ({ ingredient: ing.nombre, originalQty: `${ing.cantidad} ${ing.unidad}`, batchQty: `${(ing.cantidad * scalingFactor).toFixed(1)} ml` }));

        if (includeDilution) {
            newBatchData.push({ ingredient: 'Agua (Dilución 20%)', originalQty: '-', batchQty: `${(targetVolumeMl * 0.20).toFixed(1)} ml` });
        }
        setBatchResult(newBatchData);
    };
    
    const handleSaveToPizarron = async () => {
        const recipeName = allRecipes.find(r => r.id === batchSelectedRecipeId)?.nombre;
        const taskContent = `[Batch] Producir ${targetQuantityStr} ${targetUnit} de ${recipeName}. Dilución: ${includeDilution ? 'Sí' : 'No'}`;
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent, status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Tarea de batch guardada en el Pizarrón.");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Batcher: Producción Masiva</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1 space-y-1">
                            <Label htmlFor="batch-recipe">Receta</Label>
                            <Select id="batch-recipe" value={batchSelectedRecipeId} onChange={e => setBatchSelectedRecipeId(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-grow space-y-1"><Label htmlFor="batch-qty">Cantidad</Label><Input id="batch-qty" type="number" value={targetQuantityStr} onChange={e => setTargetQuantityStr(e.target.value)} min="1" /></div>
                            <div className="space-y-1"><Label htmlFor="batch-unit">Unidad</Label><Select id="batch-unit" value={targetUnit} onChange={e => setTargetUnit(e.target.value as any)}><option>Litros</option><option>Botellas</option></Select></div>
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                            <Checkbox id="dilution" checked={includeDilution} onChange={e => setIncludeDilution(e.target.checked)} />
                            <Label htmlFor="dilution">Incluir Dilución (20%)</Label>
                        </div>
                    </div>
                     <Button onClick={handleCalculateBatch} disabled={!batchSelectedRecipeId} className="w-full"><Icon svg={ICONS.layers} className="mr-2 h-5 w-5" />Calcular Batch</Button>
                </CardContent>
            </Card>
            {batchResult && (
                 <Card>
                    <div id="print-section">
                        <CardHeader>
                            <CardTitle>Hoja de Producción: {allRecipes.find(r => r.id === batchSelectedRecipeId)?.nombre}</CardTitle>
                            <CardDescription>Objetivo: {targetQuantityStr} {targetUnit}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm text-left"><thead className="text-xs uppercase bg-secondary"><tr><th className="px-6 py-3">Ingrediente</th><th className="px-6 py-3">Cant. Original</th><th className="px-6 py-3">Cant. Batch</th></tr></thead><tbody>{batchResult.map((row, index) => (<tr key={index} className="border-b"><td className="px-6 py-4 font-medium">{row.ingredient}</td><td className="px-6 py-4">{row.originalQty}</td><td className="px-6 py-4">{row.batchQty}</td></tr>))}</tbody></table>
                        </CardContent>
                    </div>
                    <CardFooter className="gap-2"><Button variant="outline" onClick={() => window.print()} className="no-print">Imprimir</Button><Button variant="secondary" onClick={handleSaveToPizarron} className="no-print">Guardar en Pizarrón</Button></CardFooter>
                 </Card>
            )}
        </div>
    );
};

export default BatcherTab;

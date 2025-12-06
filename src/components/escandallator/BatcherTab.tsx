import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe } from '../../../types';
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
        <div className="space-y-6 max-w-3xl mx-auto mt-8">
            {/* Configuration Card */}
            <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 p-6 shadow-sm">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100">Batcher: Producción Masiva</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Calcula ingredientes para producción a gran escala</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="batch-recipe" className="text-base">Receta</Label>
                        <Select id="batch-recipe" value={batchSelectedRecipeId} onChange={e => setBatchSelectedRecipeId(e.target.value)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50">
                            <option value="">-- Seleccionar --</option>
                            {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch-qty" className="text-base">Cantidad</Label>
                            <Input id="batch-qty" type="number" value={targetQuantityStr} onChange={e => setTargetQuantityStr(e.target.value)} min="1" className="h-12 text-lg bg-white/50 dark:bg-slate-800/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch-unit" className="text-base">Unidad</Label>
                            <Select id="batch-unit" value={targetUnit} onChange={e => setTargetUnit(e.target.value as any)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50">
                                <option>Litros</option>
                                <option>Botellas</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="dilution" checked={includeDilution} onChange={e => setIncludeDilution(e.target.checked)} />
                        <Label htmlFor="dilution" className="text-sm">Incluir Dilución (20%)</Label>
                    </div>

                    <Button onClick={handleCalculateBatch} disabled={!batchSelectedRecipeId} className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Icon svg={ICONS.layers} className="mr-2 h-5 w-5" />Calcular Batch
                    </Button>
                </div>
            </div>

            {/* Results Table */}
            {batchResult && (
                <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Hoja de Producción: {allRecipes.find(r => r.id === batchSelectedRecipeId)?.nombre}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Objetivo: {targetQuantityStr} {targetUnit}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ingrediente</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cant. Original</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Cant. Batch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {batchResult.map((row, index) => (
                                    <tr key={index} className="hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{row.ingredient}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.originalQty}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-700 dark:text-emerald-400">{row.batchQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-white/10 dark:border-white/5 flex gap-2 bg-white/30 dark:bg-slate-900/20">
                        <Button variant="outline" onClick={() => window.print()} className="flex-1">Imprimir</Button>
                        <Button variant="secondary" onClick={handleSaveToPizarron} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Guardar en Pizarrón</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatcherTab;


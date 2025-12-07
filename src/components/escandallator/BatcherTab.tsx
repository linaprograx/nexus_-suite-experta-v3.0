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
        <div className="flex flex-col gap-6 max-w-4xl mx-auto mt-4 pb-20">
            <div className="text-center">
                <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <Icon svg={ICONS.layers} className="w-6 h-6 text-emerald-600" />
                    Batcher
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Calculadora de producción masiva</p>
            </div>

            {/* Configuration Card */}
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 p-6 shadow-sm">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="batch-recipe" className="text-base font-medium text-slate-700 dark:text-slate-300">Seleccionar Receta</Label>
                        <Select id="batch-recipe" value={batchSelectedRecipeId} onChange={e => setBatchSelectedRecipeId(e.target.value)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20">
                            <option value="">-- Elige un cóctel --</option>
                            {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch-qty" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad Objetivo</Label>
                            <Input id="batch-qty" type="number" value={targetQuantityStr} onChange={e => setTargetQuantityStr(e.target.value)} min="0.1" step="0.1" className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch-unit" className="text-sm font-medium text-slate-700 dark:text-slate-300">Unidad</Label>
                            <Select id="batch-unit" value={targetUnit} onChange={e => setTargetUnit(e.target.value as any)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20">
                                <option value="Litros">Litros (L)</option>
                                <option value="Botellas">Botellas (700ml)</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/20">
                        <Checkbox id="dilution" checked={includeDilution} onChange={e => setIncludeDilution(e.target.checked)} className="border-emerald-500 text-emerald-600 focus:ring-emerald-500" />
                        <Label htmlFor="dilution" className="text-sm cursor-pointer select-none text-slate-700 dark:text-slate-300">Incluir Dilución (20% Agua)</Label>
                    </div>

                    <Button onClick={handleCalculateBatch} disabled={!batchSelectedRecipeId} className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]">
                        <Icon svg={ICONS.calculator} className="mr-2 h-5 w-5" />Calcular Producción
                    </Button>
                </div>
            </div>

            {/* Results */}
            {batchResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Resultados del Batch</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total: {targetQuantityStr} {targetUnit}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-white/50 border-white/20">
                                <Icon svg={ICONS.copy} className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={handleSaveToPizarron} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Icon svg={ICONS.check} className="mr-2 w-4 h-4" /> Guardar
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {batchResult.map((row, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{row.ingredient}</span>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.batchQty}</span>
                                    <span className="text-xs text-slate-400 block">Base: {row.originalQty}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!batchResult && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                    <Icon svg={ICONS.beaker} className="w-12 h-12 mb-3" />
                    <p className="text-sm">Selecciona una receta para calcular</p>
                </div>
            )}
        </div>
    );
};

export default BatcherTab;


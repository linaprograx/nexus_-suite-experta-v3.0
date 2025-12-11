import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe } from '../../types';
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
    setBatchResult: (result: any) => void;
}

const BatcherTab: React.FC<BatcherTabProps> = ({ db, appId, allRecipes, setBatchResult }) => {
    const [batchSelectedRecipeId, setBatchSelectedRecipeId] = React.useState('');
    const [targetQuantityStr, setTargetQuantityStr] = React.useState('1');
    const [targetUnit, setTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [includeDilution, setIncludeDilution] = React.useState(false);

    const handleCalculateBatch = () => {
        if (!allRecipes || allRecipes.length === 0) {
            console.warn("Batcher: No recipes available to calculate.");
            return;
        }

        const recipe = allRecipes.find(r => r.id === batchSelectedRecipeId);
        const targetQuantity = parseFloat(targetQuantityStr);

        if (!recipe || !recipe.ingredientes || !targetQuantity || targetQuantity <= 0) {
            setBatchResult(null);
            return;
        };

        // Calculate original volume (approx)
        const originalVolume = recipe.ingredientes.reduce((acc, ing) => {
            // Only count liquids/measurable solids to some extent
            if (ing.unidad === 'ml' || ing.unidad === 'g' || ing.unidad === 'cl' || ing.unidad === 'oz') {
                let qty = ing.cantidad;
                if (ing.unidad === 'cl') qty *= 10;
                if (ing.unidad === 'oz') qty *= 30; // Approx
                return acc + qty;
            }
            return acc;
        }, 0);

        if (originalVolume === 0) {
            // Fallback if no volume found, maybe just scale by 1 (or error?)
            // For now, let's assume if 0, we can't scale by volume properly, 
            // but usually there's liquid. Let's warn.
            console.warn("Batcher: Original volume is 0, cannot scale.");
            return;
        }

        const BOTTLE_SIZE_ML = 700;
        const targetVolumeMl = targetUnit === 'Litros' ? targetQuantity * 1000 : targetQuantity * BOTTLE_SIZE_ML;
        const scalingFactor = targetVolumeMl / originalVolume;

        const newBatchData = recipe.ingredientes.map(ing => ({
            ingredient: ing.nombre,
            originalQty: `${ing.cantidad} ${ing.unidad}`,
            batchQty: `${(ing.cantidad * scalingFactor).toFixed(1)} ${ing.unidad === 'oz' ? 'oz' : 'ml'}` // Normalized to ml roughly, or keep unit? 
            // actually usually batch is in ml. Let's keep it simplifiel.
        }));

        // Re-map with simpler logic for the view
        const finalBatchData = recipe.ingredientes.map(ing => {
            let amount = ing.cantidad;
            if (ing.unidad === 'cl') amount *= 10;
            if (ing.unidad === 'oz') amount *= 30;

            // If it's a dash/twist, maybe just multiply count? 
            // For now assuming scaler logic relies on liquid volume mostly.

            return {
                ingredient: ing.nombre,
                originalQty: `${ing.cantidad} ${ing.unidad}`,
                batchQty: (ing.unidad === 'ml' || ing.unidad === 'cl' || ing.unidad === 'oz' || ing.unidad === 'g')
                    ? `${(amount * scalingFactor).toFixed(0)} ml`
                    : `${(ing.cantidad * scalingFactor).toFixed(1)} ${ing.unidad}`
            };
        });

        if (includeDilution) {
            finalBatchData.push({ ingredient: 'Agua (Dilución 20%)', originalQty: '-', batchQty: `${(targetVolumeMl * 0.20).toFixed(0)} ml` });
        }

        // Pass result up including metadata for saving
        setBatchResult({
            data: finalBatchData,
            meta: {
                recipeId: recipe.id,
                recipeName: recipe.nombre,
                targetQuantity: targetQuantityStr,
                targetUnit,
                includeDilution
            }
        });
    };

    return (
        <div className="h-full flex flex-col w-full max-w-full p-4 overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Icon svg={ICONS.layers} className="w-8 h-8 text-emerald-600" />
                    Batcher
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Calculadora de producción masiva</p>
            </div>

            {/* Configuration Card */}
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border-0 shadow-premium p-8 w-full">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="batch-recipe" className="text-base font-medium text-slate-700 dark:text-slate-300">Seleccionar Receta</Label>
                        <Select id="batch-recipe" value={batchSelectedRecipeId} onChange={e => setBatchSelectedRecipeId(e.target.value)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20 w-full">
                            <option value="">-- Elige un cóctel --</option>
                            {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                        <div className="space-y-2 w-full">
                            <Label htmlFor="batch-qty" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad Objetivo</Label>
                            <Input id="batch-qty" type="number" value={targetQuantityStr} onChange={e => setTargetQuantityStr(e.target.value)} min="0.1" step="0.1" className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20 w-full" />
                        </div>
                        <div className="space-y-2 w-full">
                            <Label htmlFor="batch-unit" className="text-sm font-medium text-slate-700 dark:text-slate-300">Unidad</Label>
                            <Select id="batch-unit" value={targetUnit} onChange={e => setTargetUnit(e.target.value as any)} className="h-12 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-white/20 w-full">
                                <option value="Litros">Litros (L)</option>
                                <option value="Botellas">Botellas (700ml)</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/20 w-full">
                        <Checkbox id="dilution" checked={includeDilution} onChange={e => setIncludeDilution(e.target.checked)} className="border-amber-500 text-amber-600 focus:ring-amber-500" />
                        <Label htmlFor="dilution" className="text-sm cursor-pointer select-none text-slate-700 dark:text-slate-300">Incluir Dilución (20% Agua)</Label>
                    </div>

                    <Button onClick={handleCalculateBatch} disabled={!batchSelectedRecipeId} className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl px-6 py-3 shadow-md transition hover:shadow-lg">
                        <Icon svg={ICONS.calculator} className="mr-2 h-5 w-5" />Calcular Producción
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BatcherTab;


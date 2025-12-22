import React from 'react';
import { Firestore } from 'firebase/firestore';
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
    // Lifted State Props
    selectedRecipeId: string;
    targetQuantity: string;
    targetUnit: 'Litros' | 'Botellas';
    includeDilution: boolean;
    onRecipeChange: (id: string) => void;
    onQuantityChange: (qty: string) => void;
    onUnitChange: (unit: 'Litros' | 'Botellas') => void;
    onDilutionChange: (checked: boolean) => void;
}

const BatcherTab: React.FC<BatcherTabProps> = ({
    allRecipes, setBatchResult,
    selectedRecipeId, targetQuantity, targetUnit, includeDilution,
    onRecipeChange, onQuantityChange, onUnitChange, onDilutionChange
}) => {

    const handleCalculateBatch = () => {
        if (!allRecipes || allRecipes.length === 0) {
            console.warn("Batcher: No recipes available to calculate.");
            return;
        }

        const recipe = allRecipes.find(r => r.id === selectedRecipeId);

        if (!recipe || !recipe.ingredientes || !targetQuantity || parseFloat(targetQuantity) <= 0) {
            setBatchResult(null);
            return;
        };

        // Calculate original volume (approx)
        const originalVolume = recipe.ingredientes.reduce((acc, ing) => {
            if (ing.unidad === 'ml' || ing.unidad === 'g' || ing.unidad === 'cl' || ing.unidad === 'oz') {
                let qty = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : ing.cantidad;
                if (ing.unidad === 'cl') qty *= 10;
                if (ing.unidad === 'oz') qty *= 30; // Approx
                return acc + qty;
            }
            return acc;
        }, 0);

        if (originalVolume === 0) {
            console.warn("Batcher: Original volume is 0, cannot scale.");
            return;
        }

        const BOTTLE_SIZE_ML = 700;
        const targetVolumeMl = targetUnit === 'Litros' ? parseFloat(targetQuantity) * 1000 : parseFloat(targetQuantity) * BOTTLE_SIZE_ML;
        const scalingFactor = targetVolumeMl / originalVolume;

        const finalBatchData = recipe.ingredientes.map(ing => {
            let amount = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : ing.cantidad;
            if (ing.unidad === 'cl') amount *= 10;
            if (ing.unidad === 'oz') amount *= 30;

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

        setBatchResult({
            data: finalBatchData,
            meta: {
                recipeId: recipe.id,
                recipeName: recipe.nombre,
                targetQuantity: targetQuantity,
                targetUnit,
                includeDilution
            }
        });
    };

    return (
        <div className="flex flex-col space-y-8 w-full animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <Icon svg={ICONS.layers} className="w-8 h-8 text-amber-500" />
                    Batcher
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Calculadora de producción masiva</p>
            </div>

            {/* Configuration Card */}
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 w-full transition-all">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="batch-recipe" className="text-base font-medium text-slate-700 dark:text-slate-300">Seleccionar Receta</Label>
                        <Select
                            id="batch-recipe"
                            value={selectedRecipeId}
                            onChange={e => onRecipeChange(e.target.value)}
                            className="h-14 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700 w-full"
                        >
                            <option value="">-- Elige un cóctel --</option>
                            {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-3 w-full">
                            <Label htmlFor="batch-qty" className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad Objetivo</Label>
                            <Input
                                id="batch-qty"
                                type="number"
                                value={targetQuantity}
                                onChange={e => onQuantityChange(e.target.value)}
                                min="0.1"
                                step="0.1"
                                className="h-14 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700 w-full"
                            />
                        </div>
                        <div className="space-y-3 w-full">
                            <Label htmlFor="batch-unit" className="text-sm font-medium text-slate-700 dark:text-slate-300">Unidad</Label>
                            <Select
                                id="batch-unit"
                                value={targetUnit}
                                onChange={e => onUnitChange(e.target.value as any)}
                                className="h-14 text-lg bg-white/50 dark:bg-slate-800/50 rounded-xl border-slate-200 dark:border-slate-700 w-full"
                            >
                                <option value="Litros">Litros (L)</option>
                                <option value="Botellas">Botellas (700ml)</option>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/20 w-full">
                        <Checkbox
                            id="dilution"
                            checked={includeDilution}
                            onChange={e => onDilutionChange(e.target.checked)}
                            className="w-5 h-5 border-amber-500 text-amber-600 focus:ring-amber-500 rounded"
                        />
                        <Label htmlFor="dilution" className="text-base cursor-pointer select-none text-slate-700 dark:text-slate-300">Incluir Dilución (20% Agua)</Label>
                    </div>

                    <Button
                        onClick={handleCalculateBatch}
                        disabled={!selectedRecipeId}
                        className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 shadow-md transition hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <Icon svg={ICONS.calculator} className="mr-2 h-6 w-6" />
                        Calcular Producción
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BatcherTab;

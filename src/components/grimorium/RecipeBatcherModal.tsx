import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Recipe } from '../../types';
import PremiumButton from '../../ui/mobile/components/PremiumButton';

interface RecipeBatcherModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}

export const RecipeBatcherModal: React.FC<RecipeBatcherModalProps> = ({ isOpen, onClose, recipe }) => {
    const [targetQuantity, setTargetQuantity] = useState('1');
    const [targetUnit, setTargetUnit] = useState<'Litros' | 'Botellas'>('Litros');
    const [includeDilution, setIncludeDilution] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const batchData = useMemo(() => {
        if (!recipe.ingredientes || !targetQuantity || parseFloat(targetQuantity) <= 0) return null;

        // Calculate original volume (approx)
        const originalVolume = recipe.ingredientes.reduce((acc, ing) => {
            if (ing.unidad === 'ml' || ing.unidad === 'g' || ing.unidad === 'cl' || ing.unidad === 'oz') {
                let qty = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : (ing.cantidad || 0);
                if (ing.unidad === 'cl') qty *= 10;
                if (ing.unidad === 'oz') qty *= 30; // Approx
                return acc + qty;
            }
            return acc;
        }, 0);

        if (originalVolume === 0) return null;

        const BOTTLE_SIZE_ML = 700;
        const targetVolumeMl = targetUnit === 'Litros' ? parseFloat(targetQuantity) * 1000 : parseFloat(targetQuantity) * BOTTLE_SIZE_ML;
        const scalingFactor = targetVolumeMl / originalVolume;

        const results = recipe.ingredientes.map(ing => {
            let amount = typeof ing.cantidad === 'string' ? parseFloat(ing.cantidad) : (ing.cantidad || 0);
            let unitMultiplier = 1;
            if (ing.unidad === 'cl') unitMultiplier = 10;
            if (ing.unidad === 'oz') unitMultiplier = 30;

            const baseMl = amount * unitMultiplier;
            const scaledMl = baseMl * scalingFactor;

            return {
                name: ing.nombre,
                original: `${ing.cantidad || 0} ${ing.unidad}`,
                result: (ing.unidad === 'ml' || ing.unidad === 'cl' || ing.unidad === 'oz' || ing.unidad === 'g')
                    ? `${scaledMl.toFixed(0)} ml`
                    : `${((ing.cantidad || 0) * scalingFactor).toFixed(1)} ${ing.unidad}`
            };
        });

        if (includeDilution) {
            results.push({
                name: 'Agua (Dilución 20%)',
                original: '-',
                result: `${(targetVolumeMl * 0.20).toFixed(0)} ml`
            });
        }

        return results;
    }, [recipe, targetQuantity, targetUnit, includeDilution]);

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500">bolt</span>
                    <span>Batcher: {recipe.nombre}</span>
                </div>
            }
        >
            <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar p-2">
                {!showResults ? (
                    <div className="space-y-6">
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                            <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                                Calcula las cantidades necesarias para una producción masiva.
                                Ingresa el volumen final deseado.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Cantidad Objetivo</label>
                                <Input
                                    type="number"
                                    value={targetQuantity}
                                    onChange={(e) => setTargetQuantity(e.target.value)}
                                    className="h-14 text-lg font-black bg-zinc-50 border-zinc-200 rounded-2xl"
                                    placeholder="Ej: 5"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Unidad</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Litros', 'Botellas'] as const).map(unit => (
                                        <button
                                            key={unit}
                                            onClick={() => setTargetUnit(unit)}
                                            className={`py-3 rounded-xl font-bold text-xs transition-all ${targetUnit === unit
                                                ? 'bg-orange-600 text-white shadow-lg'
                                                : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                                }`}
                                        >
                                            {unit === 'Botellas' ? 'Botellas (700ml)' : 'Litros'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-700">Dilución (20%)</span>
                                    <span className="text-[10px] text-zinc-400">Incluir agua para simular el batido</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={includeDilution}
                                    onChange={(e) => setIncludeDilution(e.target.checked)}
                                    className="w-6 h-6 rounded-lg border-zinc-300 text-orange-600 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        <PremiumButton
                            variant="gradient"
                            module="grimorioRecipes"
                            fullWidth
                            size="lg"
                            className="h-14 mt-4"
                            onClick={() => setShowResults(true)}
                            disabled={!targetQuantity || parseFloat(targetQuantity) <= 0}
                        >
                            CALCULAR PRODUCCIÓN
                        </PremiumButton>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-black text-zinc-900 leading-none">Resultados</h4>
                                <p className="text-xs text-zinc-500 mt-1">Para {targetQuantity} {targetUnit.toLowerCase()}</p>
                            </div>
                            <button
                                onClick={() => setShowResults(false)}
                                className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200"
                            >
                                Reconfigurar
                            </button>
                        </div>

                        <div className="space-y-2">
                            {batchData?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-slate-900 rounded-2xl border border-zinc-100 dark:border-slate-800">
                                    <div className="flex flex-col max-w-[60%]">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">{item.name}</span>
                                        <span className="text-[9px] text-zinc-400 uppercase tracking-tighter">Original: {item.original}</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-600 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-slate-700 shadow-sm">{item.result}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button variant="ghost" className="h-12 rounded-xl flex-1" onClick={onClose}>Cerrar</Button>
                            <PremiumButton
                                variant="gradient"
                                module="grimorioRecipes"
                                fullWidth
                                className="h-12 rounded-xl"
                                onClick={() => {
                                    window.print(); // Basic share/print for now
                                }}
                                icon={<span className="material-symbols-outlined !text-sm">print</span>}
                            >
                                IMPRIMIR
                            </PremiumButton>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

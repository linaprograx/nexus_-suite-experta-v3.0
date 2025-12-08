import React, { useState, useEffect } from 'react';
import { PizarronTask } from '../../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';
import { collection, query, onSnapshot, Firestore } from 'firebase/firestore';

interface RecipeBuilderProps {
    task: PizarronTask;
    onUpdate: (data: any) => Promise<void>;
    onBack: () => void;
    appId: string;
    db: Firestore;
}

interface RecipeIngredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
}

export const RecipeBuilder: React.FC<RecipeBuilderProps> = ({ task, onUpdate, onBack, appId, db }) => {
    // Recipe Basic Info
    const [yieldAmount, setYieldAmount] = useState(task.recipe?.yield || 1);
    const [yieldUnit, setYieldUnit] = useState(task.recipe?.yieldUnit || 'porciones');
    const [prepTime, setPrepTime] = useState(task.recipe?.prepTime || 15);
    const [steps, setSteps] = useState<string[]>(task.recipe?.steps || ['']);

    // Ingredients
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(task.recipe?.ingredients || []);
    const [allIngredients, setAllIngredients] = useState<any[]>([]);

    // Fetch Reference Ingredients
    useEffect(() => {
        if (!db || !appId) return;
        const q = query(collection(db, `artifacts/${appId}/public/data/ingredients`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllIngredients(ings);
        });
        return () => unsubscribe();
    }, [db, appId]);

    // Sync with Linked Ingredients (from Main View)
    useEffect(() => {
        if (!task.linkedIngredients || allIngredients.length === 0) return;

        // Current assignments
        const currentIds = recipeIngredients.map(r => r.id);

        // Find new IDs that are linked but not in recipe
        const newIds = task.linkedIngredients.filter(id => !currentIds.includes(id));

        if (newIds.length === 0) return; // No changes needed

        const newItems = newIds.map(id => {
            const ref = allIngredients.find(i => i.id === id);
            return {
                id,
                name: ref?.nombre || 'Ingrediente Desconocido',
                quantity: 1,
                unit: ref?.unidad || 'ud'
            };
        });

        setRecipeIngredients(prev => [...prev, ...newItems]);

    }, [task.linkedIngredients, allIngredients]); // Run when linked list or ref data changes

    // Update quantity/unit for an item
    const updateIngredient = (index: number, field: 'quantity' | 'unit', value: any) => {
        const updated = [...recipeIngredients];
        updated[index] = { ...updated[index], [field]: value };
        setRecipeIngredients(updated);
    };

    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const addStep = () => setSteps([...steps, '']);
    const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

    const handleSave = async () => {
        await onUpdate({
            recipe: {
                yield: yieldAmount,
                yieldUnit,
                prepTime,
                steps: steps.filter(s => s.trim() !== ''),
                ingredients: recipeIngredients
            }
        });
        onBack();
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-slate-500 hover:text-slate-800">
                    <Icon svg={ICONS.arrowLeft} className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Icon svg={ICONS.book} className="w-5 h-5" />
                        Constructor de Recetas
                    </h3>
                </div>
                <Button onClick={handleSave} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                    Guardar
                </Button>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto px-1 custom-scrollbar">
                {/* 1. Basic Info */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-500 mb-1 block">Rendimiento</Label>
                            <div className="flex gap-2">
                                <Input type="number" value={yieldAmount} onChange={e => setYieldAmount(Number(e.target.value))} className="w-20 bg-white" />
                                <Input value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} placeholder="porciones" className="flex-1 bg-white" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 mb-1 block">Tiempo (mins)</Label>
                            <Input type="number" value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} className="bg-white" />
                        </div>
                    </div>
                </div>

                {/* 2. Ingredients Section (Synced) */}
                <div>
                    <Label className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                        <Icon svg={ICONS.leaf} className="w-4 h-4" />
                        Ingredientes Seleccionados
                    </Label>
                    <p className="text-xs text-slate-400 mb-3">
                        Selecciona los ingredientes en la pantalla principal para añadirlos aquí.
                    </p>

                    <div className="space-y-2">
                        {recipeIngredients.map((ing, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{ing.name}</span>
                                </div>
                                <div className="flex items-center gap-2 w-40">
                                    <Input
                                        type="number"
                                        value={ing.quantity}
                                        onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))}
                                        className="h-8 text-right"
                                    />
                                    <Input
                                        value={ing.unit}
                                        onChange={e => updateIngredient(i, 'unit', e.target.value)}
                                        className="h-8 w-16"
                                    />
                                </div>
                            </div>
                        ))}
                        {recipeIngredients.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-sm">
                                No hay ingredientes seleccionados. <br />
                                Vuelve atrás y selecciona ingredientes del Grimorium.
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Steps */}
                <div>
                    <Label className="text-sm font-bold text-slate-500 mb-3 block">Instrucciones</Label>
                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div key={index} className="flex gap-3 group">
                                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 flex items-center justify-center text-xs font-bold mt-2 shrink-0 border border-indigo-100 dark:border-indigo-800">
                                    {index + 1}
                                </div>
                                <textarea
                                    value={step}
                                    onChange={e => handleStepChange(index, e.target.value)}
                                    className="flex-1 min-h-[60px] p-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                                    placeholder={`Describe el paso ${index + 1}...`}
                                />
                                <button
                                    onClick={() => removeStep(index)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity self-center"
                                >
                                    <Icon svg={ICONS.trash} className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={addStep} className="mt-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <Icon svg={ICONS.plus} className="w-4 h-4 mr-2" />
                        Añadir Nuevo Paso
                    </Button>
                </div>
            </div>
        </div>
    );
};

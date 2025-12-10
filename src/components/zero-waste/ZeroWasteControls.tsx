import React from 'react';
import { Ingredient } from '../../../types';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface ZeroWasteControlsProps {
    allIngredients: Ingredient[];
    selectedIngredients: string[];
    rawIngredients: string;
    loading: boolean;
    onToggleIngredient: (name: string) => void;
    onRawIngredientsChange: (value: string) => void;
    onGenerate: () => void;
}

const ZeroWasteControls: React.FC<ZeroWasteControlsProps> = ({
    allIngredients,
    selectedIngredients,
    rawIngredients,
    loading,
    onToggleIngredient,
    onRawIngredientsChange,
    onGenerate
}) => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">The Lab Input</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Define tus descartes</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Grimorium Ingredients */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Desde Grimorium</Label>
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-2 border border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
                        {allIngredients.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2">No hay ingredientes disponibles.</p>
                        ) : (
                            <div className="space-y-1">
                                {allIngredients.map(ing => (
                                    <label key={ing.id} className="flex items-center gap-2 p-1.5 hover:bg-white/40 dark:hover:bg-slate-700/40 rounded-lg cursor-pointer transition-colors group">
                                        <Checkbox
                                            id={`zw-${ing.id}`}
                                            checked={selectedIngredients.includes(ing.nombre)}
                                            onChange={() => onToggleIngredient(ing.nombre)}
                                            className="data-[state=checked]:bg-cyan-500 border-slate-300 dark:border-slate-600"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {ing.nombre}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Raw Input */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Otros Descartes</Label>
                    <Textarea
                        value={rawIngredients}
                        onChange={e => onRawIngredientsChange(e.target.value)}
                        placeholder="Ej: Pieles de cítricos, restos de sirope, pulpa de fruta..."
                        className="bg-white/40 dark:bg-slate-800/40 border-white/10 focus:border-cyan-500 min-h-[100px] text-sm resize-none"
                    />
                </div>
            </div>

            <div className="p-4 border-t border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/20">
                <Button
                    onClick={onGenerate}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-premium rounded-xl"
                >
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <Icon svg={ICONS.recycle} className="w-4 h-4 mr-2" />}
                    Generar
                </Button>
            </div>
        </div>
    );
};

export default ZeroWasteControls;

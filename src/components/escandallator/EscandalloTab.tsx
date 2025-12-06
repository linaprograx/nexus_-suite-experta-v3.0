import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface EscandalloTabProps {
    allRecipes: Recipe[];
    selectedRecipe: Recipe | null;
    precioVenta: number;
    onSelectRecipe: (recipe: Recipe | null) => void;
    onPriceChange: (price: number) => void;
}

const EscandalloTab: React.FC<EscandalloTabProps> = ({
    allRecipes,
    selectedRecipe,
    precioVenta,
    onSelectRecipe,
    onPriceChange
}) => {

    return (
        <div className="space-y-6 max-w-2xl mx-auto mt-8">
            <Card className="bg-white/60 dark:bg-slate-900/30 backdrop-blur-sm border-white/20 dark:border-white/5 shadow-sm">
                <CardContent className="p-6 space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100">Calculadora de Rentabilidad</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona una receta y define su precio de venta</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipe-select-esc" className="text-base">Seleccionar Receta</Label>
                            <Select
                                id="recipe-select-esc"
                                value={selectedRecipe?.id || ''}
                                onChange={e => {
                                    const recipe = allRecipes.find(r => r.id === e.target.value) || null;
                                    onSelectRecipe(recipe);
                                }}
                                className="h-12 text-lg bg-white/50 dark:bg-slate-800/50"
                            >
                                <option value="">-- Seleccionar --</option>
                                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pvp-input" className="text-base">Precio de Venta (PVP)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                                <Input
                                    id="pvp-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={precioVenta || ''}
                                    onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                                    className="pl-8 h-12 text-lg font-medium bg-white/50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedRecipe && (
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 p-4 text-center">
                        <p className="text-sm text-slate-500 mb-1">Costo Receta</p>
                        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">€{selectedRecipe.costoReceta?.toFixed(2) || '0.00'}</p>
                    </Card>
                    <Card className="bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/30 p-4 text-center">
                        <p className="text-sm text-slate-500 mb-1">Ingredientes</p>
                        <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">{selectedRecipe.ingredientes?.length || 0}</p>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EscandalloTab;


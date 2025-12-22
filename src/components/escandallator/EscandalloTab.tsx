import React from 'react';
import { Recipe } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

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
        <div className="flex flex-col space-y-6 w-full animate-in fade-in duration-300">
            <Card className="bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 w-full shadow-none">
                <CardContent className="p-6 md:p-8 space-y-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100">Calculadora de Rentabilidad</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona una receta y define su precio de venta</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="recipe-select-esc" className="text-base font-medium text-slate-700 dark:text-slate-300">Seleccionar Receta</Label>
                            <Select
                                id="recipe-select-esc"
                                value={selectedRecipe?.id || ''}
                                onChange={e => {
                                    const recipe = allRecipes.find(r => r.id === e.target.value) || null;
                                    onSelectRecipe(recipe);
                                }}
                                className="h-14 text-lg bg-white/50 dark:bg-slate-800/50 w-full rounded-xl"
                            >
                                <option value="">-- Seleccionar --</option>
                                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="pvp-input" className="text-base font-medium text-slate-700 dark:text-slate-300">Precio de Venta (PVP)</Label>
                            <div className="relative w-full">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">€</span>
                                <Input
                                    id="pvp-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={precioVenta || ''}
                                    onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                                    className="pl-10 h-14 text-lg font-medium bg-white/50 dark:bg-slate-800/50 w-full rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedRecipe && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
                    <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 p-6 text-center w-full shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 mb-2 uppercase tracking-wide">Costo Receta</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-emerald-100">€{selectedRecipe.costoReceta?.toFixed(2) || '0.00'}</p>
                    </Card>
                    <Card className="bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/30 p-6 text-center w-full shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Ingredientes</p>
                        <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{selectedRecipe.ingredientes?.length || 0}</p>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EscandalloTab;

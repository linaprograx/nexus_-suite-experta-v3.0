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
    realCost?: number; // -1 if not available
}

const EscandalloTab: React.FC<EscandalloTabProps> = ({
    allRecipes,
    selectedRecipe,
    precioVenta,
    onSelectRecipe,
    onPriceChange,
    realCost = 0
}) => {

    return (
        <div className="flex flex-col space-y-6 w-full animate-in fade-in duration-300">
            <Card className="bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 w-full shadow-none">
                <CardContent className="p-6 md:p-8 space-y-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100">Calculadora de Rentabilidad</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Selecciona una receta y define su precio de venta</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipe-select-esc" className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Receta</Label>
                            <Select
                                id="recipe-select-esc"
                                value={selectedRecipe?.id || ''}
                                onChange={e => {
                                    const recipe = allRecipes.find(r => r.id === e.target.value) || null;
                                    onSelectRecipe(recipe);
                                }}
                                className="h-12 text-base bg-white/50 dark:bg-slate-800/50 w-full rounded-xl"
                            >
                                <option value="">-- Seleccionar --</option>
                                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pvp-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio de Venta (PVP)</Label>
                            <div className="relative w-full">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">€</span>
                                <Input
                                    id="pvp-input"
                                    type="number"
                                    placeholder="0.00"
                                    value={precioVenta || ''}
                                    onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                                    className="pl-10 h-12 text-base font-medium bg-white/50 dark:bg-slate-800/50 w-full rounded-xl tabular-nums"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedRecipe && (
                <div className="flex flex-col gap-4 w-full">
                    {/* COST COMPARISON CARD */}
                    <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-0 text-center w-full shadow-sm overflow-hidden flex flex-col backdrop-blur-sm">
                        <div className="grid grid-cols-2 h-full divide-x divide-slate-100 dark:divide-slate-800/50">
                            {/* THEORETICAL COST */}
                            <div className="p-4 flex flex-col justify-center items-center bg-slate-50/50 dark:bg-slate-800/20">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Coste Teórico</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                    €{selectedRecipe.costoReceta?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Mercado</p>
                            </div>

                            {/* REAL COST */}
                            <div className={`p-4 flex flex-col justify-center items-center relative overflow-hidden ${realCost === -1 ? 'bg-slate-100/50 dark:bg-slate-900/50' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}`}>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Coste Real</p>
                                {realCost !== -1 ? (
                                    <>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            €{realCost.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-emerald-500/70 mt-0.5">Basado en Stock</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg font-medium text-slate-400 italic">No disponible</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Falta Stock</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* PERFORMANCE CARD (Beneficio & Margen) */}
                    <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-0 text-center w-full shadow-sm overflow-hidden flex flex-col backdrop-blur-sm">
                        <div className="grid grid-cols-2 h-full divide-x divide-slate-100 dark:divide-slate-800/50">
                            {/* BENEFIT (Profit) */}
                            <div className="p-4 flex flex-col justify-center items-center relative">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Beneficio</p>
                                {precioVenta > 0 ? (
                                    <p className={`text-2xl font-bold tabular-nums ${(precioVenta - (realCost !== -1 ? realCost : selectedRecipe.costoReceta || 0)) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                                        €{(precioVenta - (realCost !== -1 ? realCost : selectedRecipe.costoReceta || 0)).toFixed(2)}
                                    </p>
                                ) : (
                                    <p className="text-lg font-medium text-slate-400 italic">--</p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {realCost !== -1 ? 'Por Unidad (Real)' : 'Por Unidad (Teórico)'}
                                </p>
                            </div>

                            {/* MARGIN (%) */}
                            <div className="p-4 flex flex-col justify-center items-center relative">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Margen</p>
                                {precioVenta > 0 ? (
                                    (() => {
                                        const costToUse = realCost !== -1 ? realCost : (selectedRecipe.costoReceta || 0);
                                        const margin = (precioVenta - costToUse) / precioVenta;
                                        return (
                                            <p className={`text-2xl font-bold tabular-nums ${margin >= 0.7 ? 'text-emerald-500' : margin >= 0.2 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {(margin * 100).toFixed(0)}%
                                            </p>
                                        );
                                    })()
                                ) : (
                                    <p className="text-lg font-medium text-slate-400 italic">--</p>
                                )}
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {realCost !== -1 ? 'Rentabilidad Real' : 'Rentabilidad Teórica'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EscandalloTab;

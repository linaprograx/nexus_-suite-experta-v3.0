import React from 'react';
import { Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { AromaticFamily } from '../../modules/ingredients/families';

const FAMILY_BG_COLORS: { [key in AromaticFamily]: string } = {
    'Citrus': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    'Fruits': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    'Herbs': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'Spices': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    'Floral': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'Vegetal': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    'Toasted': 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
    'Umami': 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    'Sweeteners': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    'Fermented': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    'Alcohol Base': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'Bitters': 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
    'Syrups': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    'Cordials': 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300',
    'Infusions': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'Unknown': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
};

interface IngredientDetailPanelProps {
    ingredient: Ingredient | null;
    onEdit: (ingredient: Ingredient) => void;
    onDelete: (ingredient: Ingredient) => void;
    onClose: () => void;
    onSendToZeroWaste?: (ingredient: Ingredient) => void;
}

export const IngredientDetailPanel: React.FC<IngredientDetailPanelProps> = ({ ingredient, onEdit, onDelete, onClose, onSendToZeroWaste }) => {
    if (!ingredient) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
                <Icon svg={ICONS.beaker} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecciona un ingrediente para ver detalles</p>
            </Card>
        );
    }

    const familyInfo = FAMILY_BG_COLORS[ingredient.categoria as AromaticFamily] || FAMILY_BG_COLORS.Unknown;

    return (
        <Card className="h-full min-h-0 flex flex-col bg-transparent backdrop-blur-xl border-0 shadow-none rounded-2xl overflow-hidden relative">
            <Button size="icon" variant="ghost" onClick={onClose} className="absolute top-2 right-2 z-10 lg:hidden">
                <Icon svg={ICONS.x} />
            </Button>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 w-full max-w-[95%] mx-auto">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-inner ${familyInfo}`}>
                        <Icon svg={ICONS.beaker} className="w-10 h-10 opacity-80" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ingredient.nombre}</h2>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${familyInfo}`}>
                        {ingredient.categoria}
                    </span>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Información de Costo</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Precio de Compra</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {ingredient.precioCompra > 0 ? `€${ingredient.precioCompra.toFixed(2)}` : '€0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Unidad de Compra</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 capitalize">
                                    {ingredient.unidadCompra || 'Und'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Detalles</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Proveedor</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{ingredient.proveedor || 'No especificado'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Marca</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{ingredient.marca || 'Generico'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Merma / Desperdicio</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{ingredient.merma || ingredient.wastePercentage ? `${ingredient.merma || ingredient.wastePercentage}%` : '0%'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex gap-3">
                {onSendToZeroWaste && (
                    <Button variant="secondary" className="flex-1" onClick={() => onSendToZeroWaste(ingredient)} title="Crear receta Zero Waste">
                        <Icon svg={ICONS.recycle} className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Zero Waste</span>
                    </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => onEdit(ingredient)}>
                    <Icon svg={ICONS.edit} className="mr-2 w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => onDelete(ingredient)}>
                    <Icon svg={ICONS.trash} className="mr-2 w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
                </Button>
            </div>
        </Card>
    );
};

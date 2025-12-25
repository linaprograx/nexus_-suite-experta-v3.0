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
    allIngredients?: Ingredient[]; // Added optional for backward compatibility or strict if required
    onEdit: (ingredient: Ingredient) => void;
    onDelete: (ingredient: Ingredient) => void;
    onClose: () => void;
    onBuy?: (ingredient: Ingredient) => void;
}


import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';
import { useApp } from '../../context/AppContext';

export const IngredientDetailPanel: React.FC<IngredientDetailPanelProps> = ({ ingredient, allIngredients = [], onEdit, onDelete, onClose, onBuy }) => {
    const { db, userId } = useApp();
    const { suppliers } = useSuppliers({ db, userId });

    if (!ingredient) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
                <Icon svg={ICONS.beaker} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecciona un ingrediente para ver detalles</p>
            </Card>
        );
    }

    // --- AGGREGATION LOGIC (Refined) ---
    const siblings = React.useMemo(() => {
        if (!allIngredients || allIngredients.length === 0) return [];

        // Stop words (grammatical) + Weak Categories (common product types that shouldn't trigger match alone)
        const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'o', 'con', 'sin', 'por', 'para', 'un', 'una']);
        const WEAK_TOKENS = new Set(['vodka', 'ron', 'gin', 'ginebra', 'tequila', 'whisky', 'whiskey', 'brandy', 'licor', 'cerveza', 'vino', 'sirope', 'pure', 'zumo', 'jugo', 'refresco', 'agua']);

        const getTokens = (str: string) => str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

        const targetTokens = getTokens(ingredient.nombre);

        return allIngredients.filter(other => {
            // 1. Same ID?
            if (other.id === ingredient.id) return true;

            // 2. Name Match?
            const otherTokens = getTokens(other.nombre);
            if (otherTokens.length === 0) return false;

            // 3. Strict Match Logic:
            // - Must share at least one STRONG token (e.g. "Absolut")
            // - shared WEAK tokens (e.g. "Vodka") don't count unless a strong token also matches

            let hasStrongMatch = false;
            let weakMatchCount = 0;

            targetTokens.forEach(tA => {
                const isWeak = WEAK_TOKENS.has(tA);
                // Check if tA matches any in otherTokens
                const matched = otherTokens.some(tB => {
                    if (tA === tB) return true;
                    if (tA.length > 3 && tB.length > 3 && (tA.includes(tB) || tB.includes(tA))) return true;
                    if (tA.length >= 3 && (tA.startsWith(tB) || tB.startsWith(tA))) return true;
                    return false;
                });

                if (matched) {
                    if (isWeak) weakMatchCount++;
                    else hasStrongMatch = true;
                }
            });

            // Pass if:
            // A) Has at least one STRONG match (Example: "Absolut" matches "Absolut")
            // B) OR if ONLY composed of weak tokens (Generic product like "Leche"), then match strict count? 
            //    -> For now, assume branded products mainly. If target has strong tokens, we MUST match one.

            // If target is ONLY weak tokens (e.g. "Vodka"), then we allow weak matches (otherwise "Vodka" generic wouldn't match anything)
            const targetHasStrongTokens = targetTokens.some(t => !WEAK_TOKENS.has(t));

            if (!targetHasStrongTokens) {
                // If I am searching "Vodka" (generic), show all Vodkas? 
                // User requirement: "Absolut" should only show "Absolut".
                // So if I have strong tokens, I require strong match.
                return weakMatchCount > 0;
            }

            return hasStrongMatch;
        }).sort((a, b) => (a.precioCompra || 9999) - (b.precioCompra || 9999));
    }, [ingredient, allIngredients]);

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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{ingredient.nombre}</h2>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${familyInfo}`}>
                        {ingredient.categoria}
                    </span>
                    {siblings.length > 1 && (
                        <div className="mt-2 text-xs text-slate-400 font-medium">
                            {siblings.length} opciones disponibles
                        </div>
                    )}
                </div>

                <div className="space-y-6">

                    {/* ALL SUPPLIER OPTIONS TABLE */}
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Icon svg={ICONS.users} className="w-4 h-4 text-emerald-500" />
                            Opciones de Compra
                        </h3>
                        <div className="space-y-3">
                            {siblings.length > 0 ? siblings.map((sib, idx) => {
                                const providerName = sib.proveedores && sib.proveedores.length > 0
                                    ? suppliers.find(s => s.id === sib.proveedores![0])?.name || sib.proveedor || 'Desconocido'
                                    : sib.proveedor || 'Desconocido';

                                const isCurrent = sib.id === ingredient.id;

                                return (
                                    <div key={sib.id} className={`flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0 ${isCurrent ? 'bg-emerald-50/50 dark:bg-emerald-900/10 -mx-2 px-2 rounded-lg' : ''}`}>
                                        <div className="flex flex-col min-w-0 gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium truncate ${isCurrent ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {providerName}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                        MEJOR PRECIO
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{sib.nombre}</span>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {sib.precioCompra ? `€${sib.precioCompra.toFixed(2)}` : '--'}
                                            </div>
                                            <div className="text-[9px] text-slate-400 uppercase">{sib.unidadCompra || 'Und'}</div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-slate-400 italic">No hay información de proveedores.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Detalles Generales</h3>
                        <div className="space-y-3">
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
                {onBuy && (
                    <Button
                        variant="ghost"
                        className="flex-1 !bg-emerald-50 !text-emerald-700 border border-emerald-200 hover:!bg-emerald-600 hover:!text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-300 font-bold"
                        onClick={() => onBuy(ingredient)}
                        title="Comprar Ingrediente Seleccionado"
                    >
                        <span className="hidden sm:inline">Comprar</span>
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

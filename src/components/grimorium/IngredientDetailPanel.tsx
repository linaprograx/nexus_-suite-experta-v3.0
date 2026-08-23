import React from 'react';
import { Ingredient, Recipe } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { AromaticFamily } from '../../features/ingredients/families';
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';
import { useApp, useCapabilities } from '../../context/AppContext';
import { evaluateCrossLayerContext } from '../../core/context/crossLayer.engine';
import { evaluateMarketSignals } from '../../core/signals/signal.engine';
import { generateAssistedInsights } from '../../core/assisted/assisted.engine';
import { generateActiveSuggestions } from '../../core/active/active.engine';
import { AssistedInsightsInline } from '../common/AssistedInsightsInline';
import { ActiveSuggestionInline } from '../common/ActiveSuggestionInline';
import { useUserIntelProfile } from '../../features/learning/hooks/useUserIntelProfile';
import { LearningEngine } from '../../core/learning/learning.engine';
import { TOKENS_GENERICOS as WEAK_TOKENS, esTokenGenerico } from '../../core/identity/genericTokens';
import { proveedorDeIngrediente } from '../../features/orders/resolverProveedor';
import { historialDeProducto, resumenDeHistorial } from '../../core/historial/historialProducto';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { useStockMovements } from '../../hooks/useStockMovements';
import { Plegable } from '../ui/Plegable';
import { fijarZonaDeProducto } from '../../features/suppliers/zonaDeProducto';
import { zonasDelCatalogo, normalizarZona, ZONAS_SUGERIDAS, SIN_ZONA } from '../../core/stock/zonas';
import { useQueryClient } from '@tanstack/react-query';


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
    allIngredients?: Ingredient[];
    recipes?: Recipe[]; // Added for Cross-Layer Context
    onEdit: (ingredient: Ingredient) => void;
    onDelete: (ingredient: Ingredient) => void;
    onClose: () => void;
    onBuy?: (ingredient: Ingredient) => void;
}

export const IngredientDetailPanel: React.FC<IngredientDetailPanelProps> = ({
    ingredient,
    allIngredients = [],
    recipes = [], // Default to empty 
    onEdit,
    onDelete,
    onClose,
    onBuy
}) => {
    const { db, userId } = useApp();
    const { suppliers } = useSuppliers({ db, userId });

    /**
     * Punto 8: todo lo que le ha pasado a este producto, en una sola línea.
     *
     * Los tres registros llevaban tiempo escribiéndose —compras, movimientos y
     * el registro del asistente— pero **faltaba la vista que los une**, así que
     * responder «¿qué ha pasado con este mezcal?» obligaba a abrir tres
     * pantallas y cruzar fechas a mano. Un historial partido en tres no es un
     * historial: son tres listas.
     */
    const { purchaseHistory } = usePurchaseIngredient();
    const { appId } = useApp();
    const queryClient = useQueryClient();

    /**
     * Dónde se guarda. Punto 7: sin poder asignarla, la zona sería un campo que
     * se lee y nadie escribe — exactamente el caso del proveedor preferente,
     * que estuvo seis lecturas y ninguna escritura.
     *
     * Las opciones salen de las zonas que ya existen más unas sugeridas, para
     * que no haya que teclear «Cámara» distinto cada vez y acaben dos zonas que
     * son la misma.
     */
    const zonasDisponibles = React.useMemo(() => {
        const existentes = zonasDelCatalogo(allIngredients).filter(z => z !== SIN_ZONA);
        return Array.from(new Set([...existentes, ...ZONAS_SUGERIDAS]))
            .sort((a, b) => a.localeCompare(b, 'es'));
    }, [allIngredients]);

    const cambiarZona = React.useCallback(async (valor: string) => {
        if (!db || !appId || !userId || !ingredient) return;
        try {
            await fijarZonaDeProducto(db, appId, userId, ingredient.id, valor || null);
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        } catch (e) {
            console.error('[zona] no se pudo guardar', e);
        }
    }, [db, appId, userId, ingredient, queryClient]);
    const { movements } = useStockMovements();
    const historial = React.useMemo(
        () => (ingredient ? historialDeProducto(ingredient.id, allIngredients, purchaseHistory || [], movements || []) : []),
        [ingredient, allIngredients, purchaseHistory, movements],
    );
    const resumenHist = React.useMemo(() => resumenDeHistorial(historial), [historial]);

    // --- CROSS-LAYER CONTEXT ---
    const contextHints = React.useMemo(() => {
        if (!ingredient) return [];
        return evaluateCrossLayerContext({
            market: {
                ingredients: allIngredients,
                selectedIngredientId: ingredient.id
            },
            recipes: recipes
        });
    }, [ingredient, allIngredients, recipes]);


    if (!ingredient) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
                <Icon svg={ICONS.beaker} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecciona un ingrediente para ver detalles</p>
            </Card>
        );
    }


    // --- SIGNALS (Recalculate for Selected Context) ---
    // We need signals for the Assisted Engine. 
    // Since this panel focuses on ONE ingredient, we calculate signals just for it.
    const signals = React.useMemo(() => {
        if (!ingredient) return [];

        // Create supplier map for this specific ingredient aggregation
        // The 'siblings' logic is duplicated here or needs to be shared. 
        // Assuming 'allIngredients' + fuzzy match logic is available or we use the 'siblings' computed prop if we move it up?
        // Actually, IngredientDetailPanel computes 'siblings' internally. I should lift that out or reuse it.
        // For now, to keep it clean, I will reuse the 'siblings' logic which I will define above this block or move up.
        return [];
    }, [ingredient]);

    // Lifted Siblings Logic (from below)
    const siblings = React.useMemo(() => {
        if (!allIngredients || !ingredient || allIngredients.length === 0) return [];
        // ... (Same fuzzy matching logic as before) ...
        const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'o', 'con', 'sin', 'por', 'para', 'un', 'una']);
    
        const getTokens = (str: string) => str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

        const targetTokens = getTokens(ingredient.nombre);

        return allIngredients.filter(other => {
            if (other.id === ingredient.id) return true;
            const otherTokens = getTokens(other.nombre);
            if (otherTokens.length === 0) return false;

            let strongMatched = 0;
            let weakMatchCount = 0;
            const strongTotal = targetTokens.filter(t => !esTokenGenerico(t)).length;

            targetTokens.forEach(tA => {
                const isWeak = WEAK_TOKENS.has(tA);
                const matched = otherTokens.some(tB => {
                    if (tA === tB) return true;
                    if (tA.length > 3 && tB.length > 3 && (tA.includes(tB) || tB.includes(tA))) return true;
                    if (tA.length >= 3 && (tA.startsWith(tB) || tB.startsWith(tA))) return true;
                    return false;
                });

                if (matched) {
                    if (isWeak) weakMatchCount++;
                    else strongMatched++;
                }
            });

            const targetHasStrongTokens = targetTokens.some(t => !WEAK_TOKENS.has(t));
            // El objetivo solo dice su familia («MEZCAL CUPREATA»): cualquier
            // coincidencia sería de familia, no de producto. Se exige que
            // coincidan TODAS sus palabras y que el candidato no añada ninguna
            // específica; si no, «MEZCAL» emparejaría con medio catálogo.
            if (!targetHasStrongTokens) {
                const candidatoEsEspecifico = otherTokens.some(t => !esTokenGenerico(t));
                return weakMatchCount === targetTokens.length && !candidatoEsEspecifico;
            }
            // Simétrico: además de encontrar todas las palabras específicas del
            // objetivo, el candidato no puede traer ninguna de más. Sin esto,
            // «ABSOLUT MANDARINA» se ofrecía como alternativa de «ABSOLUT
            // VODKA»: comparten la marca y «mandarina» pasaba desapercibida.
            // Los números se ignoran: son formato («0,7 L»), no identidad.
            const esFormato = (t: string) => /^[0-9]+([.,]?[0-9]+)?(cl|ml|l|g|kg|und|ud)?$/.test(t);
            const sobra = otherTokens.some(tB =>
                !esTokenGenerico(tB) && !esFormato(tB) &&
                !targetTokens.some(tA => tA === tB
                    || (tA.length > 3 && tB.length > 3 && (tA.includes(tB) || tB.includes(tA)))
                    || (tA.length >= 3 && (tA.startsWith(tB) || tB.startsWith(tA)))));
            return strongTotal > 0 && strongMatched === strongTotal && !sobra;
        }).sort((a, b) => (a.precioCompra || 9999) - (b.precioCompra || 9999));
    }, [ingredient, allIngredients]);

    // --- RE-CALCULATE SIGNALS FOR ASSISTED ENGINE ---
    const activeSignals = React.useMemo(() => {
        if (!ingredient || siblings.length === 0) return [];

        // Construct Supplier Map (Filter out invalid options)
        const supplierMap: Record<string, any> = {};
        siblings.forEach((entry, idx) => {
            // Skip if no price or explicitly 'Desconocido'/Generic without valid data
            if (!entry.precioCompra || entry.precioCompra <= 0) return;

            supplierMap[entry.id || `iso_${idx}`] = {
                price: entry.precioCompra,
                formatQty: (entry as any).formatQty || 1,
                formatUnit: (entry as any).formatUnit || entry.unidad || 'units',
                updatedAt: (entry.supplierData as any)?.lastUpdated || Date.now()
            };
        });

        // Import evaluateMarketSignals
        return evaluateMarketSignals({
            product: {
                id: ingredient.id,
                name: ingredient.nombre,
                category: ingredient.categoria ?? null,
                supplierData: supplierMap,
                referencePrice: ingredient.costo || null,
                referenceSupplierId: null, // We act as observer
                unitBase: (ingredient.unidad as any) || 'units'
            }
        });
    }, [ingredient, siblings]);


    // --- GATE INTELLIGENCE CALCULATIONS (Phase 5.1 Performance) ---
    const { hasLayer } = useCapabilities();
    const canAssist = hasLayer('assisted_intelligence');
    const canActive = hasLayer('active_intelligence');

    // --- ASSISTED INSIGHTS ---
    const assistedInsights = React.useMemo(() => {
        if (!ingredient || !canAssist) return []; // OPTIMIZATION: Skip if gated
        return generateAssistedInsights({
            signals: activeSignals,
            contextHints: contextHints,
            domain: {
                market: {
                    ingredients: allIngredients,
                    selectedIngredient: ingredient
                },
                recipes: recipes
            }
        });
    }, [activeSignals, contextHints, allIngredients, ingredient, recipes, canAssist]);

    // --- PHASE 3.0: ACTIVE INTELLIGENCE ---
    const { profile } = useUserIntelProfile();

    const activeSuggestions = React.useMemo(() => {
        if (!canActive) return []; // OPTIMIZATION: Skip if gated
        return generateActiveSuggestions(assistedInsights, profile);
    }, [assistedInsights, profile, canActive]);

    const familyInfo = FAMILY_BG_COLORS[ingredient.categoria as AromaticFamily] || FAMILY_BG_COLORS.Unknown;

    return (
        <Card className="h-full min-h-0 flex flex-col bg-transparent backdrop-blur-xl border-0 shadow-none rounded-2xl overflow-hidden relative">
            <Button size="icon" variant="ghost" onClick={onClose} className="absolute top-2 right-2 z-10 lg:hidden">
                <Icon svg={ICONS.x} />
            </Button>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 w-full max-w-[95%] mx-auto">
                {/* ... (Header Content) ... */}
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
                                // Por la escalera de M2: mira el preferente, luego
                                // `proveedores[]` y solo al final el campo viejo, que
                                // en el catálogo real está vacío y dejaba a casi
                                // todas las fichas hermanas como «Desconocido».
                                const provId = proveedorDeIngrediente(sib as any);
                                const providerName = provId
                                    ? suppliers.find(s => s.id === provId)?.name || provId
                                    : 'Desconocido';

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

                            {/* ASSISTED DECISIONS */}
                            {assistedInsights.length > 0 && (
                                <AssistedInsightsInline insights={assistedInsights} />
                            )}

                            {/* ACTIVE SUGGESTIONS (Phase 3.0) */}
                            {activeSuggestions.length > 0 && (
                                <ActiveSuggestionInline
                                    suggestion={activeSuggestions[0]}
                                    onAction={async (id) => {
                                        if (db && userId) {
                                            await LearningEngine.trackEvent(db, userId, {
                                                type: 'action_previewed',
                                                scope: 'market',
                                                entity: { ingredientId: ingredient.id },
                                                signalIds: [],
                                                suggestionId: id,
                                                meta: {}
                                            });
                                        }
                                    }}
                                    onDismiss={async (id) => {
                                        if (db && userId) {
                                            await LearningEngine.trackEvent(db, userId, {
                                                type: 'suggestion_dismissed',
                                                scope: 'market',
                                                entity: { ingredientId: ingredient.id },
                                                signalIds: [],
                                                suggestionId: id,
                                                meta: {}
                                            });
                                        }
                                        // Local hide logic could go here or rely on re-render
                                    }}
                                />
                            )}

                            {/* CONTEXT HINTS (Fallback) */}
                            {contextHints.length > 0 && assistedInsights.length === 0 && (
                                <div className="space-y-2 mb-4">
                                    {contextHints.map(hint => (
                                        <div key={hint.id} className="flex items-start gap-2 p-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg">
                                            <Icon svg={ICONS.activity} className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-tight">
                                                {hint.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                </div>

            {/* La zona, editable. Va antes del historial porque es un dato que se
                cambia; el historial solo se consulta. */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Zona</span>
                <select
                    value={normalizarZona((ingredient as any).zona) === SIN_ZONA ? '' : normalizarZona((ingredient as any).zona)}
                    onChange={e => cambiarZona(e.target.value)}
                    aria-label="Zona de almacenamiento"
                    className="flex-1 min-w-0 h-9 px-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                    <option value="">Sin colocar</option>
                    {zonasDisponibles.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
            </div>

            {/* Plegado por defecto: quien abre la ficha suele venir a otra cosa,
                y una lista larga abierta empuja los botones fuera de la pantalla.
                Ver la regla en `Plegable`. */}
            {historial.length > 0 && (
                <Plegable
                    titulo="Historial de este producto"
                    insignia={`${resumenHist.eventos}`}
                    className="mb-3"
                >
                    <div className="p-2.5">
                        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                            {resumenHist.compras} compra(s) por €{resumenHist.gastado.toFixed(2)} · {resumenHist.salidas} salida(s)
                            {resumenHist.fichas > 1 && ` · repartido entre ${resumenHist.fichas} fichas fusionadas`}
                        </p>
                        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                            {historial.slice(0, 60).map((e, i) => (
                                <div key={i} className="flex items-baseline justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <div className="min-w-0">
                                        <span className="text-[11px] text-slate-700 dark:text-slate-300">{e.texto}</span>
                                        <span className="text-[10px] text-slate-400"> · {e.fecha.toLocaleDateString()}</span>
                                    </div>
                                    <span className={`text-[11px] font-bold tabular-nums shrink-0 ${e.cantidad >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {e.cantidad >= 0 ? '+' : ''}{e.cantidad} {e.unidad}
                                        {e.importe !== undefined && <span className="text-slate-400 font-normal"> · €{e.importe.toFixed(2)}</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {historial.length > 60 && (
                            <p className="text-[10px] text-slate-400 text-center pt-2">…y {historial.length - 60} más.</p>
                        )}
                    </div>
                </Plegable>
            )}

            <div className="flex gap-2">
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

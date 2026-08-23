import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { useStockRules } from '../../hooks/useStockRules';
import { useStockMovements } from '../../hooks/useStockMovements';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { buildCurrentStock } from '../../utils/stockUtils';
import { indicePorId, resolverMaestro } from '../../core/identity/masterProduct';
import { construirAlertas, resumenDeAlertas, Prioridad, Alerta } from '../../core/alertas/centroDeAlertas';

/**
 * El centro de alertas. **Solo lectura.**
 *
 * Cada tarjeta responde a las cuatro preguntas del punto 5 —qué pasa, por qué
 * importa, qué impacto tiene y qué se puede hacer— y las acciones dependen de
 * la causa: un producto sin precio no se arregla pidiendo más.
 */

const NIVEL: Record<Prioridad, { texto: string; cls: string; borde: string }> = {
    ahora: { texto: 'Ahora', cls: 'bg-rose-500 text-white', borde: 'border-rose-200 dark:border-rose-800/40' },
    'esta-semana': { texto: 'Esta semana', cls: 'bg-amber-500 text-white', borde: 'border-amber-200 dark:border-amber-800/40' },
    'cuando-puedas': { texto: 'Cuando puedas', cls: 'bg-slate-400 text-white', borde: 'border-slate-200 dark:border-slate-700' },
};

export const CentroDeAlertasModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();
    const { rules } = useStockRules();
    const { movements } = useStockMovements();
    const { purchaseHistory } = usePurchaseIngredient();

    // La misma consolidación que el resto de la app: sin ella, las alertas de
    // stock hablarían de fichas y no de productos.
    const stock = React.useMemo(() => {
        const porId = indicePorId(ingredients || []);
        return buildCurrentStock(purchaseHistory || [], movements || [], id => resolverMaestro(id, porId));
    }, [purchaseHistory, movements, ingredients]);

    const alertas = React.useMemo(() => construirAlertas({
        ingredientes: ingredients || [],
        recetas: recipes || [],
        reglas: rules || [],
        stock,
        compras: purchaseHistory || [],
    }), [ingredients, recipes, rules, stock, purchaseHistory]);

    const resumen = React.useMemo(() => resumenDeAlertas(alertas), [alertas]);

    const Cifra: React.FC<{ n: React.ReactNode; etiqueta: string; color?: string }> = ({ n, etiqueta, color }) => (
        <div className="flex-1 min-w-0 text-center px-2">
            <div className={`text-xl font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-100'}`}>{n}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 truncate">{etiqueta}</div>
        </div>
    );

    const Tarjeta: React.FC<{ a: Alerta }> = ({ a }) => {
        const n = NIVEL[a.prioridad];
        return (
            <div className={`rounded-xl border p-3 ${n.borde}`}>
                <div className="flex items-start gap-2">
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${n.cls}`}>{n.texto}</span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{a.titulo}</span>
                            {a.impacto !== undefined && a.impacto > 0 && (
                                <span className="text-xs font-black tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                                    €{a.impacto.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{a.queOcurre}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            <strong className="text-slate-600 dark:text-slate-400">Por qué importa:</strong> {a.porQueImporta}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{a.impactoTexto}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {a.acciones.map(ac => (
                                <span key={ac.etiqueta} className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {ac.etiqueta}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-600 to-amber-600 text-white shrink-0">
                    <span className="p-2 rounded-xl bg-white/15"><Icon svg={ICONS.alertCircle} className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base">Qué necesita tu atención</h2>
                        <p className="text-[11px] text-white/80">Solo lectura. Ordenado por urgencia, no por importe.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex divide-x divide-slate-200 dark:divide-slate-700 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <Cifra n={resumen.ahora} etiqueta="ahora" color="text-rose-600" />
                    <Cifra n={resumen.estaSemana} etiqueta="esta semana" color="text-amber-600" />
                    <Cifra n={resumen.cuandoPuedas} etiqueta="cuando puedas" />
                    <Cifra n={`€${resumen.impacto.toFixed(0)}`} etiqueta="valorable" color="text-emerald-600" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {alertas.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-10 leading-relaxed">
                            Nada que requiera tu atención ahora mismo.<br />
                            <span className="text-slate-400">Y esto es un dato, no un cartel de cortesía: se ha comprobado el stock,
                            los precios, los techos y la concentración de proveedores.</span>
                        </p>
                    ) : (
                        <>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                                <strong>Ahora</strong> impide servir hoy o hay dinero saliendo. <strong>Esta semana</strong> todavía no
                                duele pero va a doler. <strong>Cuando puedas</strong> deja los datos mejor sin cambiar el servicio de hoy.
                                Dentro de cada nivel manda el importe.
                            </p>
                            {alertas.map(a => <Tarjeta key={a.id} a={a} />)}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

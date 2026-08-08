import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';

/**
 * Lo que la pestaña de Rentabilidad no contaba.
 *
 * Hasta ahora mostraba coste teórico, coste real, beneficio y margen: los mismos
 * cuatro números que ya se ven en la ficha de la receta. El fundador lo dijo
 * claro — *"su resultado es vago, no muestra nada diferente"*.
 *
 * Aquí se añade lo que **solo puede saberse cruzando datos**, que es lo que
 * justifica una pantalla aparte:
 *
 * 1. **La desviación** entre el coste teórico y el real. Los dos números ya
 *    estaban, pero uno al lado del otro; nadie los restaba. Es el dato que dice
 *    si la receta se está encareciendo.
 * 2. **Quién se lleva el coste.** Los ingredientes que más pesan, en euros y en
 *    porcentaje. Es lo accionable: si el 60% del coste está en un ingrediente,
 *    ahí está la palanca.
 * 3. **El precio para un margen objetivo.** El cálculo inverso: en vez de
 *    "cuánto margen me da este precio", "qué precio necesito para este margen".
 *
 * Todo sale del motor de costes existente (`costCalculator`), que sigue siendo
 * la fuente única. Aquí no se calcula ningún coste por cuenta propia.
 */

interface Props {
    receta: Recipe;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    /** Coste real derivado del stock. `-1` cuando no hay datos suficientes. */
    costeReal: number;
    precioVenta: number;
}

const eur = (n: number) => `€${(isNaN(n) ? 0 : n).toFixed(2)}`;

export const RentabilidadDetalle: React.FC<Props> = ({
    receta, allIngredients, allRecipes, costeReal, precioVenta,
}) => {
    const [margenObjetivo, setMargenObjetivo] = React.useState(75);

    const desglose = React.useMemo(
        () => calculateRecipeCost(receta, allIngredients, undefined, allRecipes),
        [receta, allIngredients, allRecipes]
    );

    const teorico = desglose.costoTotal || 0;
    const hayReal = costeReal !== -1 && costeReal > 0;
    const desviacion = hayReal && teorico > 0 ? ((costeReal - teorico) / teorico) * 100 : null;

    const pesos = React.useMemo(() => {
        const total = teorico || 1;
        return [...(desglose.costoPorIngrediente || [])]
            .map(i => ({ nombre: (i as any).nombre || 'Ingrediente', costo: i.costo || 0, peso: ((i.costo || 0) / total) * 100 }))
            .filter(i => i.costo > 0)
            .sort((a, b) => b.costo - a.costo)
            .slice(0, 4);
    }, [desglose, teorico]);

    // Precio necesario para el margen objetivo: PVP = coste / (1 - margen).
    const base = hayReal ? costeReal : teorico;
    const objetivo = Math.min(95, Math.max(0, margenObjetivo));
    const precioNecesario = objetivo < 100 ? base / (1 - objetivo / 100) : 0;

    return (
        <div className="space-y-3">
            {/* Desviación entre lo previsto y lo que cuesta de verdad */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Desviación del coste</p>
                {desviacion === null ? (
                    <p className="text-sm text-slate-400 italic">
                        Sin coste real todavía. Hace falta historial de compras de estos ingredientes.
                    </p>
                ) : (
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <span className={`text-2xl font-bold tabular-nums ${desviacion > 10 ? 'text-rose-600 dark:text-rose-400' : desviacion < -5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {desviacion > 0 ? '+' : ''}{desviacion.toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {eur(teorico)} previsto → {eur(costeReal)} real
                        </span>
                    </div>
                )}
            </div>

            {/* Dónde está el coste */}
            {pesos.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dónde está el coste</p>
                    <div className="space-y-2.5">
                        {pesos.map((i, k) => (
                            <div key={k}>
                                <div className="flex items-baseline justify-between gap-3 mb-1">
                                    <span className="text-sm text-slate-700 dark:text-slate-200 min-w-0 break-words">{i.nombre}</span>
                                    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                                        {eur(i.costo)} · {i.peso.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, i.peso)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* El cálculo inverso: qué precio necesito */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Precio para un margen objetivo</p>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <input
                            type="number" min={0} max={95} value={margenObjetivo}
                            onChange={e => setMargenObjetivo(Number(e.target.value))}
                            aria-label="Margen objetivo en porcentaje"
                            className="w-20 h-10 px-3 rounded-xl text-sm tabular-nums bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">% de margen</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">→</span>
                    <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {eur(precioNecesario)}
                    </span>
                </div>
                {precioVenta > 0 && precioNecesario > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {precioVenta >= precioNecesario
                            ? `Tu precio actual (${eur(precioVenta)}) ya lo cumple.`
                            : `Faltan ${eur(precioNecesario - precioVenta)} sobre tu precio actual (${eur(precioVenta)}).`}
                    </p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                    Calculado sobre el coste {hayReal ? 'real' : 'teórico'}: {eur(base)}
                </p>
            </div>
        </div>
    );
};

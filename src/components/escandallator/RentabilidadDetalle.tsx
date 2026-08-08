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
    /** Fracción del coste real respaldada por compras (0–1). */
    cobertura?: number;
}

const eur = (n: number) => `€${(isNaN(n) ? 0 : n).toFixed(2)}`;

export const RentabilidadDetalle: React.FC<Props> = ({
    receta, allIngredients, allRecipes, costeReal, precioVenta, cobertura = 0,
}) => {
    // 80% es el suelo de rentabilidad que el negocio quiere sostener.
    const [margenObjetivo, setMargenObjetivo] = React.useState(80);

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

    const base = hayReal ? costeReal : teorico;

    /**
     * Sugerencias de precio, **partiendo del que la receta ya tiene**.
     *
     * Antes esto proponía un precio salido de la nada a partir de un margen
     * tecleado, ignorando que la receta ya está valorada. Lo que hace falta no es
     * inventar un precio, sino **explorar alrededor del actual**: hasta dónde se
     * puede bajar sin romper la rentabilidad.
     *
     * El suelo es el margen mínimo (80% por defecto): por debajo no se sugiere
     * nada, aunque el precio actual dé mucho margen de maniobra.
     *
     * Cuando el precio actual **no** llega al suelo, las sugerencias apuntan
     * hacia arriba: es el caso de una receta con coste elevado.
     */
    const precioActual = (receta.precioVenta || 0) || precioVenta || 0;
    const suelo = margenObjetivo < 100 ? base / (1 - margenObjetivo / 100) : 0;
    const aMedio = (n: number) => Math.round(n * 2) / 2;   // precios de barra: pasos de 0,50

    const sugerencias = React.useMemo(() => {
        if (!precioActual || !base) return [];
        if (precioActual >= suelo) {
            // Hay recorrido: se puede bajar sin bajar del margen objetivo.
            const moderado = Math.max(suelo, aMedio(precioActual * 0.85));
            const agresivo = Math.max(suelo, aMedio(precioActual * 0.80));
            return [
                { etiqueta: 'Moderado', precio: moderado },
                { etiqueta: 'Agresivo', precio: agresivo },
            ].filter((s, i, a) => i === 0 || Math.abs(s.precio - a[0].precio) > 0.01);
        }
        // No llega al margen objetivo: las sugerencias apuntan hacia arriba.
        //
        // Una de ellas es una subida realista y la otra, el precio que el objetivo
        // exige. Se muestran las dos a propósito: cuando la segunda es
        // desproporcionada, el mensaje útil no es «sube el precio» sino que **el
        // problema está en el coste**, y eso solo se ve teniendo ambas delante.
        return [
            { etiqueta: 'Subida realista', precio: aMedio(precioActual * 1.15) },
            { etiqueta: `Para el ${margenObjetivo}%`, precio: aMedio(suelo) },
        ];
    }, [precioActual, base, suelo]);

    const margenDe = (p: number) => (p > 0 ? ((p - base) / p) * 100 : 0);

    return (
        <div className="space-y-3">
            {/* Desviación entre lo previsto y lo que cuesta de verdad */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Desviación del coste</p>
                {desviacion === null ? (
                    <p className="text-sm text-slate-400 italic">
                        Todavía no hay compras registradas de estos ingredientes, así que no hay
                        con qué comparar. En cuanto registres alguna, aquí verás si la receta se
                        encarece.
                    </p>
                ) : (
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <span className={`text-2xl font-bold tabular-nums ${desviacion > 10 ? 'text-rose-600 dark:text-rose-400' : desviacion < -5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {desviacion > 0 ? '+' : ''}{desviacion.toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {eur(teorico)} previsto → {eur(costeReal)} real
                            {cobertura > 0 && cobertura < 0.999 && (
                                <span className="block text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                    Solo el {Math.round(cobertura * 100)}% del coste está respaldado por compras;
                                    el resto es teórico.
                                </span>
                            )}
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

            {/* Sugerencias alrededor del precio actual */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio y alternativas</p>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Margen mínimo
                        <input
                            type="number" min={0} max={95} value={margenObjetivo}
                            onChange={e => setMargenObjetivo(Number(e.target.value))}
                            aria-label="Margen mínimo en porcentaje"
                            className="w-16 h-8 px-2 rounded-lg text-sm tabular-nums bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />%
                    </label>
                </div>

                {!precioActual ? (
                    <p className="text-sm text-slate-400 italic">
                        Esta receta todavía no tiene precio de venta. Ponle uno y aquí verás hasta dónde puedes moverlo.
                    </p>
                ) : (
                    <>
                        <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Actual</span>
                                <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{eur(precioActual)}</span>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${margenDe(precioActual) >= margenObjetivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {margenDe(precioActual).toFixed(0)}% de margen
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {sugerencias.map((sug, k) => (
                                <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">{sug.etiqueta}</span>
                                    <span className="block text-xl font-bold tabular-nums text-teal-600 dark:text-teal-400">{eur(sug.precio)}</span>
                                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {margenDe(sug.precio).toFixed(0)}% · {sug.precio < precioActual ? `−${eur(precioActual - sug.precio)}` : `+${eur(sug.precio - precioActual)}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {suelo > precioActual * 1.6 && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2.5 leading-snug">
                                Llegar al {margenObjetivo}% exigiría multiplicar el precio por{' '}
                                {(suelo / precioActual).toFixed(1)}. Con este coste, la palanca no es el
                                precio: mira arriba qué ingrediente se lleva la mayor parte.
                            </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2">
                            Sobre el coste {hayReal ? 'real' : 'teórico'} de {eur(base)}.
                            {precioActual >= suelo ? ` Ninguna sugerencia baja del ${margenObjetivo}%.` : ''}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

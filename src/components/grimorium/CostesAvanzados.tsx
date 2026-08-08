import React from 'react';
import { Recipe, Ingredient } from '../../types';
import {
    RecipeCostOverrides, DirectAdditionalCost, VariableServiceCost,
} from '../../core/costing/profitability.types';
import { calculateRecipeProfitability } from '../../core/costing/profitabilityEngine';
import { useBusinessCostSettings } from '../../hooks/useBusinessCostSettings';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

/**
 * Costes avanzados de una receta. Sección **plegada por defecto**.
 *
 * Quien solo quiera ingredientes, cantidades y precio no debe notar que esto
 * existe: crear una receta tiene que seguir siendo rápido. Por eso vive
 * colapsada y no reordena nada del formulario.
 *
 * ## Herencia
 *
 * Nada se copia de la configuración del negocio al abrir la sección. Una receta
 * sin override **hereda en vivo**: si mañana cambias la merma global, esta
 * receta la sigue. Copiar el valor global al abrir sería silencioso y rompería
 * esa herencia sin que nadie lo pidiera — por eso cada bloque dice si está
 * heredando y hay que pulsar para personalizar.
 *
 * ## Cálculo
 *
 * Las vistas previas salen de `calculateRecipeProfitability`. Aquí no hay ni una
 * fórmula: si el resumen y la pantalla de rentabilidad divergieran, tendríamos
 * otra vez dos verdades para el mismo número.
 */

interface Props {
    recipe: Partial<Recipe>;
    lineItems: any[];
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    onChange: (overrides: RecipeCostOverrides) => void;
}

const eur = (n: number) => `€${(isNaN(n) ? 0 : n).toFixed(2)}`;
const nuevoId = () => Math.random().toString(36).slice(2, 10);

/** Presets de hielo: solo el NOMBRE. El precio lo pone siempre el usuario. */
const PRESETS_HIELO = [
    'Hielo estándar', 'Cubo premium', 'Esfera cristalina',
    'Cubo artesanal', 'Hielo picado premium',
];

const campo = 'h-10 px-3 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 w-full';
const etiqueta = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1';

/** Aviso de herencia + botón para personalizar. Mismo patrón en los tres bloques. */
const Heredado: React.FC<{ texto: string; onPersonalizar: () => void }> = ({ texto, onPersonalizar }) => (
    <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400">{texto}</span>
        <button
            type="button"
            onClick={onPersonalizar}
            className="shrink-0 h-8 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wider"
        >
            Personalizar
        </button>
    </div>
);

const Bloque: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{titulo}</p>
        {children}
    </div>
);

export const CostesAvanzados: React.FC<Props> = ({
    recipe, lineItems, allIngredients, allRecipes, onChange,
}) => {
    const { ajustes } = useBusinessCostSettings();
    const [abierto, setAbierto] = React.useState(false);

    const ov: RecipeCostOverrides = recipe.costingOverrides || {};
    const set = (cambios: Partial<RecipeCostOverrides>) => onChange({ ...ov, ...cambios });

    // La vista previa usa la receta EN EDICIÓN, con sus líneas actuales.
    const r = React.useMemo(() => calculateRecipeProfitability({
        recipe: { ...recipe, ingredientes: lineItems, costingOverrides: ov } as Partial<Recipe>,
        allIngredients,
        allRecipes,
        settings: ajustes,
    }), [recipe, lineItems, allIngredients, allRecipes, ajustes, ov]);

    const adicionales = ov.costesDirectosAdicionales || [];
    const variables = ov.costesVariablesServicio || [];
    const mermaPersonalizada = ov.porcentajeMerma !== undefined;
    const moPersonalizada = ov.incluirManoObra !== undefined || !!ov.tiempoPreparacionMinutos;

    const hayAlgo = adicionales.length > 0 || variables.length > 0 || mermaPersonalizada || moPersonalizada;

    // ── Costes adicionales
    const añadirAdicional = (nombre = '') => set({
        costesDirectosAdicionales: [...adicionales,
            { id: nuevoId(), nombre, cantidad: 1, costeUnitario: 0 } as DirectAdditionalCost],
    });
    const editarAdicional = (id: string, cambios: Partial<DirectAdditionalCost>) => set({
        costesDirectosAdicionales: adicionales.map(c => (c.id === id ? { ...c, ...cambios } : c)),
    });
    const borrarAdicional = (id: string) => set({
        costesDirectosAdicionales: adicionales.filter(c => c.id !== id),
    });

    // ── Costes variables
    const añadirVariable = () => set({
        costesVariablesServicio: [...variables,
            { id: nuevoId(), nombre: '', tipo: 'fixed', valor: 0 } as VariableServiceCost],
    });
    const editarVariable = (id: string, cambios: Partial<VariableServiceCost>) => set({
        costesVariablesServicio: variables.map(c => (c.id === id ? { ...c, ...cambios } : c)),
    });
    const borrarVariable = (id: string) => set({
        costesVariablesServicio: variables.filter(c => c.id !== id),
    });

    return (
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
                type="button"
                onClick={() => setAbierto(v => !v)}
                aria-expanded={abierto}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/60 text-left"
            >
                <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">Costes avanzados</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                        {hayAlgo
                            ? `Coste servido ${eur(r.realServedCost)} · ${adicionales.length + variables.length} concepto(s)`
                            : 'Hielo, merma, comisiones, mano de obra — opcional'}
                    </span>
                </span>
                <Icon svg={ICONS.chevronDown} className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
            </button>

            {abierto && (
                <div className="p-3 space-y-3 bg-white dark:bg-slate-900">

                    {/* ── Costes adicionales por servicio */}
                    <Bloque titulo="Costes adicionales por servicio">
                        {adicionales.length === 0 && (
                            <p className="text-xs text-slate-400 mb-2.5">
                                Hielo premium, garnish comprado, posavasos, envase de reparto…
                            </p>
                        )}

                        <div className="space-y-2">
                            {adicionales.map(c => (
                                // Bloque vertical: en un móvil, cuatro campos en fila
                                // dejan el botón de borrar fuera de la pantalla.
                                <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={c.nombre}
                                            onChange={e => editarAdicional(c.id, { nombre: e.target.value })}
                                            placeholder="Nombre del coste"
                                            className={campo}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => borrarAdicional(c.id)}
                                            aria-label={`Eliminar ${c.nombre || 'coste'}`}
                                            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                                        >
                                            <Icon svg={ICONS.trash} className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-20">
                                            <span className={etiqueta}>Cant.</span>
                                            <input
                                                type="number" min={0} step="any" value={c.cantidad}
                                                onChange={e => editarAdicional(c.id, { cantidad: Number(e.target.value) })}
                                                className={`${campo} tabular-nums`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={etiqueta}>€ / unidad</span>
                                            <input
                                                type="number" min={0} step="any" value={c.costeUnitario}
                                                onChange={e => editarAdicional(c.id, { costeUnitario: Number(e.target.value) })}
                                                className={`${campo} tabular-nums`}
                                            />
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={etiqueta}>Total</span>
                                            <span className="block h-10 leading-10 text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                                                {eur((c.costeUnitario || 0) * (c.cantidad || 1))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => añadirAdicional()}
                            className="mt-2.5 h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider"
                        >
                            + Añadir coste
                        </button>

                        {/* Atajos de hielo: solo ponen el NOMBRE, nunca un precio. */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {PRESETS_HIELO.map(n => (
                                <button
                                    key={n} type="button" onClick={() => añadirAdicional(n)}
                                    className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
                                >
                                    + {n}
                                </button>
                            ))}
                        </div>
                    </Bloque>

                    {/* ── Merma */}
                    <Bloque titulo="Merma estimada">
                        {!mermaPersonalizada ? (
                            <Heredado
                                texto={ajustes.porcentajeMermaDefault > 0
                                    ? `Usando la del negocio: ${ajustes.porcentajeMermaDefault}%`
                                    : 'Usando la del negocio: sin merma'}
                                onPersonalizar={() => set({ porcentajeMerma: ajustes.porcentajeMermaDefault || 5 })}
                            />
                        ) : (
                            <div className="flex items-end gap-2 flex-wrap">
                                <div className="w-24">
                                    <span className={etiqueta}>% merma</span>
                                    <input
                                        type="number" min={0} max={100} step="any" value={ov.porcentajeMerma}
                                        onChange={e => set({ porcentajeMerma: Number(e.target.value) })}
                                        className={`${campo} tabular-nums`}
                                    />
                                </div>
                                <span className="h-10 leading-10 text-xs text-amber-600 dark:text-amber-400">
                                    Impacto estimado: +{eur(r.wasteCost)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => set({ porcentajeMerma: undefined })}
                                    className="h-10 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                                >
                                    Volver al negocio
                                </button>
                            </div>
                        )}
                    </Bloque>

                    {/* ── Tiempo y mano de obra */}
                    <Bloque titulo="Tiempo y mano de obra">
                        <div className="flex items-end gap-2 flex-wrap">
                            <div className="w-24">
                                <span className={etiqueta}>Minutos</span>
                                <input
                                    type="number" min={0} step="any" value={ov.tiempoPreparacionMinutos ?? ''}
                                    onChange={e => set({ tiempoPreparacionMinutos: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    className={`${campo} tabular-nums`}
                                />
                            </div>
                            <label className="flex items-center gap-2 h-10 text-xs text-slate-600 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={ov.incluirManoObra ?? ajustes.incluirManoObraPorDefecto}
                                    onChange={e => set({ incluirManoObra: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                Incluir en el análisis
                            </label>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {ajustes.costeLaboralHora > 0
                                ? <>Coste laboral del negocio: {eur(ajustes.costeLaboralHora)}/h · Estimado: <span className="text-amber-600 dark:text-amber-400 font-bold">{eur(r.laborCost)}</span> <span className="text-amber-600 dark:text-amber-500">estimado</span></>
                                : 'Configura el coste laboral por hora en los ajustes del negocio para ver el importe.'}
                        </p>
                    </Bloque>

                    {/* ── Costes variables específicos */}
                    <Bloque titulo="Costes variables de esta receta">
                        {variables.length === 0 && (
                            <p className="text-xs text-slate-400 mb-2.5">
                                {ajustes.costesVariablesDefault.length > 0
                                    ? `Usando los del negocio (${ajustes.costesVariablesDefault.length}). Si añades aquí, sustituyen a los globales.`
                                    : 'Comisión de plataforma, reparto, packaging especial… Sustituyen a los del negocio.'}
                            </p>
                        )}
                        <div className="space-y-2">
                            {variables.map(c => (
                                <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={c.nombre}
                                            onChange={e => editarVariable(c.id, { nombre: e.target.value })}
                                            placeholder="Nombre (ej. Comisión delivery)"
                                            className={campo}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => borrarVariable(c.id)}
                                            aria-label={`Eliminar ${c.nombre || 'coste variable'}`}
                                            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                                        >
                                            <Icon svg={ICONS.trash} className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={c.tipo}
                                            onChange={e => editarVariable(c.id, { tipo: e.target.value as 'fixed' | 'percentage' })}
                                            className={`${campo} w-32 shrink-0`}
                                        >
                                            <option value="fixed">Importe €</option>
                                            <option value="percentage">% del PVP</option>
                                        </select>
                                        <input
                                            type="number" min={0} step="any" value={c.valor}
                                            onChange={e => editarVariable(c.id, { valor: Number(e.target.value) })}
                                            className={`${campo} tabular-nums flex-1 min-w-0`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={añadirVariable}
                            className="mt-2.5 h-10 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider"
                        >
                            + Añadir coste variable
                        </button>
                    </Bloque>

                    {/* ── Resumen en vivo. Feedback inmediato, no un panel de análisis. */}
                    <div className="p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-200 space-y-1.5">
                        {r.desglose.map((l, i) => (
                            <div key={i} className="flex items-baseline justify-between gap-3 text-xs">
                                <span className="min-w-0 break-words text-slate-400">
                                    {l.concepto}
                                    {l.origen !== 'real' && <span className="ml-1.5 text-amber-500">{l.origen}</span>}
                                </span>
                                <span className="shrink-0 tabular-nums">{eur(l.importe)}</span>
                            </div>
                        ))}
                        <div className="flex items-baseline justify-between gap-3 pt-2 mt-1 border-t border-white/15">
                            <span className="text-sm font-bold">Coste real servido</span>
                            <span className="text-lg font-bold tabular-nums text-emerald-400">{eur(r.realServedCost)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

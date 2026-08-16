import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { informeDeTaxonomia, duplicadasDeTaxonomia, GrupoTaxonomia } from '../../core/taxonomia/taxonomia';

/**
 * Informe de taxonomía. **Solo lectura: abrirlo no escribe nada.**
 *
 * Enseña a qué familia y subfamilia iría cada categoría del catálogo, y sobre
 * todo **qué cadenas distintas dicen lo mismo** — que es donde está el trabajo
 * de verdad. La migración no la hace este panel: la decide el fundador viendo
 * esto, y se ejecuta aparte.
 */

const Cifra: React.FC<{ n: React.ReactNode; etiqueta: string; color?: string }> = ({ n, etiqueta, color }) => (
    <div className="flex-1 min-w-0 text-center px-2">
        <div className={`text-xl font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-100'}`}>{n}</div>
        <div className="text-[9px] uppercase tracking-wider text-slate-400 truncate">{etiqueta}</div>
    </div>
);

const Casilla: React.FC<{ g: GrupoTaxonomia }> = ({ g }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
        <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {g.familia}
                {g.subfamilia && <span className="text-slate-400 font-normal"> ▸ </span>}
                {g.subfamilia}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">{g.fichas} fichas</span>
            {g.etiquetas.map(e => (
                <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    {e}
                </span>
            ))}
        </div>
        {g.originales.length > 1 && (
            <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
                Escrita de {g.originales.length} formas: {g.originales.map(o => `«${o.categoria}» (${o.fichas})`).join('  +  ')}
            </p>
        )}
        {g.confianza !== 'alta' && (
            <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{g.motivo}</p>
        )}
    </div>
);

export const TaxonomiaReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();

    const inf = React.useMemo(
        () => informeDeTaxonomia((allIngredients || []).map(i => ({ categoria: i.categoria }))),
        [allIngredients],
    );
    const duplicadas = React.useMemo(() => duplicadasDeTaxonomia(inf.grupos), [inf.grupos]);

    const familias = React.useMemo(() => {
        const m = new Map<string, number>();
        inf.grupos.forEach(g => m.set(g.familia, (m.get(g.familia) || 0) + g.fichas));
        return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    }, [inf.grupos]);

    /** Cuántas categorías desaparecerían al unir las que dicen lo mismo. */
    const sobran = duplicadas.reduce((a, g) => a + g.originales.length, 0) - duplicadas.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shrink-0">
                    <span className="p-2 rounded-xl bg-white/15"><Icon svg={ICONS.grid} className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base">Taxonomía — informe</h2>
                        <p className="text-[11px] text-white/80">Solo lectura. Nada se modifica desde aquí.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex divide-x divide-slate-200 dark:divide-slate-700 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <Cifra n={inf.totalCategorias} etiqueta="categorías hoy" />
                    <Cifra n={familias.length} etiqueta="familias" color="text-emerald-600" />
                    <Cifra n={inf.grupos.length} etiqueta="casillas" />
                    <Cifra n={sobran} etiqueta="sobran" color="text-amber-600" />
                    <Cifra n={inf.sinClasificar.length} etiqueta="no son categoría" color="text-rose-600" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 leading-relaxed">
                        La familia ya estaba escrita dentro de cada categoría —«ALGAS <strong>FRESCOS</strong>»,
                        «<strong>ESPECIALES</strong> MINIS»— porque no había dónde ponerla. Esto la lee; no
                        reclasifica nada a mano ni por parecido de texto.
                    </p>

                    {familias.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Familias</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {familias.map(([f, n]) => (
                                    <span key={f} className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
                                        {f} <span className="text-emerald-500/70 tabular-nums">{n}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {duplicadas.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">
                                Lo mismo, escrito de varias formas ({duplicadas.length})
                            </h3>
                            <div className="space-y-2">
                                {duplicadas.map(g => <Casilla key={g.familia + g.subfamilia} g={g} />)}
                            </div>
                        </div>
                    )}

                    {inf.sinClasificar.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2">
                                No son categorías ({inf.sinClasificar.length})
                            </h3>
                            <div className="space-y-2">
                                {inf.sinClasificar.map(g => (
                                    <div key={g.originales[0].categoria} className="rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-900/10 p-2.5">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                            «{g.originales[0].categoria}»
                                        </span>
                                        <span className="text-[10px] text-slate-400 tabular-nums ml-2">{g.fichas} fichas</span>
                                        <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{g.motivo}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Todas las casillas ({inf.grupos.length})
                        </h3>
                        <div className="space-y-2">
                            {inf.grupos.map(g => <Casilla key={g.familia + '▸' + g.subfamilia} g={g} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

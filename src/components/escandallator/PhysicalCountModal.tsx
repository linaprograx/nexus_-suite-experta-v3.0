import React from 'react';
import { StockItem } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Input } from '../ui/Input';
import { CapaModal } from '../ui/CapaModal';
import { buscar } from '../../core/search/buscador';
import { stockPorZona, progresoDeZona, SIN_ZONA } from '../../core/stock/zonas';
import { Ingredient } from '../../types';

export interface CountAdjustment {
    item: StockItem;
    counted: number;
    delta: number; // digital − counted (positive = remove, negative = add back)
}

/**
 * #4 · Physical cycle count. The user enters the counted quantity per ingredient;
 * on save, only items whose count differs produce an 'adjustment' movement
 * (delta = digital − counted). Reuses the stock-movements ledger from #3.
 */
export const PhysicalCountModal: React.FC<{
    stockItems: StockItem[];
    allIngredients?: Ingredient[];
    onClose: () => void;
    onConfirm: (adjustments: CountAdjustment[]) => void;
}> = ({ stockItems, allIngredients = [], onClose, onConfirm }) => {
    const [counts, setCounts] = React.useState<Record<string, string>>({});
    const [search, setSearch] = React.useState('');

    /**
     * Punto 7: contar **por zonas**.
     *
     * El conteo ya hacía lo importante —no sobrescribe, genera un ajuste con
     * signo— pero pedía contar 1.326 productos de una sentada, y eso no se
     * hace: se cuenta la barra, luego el almacén, luego la cámara. Sin zonas un
     * conteo se empieza y no se termina, y **uno a medias es peor que ninguno**,
     * porque los ajustes que sí se guardaron parecen un inventario completo.
     */
    const [zona, setZona] = React.useState<string>('todas');
    const zonas = React.useMemo(() => stockPorZona(stockItems, allIngredients), [stockItems, allIngredients]);
    const enZona = React.useMemo(
        () => (zona === 'todas' ? stockItems : (zonas.find(z => z.zona === zona)?.items || [])),
        [zona, zonas, stockItems],
    );
    const progreso = React.useMemo(() => progresoDeZona(enZona, counts), [enZona, counts]);

    const items = React.useMemo(() => {
        // Alfabético y no por relevancia: en un conteo físico se recorre la
        // lista entera con las botellas delante, y el orden tiene que ser
        // estable para no perder el sitio.
        const encontrados = buscar(enZona, search, { camposDe: i => [i.ingredientName] });
        return [...encontrados].sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
    }, [enZona, search]);

    const adjustments: CountAdjustment[] = React.useMemo(() => {
        const out: CountAdjustment[] = [];
        for (const item of stockItems) {
            const raw = counts[item.ingredientId];
            if (raw === undefined || raw === '') continue;
            const counted = parseFloat(raw);
            if (isNaN(counted) || counted < 0) continue;
            const delta = Math.round((item.quantityAvailable - counted) * 1000) / 1000;
            if (delta !== 0) out.push({ item, counted, delta });
        }
        return out;
    }, [counts, stockItems]);

    return (
        <CapaModal onFondoPulsado={onClose}>
            <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 shrink-0 bg-gradient-to-r from-sky-600 to-cyan-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/15 text-white"><Icon svg={ICONS.list} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Conteo físico de inventario</h2>
                            <p className="text-xs text-white/80">Introduce lo contado; ajustamos las diferencias</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pt-3 shrink-0">
                    {/* La zona primero: decide QUÉ se cuenta. El buscador solo
                        decide dónde mirar dentro de eso, así que va detrás. */}
                    <div className="flex items-center gap-2 mb-2">
                        <select
                            value={zona}
                            onChange={e => setZona(e.target.value)}
                            aria-label="Zona a contar"
                            className="flex-1 min-w-0 h-10 px-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        >
                            <option value="todas">Todas las zonas ({stockItems.length})</option>
                            {zonas.map(z => (
                                <option key={z.zona} value={z.zona}>{z.zona} ({z.items.length}) · €{z.valor.toFixed(0)}</option>
                            ))}
                        </select>
                        <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-500" title="Contados de esta zona">
                            {progreso.hechos}/{progreso.total}
                        </span>
                    </div>
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ingrediente…" className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-sm" />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                    {items.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-10">Sin ingredientes en stock.</p>
                    ) : items.map(item => {
                        const raw = counts[item.ingredientId];
                        const counted = raw !== undefined && raw !== '' ? parseFloat(raw) : null;
                        const delta = counted != null && !isNaN(counted) ? item.quantityAvailable - counted : null;
                        return (
                            <div key={item.ingredientId} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.ingredientName}</p>
                                    <p className="text-[11px] text-slate-400">Digital: {Number.isInteger(item.quantityAvailable) ? item.quantityAvailable : item.quantityAvailable.toFixed(1)} {item.unit}</p>
                                </div>
                                {delta != null && delta !== 0 && (
                                    <span className={`text-[11px] font-bold tabular-nums ${delta > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {delta > 0 ? '−' : '+'}{Math.abs(delta).toFixed(1)}
                                    </span>
                                )}
                                <div className="w-20 shrink-0">
                                    <Input
                                        type="number"
                                        min="0"
                                        value={raw ?? ''}
                                        onChange={e => setCounts(c => ({ ...c, [item.ingredientId]: e.target.value }))}
                                        placeholder="cont."
                                        className="text-center h-9 text-sm bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200/60 dark:border-white/10 shrink-0 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {adjustments.length === 0 ? 'Sin diferencias' : `${adjustments.length} ajuste(s) a aplicar`}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                        <button
                            onClick={() => { onConfirm(adjustments); onClose(); }}
                            disabled={adjustments.length === 0}
                            className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${adjustments.length === 0 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
                        >
                            Aplicar ajustes
                        </button>
                    </div>
                </div>
            </div>
        </CapaModal>
    );
};

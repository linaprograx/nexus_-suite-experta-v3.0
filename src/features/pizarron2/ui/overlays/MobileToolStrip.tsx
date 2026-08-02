import React from 'react';
import { LuEllipsis, LuX } from 'react-icons/lu';
import { pizarronStore } from '../../state/store';
import {
    TOOLS, Tool, HERRAMIENTAS_PRIMARIAS,
    handleTool, herramientaActiva, herramientaPermitida,
} from './pizarronTools';

/**
 * Herramientas del lienzo en móvil: tira horizontal sobre la barra de
 * navegación, dentro del alcance del pulgar.
 *
 * El rail vertical de escritorio ocupaba 464px de alto flotando sobre el
 * lienzo — más de la mitad del espacio útil de un teléfono— y además tapaba
 * todo el lado izquierdo del dibujo.
 *
 * Doce herramientas no caben en 390px sin bajar de los 44px de objetivo
 * táctil, así que se muestran las cuatro de uso constante y el resto queda tras
 * "Más". Es el mismo criterio que la barra de navegación de la app: cinco
 * ranuras y lo demás a un toque.
 */

const NAV = 'calc(60px + env(safe-area-inset-bottom))';

const Boton: React.FC<{
    tool: Tool; activa: boolean; onClick: () => void; conEtiqueta?: boolean;
}> = ({ tool, activa, onClick, conEtiqueta }) => (
    <button
        onClick={onClick}
        aria-label={tool.label}
        aria-pressed={activa}
        className={`shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors active:scale-90
            ${conEtiqueta ? 'w-[4.5rem] h-16' : 'w-11 h-11'}
            ${activa
                ? 'bg-orange-50 dark:bg-orange-900/25 text-orange-600 dark:text-orange-400'
                : 'text-slate-600 dark:text-slate-300'}`}
    >
        {tool.icon}
        {conEtiqueta && <span className="text-[9px] font-semibold leading-tight text-center">{tool.label}</span>}
    </button>
);

export const MobileToolStrip: React.FC = () => {
    const activeTool = pizarronStore.useSelector(s => s.uiFlags.activeTool);
    const showLibrary = pizarronStore.useSelector(s => s.uiFlags.showLibrary);
    const showProjectManager = pizarronStore.useSelector(s => s.uiFlags.showProjectManager);
    const mode = pizarronStore.useSelector(s => s.interactionState.mode);
    const haySeleccion = pizarronStore.useSelector(s => (s.selection ? Array.from(s.selection).length : 0) > 0);
    const [masAbierto, setMasAbierto] = React.useState(false);

    // Con algo seleccionado manda el panel contextual, que ocupa esta misma
    // franja. Apilar ambos obligaría a mover la tira cada vez que el panel
    // cambia de altura, y un control que se desplaza bajo el dedo es peor que
    // uno que desaparece: tocar el lienzo deselecciona y la tira vuelve.
    React.useEffect(() => { if (haySeleccion) setMasAbierto(false); }, [haySeleccion]);
    if (haySeleccion) return null;

    const flags = { activeTool, showLibrary, showProjectManager };
    const usables = TOOLS.filter(t => t.type !== 'separator' && herramientaPermitida(t, mode));
    const primarias = usables.filter(t => HERRAMIENTAS_PRIMARIAS.includes(t.id));
    const resto = usables.filter(t => !HERRAMIENTAS_PRIMARIAS.includes(t.id));

    const usar = (tool: Tool) => { handleTool(tool); setMasAbierto(false); };

    return (
        <>
            <div
                className="lg:hidden fixed inset-x-0 z-[90] pointer-events-auto flex justify-center px-2"
                style={{ bottom: `calc(${NAV} + 0.5rem)` }}
                onPointerDown={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl">
                    {primarias.map(t => (
                        <Boton key={t.id} tool={t} activa={herramientaActiva(t, flags)} onClick={() => usar(t)} />
                    ))}

                    {resto.length > 0 && (
                        <>
                            <span className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                            <Boton
                                tool={{ id: 'more', label: 'Más', icon: <LuEllipsis size={20} /> }}
                                activa={masAbierto || resto.some(t => herramientaActiva(t, flags))}
                                onClick={() => setMasAbierto(v => !v)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* "Más": rejilla con etiquetas. Estas herramientas se usan de tarde en
                tarde, así que aquí el nombre importa más que la economía de espacio. */}
            {masAbierto && (
                <div className="lg:hidden fixed inset-0 z-[95] pointer-events-auto" onPointerDown={e => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMasAbierto(false)} />
                    <div
                        className="absolute inset-x-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl p-3"
                        style={{ bottom: `calc(${NAV} + 4.75rem)` }}
                    >
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Más herramientas</span>
                            <button onClick={() => setMasAbierto(false)} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center text-slate-400">
                                <LuX size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {resto.map(t => (
                                <Boton key={t.id} tool={t} activa={herramientaActiva(t, flags)} onClick={() => usar(t)} conEtiqueta />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

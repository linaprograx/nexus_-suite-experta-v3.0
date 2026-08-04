import React from 'react';
import { pizarronStore } from '../../state/store';
import { Inspector } from './Inspector';

/**
 * Panel contextual único del móvil.
 *
 * Sustituye a la pareja Inspector + MiniToolbar, que en escritorio conviven
 * porque sobra sitio —uno flota junto a la selección, el otro vive a la
 * derecha— pero que en un móvil competían por los mismos píxeles mostrando
 * propiedades solapadas del mismo nodo.
 *
 * Tres alturas:
 *  - `peek`   ~92px  · solo acciones rápidas; el lienzo sigue visible
 *  - `half`   45%    · propiedades del nodo seleccionado
 *  - `full`   85%    · todo, incluida la estructura interna
 *
 * Sin selección no se monta nada: el lienzo recupera la pantalla entera.
 */

type Snap = 'peek' | 'half' | 'full';
const ALTURA: Record<Snap, string> = { peek: '92px', half: '45dvh', full: '85dvh' };
/** Alto de la barra de navegación de la app, que este panel nunca debe tapar. */
const NAV = 'calc(60px + env(safe-area-inset-bottom))';

const Accion: React.FC<{ onClick: () => void; label: string; children: React.ReactNode; peligro?: boolean }> =
    ({ onClick, label, children, peligro }) => (
        <button
            onClick={onClick}
            aria-label={label}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors active:scale-90
                ${peligro
                    ? 'text-rose-500 active:bg-rose-50 dark:active:bg-rose-950/40'
                    : 'text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800'}`}
        >
            {children}
        </button>
    );

const Icono: React.FC<{ d: string }> = ({ d }) => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export const MobileContextPanel: React.FC = () => {
    const [snap, setSnap] = React.useState<Snap>('peek');
    const [seleccion, setSeleccion] = React.useState<string[]>([]);

    // El store no es un hook: nos suscribimos a mano y guardamos solo lo que
    // afecta a este panel, para no re-renderizar en cada movimiento del lienzo.
    React.useEffect(() => {
        const leer = () => {
            const s = pizarronStore.getState();
            const ids = Array.from(s.selection || []) as string[];
            setSeleccion(prev =>
                prev.length === ids.length && prev.every((v, i) => v === ids[i]) ? prev : ids
            );
        };
        leer();
        return pizarronStore.subscribe(leer);
    }, []);

    // Cada nueva selección abre a media altura, con las propiedades a la vista.
    // Empezar en 'peek' mostraba cuatro iconos y ninguna señal de que hubiera
    // más: parecía que el panel no tenía nada que ofrecer.
    React.useEffect(() => { setSnap('half'); }, [seleccion.join(',')]);

    if (seleccion.length === 0) return null;

    const varios = seleccion.length > 1;
    // El estado de bloqueo lo marca el primer seleccionado: con una selección
    // mixta, la acción unifica en vez de alternar cada nodo por su cuenta.
    const bloqueado = !!(pizarronStore.getState().nodes as any)?.[seleccion[0]]?.locked;
    const alinear = (modo: string) => (pizarronStore as any).alignSelected?.(modo);

    return (
        <div
            className="lg:hidden fixed inset-x-0 z-[100] pointer-events-auto flex flex-col
                       bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                       border-t border-slate-200 dark:border-white/10 rounded-t-3xl shadow-2xl
                       transition-[height] duration-300 ease-out"
            style={{ bottom: NAV, height: ALTURA[snap] }}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* Agarre: alterna entre las tres alturas sin necesidad de arrastrar */}
            <button
                onClick={() => setSnap(s => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'))}
                aria-label="Cambiar altura del panel"
                className="shrink-0 py-2 flex flex-col items-center gap-1"
            >
                <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {varios ? `${seleccion.length} elementos` : 'Selección'}
                    <span className="ml-1 font-normal normal-case tracking-normal text-slate-400/70">
                        · {snap === 'full' ? 'toca para reducir' : 'toca para ampliar'}
                    </span>
                </span>
            </button>

            {/* Acciones rápidas — visibles en las tres alturas */}
            <div className="shrink-0 flex items-center gap-1 px-2 pb-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
                <Accion label="Traer al frente" onClick={() => pizarronStore.bringToFront()}>
                    <Icono d="M12 19V5M5 12l7-7 7 7" />
                </Accion>
                <Accion label="Enviar al fondo" onClick={() => pizarronStore.sendToBack()}>
                    <Icono d="M12 5v14M5 12l7 7 7-7" />
                </Accion>

                <span className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

                {/* Alinear y distribuir: operan sobre la selección, así que viven
                    donde vive la selección, y no en una barra superior permanente. */}
                {varios && (['left', 'center', 'right'] as const).map(m => (
                    <Accion key={m} label={`Alinear ${m}`} onClick={() => alinear(m)}>
                        <Icono d={m === 'left' ? 'M4 4v16M8 8h12M8 16h8' : m === 'right' ? 'M20 4v16M4 8h12M8 16h8' : 'M12 4v16M6 8h12M8 16h8'} />
                    </Accion>
                ))}
                {varios && (
                    <Accion label="Agrupar" onClick={() => (pizarronStore as any).groupSelection?.()}>
                        <Icono d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
                    </Accion>
                )}
                <Accion label="Desagrupar" onClick={() => (pizarronStore as any).ungroupSelection?.()}>
                    <Icono d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M9 15l6-6" />
                </Accion>

                {/* Bloquear: el motor de interacción ya respeta `locked` al arrastrar
                    y al seleccionar, así que basta con marcar el nodo. */}
                <Accion
                    label={bloqueado ? 'Desbloquear' : 'Bloquear'}
                    onClick={() => seleccion.forEach(id => {
                        const n = pizarronStore.getState().nodes[id];
                        if (n) pizarronStore.updateNode(id, { locked: !bloqueado } as any);
                    })}
                >
                    <Icono d={bloqueado
                        ? 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14v10H5z'
                        : 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z'} />
                </Accion>

                <span className="flex-1" />

                <Accion label="Duplicar" onClick={() => { pizarronStore.copySelection(); pizarronStore.paste(); }}>
                    <Icono d="M8 8h12v12H8zM4 16V4h12" />
                </Accion>
                <Accion label="Eliminar" peligro onClick={() => pizarronStore.deleteNodes(seleccion)}>
                    <Icono d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </Accion>
            </div>

            {/* Propiedades: solo cuando hay sitio. Reutiliza el Inspector entero,
                así que no hay ni una propiedad que se pierda respecto a escritorio. */}
            {snap !== 'peek' && (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
                    <Inspector embedded />
                </div>
            )}
        </div>
    );
};

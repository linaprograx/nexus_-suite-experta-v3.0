import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useEdgeSwipe } from '../../hooks/useEdgeSwipe';

export interface StackedMobileShellProps {
    /** Rendered above the content, outside the scroll flow of the panels. */
    header?: React.ReactNode;
    /** The one thing the screen is about. Takes the full width. */
    main: React.ReactNode;
    /** Desktop's left column (history, filters, analysis). Becomes a sheet. */
    left?: React.ReactNode;
    /** Desktop's right column (detail, tools). Becomes a sheet. */
    right?: React.ReactNode;

    leftLabel?: string;
    rightLabel?: string;
    rightTitle?: string;
    rightSubtitle?: string;

    /** Lets the view drive the right sheet from its own selection state. */
    rightOpen?: boolean;
    onRightClose?: () => void;

    /** Tailwind bg-* class for the grabber and edge tabs, so each module keeps identity. */
    accentClass?: string;
    /** Painted behind everything. Each view supplies its own so it keeps its look. */
    background?: React.ReactNode;
    /**
     * Clases del degradado de la vista. Si se pasan, la cabecera queda **fija**
     * arriba en lugar de irse con el scroll.
     *
     * Se piden las clases y no un booleano porque la franja tiene que pintar
     * EXACTAMENTE el mismo degradado que el fondo, con `bg-fixed` para que
     * quede anclado al viewport igual que el fondo (que es `fixed`). Así la
     * banda es indistinguible de lo que hay detrás y no aparece la costura que
     * deja cualquier barra opaca sobre un degradado.
     */
    headerGradient?: string;
    id?: string;
}

/**
 * The mobile layout model: **three columns become three states.**
 *
 * The main content owns the screen and the side columns become bottom sheets,
 * reachable by dragging in from a screen edge or tapping the slim coloured tab
 * that marks it. Stacking the columns vertically instead — the naive responsive
 * answer — turns every screen into an endless scroll and loses the sense of
 * where you are.
 *
 * Shared by `PremiumLayout` (Grimorio, Colegium…) and by the views that paint
 * their own background and therefore cannot hand their whole shell over to it
 * (Cerebrity, Avatar). One implementation, so the gesture, the sheets and the
 * edge tabs behave identically everywhere.
 */
export const StackedMobileShell: React.FC<StackedMobileShellProps> = ({
    header, main, left, right,
    leftLabel = 'Análisis',
    rightLabel = 'Detalle',
    rightTitle, rightSubtitle,
    rightOpen, onRightClose,
    accentClass = 'bg-teal-500',
    background, headerGradient,
    id,
}) => {
    const [leftOpen, setLeftOpen] = React.useState(false);
    const [manualRightOpen, setManualRightOpen] = React.useState(false);

    const hasLeft = !!left;
    const hasRight = !!right;
    // Controlled by the view when it knows about selection; manual otherwise.
    const isRightOpen = rightOpen ?? manualRightOpen;
    const closeRight = () => { onRightClose?.(); setManualRightOpen(false); };

    const edgeSwipe = useEdgeSwipe({
        onSwipeFromLeft: hasLeft ? () => setLeftOpen(true) : undefined,
        onSwipeFromRight: hasRight ? () => setManualRightOpen(true) : undefined,
        disabled: leftOpen || isRightOpen,
    });

    const bothClosed = !leftOpen && !isRightOpen;

    return (
        <div
            id={id}
            // min-h-full, NOT h-full. With h-full this box measures exactly the height
            // of the scrolling <main> above it, so main's scrollHeight never exceeds
            // its clientHeight and nothing can scroll — the overflow is just clipped.
            // Letting it grow hands the scroll back to the page.
            className="min-h-full w-full flex flex-col relative"
            {...edgeSwipe}
        >
            {background}

            {header && (
                <div
                    className={`shrink-0 px-3 pt-3 z-30 ${headerGradient ? 'sticky' : 'relative'}`}
                    // Se ancla por debajo del área segura: con `top: 0` la cabecera
                    // se metería bajo el reloj y la batería al quedar fija.
                    style={headerGradient ? { top: 'env(safe-area-inset-top)' } : undefined}
                >
                    {headerGradient && (
                        <>
                            {/* Base opaca: el degradado se vuelve transparente al 45%,
                                así que por sí solo dejaría transparentar el contenido
                                que pasa por debajo. */}
                            <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 bg-slate-50 dark:bg-slate-950"
                                style={{ top: 'calc(-1 * env(safe-area-inset-top) - 0.5rem)' }} />
                            {/* El mismo degradado del fondo, anclado al viewport. */}
                            <div aria-hidden className={`absolute inset-x-0 bottom-0 -z-10 pointer-events-none bg-fixed ${headerGradient}`}
                                style={{ top: 'calc(-1 * env(safe-area-inset-top) - 0.5rem)' }} />
                        </>
                    )}
                    {header}
                </div>
            )}

            {/* No inner scroller and no min-h-0 clamp: the content grows and the page
                scrolls. Views must gate their own `h-full`/`overflow` behind `lg:`. */}
            <div className="grow px-3 pt-2 relative z-20 flex flex-col">
                {main}
            </div>

            {/* Edge affordances. The sheets open by dragging in from the edge, but a
                gesture with no visible cue is a feature nobody finds. These slim tabs
                make the edge legible and are tappable in their own right. */}
            {hasLeft && bothClosed && (
                <button
                    onClick={() => setLeftOpen(true)}
                    aria-label={leftLabel}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-6 h-24 flex items-center justify-start active:scale-95 transition-transform"
                >
                    <span className={`w-1.5 h-20 rounded-r-full shadow-md ${accentClass} opacity-70`} />
                </button>
            )}
            {hasRight && bothClosed && (
                <button
                    onClick={() => setManualRightOpen(true)}
                    aria-label={rightLabel}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-6 h-24 flex items-center justify-end active:scale-95 transition-transform"
                >
                    <span className={`w-1.5 h-20 rounded-l-full shadow-md ${accentClass} opacity-70`} />
                </button>
            )}

            {hasLeft && (
                <BottomSheet
                    open={leftOpen}
                    onClose={() => setLeftOpen(false)}
                    title={leftLabel}
                    accentClass={accentClass}
                    snaps={['half', 'full']}
                >
                    <div className="p-3">{left}</div>
                </BottomSheet>
            )}

            {hasRight && (
                <BottomSheet
                    open={isRightOpen}
                    onClose={closeRight}
                    title={rightTitle || rightLabel}
                    subtitle={rightSubtitle}
                    accentClass={accentClass}
                    snaps={['half', 'full']}
                    initialSnap="full"
                >
                    <div className="p-3">{right}</div>
                </BottomSheet>
            )}
        </div>
    );
};

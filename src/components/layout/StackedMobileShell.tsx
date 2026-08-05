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
    background,
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

    // La cabecera se queda fija arriba, y publica su altura en `--cabecera` para
    // que las barras de búsqueda de cada pestaña se anclen justo debajo sin que
    // nadie tenga que escribir un número a mano. Se mide en vez de fijarse
    // porque la cabecera cambia de alto entre pestañas y al colapsarse: un valor
    // escrito a mano se desincroniza en cuanto alguien toque el logo o las
    // pastillas, y el síntoma —una franja que tapa la primera fila— es de los
    // que cuesta relacionar con su causa.
    const refCabecera = React.useRef<HTMLDivElement>(null);
    const [altoCabecera, setAltoCabecera] = React.useState(0);
    React.useEffect(() => {
        const el = refCabecera.current;
        if (!el) return;
        const ro = new ResizeObserver(([entrada]) => setAltoCabecera(entrada.contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, [header]);

    return (
        <div
            id={id}
            // min-h-full, NOT h-full. With h-full this box measures exactly the height
            // of the scrolling <main> above it, so main's scrollHeight never exceeds
            // its clientHeight and nothing can scroll — the overflow is just clipped.
            // Letting it grow hands the scroll back to the page.
            className="min-h-full w-full flex flex-col relative"
            style={{ ['--cabecera' as any]: `${altoCabecera}px` }}
            {...edgeSwipe}
        >
            {background}

            {header && (
                <div ref={refCabecera} className="shrink-0 sticky top-0 px-3 pt-3 pb-1 z-30">
                    <div className="absolute inset-0 -z-10 backdrop-blur-md" />
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

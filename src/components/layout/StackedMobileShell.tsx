import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { FranjaFondo } from './FranjaFondo';
import { ID_HUECO_FRANJA } from './FranjaFija';
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
    style?: React.CSSProperties;
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
    background, headerGradient, style,
    id,
}) => {
    const [leftOpen, setLeftOpen] = React.useState(false);
    const [manualRightOpen, setManualRightOpen] = React.useState(false);

    const hasLeft = !!left;
    const hasRight = !!right;
    // `||`, no `??`. Con `??` solo se cedía el control si la vista pasaba
    // null/undefined, pero Grimorio pasa `detailOpen: !!seleccion`, que sin
    // selección vale `false` —no es nulo—, así que ganaba siempre y la pestaña
    // de borde quedaba inerte: se pulsaba y no ocurría nada.
    const isRightOpen = rightOpen || manualRightOpen;
    const closeRight = () => { onRightClose?.(); setManualRightOpen(false); };

    const edgeSwipe = useEdgeSwipe({
        onSwipeFromLeft: hasLeft ? () => setLeftOpen(true) : undefined,
        onSwipeFromRight: hasRight ? () => setManualRightOpen(true) : undefined,
        disabled: leftOpen || isRightOpen,
    });

    const bothClosed = !leftOpen && !isRightOpen;

    // La franja publica su altura real en `--franja-alto` para que las barras de
    // filtros de cada vista puedan pegarse justo debajo sin conocerla. Se mide en
    // vez de fijarse a mano porque la cabecera cambia de alto al plegarse, y un
    // número escrito a mano se quedaría desfasado en cuanto se toque el diseño.
    const franjaRef = React.useRef<HTMLDivElement>(null);
    const raizRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const franja = franjaRef.current, raiz = raizRef.current;
        if (!franja || !raiz) return;
        const publicar = () => raiz.style.setProperty('--franja-alto', `${franja.offsetHeight}px`);
        publicar();
        const ro = new ResizeObserver(publicar);
        ro.observe(franja);
        return () => ro.disconnect();
    }, [header, headerGradient]);

    return (
        <div
            id={id}
            // min-h-full, NOT h-full. With h-full this box measures exactly the height
            // of the scrolling <main> above it, so main's scrollHeight never exceeds
            // its clientHeight and nothing can scroll — the overflow is just clipped.
            // Letting it grow hands the scroll back to the page.
            ref={raizRef}
            className="min-h-full w-full flex flex-col relative"
            style={style}
            {...edgeSwipe}
        >
            {background}

            {header && (
                <div
                    ref={franjaRef}
                    // `fixed`, no `sticky`.
                    //
                    // Un elemento pegajoso sigue viviendo dentro del flujo: depende del
                    // contenedor de scroll que le toque y se descoloca cuando el
                    // navegador móvil recoge sus propias barras, que es el "se mueve un
                    // poco" al scrollear. Fijo no puede moverse.
                    //
                    // Se ancla en el borde real (`top: 0`) y mete el área segura como
                    // relleno propio: así su fondo cubre también la franja del reloj y
                    // ningún elemento puede asomar por encima al pasar por debajo.
                    className={`z-30 ${headerGradient ? 'fixed inset-x-0 top-0 lg:static lg:px-3 lg:pt-3' : 'relative shrink-0 px-3 pt-3'}`}
                    style={headerGradient
                        ? { paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingLeft: '0.75rem', paddingRight: '0.75rem' }
                        : undefined}
                >
                    {headerGradient && <FranjaFondo />}
                    {header}
                    {/* Aquí aterriza la barra de filtros de la vista. Al vivir DENTRO
                        de la cabecera, su alto entra en la misma medición y el
                        contenido reserva el hueco exacto: no hay dos bordes que
                        alinear ni rendija posible entre ambos. */}
                    {headerGradient && <div id={ID_HUECO_FRANJA} />}
                </div>
            )}

            {/* No inner scroller and no min-h-0 clamp: the content grows and the page
                scrolls. Views must gate their own `h-full`/`overflow` behind `lg:`. */}
            {/* La cabecera fija ya no ocupa sitio en el flujo, así que el contenido
                reserva su altura. Se usa la medida real publicada por la franja y no
                un número escrito a mano, que se desfasaría al plegarse el título. */}
            <div
                className="grow px-3 pt-2 relative z-20 flex flex-col"
                style={headerGradient ? { paddingTop: 'var(--franja-alto, 0px)' } : undefined}
            >
                {main}
            </div>

            {/* Pestañas de borde. Las hojas se abren arrastrando desde el borde, pero
                un gesto sin señal visible es una función que nadie encuentra.
                Eran una línea de 1,5px al 70% de opacidad: se veían apenas y su
                zona táctil, 24px, quedaba por debajo del mínimo cómodo. Ahora la
                marca es visible y el área de toque llega a 44px, sin robarle
                anchura al contenido —el botón es transparente salvo la marca—. */}
            {hasLeft && bothClosed && (
                <button
                    onClick={() => setLeftOpen(true)}
                    aria-label={leftLabel}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-11 h-28 flex items-center justify-start active:scale-95 transition-transform"
                >
                    <span className={`w-2 h-24 rounded-r-full shadow-lg ring-1 ring-black/10 ${accentClass}`} />
                </button>
            )}
            {hasRight && bothClosed && (
                <button
                    onClick={() => setManualRightOpen(true)}
                    aria-label={rightLabel}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-11 h-28 flex items-center justify-end active:scale-95 transition-transform"
                >
                    <span className={`w-2 h-24 rounded-l-full shadow-lg ring-1 ring-black/10 ${accentClass}`} />
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

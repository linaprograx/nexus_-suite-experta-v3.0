import React from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

/** Height each snap point occupies, as a fraction of the viewport. */
const SNAP_HEIGHT: Record<SheetSnap, number> = { peek: 0.32, half: 0.6, full: 0.92 };

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    /** Snap points allowed, in ascending order. Default: half → full. */
    snaps?: SheetSnap[];
    initialSnap?: SheetSnap;
    children: React.ReactNode;
    /** Accent for the grabber/header, so each module keeps its identity. */
    accentClass?: string;
}

/**
 * Mobile bottom sheet with drag-to-dismiss and snap points.
 *
 * Two details make it feel native rather than like a modal glued to the bottom:
 *  - Dragging only takes over when the scrollable content is already at the top,
 *    so a flick inside a long list scrolls it instead of closing the sheet.
 *  - Dismissal is velocity-aware: a quick flick closes even if the travelled
 *    distance is short, which is what the thumb expects.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    open,
    onClose,
    title,
    subtitle,
    snaps = ['half', 'full'],
    initialSnap,
    children,
    accentClass = 'bg-teal-500',
}) => {
    const [snap, setSnap] = React.useState<SheetSnap>(initialSnap || snaps[0]);
    const [dragY, setDragY] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const startY = React.useRef(0);
    const startTime = React.useRef(0);
    const canDrag = React.useRef(false);

    // Reset to the entry snap point each time it opens
    React.useEffect(() => {
        if (open) { setSnap(initialSnap || snaps[0]); setDragY(0); }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Lock the page behind the sheet so only the sheet scrolls
    React.useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // Escape closes (useful on tablets with a keyboard)
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const beginDrag = (clientY: number, fromHandle: boolean) => {
        // From the body, only start dragging if the content is scrolled to the top;
        // otherwise the gesture belongs to the list.
        canDrag.current = fromHandle || (scrollRef.current?.scrollTop ?? 0) <= 0;
        if (!canDrag.current) return;
        startY.current = clientY;
        startTime.current = Date.now();
        setDragging(true);
    };

    const moveDrag = (clientY: number) => {
        if (!canDrag.current) return;
        const delta = clientY - startY.current;
        if (delta < 0) {
            // Dragging up promotes to the next snap point instead of overshooting
            const next = snaps[snaps.indexOf(snap) + 1];
            if (next && delta < -60) { setSnap(next); setDragY(0); canDrag.current = false; return; }
            setDragY(delta * 0.25); // rubber-band
        } else {
            setDragY(delta);
        }
    };

    const endDrag = () => {
        if (!canDrag.current) { setDragging(false); return; }
        const dist = dragY;
        const velocity = dist / Math.max(1, Date.now() - startTime.current); // px/ms
        const height = window.innerHeight * SNAP_HEIGHT[snap];

        if (velocity > 0.6 || dist > height * 0.35) {
            const prev = snaps[snaps.indexOf(snap) - 1];
            if (prev) { setSnap(prev); setDragY(0); }   // step down one snap
            else { onClose(); }                          // already at the smallest → dismiss
        } else {
            setDragY(0); // snap back
        }
        setDragging(false);
        canDrag.current = false;
    };

    if (!open) return null;

    const heightVh = SNAP_HEIGHT[snap] * 100;
    // Backdrop dims proportionally to how far the sheet has been dragged away
    const progress = Math.min(1, dragY / (window.innerHeight * SNAP_HEIGHT[snap]));

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                style={{ opacity: 1 - progress, transition: dragging ? 'none' : 'opacity 220ms ease' }}
                onClick={onClose}
            />

            <div
                className="absolute inset-x-0 bottom-0 flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-white/10 overflow-hidden"
                style={{
                    height: `${heightVh}vh`,
                    transform: `translateY(${dragY}px)`,
                    transition: dragging ? 'none' : 'transform 260ms cubic-bezier(.32,.72,0,1), height 260ms cubic-bezier(.32,.72,0,1)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
                onPointerDown={e => beginDrag(e.clientY, false)}
                onPointerMove={e => dragging && moveDrag(e.clientY)}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                {/* Grabber — always draggable, whatever the scroll position */}
                <div
                    className="shrink-0 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onPointerDown={e => { e.stopPropagation(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); beginDrag(e.clientY, true); }}
                    onPointerMove={e => dragging && moveDrag(e.clientY)}
                    onPointerUp={endDrag}
                >
                    <div className={`mx-auto h-1.5 w-10 rounded-full ${accentClass} opacity-40`} />
                </div>

                {(title || subtitle) && (
                    <div className="shrink-0 px-5 pb-3 pt-1 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="min-w-0">
                            {title && <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h2>}
                            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="shrink-0 w-11 h-11 -mr-2 -mt-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

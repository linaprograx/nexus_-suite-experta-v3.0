import React, { useEffect, useState, useCallback } from 'react';
import { pizarronStore } from '../../state/store';
import { animateViewportTo, getNodeFocusViewport } from './cinematic';
import { BoardNode } from '../../engine/types';

export const PresentationMode: React.FC = () => {
    const [active, setActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);
    const [route, setRoute] = useState<'order' | 'selection'>('order');

    // 1. Subscribe to State
    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setActive(state.presentationState.isActive);
            setCurrentIndex(state.presentationState.currentIndex);
            setRoute(state.presentationState.route);

            // Calc total slides based on route
            const count = state.presentationState.route === 'order'
                ? state.order.length
                : state.selection.size;
            setTotalSlides(count);
        });
        return unsub;
    }, []);

    // 2. Navigation Logic
    const goToSlide = useCallback((index: number) => {
        const state = pizarronStore.getState();
        let targetId: string | null = null;

        let slideCount = 0;

        if (state.presentationState.route === 'selection' && state.selection.size > 0) {
            // Selection Route
            const selArray = Array.from(state.selection); // Potentially unstable view order? 
            // In a real app, we might sort by X/Y or Order. 
            // Using logic: "Selection Order" usually = insertion order in Set?
            // Let's use `state.order` filter for stability logic if needed, 
            // OR just Array.from (insertion order of selection).
            // Actually, sorting by `state.order` index is safest for consistent Next/Prev.
            const sortedSel = selArray.sort((a, b) => state.order.indexOf(a) - state.order.indexOf(b));

            slideCount = sortedSel.length;
            const wrappedIndex = (index + slideCount) % slideCount;
            targetId = sortedSel[wrappedIndex];
            pizarronStore.setPresentationIndex(wrappedIndex);
        } else {
            // Order Route (Fallback)
            slideCount = state.order.length;
            if (slideCount === 0) return;
            const wrappedIndex = (index + slideCount) % slideCount;
            targetId = state.order[wrappedIndex];
            pizarronStore.setPresentationIndex(wrappedIndex);
        }

        if (targetId) {
            const node = state.nodes[targetId];
            if (node) {
                // Determine container size? 
                // We assume window.innerWidth/Height or look up container?
                // For "Cinematic" usually full screen Pizarrón.
                // We can use window for now OR store needs container size tracked.
                // `renderer.width` exists in logic but not in store...
                // Let's guess typical size or fetch from DOM if we had ref.
                // Fallback: window.
                const viewport = getNodeFocusViewport(node, window.innerWidth, window.innerHeight, 80);
                if (viewport) {
                    animateViewportTo(viewport, 800);
                }
            }
        }
    }, []);

    // 3. Keyboard Shortcuts
    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            const state = pizarronStore.getState();
            // Global Shortcuts
            if (e.key === 'p' && !state.presentationState.isActive) {
                pizarronStore.setPresentationMode(true);
                // Start at 0 or current selection?
                // Creating a slideshow usually starts at 0 or focused.
                goToSlide(0);
                return;
            }

            if (!state.presentationState.isActive) return;

            // Presentation Mode Shortcuts
            if (e.key === 'Escape' || e.key === 'p') {
                pizarronStore.setPresentationMode(false);
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === ' ') {
                goToSlide(state.presentationState.currentIndex + 1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                goToSlide(state.presentationState.currentIndex - 1);
            }
        };

        window.addEventListener('keydown', handleDown);
        return () => window.removeEventListener('keydown', handleDown);
    }, [goToSlide]);

    if (!active) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-end pb-8 items-center">
            {/* Minimal Controller */}
            <div className="bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                    <span className="text-xs font-bold tracking-widest text-orange-400">PRESENTING</span>
                    <span className="text-xs text-zinc-400">
                        {currentIndex + 1} / {totalSlides}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => goToSlide(currentIndex - 1)}
                        className="hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => pizarronStore.setPresentationMode(false)}
                        className="hover:bg-red-500/20 text-red-400 px-3 py-1 rounded-md text-xs font-bold tracking-wide transition"
                    >
                        EXIT
                    </button>
                    <button
                        onClick={() => goToSlide(currentIndex + 1)}
                        className="hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
                    >
                        →
                    </button>
                </div>

                <div className="border-l border-white/20 pl-4">
                    <button
                        onClick={() => {
                            const newRoute = route === 'order' ? 'selection' : 'order';
                            pizarronStore.setPresentationRoute(newRoute);
                            pizarronStore.setPresentationIndex(0); // Reset
                            // Trigger re-focus immediate?
                            setTimeout(() => {
                                // Need to triggering jump logic again with new context.
                                // Calling goToSlide(0) here would use stale state in closure? No, goToSlide pulls store state. 
                                // Actually goToSlide depends on closure for route? No it gets state.
                                // But currentIndex update takes a tick.
                                // We can just rely on user clicking Next/Prev or better: force jump.
                            }, 50);
                        }}
                        className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition"
                    >
                        {route} Mode
                    </button>
                </div>
            </div>
        </div>
    );
};

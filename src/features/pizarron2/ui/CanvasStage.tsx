import React, { useEffect, useRef } from 'react';
import { renderer } from '../engine/renderer';
import { pizarronStore } from '../state/store';
import { interactionManager } from '../engine/interaction';

export const CanvasStage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafId = useRef<number>(0);

    // Initial Setup & Resize Observer
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // 1. Attach Renderer
        renderer.attach(canvas);

        // 2. Handle Resize
        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            renderer.resize(width, height);
            // Trigger a render immediately
            renderer.render(pizarronStore.getState());
        });

        resizeObserver.observe(container);

        // 3. Render Loop (Lazy or Continuous?)
        // For now, let's allow Store subscriptions to drive render, 
        // OR a continuous loop if we want smooth gesture inertia later.
        // Let's do Subscription-based for efficiency now.

        const render = () => {
            rafId.current = requestAnimationFrame(() => {
                renderer.render(pizarronStore.getState());
            });
        };

        // Initial render
        render();

        // Subscribe to Store
        const unsubscribe = pizarronStore.subscribe(render);

        return () => {
            resizeObserver.disconnect();
            unsubscribe();
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    // Pointer Events delegation
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        interactionManager.onPointerDown(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        interactionManager.onPointerMove(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        interactionManager.onPointerUp(e);
    };

    // Wheel is handled locally or via manager? 
    // Let's keep locally for now as manager didn't implement wheel yet, 
    // OR we should ideally move it. Use logic from previous step for now.
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const { viewport } = pizarronStore.getState();
            const delta = e.deltaY * -0.001;
            const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.1), 5);
            pizarronStore.updateViewport({ zoom: newZoom });
        } else {
            const { viewport } = pizarronStore.getState();
            pizarronStore.updateViewport({
                x: viewport.x - e.deltaX,
                y: viewport.y - e.deltaY
            });
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-slate-50 select-none touch-none"
        >
            <canvas
                ref={canvasRef}
                className="block w-full h-full outline-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                tabIndex={1} // For keyboard events
            />
        </div>
    );
};

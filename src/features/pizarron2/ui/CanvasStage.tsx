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

        // 1b. Attach Logic to Canvas (Fix for coordinates)
        interactionManager.setCanvas(canvas);

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
    // 3. Wheel Event (Non-passive for Zoom blocking)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault(); // Stop Browser Zoom/Scroll
            // Delegate to InteractionManager? 
            interactionManager.onWheel(e);
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-50 relative overflow-hidden touch-none">
            <canvas
                ref={canvasRef}
                className="block absolute top-0 left-0 outline-none"
                // Events delegated manually or via React?
                // React events are fine for Pointer, but Wheel needs non-passive.
                // Pointer inputs:
                onPointerDown={(e) => {
                    pizarronStore.setUIFlag('showLibrary', false);
                    interactionManager.onPointerDown(e);
                }}
                onPointerMove={(e) => interactionManager.onPointerMove(e)}
                onPointerUp={(e) => interactionManager.onPointerUp(e)}
                onPointerLeave={(e) => interactionManager.onPointerUp(e)}
            // onWheel removed from JSX to avoid collision
            />
        </div>
    );
};

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

        // 3. Render Loop (Continuous for smooth Motion System)
        let lastTime = 0;
        const renderLoop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to 100ms
            lastTime = time;

            const state = pizarronStore.getState();

            // Choreography: Cinematic Viewport Interpolation
            if (state.interactionState.targetViewport) {
                const target = state.interactionState.targetViewport;
                const current = state.viewport;

                // Frame-independent smoothing (approx t=0.15 at 60fps => ~9hz decay)
                // Decay formula: value += (target - value) * (1 - exp(-decay * dt))
                const decay = 10; // Adjustable stiffness
                const alpha = 1 - Math.exp(-decay * dt);

                const newViewport = {
                    x: current.x + (target.x - current.x) * alpha,
                    y: current.y + (target.y - current.y) * alpha,
                    zoom: current.zoom + (target.zoom - current.zoom) * alpha
                };

                // Check if close enough to snap
                const dx = Math.abs(newViewport.x - target.x);
                const dy = Math.abs(newViewport.y - target.y);
                const dz = Math.abs(newViewport.zoom - target.zoom);

                // Zoom-dependent snap threshold (pixels)
                if (dx < 0.5 && dy < 0.5 && dz < 0.001) {
                    // Snap & Stop
                    pizarronStore.updateViewport(target, false);
                } else {
                    // Update Frame
                    pizarronStore.updateViewport(newViewport, false);
                }
            }

            renderer.render(state);
            rafId.current = requestAnimationFrame(renderLoop);
        };

        rafId.current = requestAnimationFrame(renderLoop);

        // Theme Change Observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // No need to trigger render, loop handles it.
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => {
            resizeObserver.disconnect();
            observer.disconnect();
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
        <div ref={containerRef} className="w-full h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden touch-none">
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

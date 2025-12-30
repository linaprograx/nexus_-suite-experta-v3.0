import React, { useEffect, useRef, useState } from 'react';
import { usePizarronStore, pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';

const MAP_WIDTH = 200;
const MAP_HEIGHT = 150;
const PADDING = 20;

export const MiniMap: React.FC = () => {
    const store = usePizarronStore();
    const nodes = usePizarronStore(state => state.nodes);
    const viewport = usePizarronStore(state => state.viewport);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [mapBounds, setMapBounds] = useState({ minX: 0, minY: 0, scale: 1, w: 1, h: 1 });

    // Calculate Bounds & Scale
    useEffect(() => {
        const nodeIds = Object.keys(nodes);
        if (nodeIds.length === 0) return;

        // Initialize with fixed minimum world size to prevent "floating/inverted" perception
        // This anchors the coordinate system so movement is absolute relative to the center
        let minX = -2000, minY = -2000, maxX = 2000, maxY = 2000;

        nodeIds.forEach(id => {
            const n = nodes[id];
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.w);
            maxY = Math.max(maxY, n.y + n.h);
        });

        // Add padding
        minX -= 100; minY -= 100; maxX += 100; maxY += 100;

        const contentW = maxX - minX;
        const contentH = maxY - minY;
        const scaleX = MAP_WIDTH / contentW;
        const scaleY = MAP_HEIGHT / contentH;
        const scale = Math.min(scaleX, scaleY);

        setMapBounds({ minX, minY, scale, w: contentW, h: contentH });
    }, [nodes]); // Recalculate when nodes change (throttling might be needed for heavy apps)



    // Draw Map (Game Loop Style)
    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.fillStyle = '#f8fafc'; // Slate-50 bg
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

            const { minX, minY, scale } = mapBounds;

            // Draw Nodes
            Object.values(nodes).forEach(node => {
                const x = (node.x - minX) * scale;
                const y = (node.y - minY) * scale;
                const w = Math.max(node.w * scale, 2);
                const h = Math.max(node.h * scale, 2);

                ctx.fillStyle = node.type === 'board' ? '#cbd5e1' : '#e2e8f0';
                if (node.type === 'board') {
                    // Board Specific color
                    ctx.fillStyle = node.content.color && node.content.color !== 'transparent' ? node.content.color : '#e2e8f0';
                    // If gradient, just use simple color
                    if (node.content.gradient) ctx.fillStyle = '#c084fc'; // Purple hint for gradient
                }

                ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, w, h);
            });

            // Draw Viewport Rect
            // Inverting the sign calculation to match user's reported "Inverse" perception
            // Original was -viewport.x. Now using +viewport.x to flip direction.
            const worldVX = viewport.x / viewport.zoom;
            const worldVY = viewport.y / viewport.zoom;
            const worldVW = window.innerWidth / viewport.zoom;
            const worldVH = window.innerHeight / viewport.zoom;

            const vx = (worldVX - minX) * scale;
            const vy = (worldVY - minY) * scale;
            const vw = worldVW * scale;
            const vh = worldVH * scale;

            ctx.strokeStyle = '#3b82f6'; // Blue-500
            ctx.lineWidth = 2;
            ctx.strokeRect(vx, vy, vw, vh);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fillRect(vx, vy, vw, vh);

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [nodes, viewport, mapBounds]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        handleMove(e);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleMove = (e: React.PointerEvent) => {
        if (e.buttons === 0 && !isDragging) return;
        if (!isDragging && e.type === 'pointermove') return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Map Click (x,y) -> World (wx, wy)
        // x = (wx - minX) * scale  => wx = x/scale + minX
        const { minX, minY, scale } = mapBounds;
        const worldX = x / scale + minX;
        const worldY = y / scale + minY;

        // Center viewport on this world point
        // Viewport.x = -(WorldX * zoom) + ScreenCenter
        // We want WorldX to be centered.
        // Actually simplest is: move center of Viewport Rect to Click Point.
        // We are setting the TARGET CENTER.

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Target Viewport Position
        const newVpX = (screenW / 2) - (worldX * viewport.zoom);
        const newVpY = (screenH / 2) - (worldY * viewport.zoom);

        pizarronStore.updateViewport({ x: newVpX, y: newVpY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
            <canvas
                ref={canvasRef}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                className="cursor-crosshair touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handleMove}
                onPointerUp={handlePointerUp}
            />
        </div>
    );
};

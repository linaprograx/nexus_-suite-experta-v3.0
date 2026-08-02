import React, { useEffect, useRef, useState } from 'react';
import { usePizarronStore, pizarronStore } from '../../state/store';
import { canvasSize } from '../CanvasStage';

const MAP_W = 200;
const MAP_H = 140;

export const MiniMap: React.FC = () => {
    const nodes = usePizarronStore(state => state.nodes);
    const viewport = usePizarronStore(state => state.viewport);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Compute world bounds from nodes — fixed minimum world so empty canvas still shows
    const getBounds = () => {
        const nodeList = Object.values(nodes);
        let minX = -1500, minY = -1500, maxX = 1500, maxY = 1500;
        nodeList.forEach(n => {
            minX = Math.min(minX, n.x - 50);
            minY = Math.min(minY, n.y - 50);
            maxX = Math.max(maxX, n.x + n.w + 50);
            maxY = Math.max(maxY, n.y + n.h + 50);
        });
        const wW = maxX - minX;
        const wH = maxY - minY;
        const scale = Math.min(MAP_W / wW, MAP_H / wH);
        // Center content in the minimap
        const offsetX = (MAP_W - wW * scale) / 2;
        const offsetY = (MAP_H - wH * scale) / 2;
        return { minX, minY, scale, offsetX, offsetY };
    };

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        let raf: number;

        const render = () => {
            ctx.clearRect(0, 0, MAP_W, MAP_H);

            // Background
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, MAP_W, MAP_H);

            const { minX, minY, scale, offsetX, offsetY } = getBounds();

            const toMapX = (wx: number) => (wx - minX) * scale + offsetX;
            const toMapY = (wy: number) => (wy - minY) * scale + offsetY;

            // Draw nodes — use actual color but enforce contrast on the minimap
            Object.values(nodes).forEach(node => {
                if (node.collapsed) return; // skip collapsed

                const x = toMapX(node.x);
                const y = toMapY(node.y);
                const w = Math.max(node.w * scale, 3);
                const h = Math.max(node.h * scale, 3);

                if (node.type === 'board') {
                    // Fill: actual board color blended with a darker overlay for contrast
                    const rawColor = node.content.color && node.content.color !== 'transparent'
                        ? node.content.color : '#e2e8f0';
                    ctx.fillStyle = rawColor;
                    ctx.fillRect(x, y, w, h);
                    // Always draw a visible border so light boards are distinguishable
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x, y, w, h);
                } else {
                    // Non-board nodes: small solid dots
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(x, y, Math.max(w, 3), Math.max(h, 3));
                }
            });

            // Viewport rect — use actual canvas size, not window size
            const cW = canvasSize.w || MAP_W;
            const cH = canvasSize.h || MAP_H;

            const worldVX = -viewport.x / viewport.zoom;
            const worldVY = -viewport.y / viewport.zoom;
            const worldVW = cW / viewport.zoom;
            const worldVH = cH / viewport.zoom;

            const vx = toMapX(worldVX);
            const vy = toMapY(worldVY);
            const vw = worldVW * scale;
            const vh = worldVH * scale;

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.strokeRect(vx, vy, vw, vh);
            ctx.fillStyle = 'rgba(59,130,246,0.10)';
            ctx.fillRect(vx, vy, vw, vh);

            raf = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(raf);
    }, [nodes, viewport]);

    // Click/drag to pan the main canvas
    const worldFromMap = (mapX: number, mapY: number) => {
        const { minX, minY, scale, offsetX, offsetY } = getBounds();
        return {
            wx: (mapX - offsetX) / scale + minX,
            wy: (mapY - offsetY) / scale + minY,
        };
    };

    const panTo = (e: React.PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mapX = e.clientX - rect.left;
        const mapY = e.clientY - rect.top;
        const { wx, wy } = worldFromMap(mapX, mapY);
        const cW = canvasSize.w || window.innerWidth;
        const cH = canvasSize.h || window.innerHeight;
        pizarronStore.updateViewport({
            x: cW / 2 - wx * viewport.zoom,
            y: cH / 2 - wy * viewport.zoom,
        });
    };

    return (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 select-none">
            <canvas
                ref={canvasRef}
                width={MAP_W}
                height={MAP_H}
                className="cursor-crosshair touch-none block"
                onPointerDown={(e) => { setIsDragging(true); panTo(e); e.currentTarget.setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => { if (isDragging) panTo(e); }}
                onPointerUp={(e) => { setIsDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
            />
        </div>
    );
};

import { BoardState, BoardNode, Viewport } from './types';

export class PizarronRenderer {
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 0;
    private height: number = 0;

    attach(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize: alpha false implies opaque background
        this.width = canvas.width;
        this.height = canvas.height;
    }

    resize(w: number, h: number) {
        if (!this.ctx) return;
        this.width = w;
        this.height = h;
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
    }

    render(state: BoardState) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const { viewport, nodes, order, selection, uiFlags, interactionState } = state;

        // 1. Clear & Background
        ctx.fillStyle = '#f8fafc'; // Slate-50 equivalent
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Setup Camera Transform
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);

        // 3. Draw Grid (Optimized Pattern)
        if (uiFlags.gridEnabled) {
            this.drawGrid(ctx, viewport, this.width, this.height);
        }

        // 4. Draw Nodes (Culling could be added here)
        // Optimization: Get visible bounds in World Coords
        // const visibleRect = this.getVisibleRect(viewport);

        for (const id of order) {
            const node = nodes[id];
            if (!node) continue;
            // Simple Culling Check
            // if (!intersects(node, visibleRect)) continue;

            this.drawNode(ctx, node, selection.has(id));
        }

        // 5. Draw Marquee
        if (interactionState.marquee) {
            const { x, y, w, h } = interactionState.marquee;
            ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'; // Orange-500 @ 10%
            ctx.strokeStyle = '#f97316'; // Orange-500
            ctx.lineWidth = 1 / viewport.zoom; // Constant hairline

            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.fill();
            ctx.stroke();
        }

        // 6. Debug Overlay
        if (uiFlags.debug) {
            ctx.save(); // Nested save (rarely needed but safe)
            // Restore to screen space for text? No, use restore later
            ctx.fillStyle = 'red';
            // ctx.fillText(...) in world space scales text. 
        }

        ctx.restore(); // Back to Screen Space

        // HUD Layer (Static atop world)
        if (uiFlags.debug) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText(`View: ${Math.round(viewport.x)},${Math.round(viewport.y)} | Nodes: ${order.length}`, 10, 20);
            if (selection.size > 0) ctx.fillText(`Sel: ${selection.size}`, 10, 40);
        }
    }

    private drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, w: number, h: number) {
        const gridSize = 40;
        const dotSize = 2 / vp.zoom; // Keep dots consistent size on screen OR let them scale?
        // Let's keep dots scale with zoom for "physical" feel, or minimal 1px.
        // Actually, most infinite canvases keep consistent visual size or fade out.
        // Let's use simple dots.

        ctx.fillStyle = '#cbd5e1'; // Slate-300

        // Calculate visible range to loop only necessary dots
        // World TopLeft
        const startX = Math.floor((-vp.x) / vp.zoom / gridSize) * gridSize;
        const startY = Math.floor((-vp.y) / vp.zoom / gridSize) * gridSize;

        // World BottomRight
        const endX = startX + (w / vp.zoom) + gridSize;
        const endY = startY + (h / vp.zoom) + gridSize;

        for (let x = startX; x < endX; x += gridSize) {
            for (let y = startY; y < endY; y += gridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    private drawNode(ctx: CanvasRenderingContext2D, node: BoardNode, isSelected: boolean) {
        const { x, y, w, h } = node;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = isSelected ? 15 : 4;
        ctx.shadowOffsetY = isSelected ? 4 : 2;

        // Base Shape
        ctx.fillStyle = node.content.color || '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();

        // Border
        ctx.shadowColor = 'transparent'; // clear shadow for stroke
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeStyle = isSelected ? '#f97316' : '#e2e8f0'; // Orange-500 : Slate-200
        ctx.stroke();

        // Content
        if (node.content.title) {
            ctx.fillStyle = '#1e293b'; // Slate-800
            ctx.font = 'bold 16px sans-serif'; // Can use custom font if loaded
            ctx.fillText(node.content.title, x + 16, y + 24, w - 32);
        }

        if (node.content.body) {
            ctx.fillStyle = '#64748b'; // Slate-500
            ctx.font = '14px sans-serif';
            ctx.fillText(node.content.body, x + 16, y + 48, w - 32);
        }
    }
}

export const renderer = new PizarronRenderer();

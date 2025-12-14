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

        // 4. Draw Nodes (Sorted by Z-Index)
        const sortedNodes = order
            .map(id => nodes[id])
            .filter(n => !!n)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        for (const node of sortedNodes) {
            // Simple Culling Check (Optional)
            // if (!intersects(node, visibleRect)) continue;
            this.drawNode(ctx, node, selection.has(node.id), viewport.zoom);
        }

        // 5. Draw Marquee
        if (interactionState.marquee) {
            const { x, y, w, h } = interactionState.marquee;
            ctx.fillStyle = 'rgba(249, 115, 22, 0.1)'; // Orange-500 @ 10%
            ctx.strokeStyle = '#f97316'; // Orange-500
            ctx.lineWidth = 1 / viewport.zoom;

            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.fill();
            ctx.stroke();
        }

        // 5b. Draw Creation Ghost
        if (interactionState.creationDraft) {
            const draft = interactionState.creationDraft;
            if (draft.x !== undefined && draft.y !== undefined && draft.w !== undefined) {
                ctx.save();
                ctx.globalAlpha = 0.6;
                // Mock node for drawing
                this.drawNode(ctx, draft as BoardNode, true, viewport.zoom);
                ctx.restore();
            }
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

    private imageCache = new Map<string, HTMLImageElement>();

    private drawNode(ctx: CanvasRenderingContext2D, node: BoardNode, isSelected: boolean, zoom: number) {
        ctx.save();
        ctx.translate(node.x, node.y);

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = isSelected ? 15 : 4;
        ctx.shadowOffsetY = isSelected ? 4 : 2;

        if (node.type === 'shape') {
            const shape = node.content.shapeType || 'rectangle';
            const borderWidth = node.content.borderWidth || 0;
            const borderColor = node.content.borderColor || '#334155';
            const radius = node.content.borderRadius || 0;

            ctx.fillStyle = node.content.color || '#cbd5e1';
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;

            ctx.beginPath();
            if (shape === 'circle') {
                ctx.ellipse(node.w / 2, node.h / 2, node.w / 2, node.h / 2, 0, 0, Math.PI * 2);
            } else if (shape === 'triangle') {
                const pad = borderWidth / 2;
                ctx.moveTo(node.w / 2, pad);
                ctx.lineTo(node.w - pad, node.h - pad);
                ctx.lineTo(pad, node.h - pad);
                ctx.closePath();
            } else if (shape === 'star') {
                ctx.moveTo(node.w / 2, 0);
                // ... (simplified star)
                ctx.lineTo(node.w * 0.8, node.h / 2);
                ctx.lineTo(node.w, node.h);
                ctx.lineTo(node.w / 2, node.h * 0.8);
                ctx.lineTo(0, node.h);
                ctx.lineTo(node.w * 0.2, node.h / 2);
                ctx.closePath();
            } else {
                if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, radius);
                else ctx.rect(0, 0, node.w, node.h);
            }

            ctx.fill();
            if (borderWidth > 0) ctx.stroke();
        }
        else if (node.type === 'line') {
            ctx.strokeStyle = node.content.color || '#334155';
            ctx.lineWidth = node.content.strokeWidth || 4;
            ctx.lineCap = 'round';

            // Arrows Logic
            const hasStart = node.content.startArrow;
            const hasEnd = node.content.endArrow;
            const arrowSize = (node.content.strokeWidth || 4) * 3;

            // Simple line path
            let sx = 0, sy = 0, ex = node.w, ey = node.h;

            if (node.content.lineType === 'curved') {
                // Curve
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.bezierCurveTo(node.w / 2, 0, node.w / 2, node.h, ex, ey);
                ctx.stroke();

                // Arrows for curve (simplified: approximate angle at ends)
                // TODO: complex calc for robust curve arrows, skip for now or use simple tangent
            } else {
                // Straight
                // Back off for arrows
                const angle = Math.atan2(ey - sy, ex - sx);
                const backOff = arrowSize / 1.5;

                if (hasStart) {
                    sx += Math.cos(angle) * backOff;
                    sy += Math.sin(angle) * backOff;
                }
                if (hasEnd) {
                    ex -= Math.cos(angle) * backOff;
                    ey -= Math.sin(angle) * backOff;
                }

                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(ex, ey);
                ctx.stroke();

                // Draw Arrows
                if (hasStart) {
                    this.drawArrowHead(ctx, 0, 0, angle + Math.PI, arrowSize, node.content.color || '#334155');
                }
                if (hasEnd) {
                    this.drawArrowHead(ctx, node.w, node.h, angle, arrowSize, node.content.color || '#334155');
                }
            }
        }
        else if (node.type === 'image') {
            const src = node.content.src;
            const opacity = node.content.opacity ?? 1;
            const radius = node.content.borderRadius || 0;
            if (src) {
                let img = this.imageCache.get(src);
                if (!img) {
                    img = new Image();
                    img.src = src;
                    this.imageCache.set(src, img);
                }
                if (img.complete) {
                    ctx.save();
                    if (radius > 0) {
                        ctx.beginPath();
                        if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, radius);
                        else ctx.rect(0, 0, node.w, node.h);
                        ctx.clip();
                    }
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(img, 0, 0, node.w, node.h);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#eff6ff'; ctx.fillRect(0, 0, node.w, node.h);
                }
            } else {
                ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, node.w, node.h);
                ctx.fillStyle = '#64748b'; ctx.fillText("IMG", node.w / 2 - 10, node.h / 2);
            }
        }
        else if (node.type === 'text') {
            const fontSize = node.content.fontSize || 16;
            const fontWeight = node.content.fontWeight || 'normal';
            // ... (keep text logic)
            // Re-implementing briefly to keep context valid
            const fontStyle = node.content.fontStyle || 'normal';
            const align = node.content.textAlign || 'left';
            const decoration = node.content.textDecoration || 'none';
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = node.content.color || '#1e293b';
            ctx.textBaseline = 'top';
            let xAnchor = 5;
            if (align === 'center') xAnchor = node.w / 2;
            if (align === 'right') xAnchor = node.w - 5;
            ctx.textAlign = align;
            const lines = (node.content.title || '').split('\n');
            lines.forEach((line, i) => {
                const y = 5 + (i * (fontSize * 1.2));
                ctx.fillText(line, xAnchor, y);
                if (decoration === 'underline') {
                    const width = ctx.measureText(line).width;
                    let ux = xAnchor;
                    if (align === 'center') ux -= width / 2;
                    if (align === 'right') ux -= width;
                    ctx.fillRect(ux, y + fontSize, width, 1);
                }
            });
            ctx.textAlign = 'left';
        }
        else if (node.type === 'board') {
            // ... Board logic with Border
            ctx.fillStyle = node.content.color || '#f8fafc';
            const borderWidth = node.content.borderWidth || 2;
            const borderColor = node.content.borderColor || '#e2e8f0';

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, 16);
            else ctx.rect(0, 0, node.w, node.h);
            ctx.fill();

            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = borderColor;
            if (borderWidth > 0) ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText((node.content.title || 'BOARD').toUpperCase(), 20, 30);
        }
        else {
            // Card / Generic
            ctx.fillStyle = node.content.color || '#ffffff';
            ctx.fillRect(0, 0, node.w, node.h);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(0, 0, node.w, node.h);
            ctx.fillStyle = '#0f172a';
            ctx.font = '14px sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(node.content.title || '', 10, 10);

            // Status Pill
            if (node.content.status) {
                const s = node.content.status;
                const statusColor = s === 'done' ? '#22c55e' : s === 'in-progress' ? '#3b82f6' : '#94a3b8';
                const statusBg = s === 'done' ? '#dcfce7' : s === 'in-progress' ? '#dbeafe' : '#f1f5f9';

                // Draw pill at bottom right
                const pillW = 60, pillH = 20;
                const px = node.w - pillW - 10;
                const py = node.h - pillH - 10;

                ctx.fillStyle = statusBg;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(px, py, pillW, pillH, 10);
                else ctx.rect(px, py, pillW, pillH);
                ctx.fill();

                ctx.fillStyle = statusColor;
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(s.toUpperCase(), px + pillW / 2, py + 5);
                ctx.textAlign = 'left';
            }
        }

        // Selection Ring (Keep existing)
        if (isSelected) {
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2 / zoom;
            ctx.strokeRect(0, 0, node.w, node.h);
            // Handles...
            const handleVisualSize = 8;
            const handleSize = handleVisualSize / zoom;
            const half = handleSize / 2;
            ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.5 / zoom;
            const coords = [{ x: -half, y: -half }, { x: node.w - half, y: -half }, { x: node.w - half, y: node.h - half }, { x: -half, y: node.h - half }];
            coords.forEach(h => { ctx.beginPath(); ctx.rect(h.x, h.y, handleSize, handleSize); ctx.fill(); ctx.stroke(); });
        }

        ctx.restore();
    }

    private drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, size / 2);
        ctx.lineTo(-size, -size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

export const renderer = new PizarronRenderer();

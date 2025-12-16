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
            this.drawNode(ctx, node, selection.has(node.id), viewport.zoom, nodes);
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

        // 5. Selection Overlay (World Space, but on top)
        if (state.selection.size > 0) {
            ctx.save();
            ctx.scale(viewport.zoom, viewport.zoom);
            ctx.translate(viewport.x / viewport.zoom, viewport.y / viewport.zoom);
            this.drawSelectionOverlay(ctx, state, viewport.zoom);
            ctx.restore();
        }

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

    private drawIcon(ctx: CanvasRenderingContext2D, node: BoardNode) {
        const { w, h } = node; // Use local w/h
        const color = node.content.color || '#334155';
        const pathData = node.content.path;

        if (!pathData) return;

        ctx.save();
        // Removed ctx.translate(x, y) because context is already translated in drawNode

        // Scale to fit. Standard viewbox 24x24 assumed for these paths.
        const scaleX = w / 24;
        const scaleY = h / 24;
        ctx.scale(scaleX, scaleY);

        const p = new Path2D(pathData);
        ctx.fillStyle = color;
        ctx.fill(p);

        ctx.restore();
    }

    private drawText(ctx: CanvasRenderingContext2D, node: BoardNode) {
        const { w, h } = node;
        const { title, fontSize = 20, fontWeight = 'normal', fontStyle = 'normal', fontFamily = 'Inter', color = '#000000', align = 'left' } = node.content;

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align as CanvasTextAlign || 'left';
        ctx.textBaseline = 'top';

        // Word wrap logic
        const words = (title || '').split(' ');
        let line = '';
        let testLine = '';
        let metrics;

        // Start drawing at (0, 0) relative to node top-left
        let x = 0;
        let ly = 0; // Local Y

        if (align === 'center') x = w / 2;
        if (align === 'right') x = w;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            metrics = ctx.measureText(testLine);
            if (metrics.width > w && n > 0) {
                ctx.fillText(line, x, ly);
                line = words[n] + ' ';
                ly += (fontSize * 1.2);
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, ly);
    }

    private drawComposite(ctx: CanvasRenderingContext2D, node: BoardNode) {
        const { composite } = node.content;
        if (!composite) return;

        const { structure, cells } = composite;
        const { rows, cols, gap = 0, padding = 0 } = structure;

        // Calculate available area
        const availW = node.w - (padding * 2);
        const availH = node.h - (padding * 2);

        const cellW = (availW - ((cols - 1) * gap)) / cols;
        const cellH = (availH - ((rows - 1) * gap)) / rows;

        ctx.save();

        // Draw Container Background if generic color is set (usually transparent for composites if cells have color)
        // But if borderWidth is set on parent, draw border
        if (node.content.borderWidth || node.content.borderColor) {
            ctx.strokeStyle = node.content.borderColor || '#cbd5e1';
            ctx.lineWidth = node.content.borderWidth || 1;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, node.content.borderRadius || 0);
            else ctx.rect(0, 0, node.w, node.h);
            ctx.stroke();
        }

        cells.forEach(cell => {
            // Calculate Cell Rect
            const cellX = padding + (cell.col * (cellW + gap));
            const cellY = padding + (cell.row * (cellH + gap));

            // Draw Cell Background
            if (cell.color) {
                ctx.fillStyle = cell.color;
                ctx.beginPath();
                const r = 8; // Internal radius
                if (ctx.roundRect) ctx.roundRect(cellX, cellY, cellW, cellH, r);
                else ctx.rect(cellX, cellY, cellW, cellH);
                ctx.fill();
            }

            // Draw Cell Text
            if (cell.text) {
                ctx.fillStyle = cell.textColor || node.content.color || '#1e293b';
                // Use node font styles as base
                const fontSize = node.content.fontSize || 14;
                ctx.font = `bold ${fontSize}px "${node.content.fontFamily || 'Inter'}", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Center text in cell
                const textX = cellX + cellW / 2;
                const textY = cellY + cellH / 2;

                // Simple multi-line support
                const lines = cell.text.split('\n');
                const lineHeight = fontSize * 1.4;
                const totalH = lines.length * lineHeight;
                let startY = textY - (totalH / 2) + (lineHeight / 2);

                lines.forEach((line, i) => {
                    // Clip text to cell?
                    // ctx.save();
                    // ctx.beginPath(); ctx.rect(cellX, cellY, cellW, cellH); ctx.clip();
                    ctx.fillText(line, textX, startY + (i * lineHeight));
                    // ctx.restore();
                });
            }
        });

        ctx.restore();
    }

    private drawNode(ctx: CanvasRenderingContext2D, node: BoardNode, isSelected: boolean, zoom: number, nodes?: Record<string, BoardNode>) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(node.rotation || 0);

        if (node.type === 'composite') {
            this.drawComposite(ctx, node);
        }
        else if (node.type === 'group' && node.childrenIds && nodes) {
            // Draw Group debug border if needed, or rely on Selection Overlay

            // Draw Children (Absolute Coords -> Reset Transform)
            ctx.save();
            ctx.rotate(-(node.rotation || 0));
            ctx.translate(-node.x, -node.y);

            node.childrenIds.forEach(childId => {
                const child = nodes[childId];
                if (child) {
                    this.drawNode(ctx, child, false, zoom, nodes);
                }
            });
            ctx.restore();

            ctx.restore();
            return;
        }

        // For non-group nodes, apply rotation around center
        // The initial translate(node.x, node.y) and rotate(node.rotation || 0)
        // effectively moved the origin to the node's top-left and rotated it.
        // Now, to rotate around the center of the node, we need to adjust.
        // We want to draw the node as if its top-left is (0,0) in the current transformed space.
        // So, we translate to the center relative to (0,0), rotate, then translate back.
        const cx = node.w / 2;
        const cy = node.h / 2;
        ctx.translate(cx, cy); // Translate to center of node (relative to current origin)
        // Rotation was already applied at the start, so we don't apply it again here.
        ctx.translate(-node.w / 2, -node.h / 2); // Translate back to top-left for drawing

        // Apply Global Filters (Blur / Shadow)
        if (node.content.filters) {
            const { blur, shadow } = node.content.filters;
            if (blur) {
                ctx.filter = `blur(${blur}px)`;
            }
            if (shadow) {
                ctx.shadowColor = shadow.color;
                ctx.shadowBlur = shadow.blur;
                ctx.shadowOffsetX = shadow.offsetX;
                ctx.shadowOffsetY = shadow.offsetY;
            }
        } else {
            // Default shadow if no custom filters are defined
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = isSelected ? 15 : 4;
            ctx.shadowOffsetY = isSelected ? 4 : 2;
        }

        // Universal Opacity
        if (node.content.opacity !== undefined) {
            ctx.globalAlpha = node.content.opacity;
        }

        if (node.type === 'shape') {
            const shape = node.content.shapeType || 'rectangle';
            const borderWidth = node.content.borderWidth || 0;
            const borderColor = node.content.borderColor || '#334155';
            const radius = node.content.borderRadius || 0;

            // Enhanced Gradient Logic
            if (node.content.gradient) {
                try {
                    const g = node.content.gradient;
                    // Simple heuristic for linear gradient string: "linear-gradient(deg, #color1 pos, #color2 pos)"
                    // For now, we enforce a simple diagonal gradient from TopLeft to BottomRight
                    // extracting the first two colors found.

                    const grd = ctx.createLinearGradient(0, 0, node.w, node.h);

                    // Regex to find hex colors
                    const colors = typeof g === 'string' ? g.match(/#[a-fA-F0-9]{6}/g) : null;

                    if (colors && colors.length >= 2) {
                        grd.addColorStop(0, colors[0]);
                        grd.addColorStop(1, colors[1]);
                    } else {
                        // Fallback if parsing fails
                        grd.addColorStop(0, '#cbd5e1');
                        grd.addColorStop(1, '#94a3b8');
                    }
                    ctx.fillStyle = grd;
                } catch (e) {
                    // Fallback on error
                    ctx.fillStyle = node.content.color || '#cbd5e1';
                }
            } else {
                ctx.fillStyle = node.content.color || '#cbd5e1';
            }
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;

            // Line Dash Support
            const style = node.content.strokeStyle || 'solid';
            if (style === 'dashed') {
                ctx.setLineDash([10, 10]);
            } else if (style === 'dotted') {
                ctx.setLineDash([3, 6]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            // Use 0, 0, node.w, node.h because the context is already translated
            const currentX = 0;
            const currentY = 0;
            const currentW = node.w;
            const currentH = node.h;

            if (shape === 'circle') {
                ctx.ellipse(currentX + currentW / 2, currentY + currentH / 2, currentW / 2, currentH / 2, 0, 0, Math.PI * 2);
            } else if (shape === 'triangle') {
                ctx.moveTo(currentX + currentW / 2, currentY);
                ctx.lineTo(currentX + currentW, currentY + currentH);
                ctx.lineTo(currentX, currentY + currentH);
                ctx.closePath();
            } else if (shape === 'diamond') {
                ctx.moveTo(currentX + currentW / 2, currentY);
                ctx.lineTo(currentX + currentW, currentY + currentH / 2);
                ctx.lineTo(currentX + currentW / 2, currentY + currentH);
                ctx.lineTo(currentX, currentY + currentH / 2);
                ctx.closePath();
            } else if (shape === 'pill') {
                const r = Math.min(currentW, currentH) / 2;
                ctx.roundRect(currentX, currentY, currentW, currentH, r);
            } else if (shape === 'hexagon') {
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                const r = Math.min(currentW, currentH) / 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
            } else if (shape === 'star') {
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                const outerRadius = Math.min(currentW, currentH) / 2;
                const innerRadius = outerRadius / 2;
                const spikes = 5;
                let rot = Math.PI / 2 * 3;
                let x1 = cx;
                let y1 = cy;
                const step = Math.PI / spikes;

                ctx.moveTo(cx, cy - outerRadius)
                for (let i = 0; i < spikes; i++) {
                    x1 = cx + Math.cos(rot) * outerRadius;
                    y1 = cy + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x1, y1)
                    rot += step

                    x1 = cx + Math.cos(rot) * innerRadius;
                    y1 = cy + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x1, y1)
                    rot += step
                }
                ctx.lineTo(cx, cy - outerRadius)
                ctx.closePath();
            } else if (shape === 'bubble' || shape === 'speech_bubble') {
                const r = 10;
                ctx.roundRect(currentX, currentY, currentW, currentH - 10, r);
                ctx.moveTo(currentX + 20, currentY + currentH - 10);
                ctx.lineTo(currentX + 10, currentY + currentH);
                ctx.lineTo(currentX + 30, currentY + currentH - 10);
            } else if (shape === 'cloud') {
                // Simple cloud approx
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                ctx.moveTo(cx - currentW * 0.4, cy);
                ctx.arc(cx - currentW * 0.2, cy, currentH * 0.3, 0, Math.PI * 2);
                ctx.arc(cx + currentW * 0.2, cy, currentH * 0.3, 0, Math.PI * 2);
                ctx.arc(cx, cy - currentH * 0.2, currentH * 0.4, 0, Math.PI * 2);
            } else if (shape === 'arrow_right') {
                const headW = currentW * 0.4;
                const barH = currentH * 0.5;
                const barY = currentY + (currentH - barH) / 2;
                ctx.beginPath();
                ctx.moveTo(currentX, barY);
                ctx.lineTo(currentX + currentW - headW, barY);
                ctx.lineTo(currentX + currentW - headW, currentY);
                ctx.lineTo(currentX + currentW, currentY + currentH / 2);
                ctx.lineTo(currentX + currentW - headW, currentY + currentH);
                ctx.lineTo(currentX + currentW - headW, barY + barH);
                ctx.lineTo(currentX, barY + barH);
                ctx.closePath();
            } else if (shape === 'arrow_left') {
                const headW = currentW * 0.4;
                const barH = currentH * 0.5;
                const barY = currentY + (currentH - barH) / 2;
                ctx.beginPath();
                ctx.moveTo(currentX + currentW, barY);
                ctx.lineTo(currentX + headW, barY);
                ctx.lineTo(currentX + headW, currentY);
                ctx.lineTo(currentX, currentY + currentH / 2);
                ctx.lineTo(currentX + headW, currentY + currentH);
                ctx.lineTo(currentX + headW, barY + barH);
                ctx.lineTo(currentX + currentW, barY + barH);
                ctx.closePath();
            } else if (shape === 'arrow_up') {
                const headH = currentH * 0.4;
                const barW = currentW * 0.5;
                const barX = currentX + (currentW - barW) / 2;
                ctx.beginPath();
                ctx.moveTo(barX, currentY + currentH);
                ctx.lineTo(barX, currentY + headH);
                ctx.lineTo(currentX, currentY + headH);
                ctx.lineTo(currentX + currentW / 2, currentY);
                ctx.lineTo(currentX + currentW, currentY + headH);
                ctx.lineTo(barX + barW, currentY + headH);
                ctx.lineTo(barX + barW, currentY + currentH);
                ctx.closePath();
            } else if (shape === 'arrow_down') {
                const headH = currentH * 0.4;
                const barW = currentW * 0.5;
                const barX = currentX + (currentW - barW) / 2;
                ctx.beginPath();
                ctx.moveTo(barX, currentY);
                ctx.lineTo(barX, currentY + currentH - headH);
                ctx.lineTo(currentX, currentY + currentH - headH);
                ctx.lineTo(currentX + currentW / 2, currentY + currentH);
                ctx.lineTo(currentX + currentW, currentY + currentH - headH);
                ctx.lineTo(barX + barW, currentY + currentH - headH);
                ctx.lineTo(barX + barW, currentY);
                ctx.closePath();
            } else if (shape === 'pentagon') {
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                const r = Math.min(currentW, currentH) / 2;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            } else if (shape === 'octagon') {
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                const r = Math.min(currentW, currentH) / 2;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8; // Offset for flat top?
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
            } else if (shape === 'trapezoid') {
                const inset = currentW * 0.2;
                ctx.beginPath();
                ctx.moveTo(currentX + inset, currentY);
                ctx.lineTo(currentX + currentW - inset, currentY);
                ctx.lineTo(currentX + currentW, currentY + currentH);
                ctx.lineTo(currentX, currentY + currentH);
                ctx.closePath();
            } else if (shape === 'parallelogram') {
                const skew = currentW * 0.2;
                ctx.beginPath();
                ctx.moveTo(currentX + skew, currentY);
                ctx.lineTo(currentX + currentW, currentY);
                ctx.lineTo(currentX + currentW - skew, currentY + currentH);
                ctx.lineTo(currentX, currentY + currentH);
                ctx.closePath();
            } else if (shape === 'triangle_right') {
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(currentX, currentY + currentH);
                ctx.lineTo(currentX + currentW, currentY + currentH);
                ctx.closePath();
            } else if (shape === 'cross') {
                const thick = Math.min(currentW, currentH) / 3;
                const cx = currentX + currentW / 2;
                const cy = currentY + currentH / 2;
                const halfThick = thick / 2;
                ctx.beginPath();
                // Vertical bar
                ctx.rect(cx - halfThick, currentY, thick, currentH);
                // Horizontal bar
                ctx.rect(currentX, cy - halfThick, currentW, thick);
            } else if (shape === 'chevron_right') {
                const d = currentW * 0.5;
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(currentX + d, currentY + currentH / 2);
                ctx.lineTo(currentX, currentY + currentH);
                ctx.lineTo(currentX + (currentW - d), currentY + currentH);
                ctx.lineTo(currentX + currentW, currentY + currentH / 2);
                ctx.lineTo(currentX + (currentW - d), currentY);
                ctx.closePath();
            } else {
                // Fallback
                if (ctx.roundRect) ctx.roundRect(currentX, currentY, currentW, currentH, radius);
                else ctx.rect(currentX, currentY, currentW, currentH);
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

                if (node.type === 'line') {
                    const { start, end } = node.content;
                    // Line rendering
                    // We use relative coordinates if possible, but line usually has absolute start/end in content?
                    // Actually, Pizarra 2.0 might treat line as a box with internal line?
                    // Let's assume standard behavior: 
                    // A line node has x,y,w,h. We draw from (0,0) to (w, h) or similar?
                    // Or does it use start/end points relative to x,y?
                    // Looking at previous code, it draws simple lines. 
                    // Let's ensure dashed styles apply here too.

                    const strokeStyle = node.content.strokeStyle || 'solid';
                    ctx.beginPath();
                    if (strokeStyle === 'dashed') ctx.setLineDash([10, 10]);
                    else if (strokeStyle === 'dotted') ctx.setLineDash([3, 6]);
                    else ctx.setLineDash([]);

                    ctx.lineWidth = node.content.strokeWidth || 2;
                    ctx.strokeStyle = node.content.color || '#000';

                    // Check if it's a "connector" or just a line shape
                    // If it's a simple line shape (like from graphic library), it probably goes 0,h/2 to w,h/2?
                    // The graphic library defines it as w=200, h=0.
                    if (node.h <= 4) { // Horizontal line
                        ctx.moveTo(0, 0);
                        ctx.lineTo(node.w, 0);
                    } else {
                        // Default diagonal or custom
                        ctx.moveTo(0, 0);
                        ctx.lineTo(node.w, node.h);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset
                } else {
                    // Connectors (existing logic)
                    const sx = 0;
                    const sy = 0;
                    // ... (rest of connector logic is complex, skipping for now unless 'line' covers it)
                    // Actually, 'line' usually refers to connectors. The graphic library "lines" are separate?
                    // The library defines `type: 'line'`. 
                    // Let's keep the existing connector logic but WRAP it with dash check?
                    // The existing code at line 496 handles `if (node.type === 'line')`. 
                    // It does NOT look like it handles the Graphic Library "Lines" well if they don't have start/end properties?
                    // The Graphic Library items have `w: 200, h: 0`.

                    // Let's just fix the dash part for now.

                    const arrowSize = 10;
                    const hasStart = node.content.startArrow;
                    const hasEnd = node.content.endArrow;
                    // ...
                    const style = node.content.strokeStyle || 'solid';
                    if (style === 'dashed') ctx.setLineDash([10, 10]);
                    else if (style === 'dotted') ctx.setLineDash([3, 6]);
                    else ctx.setLineDash([]);

                    // If it is a simple Graphic Line (no start/end handle references), just draw straight
                    if (!node.content.start && !node.content.end) {
                        ctx.lineWidth = node.content.strokeWidth || 4;
                        ctx.strokeStyle = node.content.color || '#64748b';
                        ctx.moveTo(0, node.h / 2); // Center Y
                        ctx.lineTo(node.w, node.h / 2);
                    } else {
                        // ... existing connector logic ...
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(ex, ey);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Draw Arrows
                if (hasStart) {
                    this.drawArrowHead(ctx, 0, 0, angle + Math.PI, arrowSize, node.content.color || '#334155');
                }
                if (hasEnd) {
                    this.drawArrowHead(ctx, node.w, node.h, angle, arrowSize, node.content.color || '#334155');
                }
            }
        } else if (node.type === 'icon') {
            this.drawIcon(ctx, node);
        } else if (node.type === 'image') {
            const src = node.content.url || node.content.src;
            if (src) {
                let img = this.imageCache.get(src);
                if (!img) {
                    img = new Image();
                    img.src = src;
                    this.imageCache.set(src, img);
                }
                if (img.complete) {
                    ctx.save();
                    const radius = node.content.borderRadius || 0;
                    if (radius > 0) {
                        ctx.beginPath();
                        if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, radius);
                        else ctx.rect(0, 0, node.w, node.h);
                        ctx.clip();
                    }
                    ctx.drawImage(img, 0, 0, node.w, node.h);
                    ctx.restore();
                } else {
                    // Loading state
                    ctx.fillStyle = '#eff6ff';
                    ctx.fillRect(0, 0, node.w, node.h);
                    // Optional: draw loading indicator
                }
            } else {
                // No Source / Placeholder
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(0, 0, node.w, node.h);
                ctx.fillStyle = '#64748b';
                ctx.font = '12px sans-serif';
                ctx.fillText("IMG", node.w / 2 - 10, node.h / 2);
            }
        }
        else if (node.type === 'text') {
            this.drawText(ctx, node);
        }
        else if (node.type === 'board') {
            if (node.content.gradient) {
                const g = node.content.gradient;
                const grd = ctx.createLinearGradient(0, 0, 0, node.h);
                grd.addColorStop(0, g.start);
                grd.addColorStop(1, g.end);
                ctx.fillStyle = grd;
            } else {
                ctx.fillStyle = node.content.color || '#f8fafc';
            }
            const borderWidth = node.content.borderWidth || 2;
            const borderColor = node.content.borderColor || '#e2e8f0';

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, 16);
            else ctx.rect(0, 0, node.w, node.h);
            ctx.fill();

            // Internal Grid
            if (node.content.grid) {
                const { columns, rows, gap } = node.content.grid;
                if (columns > 1 || rows > 1) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = borderColor + '60'; // Semi-transparent
                    ctx.lineWidth = 1;

                    // Columns
                    if (columns > 1) {
                        const colW = (node.w - (gap * 2)) / columns; // Simplified gap logic
                        for (let i = 1; i < columns; i++) {
                            const x = i * colW + gap; // Approx
                            ctx.moveTo(x, 0);
                            ctx.lineTo(x, node.h);
                        }
                    }
                    // Rows
                    if (rows > 1) {
                        const rowH = (node.h - (gap * 2)) / rows;
                        for (let i = 1; i < rows; i++) {
                            const y = i * rowH + gap;
                            ctx.moveTo(0, y);
                            ctx.lineTo(node.w, y);
                        }
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            }

            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = borderColor;
            if (borderWidth > 0) ctx.stroke();

            // Title
            ctx.fillStyle = '#94a3b8';
            ctx.font = `bold 12px "${node.content.fontFamily || 'Inter'}", sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText((node.content.title || 'BOARD').toUpperCase(), 20, 20);

            // Body (Lists)
            if (node.content.body) {
                const startY = 50;
                let cursorY = startY;
                ctx.fillStyle = '#334155';
                ctx.font = `14px "${node.content.fontFamily || 'Inter'}", sans-serif`;
                const lineHeight = 20;

                const lines = node.content.body.split('\n');
                lines.forEach(line => {
                    if (cursorY > node.h - 20) return; // Clip

                    if (line.trim() === '---') {
                        ctx.beginPath();
                        ctx.moveTo(20, cursorY + 10);
                        ctx.lineTo(node.w - 20, cursorY + 10);
                        ctx.strokeStyle = '#cbd5e1';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        cursorY += 20;
                        return;
                    }

                    let text = line;
                    let offsetX = 20;

                    if (line.trim().startsWith('- ')) {
                        // Bullet
                        ctx.beginPath();
                        ctx.arc(28, cursorY + 8, 3, 0, Math.PI * 2);
                        ctx.fill();
                        text = line.replace('- ', '');
                        offsetX = 38;
                    } else if (/^\d+\.\s/.test(line.trim())) {
                        // Number
                        const match = line.trim().match(/^(\d+\.)\s/);
                        const prefix = match ? match[1] : '';
                        ctx.fillText(prefix, 20, cursorY);
                        text = line.replace(/^\d+\.\s/, '');
                        offsetX = 38;
                    }

                    ctx.fillText(text, offsetX, cursorY);
                    cursorY += lineHeight;
                });
            }
        }
        else {
            // Card / Generic
            ctx.fillStyle = node.content.color || '#ffffff';
            ctx.fillRect(0, 0, node.w, node.h);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(0, 0, node.w, node.h);
            ctx.fillStyle = '#0f172a';
            ctx.font = `14px "${node.content.fontFamily || 'Inter'}", sans-serif`;
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

        // Reset Filters for Selection Ring
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.restore();
    }

    private drawSelectionOverlay(ctx: CanvasRenderingContext2D, state: BoardState, zoom: number) {
        const selectedIds = Array.from(state.selection);
        if (selectedIds.length === 0) return;

        // Is Locked? (If mixed, we treat as normal unless ALL are locked)
        // Actually, simplify: Just check if single is locked. Multi resize is special.

        if (selectedIds.length === 1) {
            // Single Selection
            const id = selectedIds[0];
            const node = state.nodes[id];
            if (!node) return;

            const isLocked = node.locked || node.isFixed;
            const color = isLocked ? '#ef4444' : '#3b82f6'; // Blue

            ctx.save();
            const cx = node.x + node.w / 2;
            const cy = node.y + node.h / 2;
            ctx.translate(cx, cy);
            if (node.rotation) ctx.rotate(node.rotation);
            ctx.translate(-node.w / 2, -node.h / 2);

            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, 0, node.w, node.h);
            ctx.restore();

            if (!isLocked) {
                ctx.save();
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;
                ctx.translate(cx, cy);
                if (node.rotation) ctx.rotate(node.rotation);
                ctx.translate(-node.w / 2, -node.h / 2);
                this.drawControls(ctx, node, zoom);
                ctx.restore();
            }
        } else {
            // Multi Selection - Master Bounding Box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let anyLocked = false;

            selectedIds.forEach(id => {
                const node = state.nodes[id];
                if (node) {
                    // Logic for rotated bounding box is complex.
                    // For now, we calculate AABB of the rotated nodes?
                    // Or simplified: Just AABB of raw coordinates (UX standard for quick multi-select).
                    // Actually, Figma/Miro calculate the AABB of the rotated shapes.
                    // Doing simple min/max on x/y/w/h works well enough for now unless extreme rotation.
                    minX = Math.min(minX, node.x);
                    minY = Math.min(minY, node.y);
                    maxX = Math.max(maxX, node.x + node.w);
                    maxY = Math.max(maxY, node.y + node.h);
                    if (node.locked) anyLocked = true;
                }
            });

            const w = maxX - minX;
            const h = maxY - minY;

            ctx.save();
            ctx.strokeStyle = anyLocked ? '#ef4444' : '#3b82f6';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(minX, minY, w, h);
            ctx.setLineDash([]);
            ctx.restore();

            if (!anyLocked) {
                // Mock Group Node for Handles
                const groupNode = {
                    id: 'selection-group',
                    type: 'group' as any,
                    x: minX,
                    y: minY,
                    w,
                    h,
                    rotation: 0
                };

                ctx.save();
                ctx.translate(minX, minY);
                this.drawControls(ctx, groupNode, zoom);
                ctx.restore();
            }
        }
    }

    private drawControls(ctx: CanvasRenderingContext2D, node: { x: number, y: number, w: number, h: number }, zoom: number) {
        // Handles are always drawn relative to current context origin
        // Single: Origin is Top-Left of Node (Rotated)
        // Multi: Origin is Top-Left of Bonding Box (Unrotated)

        const handleVisualSize = 8;
        const handleSize = handleVisualSize / zoom;
        const half = handleSize / 2;

        // 8 Visual Handles
        const handles = [
            // Corners
            { x: -half, y: -half },
            { x: node.w - half, y: -half },
            { x: node.w - half, y: node.h - half },
            { x: -half, y: node.h - half },
            // Sides
            { x: node.w / 2 - half, y: -half }, // N
            { x: node.w / 2 - half, y: node.h - half }, // S
            { x: -half, y: node.h / 2 - half }, // W
            { x: node.w - half, y: node.h / 2 - half }  // E
        ];

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.lineWidth = 1.5 / zoom;

        handles.forEach(h => {
            ctx.beginPath();
            ctx.rect(h.x, h.y, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        });

        // Rotation Handle
        const rotDist = 25 / zoom;
        const rotSize = 10 / zoom;
        const rotX = node.w / 2;
        const rotY = -rotDist;

        ctx.beginPath();
        ctx.moveTo(node.w / 2, 0);
        ctx.lineTo(rotX, rotY);
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rotX, rotY, rotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
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

    private drawSnapLines(ctx: CanvasRenderingContext2D, lines: Array<{ type: 'horizontal' | 'vertical', x?: number, y?: number, start: number, end: number }>, zoom: number) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();

        lines.forEach(line => {
            if (line.type === 'vertical' && line.x !== undefined) {
                ctx.moveTo(line.x, line.start);
                ctx.lineTo(line.x, line.end);
            } else if (line.type === 'horizontal' && line.y !== undefined) {
                ctx.moveTo(line.start, line.y);
                ctx.lineTo(line.end, line.y);
            }
        });

        ctx.stroke();
        ctx.restore();
    }
}

export const renderer = new PizarronRenderer();

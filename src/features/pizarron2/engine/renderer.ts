import { BoardState, BoardNode, Viewport, InteractionState } from './types';
import { STRUCTURE_TEMPLATES } from './structures';

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

    private getVisibleRect(vp: Viewport) {
        const margin = 100; // Buffer
        return {
            x: -vp.x / vp.zoom - margin,
            y: -vp.y / vp.zoom - margin,
            w: this.width / vp.zoom + (margin * 2),
            h: this.height / vp.zoom + (margin * 2)
        };
    }

    private animStates = new Map<string, { lift: number, selectionOpacity: number }>();
    private focusOverlayOpacity: number = 0; // Global overlay alpha

    render(state: BoardState) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const { viewport, nodes, order, selection, uiFlags, interactionState } = state;

        // 1. Clear & Background
        // Detect Dark Mode (Simple DOM check as Renderer is outside React context usually)
        const isDark = document.documentElement.classList.contains('dark');

        ctx.fillStyle = isDark ? '#020617' : '#f8fafc'; // slate-950 or slate-50
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Setup Camera Transform
        ctx.save();
        ctx.translate(viewport.x, viewport.y);
        ctx.scale(viewport.zoom, viewport.zoom);

        // 3. Draw Grid (Optimized Pattern)
        if (uiFlags.gridEnabled) {
            this.drawGrid(ctx, viewport, this.width, this.height, isDark);
        }

        // 4. Draw Nodes (Sorted by Z-Index)
        const sortedNodes = order
            .map(id => nodes[id])
            .filter(n => !!n && !n.collapsed) // Skip collapsed nodes
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        const visibleRect = this.getVisibleRect(viewport);
        const { selectionBounds } = interactionState; // If we need it

        for (const node of sortedNodes) {
            // 1. Collapse Check
            if (node.collapsed) continue;

            // 2. Culling Check
            if (node.x > visibleRect.x + visibleRect.w ||
                node.x + node.w < visibleRect.x ||
                node.y > visibleRect.y + visibleRect.h ||
                node.y + node.h < visibleRect.y) {
                continue;
            }

            // 3. Animation Logic
            let anim = this.animStates.get(node.id);
            if (!anim) {
                anim = { lift: 0, selectionOpacity: 0, hoverOpacity: 0 };
                this.animStates.set(node.id, anim);
            }

            const isSelected = selection.has(node.id);
            const isHovered = interactionState.hoveredNodeId === node.id;
            const isDragging = interactionState.dragNodeId !== undefined && isSelected; // Lift all selected if dragging

            // Target Values
            const targetLift = isDragging ? 1 : 0;
            const targetSelOpacity = isSelected ? 1 : 0;
            const targetHoverOpacity = isHovered && !isSelected ? 1 : 0; // Only hover if not selected

            // Lerp (Smooth transitions)
            anim.lift += (targetLift - anim.lift) * 0.2;
            anim.selectionOpacity += (targetSelOpacity - anim.selectionOpacity) * 0.2;
            anim.hoverOpacity += (targetHoverOpacity - anim.hoverOpacity) * 0.2;

            // Pass animated values to drawNode
            this.drawNode(ctx, node, isSelected, viewport.zoom, nodes, anim);
        }

        // 4b. Focus Mode Overlay (Cinematic Fade)
        // Lerp global opacity
        const targetFocusOpacity = (uiFlags.focusMode && interactionState.focusTargetId) ? 1 : 0;
        this.focusOverlayOpacity += (targetFocusOpacity - this.focusOverlayOpacity) * 0.1; // Slower fade (0.1)

        if (this.focusOverlayOpacity > 0.01) {
            const overlayAlpha = (isDark ? 0.7 : 0.8) * this.focusOverlayOpacity;
            ctx.fillStyle = isDark ? `rgba(2, 6, 23, ${overlayAlpha})` : `rgba(255, 255, 255, ${overlayAlpha})`;
            // Use visible rect to fill only what's needed (or huge rect)
            // Using visibleRect ensures we cover the view even if zoomed out
            ctx.fillRect(visibleRect.x, visibleRect.y, visibleRect.w, visibleRect.h);

            // Re-draw Focused Node AND its children on TOP of overlay
            if (interactionState.focusTargetId) {
                const fNode = nodes[interactionState.focusTargetId];
                if (fNode) {
                    // 1. Draw the Parent (Board)
                    // Elevate it using the overlay opacity as the lift factor (0 -> 1)
                    this.drawNode(ctx, fNode, true, viewport.zoom, nodes, { lift: this.focusOverlayOpacity, selectionOpacity: 0, hoverOpacity: 0 });

                    // 2. Draw Children (Content on the board)

                    // Helper: Check spatial containment
                    const isContained = (inner: BoardNode, outer: BoardNode) => {
                        return inner.x >= outer.x &&
                            inner.y >= outer.y &&
                            inner.x + inner.w <= outer.x + outer.w &&
                            inner.y + inner.h <= outer.y + outer.h;
                    };

                    const children = order
                        .map(id => nodes[id])
                        .filter(n => {
                            if (!n || n.id === fNode.id || n.collapsed) return false;

                            // Check 1: Strict Parent
                            if (n.parentId === fNode.id) return true;

                            // Check 2: Spatial Containment (Visual Parent) for Presentation
                            // Only if we are IN presentation mode or just want lenient focus?
                            // Let's be lenient for Focus Mode in general.
                            return isContained(n, fNode);
                        })
                        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

                    for (const child of children) {
                        for (const child of children) {
                            this.drawNode(ctx, child, selection.has(child.id), viewport.zoom, nodes, { lift: 0, selectionOpacity: 0, hoverOpacity: 0 });
                        }
                    }
                }
            }
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
            ctx.fillStyle = isDark ? 'white' : 'black';
            ctx.fillText(`View: ${Math.round(viewport.x)},${Math.round(viewport.y)} | Nodes: ${order.length}`, 10, 20);
            if (selection.size > 0) ctx.fillText(`Sel: ${selection.size}`, 10, 40);
        }
    }

    private drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, w: number, h: number, isDark: boolean = false) {
        const gridSize = 40;

        ctx.fillStyle = isDark ? '#334155' : '#cbd5e1'; // slate-700 : slate-300

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

    private drawText(ctx: CanvasRenderingContext2D, node: BoardNode, zoom: number = 1) {
        // LOD Check
        if (zoom < 0.4) {
            ctx.fillStyle = node.content.backgroundColor || '#cbd5e1'; // Use bg or default grey
            ctx.fillRect(0, 0, node.w, Math.min(node.h, 10));
            return;
        }

        const { w, h } = node;
        const {
            title,
            fontSize = 20,
            fontWeight = 'normal',
            fontStyle = 'normal',
            fontFamily = 'Inter',
            color = '#000000',
            align = 'left',
            // New Props
            lineHeight = 1.2,
            padding = 0,
            backgroundColor,
            listType = 'none'
        } = node.content;

        // 1. Draw Background
        if (backgroundColor) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, w, h);
        }

        // 2. Setup Font
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align as CanvasTextAlign || 'left';
        ctx.textBaseline = 'top';

        // 3. Layout Limits
        const availW = w - (padding * 2);
        let currentY = padding;
        const lineSpacing = fontSize * (lineHeight || 1.2);

        // 4. Split by logical newlines (paragraphs)
        const paragraphs = (title || '').split('\n');

        paragraphs.forEach((para, i) => {
            // Bullet / Numbering
            let prefix = '';
            let indent = 0;
            if (listType === 'bullet') {
                prefix = '• ';
                indent = fontSize;
            } else if (listType === 'number') {
                prefix = `${i + 1}. `;
                indent = fontSize * 1.5;
            }

            // Word Wrapping logic per paragraph
            const words = para.split(' ');
            let line = '';

            // X position logic
            let x = padding;
            if (align === 'center') x = w / 2;
            if (align === 'right') x = w - padding;

            // Align adjustments for list (lists usually left aligned)
            if (listType !== 'none' && align === 'left') {
                x += indent;
            }

            // Draw Bullet/Number once per paragraph
            if (listType !== 'none' && align === 'left') {
                ctx.fillText(prefix, padding, currentY);
            }

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > (availW - indent) && n > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineSpacing;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, currentY);
            currentY += lineSpacing;
        });

        // Vertical Align (Future: Calculate total height first then shift start Y)
        // For now, simple top-down flow.
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

    private drawNode(ctx: CanvasRenderingContext2D, node: BoardNode, isSelected: boolean, zoom: number, nodes?: Record<string, BoardNode>, anim: { lift: number, selectionOpacity: number, hoverOpacity: number } = { lift: 0, selectionOpacity: 0, hoverOpacity: 0 }) {
        if (node.collapsed) return;
        ctx.save();

        // Nexus Motion: Lift Effect
        const lift = anim.lift;
        const currentScale = 1 + (lift * 0.02); // 2% scale up on lift

        // Unified Transformation: Rotate around Center
        const cx = node.x + node.w / 2;
        const cy = node.y + node.h / 2;

        ctx.translate(cx, cy);
        if (lift > 0) ctx.scale(currentScale, currentScale); // Scale Effect
        ctx.rotate(node.rotation || 0);
        ctx.translate(-node.w / 2, -node.h / 2); // Origin is now visually at Top-Left of the node

        if (node.type === 'composite') {
            this.drawComposite(ctx, node);
        }
        else if (node.type === 'group' && node.childrenIds && nodes) {
            // Unwind Transform to World Space for Children
            ctx.save();
            // 1. Move origin from Top-Left back to Center
            ctx.translate(node.w / 2, node.h / 2);
            // 2. Un-rotate
            ctx.rotate(-(node.rotation || 0));
            // 3. Un-scale
            if (lift > 0) ctx.scale(1 / currentScale, 1 / currentScale);
            // 4. Move from Center back to (0,0) World
            ctx.translate(-cx, -cy);

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

        // Use 0,0 as origin (which corresponds to node.x, node.y visually)
        // No further translation needed here since we set the origin at the top.

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
            // Nexus Motion: Dynamic Shadow
            // Lift 0: blur 4, y 2 (Flat)
            // Lift 1: blur 20, y 10 (Floating)
            ctx.shadowColor = `rgba(0,0,0,${0.1 + (0.1 * lift)})`;
            ctx.shadowBlur = 4 + (16 * lift);
            ctx.shadowOffsetY = 2 + (8 * lift);
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

                    if (g && g.start && g.end) {
                        // Handle Proper Gradient Object
                        grd.addColorStop(0, g.start);
                        grd.addColorStop(1, g.end);
                    } else {
                        // Fallback
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

            // Render Internal Structure if present (e.g. Injected Grid)
            if (node.structure) {
                this.drawBoardStructure(ctx, node, zoom);
            }
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
            this.drawText(ctx, node, zoom);
        }
        else if (node.type === 'board') {
            // Background
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

            // LOD: Skip details ONLY if zoom is very low (e.g. < 15%)
            // LOD: Skip details ONLY if zoom is very low (e.g. < 5%)
            if (zoom < 0.05) {
                ctx.lineWidth = borderWidth;
                ctx.strokeStyle = borderColor;
                if (borderWidth > 0) ctx.stroke();
                // Draw simplified title bar
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(20, 20, node.w - 40, 10);
                return;
            }

            // Internal Grid (Legacy & New)
            if (node.structure) {
                // New Phase 6.2.10 Structure
                this.drawBoardStructure(ctx, node, zoom);
            }
            else if (node.content.grid) {
                // Legacy Grid
                const { columns, rows, gap } = node.content.grid;
                if (columns > 1 || rows > 1) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = borderColor + '60'; // Semi-transparent
                    ctx.lineWidth = 1;
                    // ... (keep legacy logic or simplify) ...
                    // For now, let's keep legacy logic inline or move to helper
                    // I'll keep logic here for minimal diff, but indented correctly
                    if (columns > 1) {
                        const colW = (node.w - (gap * 2)) / columns;
                        for (let i = 1; i < columns; i++) {
                            const x = i * colW + gap;
                            ctx.moveTo(x, 0);
                            ctx.lineTo(x, node.h);
                        }
                    }
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
            ctx.fillStyle = node.content.titleColor || '#94a3b8';
            ctx.font = `bold ${node.content.fontSize || 14}px "${node.content.fontFamily || 'Inter'}", sans-serif`;
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
        else if (node.type === 'group') {
            // Groups are transparent logic wrappers.
            // Do not draw background. Fall through to restore.
        }
        else {
            // Card / Generic
            ctx.fillStyle = node.content.color || '#ffffff';
            ctx.fillRect(0, 0, node.w, node.h);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(0, 0, node.w, node.h);
            ctx.fillStyle = '#0f172a';
            const fontSize = node.content.fontSize || 14;
            ctx.font = `bold ${fontSize}px "${node.content.fontFamily || 'Inter'}", sans-serif`;
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

        // Hover Indicator
        if (anim.hoverOpacity > 0.01) {
            ctx.save();
            ctx.globalAlpha = anim.hoverOpacity;
            ctx.strokeStyle = '#94a3b8'; // Slate-400
            ctx.lineWidth = 2; // Fixed 2px border? Or 2/zoom? Let's use 2px visual.
            // But we are in node space (w, h).
            // Context scale is applied? 
            // ctx.lineWidth is affected by scale.
            // If I want 2px SCREEN width, I need 2 / zoom / currentScale.
            const screenPixel = 1 / (zoom * currentScale);
            ctx.lineWidth = 2 * screenPixel;

            // Draw Border
            const radius = node.content.borderRadius || (node.type === 'board' ? 16 : 0);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(0, 0, node.w, node.h, radius);
            else ctx.rect(0, 0, node.w, node.h);
            ctx.stroke();
            ctx.restore();
        }

        // Reset Filters for Selection Ring
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.restore();
    }

    private drawBoardStructure(ctx: CanvasRenderingContext2D, node: BoardNode, zoom: number) {
        if (!node.structure) return;

        // --- NEW: Zone Based Structure ---
        if (node.structure.zones) {
            const { w, h } = node;
            ctx.save();

            // Text Style for Labels
            ctx.font = `500 ${Math.max(10, 12 / zoom)}px Inter, sans-serif`;
            ctx.textBaseline = 'top';

            node.structure.zones.forEach(zone => {
                const gap = node.structure.gap || 0;
                // Calculate percentages to pixels
                const baseZx = zone.x * w;
                const baseZy = zone.y * h;
                const baseZw = zone.w * w;
                const baseZh = zone.h * h;

                // Apply Gap (Shrink inwards)
                const zx = baseZx + (gap / 2);
                const zy = baseZy + (gap / 2);
                const zw = Math.max(0, baseZw - gap);
                const zh = Math.max(0, baseZh - gap);

                // 1. Zone Styling (Enhanced)
                ctx.save();

                // Shadow
                if (zone.style?.shadow) {
                    const { color, blur, offsetX, offsetY } = zone.style.shadow;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur;
                    ctx.shadowOffsetX = offsetX;
                    ctx.shadowOffsetY = offsetY;
                }

                // Background & Gradient
                if (zone.style?.gradient) {
                    const g = zone.style.gradient;
                    const grad = ctx.createLinearGradient(zx, zy, zx + zw, zy + zh);
                    grad.addColorStop(0, g.start);
                    grad.addColorStop(1, g.end);
                    ctx.fillStyle = grad;

                    if (ctx.roundRect) ctx.roundRect(zx, zy, zw, zh, zone.style?.borderRadius || 0);
                    else ctx.rect(zx, zy, zw, zh);
                    ctx.fill();
                } else if (zone.style?.backgroundColor || zone.style?.shading) {
                    ctx.fillStyle = zone.style.backgroundColor || zone.style.shading!;
                    if (ctx.roundRect) ctx.roundRect(zx, zy, zw, zh, zone.style?.borderRadius || 0);
                    else ctx.rect(zx, zy, zw, zh);
                    ctx.fill();
                }

                // Reset Shadow for Border
                ctx.shadowColor = 'transparent';

                // Border
                if (zone.style?.borderWidth || zone.style?.dashed) {
                    ctx.beginPath();
                    ctx.strokeStyle = zone.style.borderColor || (zone.style.dashed ? '#94a3b8' : 'transparent');
                    ctx.lineWidth = (zone.style.borderWidth || 1) / zoom; // Scale border correctly? Usually we want screen pixels or world pixels? If resizing, world is better.
                    // Wait, renderer scale is applied at top level. 
                    // But here we are drawing in world coords?
                    // Ah, `drawBoardStructure` is called inside `drawNode`? No, let's check context.
                    // Yes, `drawBoardStructure` seems to use `ctx` which is already transformed or we calculate zx/zy manually?
                    // Re-checking lines 1109: zx = zone.x * w. These are world internal coordinates.
                    // So we are in world space. `lineWidth` should be in world units.
                    // If we want 1px visual border, it should be 1/zoom.
                    // However, user input is likely "pixels". Let's treat it as world pixels (standard).
                    ctx.lineWidth = Math.max(1 / zoom, zone.style?.borderWidth || 1); // Ensure at least 1 screen pixel

                    if (zone.style?.dashed) ctx.setLineDash([4 / zoom, 4 / zoom]);
                    else ctx.setLineDash([]);

                    if (ctx.roundRect) ctx.roundRect(zx, zy, zw, zh, zone.style?.borderRadius || 0);
                    else ctx.rect(zx, zy, zw, zh);
                    ctx.stroke();
                }

                ctx.restore();

                // 3. Label (Placeholder) - Only if empty?
                // Always show label as a hint if zoom is high enough
                if (zoom > 0.4) {
                    // Draw Dashed Border if enabled
                    if (zone.style?.dashed) {
                        ctx.save();
                        ctx.strokeStyle = '#94a3b8';
                        ctx.setLineDash([4, 4]);
                        ctx.strokeRect(zx, zy, zw, zh);
                        ctx.restore();
                    }

                    // 3. Label (Title Section)
                    const showTitle = zone.style?.showLabel !== false;
                    const titleHeightBase = showTitle ? 24 : 0;
                    const titleGap = zone.style?.titleGap ?? 2;
                    const contentOffsetY = titleHeightBase + titleGap;

                    // Draw Title Background
                    if (showTitle && zone.style?.titleBackgroundColor && zone.style.titleBackgroundColor !== 'transparent') {
                        ctx.fillStyle = zone.style.titleBackgroundColor;
                        ctx.fillRect(zx, zy, zw, titleHeightBase);
                    }

                    if (showTitle && zoom > 0.4) {
                        ctx.fillStyle = zone.style?.titleColor || '#64748b';
                        const tSize = zone.style?.titleFontSize || 12;
                        ctx.font = `700 ${Math.max(10, tSize / zoom)}px Inter, sans-serif`;
                        ctx.textBaseline = 'middle'; // Center vertically in title bar

                        const align = zone.style?.titleAlign || 'left';
                        ctx.textAlign = align;

                        let tx = zx + 6;
                        if (align === 'center') tx = zx + zw / 2;
                        if (align === 'right') tx = zx + zw - 6;

                        ctx.fillText(zone.label || 'Zone', tx, zy + (titleHeightBase / 2));
                        ctx.textAlign = 'left'; // Reset
                    }

                    // 4. Render Zone Content (Body Text Section)
                    // 4. Render Zone Sections (Content + Extra)
                    // Layout Calculation
                    const availableH = Math.max(0, zh - contentOffsetY);
                    const sections = zone.sections || []; // Extra sections
                    const allSectionsCount = 1 + sections.length; // 1 = Main Content
                    const gap = zone.style?.titleGap ?? 2;

                    // Internal Gaps: Between Content and Sec1, Sec1 and Sec2... (count - 1)
                    // Wait, layout logic: Title, Gap, [Content, Gap, Section, Gap, Section...]
                    // We already offset by `contentOffsetY` (Title + Gap).
                    // So inside this area, we have items separated by gaps.
                    const totalInternalGapH = Math.max(0, allSectionsCount - 1) * gap;
                    const itemH = Math.max(0, (availableH - totalInternalGapH) / allSectionsCount);

                    ctx.save();
                    ctx.translate(zx, zy + contentOffsetY);

                    // Clip to body area
                    ctx.beginPath();
                    ctx.rect(0, 0, zw, availableH);
                    ctx.clip();

                    // --- DRAW CONTENT (Index 0) ---
                    // Background
                    if (zone.content?.style?.backgroundColor && zone.content.style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = zone.content.style.backgroundColor;
                        ctx.fillRect(0, 0, zw, itemH);
                    }
                    // Text
                    if (zone.content && zone.content.text) {
                        const proxyNode: any = {
                            w: zw,
                            h: itemH,
                            content: {
                                title: zone.content.text,
                                fontSize: 14,
                                color: '#334155',
                                ...zone.content.style,
                                padding: 4
                            }
                        };
                        this.drawText(ctx, proxyNode, zoom);
                    }

                    // --- DRAW EXTRA SECTIONS ---
                    sections.forEach((sec, i) => {
                        const yPos = (i + 1) * (itemH + gap);

                        // Background
                        if (sec.style?.backgroundColor && sec.style.backgroundColor !== 'transparent') {
                            ctx.fillStyle = sec.style.backgroundColor;
                            ctx.fillRect(0, yPos, zw, itemH);
                        }

                        // Text (Content)
                        if (sec.content && sec.content.text) {
                            const proxySec: any = {
                                w: zw,
                                h: itemH,
                                content: {
                                    title: sec.content.text,
                                    fontSize: 14,
                                    color: '#334155',
                                    ...sec.content.style,
                                    padding: 4
                                }
                            };

                            // Adjust context translation temporarily?
                            // drawText assumes (0,0) is top-left of node? No, it uses 0,0 of current transform?
                            // drawText calls `drawParagraph`.
                            // Let's look at `drawText`. Usually it draws at 0,0?
                            // Yes, `drawText` uses `node` dimensions.
                            // I need to offset context.
                            ctx.save();
                            ctx.translate(0, yPos);
                            this.drawText(ctx, proxySec, zoom);
                            ctx.restore();
                        }
                    });

                    ctx.restore();
                }
            });

            ctx.restore();
            return;
        }

        // --- LEGACY: Grid Based Structure (Keep for backward compatibility) ---
        // (Only runs if 'zones' is undefined)
        const rows = (node.structure as any).rows;
        const cols = (node.structure as any).cols;
        if (!rows || !cols) return;

        // Calculation
        const totalRowHeight = rows.reduce((acc: number, r: any) => acc + (r.height || 1), 0);
        const totalColWidth = cols.reduce((acc: number, c: any) => acc + (c.width || 1), 0);

        // Draw Grid
        ctx.save();
        ctx.strokeStyle = node.content.borderColor ? node.content.borderColor + '80' : '#94a3b8';
        ctx.lineWidth = 1;

        // Calculate and Draw
        let currentY = 0;
        const computedRows = rows.map((r: any) => {
            const h = (r.height / totalRowHeight) * node.h;
            const startY = currentY;
            currentY += h;
            return { ...r, startY, h };
        });

        let currentX = 0;
        const computedCols = cols.map((c: any) => {
            const w = (c.width / totalColWidth) * node.w;
            const startX = currentX;
            currentX += w;
            return { ...c, startX, w };
        });

        // Draw Lines
        ctx.beginPath();
        // Skip last line (border)
        for (let i = 0; i < computedRows.length - 1; i++) {
            const y = computedRows[i].startY + computedRows[i].h;
            ctx.moveTo(0, y);
            ctx.lineTo(node.w, y);
        }
        for (let i = 0; i < computedCols.length - 1; i++) {
            const x = computedCols[i].startX + computedCols[i].w;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, node.h);
        }
        ctx.stroke();

        // Draw Cells Content
        // LOD check already done in parent, but cells might be small
        // If zoom is okay, draw text
        if (zoom > 0.5) {
            const cells = (node.structure as any).cells; // Need to get cells here
            ctx.fillStyle = '#64748b'; // Muted text
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            computedRows.forEach((row: any) => {
                computedCols.forEach((col: any) => {
                    const cellId = `${row.id}_${col.id}`;
                    if (cells && cells[cellId] && cells[cellId].content) {
                        const content = cells[cellId].content;
                        // Clip to cell
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(col.startX, row.startY, col.w, row.h);
                        ctx.clip();

                        // Draw Text (Simple truncate)
                        ctx.fillText(content, col.startX + 5, row.startY + 5);
                        ctx.restore();
                    }
                });
            });
        }

        ctx.restore();
    }

    private drawSelectionOverlay(ctx: CanvasRenderingContext2D, state: BoardState, zoom: number) {
        const selectedIds = Array.from(state.selection);
        if (selectedIds.length === 0) return;

        // Is Locked? (If mixed, we treat as normal unless ALL are locked)
        // Actually, simplify: Just check if single is locked. Multi resize is special.

        if (selectedIds.length === 1) {
            const node = state.nodes[selectedIds[0]];
            // Defensive check: Skip if collpased
            if (node && !node.collapsed) {
                // Determine Bounds (Rotated ?)
                // ...
                const isLocked = node.locked || node.isFixed;
                const strokeColor = isLocked ? '#ef4444' : '#3b82f6'; // Red if locked

                // Nexus Motion: Selection Fade-in
                const anim = this.animStates.get(node.id);
                // default to 1 if no anim found (fallback)
                const opacity = anim ? anim.selectionOpacity : 1;

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1.5; // Slightly thicker for better visibility with fade

                // Draw rotated bounding box
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;

                ctx.translate(cx, cy);
                if (node.rotation) ctx.rotate(node.rotation);
                ctx.translate(-cx, -cy);

                ctx.strokeRect(node.x, node.y, node.w, node.h);
                ctx.restore();

                if (!isLocked) {
                    ctx.save();
                    // const cx = node.x + node.w / 2; // declared above
                    // const cy = node.y + node.h / 2;
                    ctx.translate(cx, cy);
                    if (node.rotation) ctx.rotate(node.rotation);
                    ctx.translate(-node.w / 2, -node.h / 2);
                    this.drawControls(ctx, node, zoom);
                    ctx.restore();
                }
            }
        } else {
            // Multi Selection - Master Bounding Box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let anyLocked = false;
            let hasVisibleNode = false;

            selectedIds.forEach(id => {
                const node = state.nodes[id];
                if (node && !node.collapsed) {
                    hasVisibleNode = true;
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

            if (!hasVisibleNode) return;

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

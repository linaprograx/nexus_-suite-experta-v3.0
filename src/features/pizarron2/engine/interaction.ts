import { pizarronStore } from '../state/store';
import { BoardNode, Viewport } from './types';

interface Point {
    x: number;
    y: number;
}

export class InteractionManager {
    private isDragging: boolean = false;
    private isPanning: boolean = false;
    private dragStart: Point = { x: 0, y: 0 }; // World Coords (for Items/Creation)
    private panStartScreen: Point = { x: 0, y: 0 }; // Screen Coords (for Pan)
    private initialNodePositions: Record<string, Point> = {};
    private startViewport: Viewport = { x: 0, y: 0, zoom: 1 };
    private isResizing = false;
    private isRotating = false;
    private initialRotation = 0;
    private resizeHandle: string | null = null;
    private initialResizeState: { x: number, y: number, w: number, h: number, rotation?: number } | null = null;
    private canvas: HTMLCanvasElement | null = null;

    // Helper: Rotate point around center
    private rotatePoint(point: Point, center: Point, angle: number): Point {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        return {
            x: center.x + (dx * cos - dy * sin),
            y: center.y + (dx * sin + dy * cos)
        };
    }

    // Double Click Helpers
    private lastClickTime: number = 0;
    private lastClickId: string | null = null;

    // Configurable keys
    private panKey = 'Space';

    onWheel(e: WheelEvent) {
        if (!this.canvas) return;
        const state = pizarronStore.getState();
        const { viewport } = state;

        if (e.ctrlKey || e.metaKey) {
            // ZOOM
            // Calculate zoom center (mouse position relative to viewport)
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // World point before zoom
            const wx = (mouseX - viewport.x) / viewport.zoom;
            const wy = (mouseY - viewport.y) / viewport.zoom;

            // Zoom Factor
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(viewport.zoom * factor, 0.1), 5);

            // Compensate Pan to keep mouse point stable
            // mouseX = newX * newZoom + newPanX
            // newPanX = mouseX - wx * newZoom

            pizarronStore.updateViewport({
                zoom: newZoom,
                x: mouseX - wx * newZoom,
                y: mouseY - wy * newZoom
            });

        } else {
            // PAN
            pizarronStore.updateViewport({
                x: viewport.x - e.deltaX,
                y: viewport.y - e.deltaY
            });
        }
    }

    constructor() { }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // Helper to convert screen coordinates to    // Coordinate Systems
    private screenToWorld(point: { x: number, y: number }, viewport: Viewport): Point {
        return {
            x: (point.x - viewport.x) / viewport.zoom,
            y: (point.y - viewport.y) / viewport.zoom
        };
    }

    // Helper to check if a point is inside a node
    private isPointInNode(point: Point, node: BoardNode): boolean {
        // Basic AABB check for now
        return point.x >= node.x &&
            point.x <= node.x + node.w &&
            point.y >= node.y &&
            point.y <= node.y + node.h;
    }

    // Main Entry Points from React
    onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!this.canvas) return; // Guard

        const state = pizarronStore.getState();
        const { viewport, order, nodes } = state;

        // Correctly calculate screen point relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const screenPoint = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        const worldPoint = this.screenToWorld(screenPoint, viewport);

        // 0. RESIZE HANDLES
        // 1. Check Resize Handles (only if 1 node selected and NOT LOCKED)
        if (state.selection.size === 1 && state.uiFlags.activeTool === 'pointer') {
            const id = Array.from(state.selection)[0];
            const node = nodes[id];

            if (node && !node.locked && !node.isFixed) {
                const handleSize = 10 / viewport.zoom;
                const half = handleSize / 2;
                const margin = handleSize;

                // Prepare Rotation Math
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;
                const rot = node.rotation || 0;

                // Map Mouse to Local Axis-Aligned Space
                const localMouse = this.rotatePoint(worldPoint, { x: cx, y: cy }, -rot);

                // 1. ROTATION HANDLE
                const rotHandleY = node.y - (25 / viewport.zoom);
                const rotHandleX = node.x + node.w / 2;

                if (Math.abs(localMouse.x - rotHandleX) < margin &&
                    Math.abs(localMouse.y - rotHandleY) < margin) {

                    this.isRotating = true;
                    this.initialResizeState = { ...node }; // snapshot
                    // Calculate start angle relative to center in WORLD space
                    this.initialRotation = Math.atan2(worldPoint.y - cy, worldPoint.x - cx);
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    return;
                }

                // 2. RESIZE HANDLES (Using localMouse works perfectly for rotated nodes!)
                const handles: Record<string, { x: number, y: number }> = {
                    nw: { x: node.x - half, y: node.y - half },
                    ne: { x: node.x + node.w - half, y: node.y - half },
                    se: { x: node.x + node.w - half, y: node.y + node.h - half },
                    sw: { x: node.x - half, y: node.y + node.h - half },
                    n: { x: node.x + node.w / 2 - half, y: node.y - half },
                    s: { x: node.x + node.w / 2 - half, y: node.y + node.h - half },
                    e: { x: node.x + node.w - half, y: node.y + node.h / 2 - half },
                    w: { x: node.x - half, y: node.y + node.h / 2 - half }
                };

                for (const [key, pos] of Object.entries(handles)) {
                    if (Math.abs(localMouse.x - (pos.x + half)) < margin &&
                        Math.abs(localMouse.y - (pos.y + half)) < margin) {

                        this.isResizing = true;
                        this.resizeHandle = key as any;
                        this.initialResizeState = { ...node };
                        this.dragStart = worldPoint;
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                        return;
                    }
                }
            }
        }

        // 1. Check for Node Hits (Reverse order for z-index)
        let hitId: string | null = null;
        for (let i = order.length - 1; i >= 0; i--) {
            const id = order[i];
            const node = nodes[id];
            if (this.isPointInNode(worldPoint, node)) {
                hitId = id;
                break;
            }
        }

        // DOUBLE CLICK (Text Edit)
        const now = Date.now();
        if (hitId && hitId === this.lastClickId && (now - this.lastClickTime) < 300) {
            const node = nodes[hitId];
            if (node.type === 'text') {
                pizarronStore.updateInteractionState({ editingNodeId: hitId });
                this.lastClickId = null;
                return;
            }
        }
        this.lastClickTime = now;
        this.lastClickId = hitId;

        // 2. Logic: Pan vs Select/Drag vs Marquee
        const isMiddleClick = e.button === 1;
        const currentTool = state.uiFlags.activeTool;
        const isHandTool = currentTool === 'hand';
        const isCreatingTool = ['rectangle', 'shape', 'text', 'line'].includes(currentTool);

        // PAN CONDITION
        if (isMiddleClick || isHandTool) {
            this.isPanning = true;
            this.panStartScreen = screenPoint; // Use Screen Coords
            this.startViewport = { ...viewport };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            (e.target as HTMLElement).style.cursor = 'grabbing';
            return;
        }

        // CREATE CONDITION
        if (isCreatingTool) {
            this.isDragging = true;
            this.dragStart = worldPoint;

            // Fetch latest state for activeShapeType
            // const state = pizarronStore.getState(); // Already fetched

            // Determine Type & Content
            let nodeType: BoardNode['type'] = 'shape'; // default
            let content: any = { color: '#94a3b8' };
            let w = 0, h = 0;

            if (currentTool === 'text') {
                nodeType = 'text';
                content = { title: 'New Text', color: '#1e293b' };
                // Default size if click, but allow drag
            } else if (currentTool === 'line') {
                nodeType = 'line';
                content = { lineType: 'straight', strokeWidth: 4, color: '#334155' };
            } else if (currentTool === 'shape' || currentTool === 'rectangle') {
                nodeType = 'shape';
                content = {
                    shapeType: state.uiFlags.activeShapeType || 'rectangle',
                    color: '#cbd5e1'
                };
            }

            pizarronStore.updateInteractionState({
                creationDraft: {
                    id: crypto.randomUUID(),
                    type: nodeType,
                    x: worldPoint.x,
                    y: worldPoint.y,
                    w: w,
                    h: h,
                    content,
                    zIndex: state.order.length + 1,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
            });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        // POINTER TOOL
        if (currentTool === 'pointer') {
            if (hitId) {
                // Mode: SELECT / DRAG
                const n = nodes[hitId]; // Get the node that was hit

                // Handle Selection (Always allow selection, even if locked)
                const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
                let newSelection = new Set(state.selection);

                if (isMultiSelect) {
                    if (newSelection.has(hitId)) {
                        newSelection.delete(hitId);
                    } else {
                        newSelection.add(hitId);
                    }
                } else {
                    if (!newSelection.has(hitId)) {
                        newSelection = new Set([hitId]);
                    }
                }

                pizarronStore.setSelection(Array.from(newSelection));

                // Check Lock
                if (n.locked || n.isFixed) {
                    // Allow selection but NO drag
                    (e.target as HTMLElement).setPointerCapture(e.pointerId); // Still capture to prevent bg panning
                    return;
                }

                this.isDragging = true;

                // Prepare initial positions
                this.initialNodePositions = {};
                newSelection.forEach(id => {
                    const n = nodes[id];
                    if (n) this.initialNodePositions[id] = { x: n.x, y: n.y };
                });

                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            } else {
                // Mode: MARQUEE (Background Click)
                this.dragStart = worldPoint; // Start in World Coords allows consistent resize calculations

                pizarronStore.updateInteractionState({
                    marquee: { x: worldPoint.x, y: worldPoint.y, w: 0, h: 0 }
                });

                pizarronStore.setSelection([]); // Clear selection on bg click
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
        // RECTANGLE TOOL
        else if (currentTool === 'rectangle') {
            // Start Creation Draft
            this.dragStart = worldPoint;
            pizarronStore.updateInteractionState({
                creationDraft: {
                    type: 'shape',
                    x: worldPoint.x,
                    y: worldPoint.y,
                    w: 0,
                    h: 0,
                    content: { shapeType: 'rectangle', color: '#ffffff' }
                }
            });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }

        // TEXT TOOL
        else if (currentTool === 'text') {
            // We just track start pos to detect drag vs click
            this.dragStart = worldPoint;
        }
    }

    onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!this.canvas) return;

        const state = pizarronStore.getState();
        const { viewport } = state;

        const rect = this.canvas.getBoundingClientRect();
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPoint = this.screenToWorld(screenPoint, viewport);

        // ROTATION
        if (this.isRotating && this.initialResizeState) {
            const { x, y, w, h, rotation } = this.initialResizeState;
            const cx = x + w / 2;
            const cy = y + h / 2;

            // Current angle from center
            const currentAngle = Math.atan2(worldPoint.y - cy, worldPoint.x - cx);

            // Diff from drag start
            let deltaAngle = currentAngle - this.initialRotation;

            // New Rotation (Start Rotation + Delta)
            let newRotation = (rotation || 0) + deltaAngle;

            // Snap (Shift) - 45 deg
            if (e.shiftKey) {
                const step = Math.PI / 4; // 45 deg
                newRotation = Math.round(newRotation / step) * step;
            }

            const id = Array.from(state.selection)[0];
            if (id) {
                pizarronStore.updateNode(id, { rotation: newRotation });
            }
            return;
        }

        // RESIZING
        if (this.isResizing && this.initialResizeState && this.resizeHandle) {
            const { x, y, w, h } = this.initialResizeState;
            const dx = worldPoint.x - this.dragStart.x;
            const dy = worldPoint.y - this.dragStart.y;
            const aspect = w / h;

            let nx = x, ny = y, nw = w, nh = h;

            // --- Side Handles (Unidim) ---
            if (this.resizeHandle === 'e') {
                nw = w + dx;
            } else if (this.resizeHandle === 'w') {
                nx = x + dx;
                nw = w - dx;
            } else if (this.resizeHandle === 's') {
                nh = h + dy;
            } else if (this.resizeHandle === 'n') {
                ny = y + dy;
                nh = h - dy;
            }
            // --- Corner Handles (Proportional) ---
            else if (this.resizeHandle === 'se') {
                nw = w + dx;
                nh = nw / aspect;
            } else if (this.resizeHandle === 'sw') {
                nx = x + dx;
                nw = w - dx;
                nh = nw / aspect;
            } else if (this.resizeHandle === 'ne') {
                nw = w + dx;
                nh = nw / aspect;
                ny = y + (h - nh);
            } else if (this.resizeHandle === 'nw') {
                nx = x + dx;
                nw = w - dx;
                nh = nw / aspect;
                ny = y + (h - nh);
            }

            // Min Size Constraint
            if (nw < 20) nw = 20;
            if (nh < 20) nh = 20;

            const id = Array.from(state.selection)[0];
            if (id) {
                const node = state.nodes[id];
                if (node) {
                    pizarronStore.updateNode(id, { x: nx, y: ny, w: nw, h: nh });
                }
            }
            return;
        }

        // Optimize: Only calc world point if needed (not for Pan)

        if (this.isPanning) {
            // Use Screen Delta
            const dx = e.clientX - this.panStartScreen.x;
            const dy = e.clientY - this.panStartScreen.y;
            pizarronStore.updateViewport({
                x: this.startViewport.x + dx,
                y: this.startViewport.y + dy
            });
            return;
        }

        // const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport); 
        // ALREADY CALCULATED AT TOP

        if (this.isDragging) {
            const dx = worldPoint.x - this.dragStart.x;
            const dy = worldPoint.y - this.dragStart.y;

            // Update all selected nodes
            state.selection.forEach(id => {
                const initial = this.initialNodePositions[id];
                if (initial) {
                    pizarronStore.updateNode(id, {
                        x: initial.x + dx,
                        y: initial.y + dy
                    });
                }
            });
            return;
        }

        // Marquee Update
        if (state.interactionState.marquee) {
            pizarronStore.updateInteractionState({
                marquee: {
                    x: state.interactionState.marquee.x,
                    y: state.interactionState.marquee.y,
                    w: worldPoint.x - state.interactionState.marquee.x,
                    h: worldPoint.y - state.interactionState.marquee.y
                }
            });
            this.updateMarqueeSelection(state.interactionState.marquee, state.nodes, state.order);
        }

        // Creation Update
        if (state.interactionState.creationDraft) {
            pizarronStore.updateInteractionState({
                creationDraft: {
                    ...state.interactionState.creationDraft,
                    w: worldPoint.x - this.dragStart.x,
                    h: worldPoint.y - this.dragStart.y
                }
            });
        }

        // Hover effects? (Debounce/Throttle if expensive)
    }

    private updateMarqueeSelection(marquee: any, nodes: Record<string, BoardNode>, order: string[]) {
        // Normalize rect
        const rx = marquee.w < 0 ? marquee.x + marquee.w : marquee.x;
        const ry = marquee.h < 0 ? marquee.y + marquee.h : marquee.y;
        const rw = Math.abs(marquee.w);
        const rh = Math.abs(marquee.h);

        const selected: string[] = [];

        for (const id of order) {
            const n = nodes[id];
            if (!n) continue;
            // Intersection check (AABB)
            if (rx < n.x + n.w && rx + rw > n.x &&
                ry < n.y + n.h && ry + rh > n.y) {
                selected.push(id);
            }
        }

        // OPTIMIZATION: Diff check to avoid spamming Store updates
        const currentSel = pizarronStore.getState().selection;
        const isSame = selected.length === currentSel.size &&
            selected.every(id => currentSel.has(id));

        if (!isSame) {
            pizarronStore.setSelection(selected);
        }
    }

    onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        (e.target as HTMLElement).style.cursor = 'default';

        if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
            return;
        }

        if (this.isRotating) {
            this.isRotating = false;
            return;
        }

        this.isPanning = false;
        this.isDragging = false;

        const state = pizarronStore.getState();
        const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);

        // MARQUEE SELECTION
        if (state.interactionState.marquee) {
            const { x, y, w, h } = state.interactionState.marquee;
            // Normalize
            const rx = w < 0 ? x + w : x;
            const ry = h < 0 ? y + h : h;
            const rw = Math.abs(w);
            const rh = Math.abs(h);

            const selectedIds: string[] = [];
            state.order.forEach(id => {
                const node = state.nodes[id];
                // Intersect
                if (
                    node.x < rx + rw &&
                    node.x + node.w > rx &&
                    node.y < ry + rh &&
                    node.y + node.h > ry
                ) {
                    selectedIds.push(id);
                }
            });

            pizarronStore.setSelection(selectedIds);
            pizarronStore.updateInteractionState({ marquee: undefined });
        }

        // Commit Creation
        if (state.interactionState.creationDraft) {
            const draft = state.interactionState.creationDraft;

            // Validate Dimensions (Click vs Drag)
            let finalW = Math.abs(draft.w);
            let finalH = Math.abs(draft.h);
            const isClick = finalW < 5 && finalH < 5;

            if (isClick) {
                // Apply Defaults
                if (draft.type === 'text') {
                    finalW = 200; finalH = 50;
                } else if (draft.type === 'shape') {
                    finalW = 100; finalH = 100;
                } else if (draft.type === 'line') {
                    finalW = 100; finalH = 10; // Line length / thickness box
                } else if (draft.type === 'image') {
                    finalW = 200; finalH = 200;
                }
            }

            // Normalize X,Y if w/h were negative (dragged left/up)
            let finalX = draft.w < 0 ? draft.x + draft.w : draft.x;
            let finalY = draft.h < 0 ? draft.y + draft.h : draft.y;

            // If it was a click, center it on the mouse point (optional, or just top-left)
            // Let's keep top-left as click point for simplicity

            const newNode: BoardNode = {
                ...draft,
                x: finalX,
                y: finalY,
                w: finalW,
                h: finalH,
                id: crypto.randomUUID(), // New ID or keep draft ID? Draft has ID.
                zIndex: state.order.length + 1,
                updatedAt: Date.now(),
                createdAt: Date.now()
            };

            pizarronStore.addNode(newNode);
            pizarronStore.setSelection([newNode.id]);

            // Reset
            pizarronStore.updateInteractionState({ creationDraft: undefined });
            pizarronStore.setActiveTool('pointer');

            // Special case for Text: Open editing? 
            if (newNode.type === 'text') {
                // The ConfigModalRouter will open TextModal. 
                // If we want inline editing, we might set editingNodeId.
                // But user asked for "Modal Reconnection", so TextModal is fine.
                // Wait, "TextConfigModal" is separate from "Inline Editing" (Double Click).
                // User said "Text... abren su modal correspondiente".
                // So selecting it is enough.
            }

            // Clean up (these are now handled at the very beginning of onPointerUp)
            // this.isDragging = false;
            // this.isPanning = false;
            // (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            // (e.target as HTMLElement).style.cursor = 'default';
            return;
        }

        // These are now handled at the very beginning of onPointerUp
        // this.isDragging = false;
        // this.isPanning = false;
        // (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        // (e.target as HTMLElement).style.cursor = 'default';

    }
}

export const interactionManager = new InteractionManager();

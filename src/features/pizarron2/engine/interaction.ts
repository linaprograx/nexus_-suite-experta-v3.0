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
    private canvas: HTMLCanvasElement | null = null;

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

    // Main Entry Points from React
    onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!this.canvas) return; // Guard

        const state = pizarronStore.getState();
        const { viewport, order, nodes } = state;
        const screenPoint = { x: e.clientX, y: e.clientY };
        const worldPoint = this.screenToWorld(screenPoint, viewport);

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

        // PAN CONDITION
        if (isMiddleClick || isHandTool) {
            this.isPanning = true;
            this.panStartScreen = screenPoint; // Use Screen Coords
            this.startViewport = { ...viewport };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            (e.target as HTMLElement).style.cursor = 'grabbing';
            return;
        }

        // POINTER TOOL
        if (currentTool === 'pointer') {
            if (hitId) {
                // Mode: SELECT / DRAG
                this.isDragging = true;
                this.dragStart = worldPoint;

                // Handle Selection
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

        const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);

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

        pizarronStore.setSelection(selected);
    }

    onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        const state = pizarronStore.getState();
        const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);

        // Commit Creation
        if (state.interactionState.creationDraft) {
            const draft = state.interactionState.creationDraft;
            // Normalize Geometry (handle negative w/h)
            const finalX = draft.w! < 0 ? (draft.x || 0) + draft.w! : (draft.x || 0);
            const finalY = draft.h! < 0 ? (draft.y || 0) + draft.h! : (draft.y || 0);
            const finalW = Math.abs(draft.w || 0);
            const finalH = Math.abs(draft.h || 0);

            if (finalW > 5 && finalH > 5) {
                const newNode: BoardNode = {
                    id: crypto.randomUUID(),
                    type: draft.type as any,
                    x: finalX,
                    y: finalY,
                    w: finalW,
                    h: finalH,
                    zIndex: state.order.length + 1,
                    content: draft.content || {},
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                pizarronStore.addNode(newNode);
                pizarronStore.setSelection([newNode.id]);
                pizarronStore.setActiveTool('pointer'); // Reset tool
            }

            pizarronStore.updateInteractionState({ creationDraft: undefined });
        }

        // Create Text on Click
        if (state.uiFlags.activeTool === 'text' && !this.isPanning && !this.isDragging) {
            // Check distance for clean click
            const dist = Math.hypot(worldPoint.x - this.dragStart.x, worldPoint.y - this.dragStart.y);
            if (dist < 5) {
                const newNode: BoardNode = {
                    id: crypto.randomUUID(),
                    type: 'text',
                    x: worldPoint.x,
                    y: worldPoint.y,
                    w: 200,
                    h: 50,
                    zIndex: state.order.length + 1,
                    content: { title: 'New Text', color: '#1e293b' }, // Default text
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                pizarronStore.addNode(newNode);
                pizarronStore.setSelection([newNode.id]);
                pizarronStore.setActiveTool('pointer');
            }
        }

        if (state.interactionState.marquee) {
            // Clear Marquee
            pizarronStore.updateInteractionState({ marquee: undefined });
        }

        this.isDragging = false;
        this.isPanning = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        (e.target as HTMLElement).style.cursor = 'default';

        // Sync Logic will happen here eventually (notify flush)
    }

    // --- Helpers ---

    private screenToWorld(point: Point, viewport: Viewport): Point {
        // screen = world * zoom + pan
        // world = (screen - pan) / zoom

        // Note: ClientX/Y includes window coords. 
        // We usually need relative to Canvas Container if the canvas is not full screen absolute.
        // Assuming CanvasStage is essentially the screen or we correct for offset in the View.
        // Ideally we should use e.nativeEvent.offsetX if possible, or track canvas rect.
        // For Full Screen Engine, ClientX matches (if no margins).
        // Let's assume standard behavior for now, but correction might be needed.

        return {
            x: (point.x - viewport.x) / viewport.zoom,
            y: (point.y - viewport.y) / viewport.zoom
        };
    }

    private isPointInNode(point: Point, node: BoardNode): boolean {
        return (
            point.x >= node.x &&
            point.x <= node.x + node.w &&
            point.y >= node.y &&
            point.y <= node.y + node.h
        );
    }
}

export const interactionManager = new InteractionManager();

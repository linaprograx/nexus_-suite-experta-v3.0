import { pizarronStore } from '../state/store';
import { BoardNode, Viewport } from './types';

interface Point {
    x: number;
    y: number;
}

export class InteractionManager {
    private isDragging: boolean = false;
    private isPanning: boolean = false;
    private dragStart: Point = { x: 0, y: 0 };
    private initialNodePositions: Record<string, Point> = {};
    private startViewport: Viewport = { x: 0, y: 0, zoom: 1 };

    // Configurable keys
    private panKey = 'Space';

    constructor() { }

    // Main Entry Points from React
    onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
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

        // 2. Logic: Pan vs Select/Drag vs Marquee
        const isMiddleClick = e.button === 1;
        const currentTool = state.uiFlags.activeTool;
        const isHandTool = currentTool === 'hand';

        // PAN CONDITION
        if (isMiddleClick || isHandTool) {
            this.isPanning = true;
            this.dragStart = screenPoint;
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
                this.dragStart = worldPoint; // Start in World Coords gives us stable anchor? 
                // Careful: Marquee usually drawn in SCREEN or WORLD?
                // Visuals usually World-relative if we want them to zoom with canvas, 
                // or Screen-relative if we want them static.
                // Standard is World-relative logic for intersection.

                pizarronStore.updateInteractionState({
                    marquee: { x: worldPoint.x, y: worldPoint.y, w: 0, h: 0 }
                });

                pizarronStore.setSelection([]); // Clear selection on bg click
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
    }

    onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        const state = pizarronStore.getState();

        if (this.isPanning) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            pizarronStore.updateViewport({
                x: this.startViewport.x + dx,
                y: this.startViewport.y + dy
            });
            return;
        }

        if (this.isDragging) {
            const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);
            const dx = worldPoint.x - this.dragStart.x;
            const dy = worldPoint.y - this.dragStart.y;

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
            const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);
            // Logic to allow negative width/height normalization?
            // Or keep w/h signed and renderer handles it? 
            // Renderer `rect` supports signed usually.

            pizarronStore.updateInteractionState({
                marquee: {
                    x: state.interactionState.marquee.x,
                    y: state.interactionState.marquee.y,
                    w: worldPoint.x - state.interactionState.marquee.x,
                    h: worldPoint.y - state.interactionState.marquee.y
                }
            });

            // Update selection continuously during drag? (Heavy but cool)
            // Let's do it on Up for speed, or throttle. 
            // "Acceptance: Selection box fluid". Continuously is better UX.
            // We can do simple bounding box check.
            this.updateMarqueeSelection(state.interactionState.marquee, state.nodes, state.order);
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

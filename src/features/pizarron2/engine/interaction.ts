import { pizarronStore } from '../state/store';
import { BoardNode, Viewport } from './types';
import { snapEngine } from './SnapEngine';

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
    private initialResizeState: { x: number, y: number, w: number, h: number, rotation?: number, fontSize?: number } | null = null;
    private initialNodesState: Record<string, { x: number, y: number, w: number, h: number, fontSize?: number, rotation?: number }> | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private interactionTargetId: string | null = null;
    private keys: Record<string, boolean> = {};


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

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                this.keys[e.key] = true;
                if (e.key === ' ') this.keys['Space'] = true;
            });
            window.addEventListener('keyup', (e) => {
                this.keys[e.key] = false;
                if (e.key === ' ') this.keys['Space'] = false;
            });
        }
    }

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

    // Helper: Rotate a point around a center
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

    // Helper to check if a point is inside a node (Rotation Aware)
    private isPointInNode(point: Point, node: BoardNode): boolean {
        let testPoint = { ...point };

        if (node.rotation) {
            const cx = node.x + node.w / 2;
            const cy = node.y + node.h / 2;
            // Rotate the point opposite to the node's rotation to test against AABB
            testPoint = this.rotatePoint(point, { x: cx, y: cy }, -node.rotation);
        }

        return testPoint.x >= node.x &&
            testPoint.x <= node.x + node.w &&
            testPoint.y >= node.y &&
            testPoint.y <= node.y + node.h;
    }

    // Helper: Calculate connection point on node
    private calculateConnection(point: Point, node: BoardNode): { x: number, y: number, side: 'left' | 'right' | 'top' | 'bottom' } {
        const centers: Record<string, { x: number, y: number }> = {
            top: { x: node.x + node.w / 2, y: node.y },
            bottom: { x: node.x + node.w / 2, y: node.y + node.h },
            left: { x: node.x, y: node.y + node.h / 2 },
            right: { x: node.x + node.w, y: node.y + node.h / 2 }
        };

        let minDist = Infinity;
        let bestSide: 'left' | 'right' | 'top' | 'bottom' = 'top';

        (Object.keys(centers) as Array<'left' | 'right' | 'top' | 'bottom'>).forEach(side => {
            const c = centers[side];
            const dist = Math.hypot(c.x - point.x, c.y - point.y);
            if (dist < minDist) {
                minDist = dist;
                bestSide = side;
            }
        });

        return { ...centers[bestSide], side: bestSide };
    }

    // Phase 6.8: External DOM Node Interaction Support
    startExternalDrag(nodeId: string, e: React.PointerEvent<any> | PointerEvent) {
        if (!this.canvas) return;

        const state = pizarronStore.getState();
        const { viewport, nodes, selection } = state;

        // 1. Calculate World Point
        const rect = this.canvas.getBoundingClientRect();
        const screenPoint = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        const worldPoint = this.screenToWorld(screenPoint, viewport);

        // 2. Selection Logic
        const isSelected = selection.has(nodeId);
        if (e.shiftKey) {
            // Toggle
            if (isSelected) {
                const newSel = new Set(selection);
                newSel.delete(nodeId);
                pizarronStore.setSelection(Array.from(newSel));
                return;
            } else {
                pizarronStore.setSelection([...Array.from(selection), nodeId]);
            }
        } else {
            // Replace if not already selected (Standard behavior)
            // If already selected, keep selection (to allow group drag)
            if (!isSelected) {
                pizarronStore.setSelection([nodeId]);
            }
        }

        // 3. Initialize Drag State
        this.interactionTargetId = nodeId;
        this.isDragging = true;
        this.isPanning = false; // DOM nodes override pan usually
        this.dragStart = worldPoint;

        // Capture initial state for ALL selected nodes (Group Move)
        // Refresh selection from store potentially, or assume sync.
        const effectiveSelection = pizarronStore.getState().selection; // Get fresh

        this.initialNodePositions = {};
        effectiveSelection.forEach(id => {
            const n = nodes[id];
            if (n) {
                this.initialNodePositions[id] = { x: n.x, y: n.y };
            }
        });

        // Set dragging flag in store for UI feedback
        // pizarronStore.setInteractionState({ isDragging: true }); // optimize: dont trigger rerender yet?
    }
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
        // 0. RESIZE HANDLES
        const selectedIds = Array.from(state.selection);
        if (selectedIds.length > 0 && state.uiFlags.activeTool === 'pointer') {
            // Determine Bounds
            let bounds: { x: number, y: number, w: number, h: number, rotation?: number } | null = null;

            if (selectedIds.length === 1) {
                const node = nodes[selectedIds[0]];
                if (node && !node.locked && !node.isFixed) {
                    bounds = { x: node.x, y: node.y, w: node.w, h: node.h, rotation: node.rotation };
                }
            } else {
                // Group Bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let anyLocked = false;
                selectedIds.forEach(id => {
                    const n = nodes[id];
                    if (n) {
                        minX = Math.min(minX, n.x);
                        minY = Math.min(minY, n.y);
                        maxX = Math.max(maxX, n.x + n.w);
                        maxY = Math.max(maxY, n.y + n.h);
                        if (n.locked || n.isFixed) anyLocked = true;
                    }
                });
                if (!anyLocked && minX !== Infinity) {
                    bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, rotation: 0 };
                }
            }

            if (bounds) {
                // Nexus Interaction: Enhanced Handle Logic
                // 1. Base size in Screen Pixels (10px) converted to World
                const baseSize = 10 / viewport.zoom;
                // 2. Clamp to ensure handles don't overlap (max 33% of min dimension)
                const limit = Math.min(bounds.w, bounds.h) / 3;

                const handleSize = Math.min(baseSize, limit);
                const margin = handleSize; // Hit area matches visual/logical size
                const half = handleSize / 2;

                let localMouse = { ...worldPoint };

                // Rotation Check (Only Single)
                if (selectedIds.length === 1 && bounds.rotation !== undefined) {
                    const cx = bounds.x + bounds.w / 2;
                    const cy = bounds.y + bounds.h / 2;
                    localMouse = this.rotatePoint(worldPoint, { x: cx, y: cy }, -bounds.rotation);

                    // Rotation Handle Check (Only Single)
                    const rotHandleY = bounds.y - (25 / viewport.zoom);
                    const rotHandleX = bounds.x + bounds.w / 2;
                    if (Math.abs(localMouse.x - rotHandleX) < margin && Math.abs(localMouse.y - rotHandleY) < margin) {
                        this.isRotating = true;
                        this.initialResizeState = { ...bounds };
                        this.initialRotation = Math.atan2(worldPoint.y - cy, worldPoint.x - cx);
                        (e.target as HTMLElement).setPointerCapture(e.pointerId);
                        return;
                    }
                }

                // Resize Handles Check
                const startX = bounds.x;
                const startY = bounds.y;
                const w = bounds.w;
                const h = bounds.h;

                const handles: Record<string, { x: number, y: number }> = {
                    nw: { x: startX - half, y: startY - half },
                    ne: { x: startX + w - half, y: startY - half },
                    se: { x: startX + w - half, y: startY + h - half },
                    sw: { x: startX - half, y: startY + h - half },
                    n: { x: startX + w / 2 - half, y: startY - half },
                    s: { x: startX + w / 2 - half, y: startY + h - half },
                    e: { x: startX + w - half, y: startY + h / 2 - half },
                    w: { x: startX - half, y: startY + h / 2 - half },
                    rot: { x: startX + w / 2 - half, y: startY - (25 / viewport.zoom) - half } // Corrected hit center
                };

                let hitHandle: string | null = null;
                for (const [key, pos] of Object.entries(handles)) {
                    if (Math.abs(localMouse.x - (pos.x + half)) < margin &&
                        Math.abs(localMouse.y - (pos.y + half)) < margin) {
                        hitHandle = key;
                        break;
                    }
                }

                if (hitHandle) {
                    if (hitHandle === 'rot') {
                        this.isRotating = true;
                        this.isResizing = false;
                    } else {
                        this.isResizing = true;
                        this.resizeHandle = hitHandle;
                    }
                    this.initialResizeState = { ...bounds };

                    // Capture Initial State of ALL Selected Nodes
                    this.initialNodesState = {};
                    selectedIds.forEach(id => {
                        const n = nodes[id];
                        if (n) this.initialNodesState![id] = { x: n.x, y: n.y, w: n.w, h: n.h, fontSize: n.content.fontSize, rotation: n.content.rotation || 0 };
                    });

                    this.dragStart = worldPoint;
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 1. Check        // Hit Test (Reverse Order for Top-First)
        let hitId: string | null = null;
        for (let i = order.length - 1; i >= 0; i--) {
            const id = order[i];
            const node = nodes[id];
            // Ignore collapsed nodes
            if (node && !node.collapsed && this.isPointInNode(worldPoint, node)) {
                hitId = id;
                break;
            }
        }

        // DOUBLE CLICK (Text Edit)
        const now = Date.now();
        // Allow slightly longer for double click (400ms)
        if (hitId && hitId === this.lastClickId && (now - this.lastClickTime) < 400) {
            const node = nodes[hitId];

            // Structured Board Logic (Zones - Phase 7)
            if (node.structure && node.structure.zones) {
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;
                const unrotatedPoint = this.rotatePoint(worldPoint, { x: cx, y: cy }, -(node.rotation || 0));
                const localX = unrotatedPoint.x - node.x;
                const localY = unrotatedPoint.y - node.y;

                // Check Zones
                const hitZone = node.structure.zones.find(z => {
                    const zx = z.x * node.w;
                    const zy = z.y * node.h;
                    const zw = z.w * node.w;
                    const zh = z.h * node.h;
                    return localX >= zx && localX <= zx + zw && localY >= zy && localY <= zy + zh;
                });

                if (hitZone) {
                    // Phase 10: Zone Content Editing (No floating nodes)

                    // 1. Ensure Zone Content is Initialized
                    if (!hitZone.content) {
                        // We need to clone the structure to avoid direct mutation
                        const updatedStructure = JSON.parse(JSON.stringify(node.structure));
                        const idx = updatedStructure.zones.findIndex((z: any) => z.id === hitZone.id);
                        if (idx >= 0) {
                            updatedStructure.zones[idx].content = {
                                text: hitZone.placeholderText || hitZone.label || 'Text',
                                style: { fontSize: 16, color: '#1e293b' }
                            };
                            pizarronStore.updateNode(node.id, { structure: updatedStructure });
                        }
                    }

                    // 2. Select Zone for Editing
                    // Ensure the board itself is selected first (Double click assumes it is, but just in case)
                    if (!this.keys.shift) {
                        pizarronStore.setSelection([node.id]);
                    }

                    // Activate Inspector
                    pizarronStore.updateInteractionState({ activeZoneId: hitZone.id });

                    // Activate Inline Text Editor (Visual Cursor)
                    requestAnimationFrame(() => {
                        pizarronStore.updateInteractionState({
                            editingNodeId: node.id,
                            editingSubId: hitZone.id // Use Zone ID as SubId
                        });
                    });

                    this.lastClickId = null;
                    return;
                }
            }

            // Legacy Grid Logic
            if (node.structure && (node.structure as any).rows) {
                const rows = (node.structure as any).rows;
                const cols = (node.structure as any).cols;

                // Calculate Un-Rotated Point relative to TopLeft
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;
                // Rotate mouse point inversely around center to align with unrotated box
                const unrotatedPoint = this.rotatePoint(worldPoint, { x: cx, y: cy }, -(node.rotation || 0));
                const localX = unrotatedPoint.x - node.x;
                const localY = unrotatedPoint.y - node.y;

                if (localX >= 0 && localX <= node.w && localY >= 0 && localY <= node.h) {
                    // Calculation
                    const totalRowHeight = rows.reduce((acc: number, r: any) => acc + (r.height || 1), 0);
                    const totalColWidth = cols.reduce((acc: number, c: any) => acc + (c.width || 1), 0);

                    let foundRowId = null;
                    let currentY = 0;
                    for (const r of rows) {
                        const h = (r.height / totalRowHeight) * node.h;
                        if (localY >= currentY && localY < currentY + h) {
                            foundRowId = r.id;
                            break;
                        }
                        currentY += h;
                    }

                    let foundColId = null;
                    let currentX = 0;
                    for (const c of cols) {
                        const w = (c.width / totalColWidth) * node.w;
                        if (localX >= currentX && localX < currentX + w) {
                            foundColId = c.id;
                            break;
                        }
                        currentX += w;
                    }

                    if (foundRowId && foundColId) {
                        pizarronStore.updateInteractionState({
                            editingNodeId: hitId,
                            editingSubId: `${foundRowId}_${foundColId}`
                        });
                        this.lastClickId = null;
                        return;
                    }
                }
            }

            // Composite Logic
            if (node.type === 'composite' && node.content.composite) {
                const { composite } = node.content;
                const { structure, cells } = composite;
                const { rows, cols, gap = 0, padding = 0 } = structure;

                const availW = node.w - (padding * 2);
                const availH = node.h - (padding * 2);
                const cellW = (availW - ((cols - 1) * gap)) / cols;
                const cellH = (availH - ((rows - 1) * gap)) / rows;

                // Local transform
                let localP = { x: worldPoint.x - node.x, y: worldPoint.y - node.y };
                if (node.rotation) {
                    const cx = node.w / 2;
                    const cy = node.h / 2;
                    const dx = localP.x - cx;
                    const dy = localP.y - cy;
                    const cos = Math.cos(-node.rotation);
                    const sin = Math.sin(-node.rotation);
                    localP.x = cx + (dx * cos - dy * sin);
                    localP.y = cy + (dx * sin + dy * cos);
                }

                // Check cells
                for (const cell of cells) {
                    const cellX = padding + (cell.col * (cellW + gap));
                    const cellY = padding + (cell.row * (cellH + gap));

                    if (localP.x >= cellX && localP.x <= cellX + cellW &&
                        localP.y >= cellY && localP.y <= cellY + cellH) {

                        pizarronStore.updateInteractionState({
                            editingNodeId: hitId,
                            editingSubId: cell.id
                        });
                        this.lastClickId = null;
                        return;
                    }
                }
                // If background clicked, maybe edit generic text? Or just ignore
            }

            if (node.type === 'text' || node.type === 'card' || node.type === 'board') {
                // Determine if click was on Title or Body (for Board/Card)
                let subId: string | undefined = undefined;
                if (node.type === 'board' || node.type === 'card') {
                    // Calculate local click position
                    const cx = node.x + node.w / 2;
                    const cy = node.y + node.h / 2;
                    const unrotatedPoint = this.rotatePoint(worldPoint, { x: cx, y: cy }, -(node.rotation || 0));
                    const localY = unrotatedPoint.y - node.y;

                    // Title Bar threshold (approx 40px)
                    if (localY > 45) {
                        subId = 'body';
                    }
                }

                pizarronStore.updateInteractionState({ editingNodeId: hitId, editingSubId: subId });
                this.lastClickId = null;
                return;
            }
        }

        // Check Double Click
        const clickTime = Date.now();
        const doubleClickThreshold = 300;
        const isDoubleClick = (clickTime - this.lastClickTime < doubleClickThreshold);
        this.lastClickTime = clickTime;

        if (isDoubleClick) {
            console.log("Double Click Detected!");

            // 1. If Locked Node, ignore
            if (hitId && nodes[hitId] && nodes[hitId].locked) return;

            // 2. If Text Node -> Edit Mode
            if (hitId && nodes[hitId] && nodes[hitId].type === 'text') {
                pizarronStore.setUIFlag('activeTool', 'pointer'); // Ensure pointer
                pizarronStore.updateInteractionState({ editingTextId: nodes[hitId].id });
                return;
            }

            // 3. If Board or Canvas (Empty) -> Create Text
            // We need world coordinates for where the click happened
            const rect = this.canvas.getBoundingClientRect();
            const worldPos = this.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, state.viewport);

            // Determine if we clicked on a board or "nothing" (which means canvas)
            // 'node' variable holds the clicked target. 
            // If node is undefined, it's canvas.
            // If node is 'board', it's board.
            const clickedNode = hitId ? nodes[hitId] : undefined;

            if (!clickedNode || (clickedNode.type === 'board' && !clickedNode.structure?.zones && !clickedNode.structure?.cells)) {
                console.log("Creating Quick Text Node at", worldPos);

                const newTextId = crypto.randomUUID();
                const newTextNode: any = {
                    id: newTextId,
                    type: 'text',
                    x: worldPos.x,
                    y: worldPos.y,
                    w: 200, // Default width
                    h: 50,  // Default height estimate
                    zIndex: (state.order.length || 0) + 100,
                    content: {
                        title: 'Type something...',
                        fontSize: 24,
                        fontFamily: 'Inter',
                        color: '#1e293b'
                    },
                    createdAt: clickTime,
                    updatedAt: clickTime,
                    parentId: clickedNode ? clickedNode.id : undefined // If double clicked on a board, parent it!
                };

                // Adjust position to center on click?
                // Text creation usually starts top-left at click. Middle-left is better UX.
                newTextNode.y -= 12; // Approximation for font baseline center

                pizarronStore.addNode(newTextNode);
                pizarronStore.setSelection([newTextId]);

                // Enter Edit Mode immediately
                // We need to wait a tick for the node to be in store/DOM?
                // Usually React sequence handles it if store updates fast enough.
                setTimeout(() => {
                    pizarronStore.updateInteractionState({ editingTextId: newTextId });
                }, 50);

                return;
            }
        }

        // 2. Logic: Pan vs Select/Drag vs Marquee
        const isMiddleClick = e.button === 1;
        const currentTool = state.uiFlags.activeTool;
        const isHandTool = currentTool === 'hand';
        const isCreatingTool = ['rectangle', 'shape', 'text', 'line'].includes(currentTool);
        const isTemporaryPan = state.interactionState.temporaryPanMode; // Spacebar-triggered

        // PAN CONDITION (includes spacebar temporary pan)
        if (isMiddleClick || isHandTool || isTemporaryPan) {
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
                // --- MODE: HIT NODE (Select/Drag) ---

                // 1. Handle Selection
                const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

                // ZONE SELECTION LOGIC
                // (Optimized: Check Bounds First)
                // ... logic ...

                pizarronStore.updateInteractionState({ dragNodeId: hitId }); // Visual Feedback (Lift)
                const hitNode = nodes[hitId];
                if (hitNode && hitNode.structure && hitNode.structure.zones) {
                    const cx = hitNode.x + hitNode.w / 2;
                    const cy = hitNode.y + hitNode.h / 2;
                    const unrotatedPoint = this.rotatePoint(worldPoint, { x: cx, y: cy }, -(hitNode.rotation || 0));
                    const localX = unrotatedPoint.x - hitNode.x;
                    const localY = unrotatedPoint.y - hitNode.y;

                    const hitZone = hitNode.structure.zones.find(z => {
                        const zx = z.x * hitNode.w;
                        const zy = z.y * hitNode.h;
                        const zw = z.w * hitNode.w;
                        const zh = z.h * hitNode.h;
                        return localX >= zx && localX <= zx + zw && localY >= zy && localY <= zy + zh;
                    });

                    if (hitZone) {
                        const zy = hitZone.y * hitNode.h;
                        const localYInZone = localY - zy;
                        const titleBoundary = 24 + (hitZone.style?.titleGap ?? 2);

                        let section = 'content';
                        if (localYInZone < titleBoundary) {
                            section = 'title';
                        } else {
                            // Section Layout Logic (Match Renderer)
                            const zh = hitZone.h * hitNode.h;
                            const availableH = Math.max(0, zh - titleBoundary);
                            const extraSections = hitZone.sections || [];
                            const totalSections = 1 + extraSections.length; // 1 for 'content'
                            const sectionH = availableH / totalSections;

                            const relativeY = localYInZone - titleBoundary;
                            const sectionIndex = Math.floor(relativeY / sectionH);

                            if (sectionIndex === 0) {
                                section = 'content';
                            } else if (sectionIndex > 0 && sectionIndex <= extraSections.length) {
                                section = extraSections[sectionIndex - 1].id;
                            }
                        }

                        pizarronStore.updateInteractionState({
                            activeZoneId: hitZone.id,
                            activeZoneSection: section
                        });
                    } else {
                        pizarronStore.updateInteractionState({
                            activeZoneId: undefined,
                            activeZoneSection: undefined
                        });
                    }
                } else {
                    if (!isMultiSelect) pizarronStore.updateInteractionState({ activeZoneId: undefined });
                }

                // Group Hierarchy Logic
                let targetId = hitId;
                const node = state.nodes[hitId];
                if (node?.parentId) {
                    if (state.interactionState.editingGroupId !== node.parentId) {
                        targetId = node.parentId;
                    }
                }
                this.interactionTargetId = targetId;

                if (isMultiSelect) {
                    pizarronStore.toggleSelection(targetId);
                } else {
                    if (!state.selection.has(targetId)) {
                        pizarronStore.setSelection([targetId]);
                    }
                    // If already selected, keep it selected (drag prep)
                }

                // 2. Prepare Drag (Always runs on hit)
                this.isDragging = true;
                this.dragStart = worldPoint;

                const selectedNodes = pizarronStore.getSelectedNodes();
                this.initialNodePositions = {};
                selectedNodes.forEach(n => {
                    this.initialNodePositions[n.id] = { ...n };
                    if (n.type === 'group' && n.childrenIds) {
                        n.childrenIds.forEach(cid => {
                            const child = state.nodes[cid];
                            if (child) {
                                this.initialNodePositions[cid] = { ...child };
                            }
                        });
                    }
                });

                (e.target as HTMLElement).setPointerCapture(e.pointerId);

            } else {
                // --- MODE: BACKGROUND (Marquee) ---
                this.dragStart = worldPoint;

                pizarronStore.updateInteractionState({
                    marquee: { x: worldPoint.x, y: worldPoint.y, w: 0, h: 0 }
                });

                if (!e.shiftKey) {
                    pizarronStore.setSelection([]);
                    pizarronStore.updateInteractionState({
                        activeZoneId: undefined,
                        activeZoneSection: undefined
                    });
                }
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
        // LINE TOOL
        else if (currentTool === 'line') {
            let startX = worldPoint.x;
            let startY = worldPoint.y;
            let startBinding: any = undefined;

            if (hitId) {
                const target = nodes[hitId];
                const snap = this.calculateConnection(worldPoint, target);
                startX = snap.x;
                startY = snap.y;
                startBinding = { nodeId: hitId, side: snap.side };
            }

            this.dragStart = { x: startX, y: startY };

            pizarronStore.updateInteractionState({
                creationDraft: {
                    type: 'line',
                    x: startX,
                    y: startY,
                    w: 0,
                    h: 0,
                    content: {
                        lineType: 'straight',
                        strokeWidth: 2,
                        endArrow: true,
                        startBinding
                    }
                }
            });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
            const cx = this.initialResizeState.x + this.initialResizeState.w / 2;
            const cy = this.initialResizeState.y + this.initialResizeState.h / 2;

            const currentAngle = Math.atan2(worldPoint.y - cy, worldPoint.x - cx);
            let newRotation = currentAngle + (Math.PI / 2); // Adjust for handle position (top)

            // Normalize to 0-2PI or -PI to PI if needed, but simple is fine.
            // Snap to 45 degrees (PI/4)
            if (e.shiftKey) {
                // Shift: Force Snap to 45 deg
                const SNAP_ANGLE = Math.PI / 4;
                newRotation = Math.round(newRotation / SNAP_ANGLE) * SNAP_ANGLE;
            } else {
                // No Shift: Magnetism to 90 deg (PI/2)
                const MAGNET_ANGLE = Math.PI / 2;
                const closest = Math.round(newRotation / MAGNET_ANGLE) * MAGNET_ANGLE;
                if (Math.abs(newRotation - closest) < 0.1) {
                    newRotation = closest;
                }
            }

            // Update Nodes
            const selectedIds = Array.from(state.selection);
            selectedIds.forEach(id => {
                const initial = this.initialNodesState?.[id];
                if (initial) {
                    // For single node, just set rotation.
                    // For multiple, we'd rotate around group center, but let's stick to single for now as per resizing.
                    pizarronStore.updateNode(id, {
                        content: {
                            ...state.nodes[id].content,
                            rotation: newRotation
                        }
                    });
                }
            });

            return;
        }


        // RESIZING
        if (this.isResizing && this.initialResizeState && this.resizeHandle) {
            const { x, y, w, h } = this.initialResizeState;
            const dx = worldPoint.x - this.dragStart.x;
            const dy = worldPoint.y - this.dragStart.y;
            const aspect = w / h;
            const isProportional = !e.altKey && ['se', 'sw', 'ne', 'nw'].includes(this.resizeHandle);

            let nx = x, ny = y, nw = w, nh = h;

            // --- Side Handles (Always Unidim) ---
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
            // --- Corner Handles ---
            else if (this.resizeHandle === 'se') {
                nw = w + dx;
                nh = isProportional ? nw / aspect : h + dy;
            } else if (this.resizeHandle === 'sw') {
                nx = x + dx;
                nw = w - dx;
                nh = isProportional ? nw / aspect : h + dy;
            } else if (this.resizeHandle === 'ne') {
                nw = w + dx;
                if (isProportional) {
                    nh = nw / aspect;
                    ny = y + (h - nh);
                } else {
                    ny = y + dy;
                    nh = h - dy;
                }
            } else if (this.resizeHandle === 'nw') {
                nx = x + dx;
                nw = w - dx;
                if (isProportional) {
                    nh = nw / aspect;
                    ny = y + (h - nh);
                } else {
                    ny = y + dy;
                    nh = h - dy;
                }
            }

            // Min Size Constraint
            if (nw < 20) nw = 20;
            if (nh < 20) nh = 20;

            // --- Group vs Single Update ---
            if (this.initialNodesState) {
                // MULTI-SELECTION RESIZE
                const initBox = this.initialResizeState!;
                const scaleX = nw / initBox.w;
                const scaleY = nh / initBox.h;

                Object.entries(this.initialNodesState).forEach(([id, initNode]) => {
                    // Calculate relative position to the Group Box
                    const relX = initNode.x - initBox.x;
                    const relY = initNode.y - initBox.y;

                    // Apply Scale
                    const newX = nx + (relX * scaleX);
                    const newY = ny + (relY * scaleY);
                    const newW = initNode.w * scaleX;
                    const newH = initNode.h * scaleY;

                    const updates: any = { x: newX, y: newY, w: newW, h: newH };

                    // Text Scaling (if present)
                    // Use MAX scale factor to ensure text scales even if dragging only one axis
                    if (initNode.fontSize) {
                        const maxScale = Math.max(scaleX, scaleY);
                        const newSize = Math.max(8, Math.round(initNode.fontSize * maxScale));
                        const currentNode = state.nodes[id];
                        updates.content = { ...currentNode.content, fontSize: newSize };
                    }

                    pizarronStore.updateNode(id, updates);
                });

            } else {
                // SINGLE SELECTION RESIZE (Legacy Logic)
                const id = Array.from(state.selection)[0];
                if (id) {
                    const node = state.nodes[id];
                    if (node) {
                        const updates: any = { x: nx, y: ny, w: nw, h: nh };

                        // Text Scaling (Proportional)
                        if (node.type === 'text' && this.initialResizeState?.fontSize) {
                            const initialH = this.initialResizeState.h;
                            if (initialH > 0) {
                                const ratio = nh / initialH;
                                const newSize = Math.max(8, Math.round(this.initialResizeState.fontSize * ratio));
                                updates.content = { ...node.content, fontSize: newSize };
                            }
                        }

                        pizarronStore.updateNode(id, updates);
                    }
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
            let dx = worldPoint.x - this.dragStart.x;
            let dy = worldPoint.y - this.dragStart.y;

            // --- SNAP ENGINE ---
            let snapLines: any[] = [];

            if (!e.altKey && state.selection.size > 0) {
                // Calculate Future Bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                state.selection.forEach(id => {
                    const init = this.initialNodePositions[id];
                    const n = state.nodes[id];
                    if (init && n) {
                        minX = Math.min(minX, init.x);
                        minY = Math.min(minY, init.y);
                        maxX = Math.max(maxX, init.x + n.w);
                        maxY = Math.max(maxY, init.y + n.h);
                    }
                });

                if (minX !== Infinity) {
                    const w = maxX - minX;
                    const h = maxY - minY;
                    const futureBox = { x: minX + dx, y: minY + dy, w, h };

                    // 8px Threshold (adjusted for zoom)
                    const threshold = 8 / state.viewport.zoom;
                    const snap = this.calculateSnap(futureBox, state.nodes, state.selection, threshold);

                    dx += snap.dx;
                    dy += snap.dy;
                    snapLines = snap.lines;
                }
            }

            pizarronStore.updateInteractionState({ guides: snapLines.length > 0 ? snapLines : undefined });

            // Update all selected nodes

            state.selection.forEach(id => {
                const initial = this.initialNodePositions[id];
                if (initial) {
                    pizarronStore.updateNode(id, {
                        x: initial.x + dx,
                        y: initial.y + dy
                    });

                    // Update Connected Lines
                    if (state.nodes[id]) {
                        pizarronStore.updateAttachedLines(id, { x: initial.x + dx, y: initial.y + dy, w: state.nodes[id].w, h: state.nodes[id].h });
                    }

                    // Propagate to Group Children
                    const node = state.nodes[id];
                    if (node?.type === 'group' && node.childrenIds) {
                        node.childrenIds.forEach(cid => {
                            const childInitial = this.initialNodePositions[cid];
                            if (childInitial) {
                                pizarronStore.updateNode(cid, {
                                    x: childInitial.x + dx,
                                    y: childInitial.y + dy
                                });
                            }
                        });
                    }
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
            const draft = state.interactionState.creationDraft;

            if (draft.type === 'line') {
                let endX = worldPoint.x;
                let endY = worldPoint.y;
                let endBinding = undefined;

                let hitId: string | null = null;
                for (let i = state.order.length - 1; i >= 0; i--) {
                    const id = state.order[i];
                    const n = state.nodes[id];
                    if (n && this.isPointInNode(worldPoint, n)) {
                        hitId = id;
                        break;
                    }
                }

                if (hitId && hitId !== draft.content?.startBinding?.nodeId) {
                    const target = state.nodes[hitId];
                    const snap = this.calculateConnection(worldPoint, target);
                    endX = snap.x;
                    endY = snap.y;
                    endBinding = { nodeId: hitId, side: snap.side };
                } else if (e.shiftKey) {
                    // Shift: Constrain to H / V
                    const dx = endX - this.dragStart.x;
                    const dy = endY - this.dragStart.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        endY = this.dragStart.y; // Horizontal
                    } else {
                        endX = this.dragStart.x; // Vertical
                    }
                }

                pizarronStore.updateInteractionState({
                    creationDraft: {
                        ...draft,
                        w: endX - this.dragStart.x,
                        h: endY - this.dragStart.y,
                        content: {
                            ...draft.content,
                            endBinding
                        }
                    }
                });
            } else {
                pizarronStore.updateInteractionState({
                    creationDraft: {
                        ...draft,
                        w: worldPoint.x - this.dragStart.x,
                        h: worldPoint.y - this.dragStart.y
                    }
                });
            }
        }

        // Hover effects (Throttle)
        // Find top-most node under cursor
        let hoverId: string | undefined = undefined;
        for (let i = state.order.length - 1; i >= 0; i--) {
            const id = state.order[i];
            const n = state.nodes[id];
            if (n && !n.collapsed && this.isPointInNode(worldPoint, n)) {
                hoverId = id;
                break;
            }
        }

        // Only update if changed
        if (state.interactionState.hoveredNodeId !== hoverId) {
            pizarronStore.updateInteractionState({ hoveredNodeId: hoverId });
        }
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


    private calculateSnap(
        movingBox: { x: number, y: number, w: number, h: number },
        otherNodes: Record<string, BoardNode>,
        excludeIds: Set<string>,
        threshold: number = 6
    ): { dx: number, dy: number, lines: NonNullable<import('./types').BoardState['interactionState']['snapLines']> } {

        let dx = 0;
        let dy = 0;
        const lines: NonNullable<import('./types').BoardState['interactionState']['snapLines']> = [];

        const candidates = Object.values(otherNodes).filter(n => !excludeIds.has(n.id));

        const moving = {
            l: movingBox.x,
            c: movingBox.x + movingBox.w / 2,
            r: movingBox.x + movingBox.w,
            t: movingBox.y,
            m: movingBox.y + movingBox.h / 2,
            b: movingBox.y + movingBox.h
        };

        let minDx = Infinity;
        let snapXLine: any = null;

        let minDy = Infinity;
        let snapYLine: any = null;

        candidates.forEach(cand => {
            const target = {
                l: cand.x,
                c: cand.x + cand.w / 2,
                r: cand.x + cand.w,
                t: cand.y,
                m: cand.y + cand.h / 2,
                b: cand.y + cand.h
            };

            // Horizontal Snaps
            const xPairs = [
                { m: moving.l, t: target.l }, { m: moving.l, t: target.c }, { m: moving.l, t: target.r },
                { m: moving.c, t: target.l }, { m: moving.c, t: target.c }, { m: moving.c, t: target.r },
                { m: moving.r, t: target.l }, { m: moving.r, t: target.c }, { m: moving.r, t: target.r }
            ];

            xPairs.forEach(pair => {
                const diff = pair.t - pair.m;
                if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDx)) {
                    minDx = diff;
                    const startY = Math.min(movingBox.y, cand.y);
                    const endY = Math.max(movingBox.y + movingBox.h, cand.y + cand.h);
                    snapXLine = { type: 'vertical', x: pair.t, start: startY - 20, end: endY + 20 };
                }
            });

            // Vertical Snaps
            const yPairs = [
                { m: moving.t, t: target.t }, { m: moving.t, t: target.m }, { m: moving.t, t: target.b },
                { m: moving.m, t: target.t }, { m: moving.m, t: target.m }, { m: moving.m, t: target.b },
                { m: moving.b, t: target.t }, { m: moving.b, t: target.m }, { m: moving.b, t: target.b }
            ];

            yPairs.forEach(pair => {
                const diff = pair.t - pair.m;
                if (Math.abs(diff) < threshold && Math.abs(diff) < Math.abs(minDy)) {
                    minDy = diff;
                    const startX = Math.min(movingBox.x, cand.x);
                    const endX = Math.max(movingBox.x + movingBox.w, cand.x + cand.w);
                    snapYLine = { type: 'horizontal', y: pair.t, start: startX - 20, end: endX + 20 };
                }
            });
        });

        if (minDx !== Infinity) {
            dx = minDx;
            if (snapXLine) lines.push(snapXLine);
        }
        if (minDy !== Infinity) {
            dy = minDy;
            if (snapYLine) lines.push(snapYLine);
        }

        return { dx, dy, lines };
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
        this.isPanning = false;
        this.isDragging = false;

        pizarronStore.updateInteractionState({ dragNodeId: undefined }); // Clear Drag Visual

        const state = pizarronStore.getState();

        if (state.interactionState.snapLines) {
            pizarronStore.updateInteractionState({ snapLines: undefined });
        }
        if (state.interactionState.guides) {
            pizarronStore.updateInteractionState({ guides: undefined });
        }

        const worldPoint = this.screenToWorld({ x: e.clientX, y: e.clientY }, state.viewport);

        // Click Selection Refinement
        if (this.interactionTargetId && !state.interactionState.marquee && !state.interactionState.creationDraft) {
            const dist = Math.hypot(worldPoint.x - this.dragStart.x, worldPoint.y - this.dragStart.y);
            if (dist < 5 && !e.shiftKey) {
                pizarronStore.setSelection([this.interactionTargetId]);
            }
        }
        this.interactionTargetId = null;

        // MARQUEE SELECTION
        if (state.interactionState.marquee) {
            const { x, y, w, h } = state.interactionState.marquee;
            // Normalize
            const rx = w < 0 ? x + w : x;
            const ry = h < 0 ? y + h : y;
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
                id: crypto.randomUUID(), // New ID or keep draft ID? Draft has ID.
                type: draft.type || 'shape', // Ensure type is set
                x: finalX,
                y: finalY,
                w: finalW,
                h: finalH,
                zIndex: state.order.length + 1,
                updatedAt: Date.now(),
                createdAt: Date.now(),
                content: draft.content || {}
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

    onDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const state = pizarronStore.getState();
        const worldPoint = this.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, state.viewport);

        let hitId: string | null = null;
        for (let i = state.order.length - 1; i >= 0; i--) {
            const id = state.order[i];
            const n = state.nodes[id];
            if (n && !n.collapsed && this.isPointInNode(worldPoint, n)) {
                hitId = id;
                break;
            }
        }

        if (hitId) {
            const node = state.nodes[hitId];

            // Text nodes: always open editor
            if (node.type === 'text') {
                pizarronStore.updateInteractionState({ editingTextId: hitId });
                return;
            }

            // Shape nodes: add editable text if none exists, or open editor
            if (node.type === 'shape') {
                // If shape doesn't have title, add it with contrasting color
                if (!node.content.title) {
                    pizarronStore.updateNode(hitId, {
                        content: {
                            ...node.content,
                            title: 'Text',
                            titleColor: '#ffffff',  // White text for visibility
                            fontSize: 16,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: '400'
                        }
                    });
                }
                // Open editor for the title
                pizarronStore.updateInteractionState({ editingNodeId: hitId, editingSubId: 'title' });
                return;
            }

            // Card, Board, Menu nodes: determine which part was clicked
            if (node.type === 'card' || node.type === 'board' || node.type === 'menu-design') {
                const cx = node.x + node.w / 2;
                const cy = node.y + node.h / 2;
                const unrotatedPoint = this.rotatePoint(worldPoint, { x: cx, y: cy }, -(node.rotation || 0));
                const localY = unrotatedPoint.y - node.y;

                const subId = localY > 45 ? 'body' : 'title';
                pizarronStore.updateInteractionState({ editingNodeId: hitId, editingSubId: subId });
            }
        }
    }

}

export const interactionManager = new InteractionManager();

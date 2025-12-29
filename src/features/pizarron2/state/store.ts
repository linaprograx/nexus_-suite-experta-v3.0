
import { useSyncExternalStore } from 'react';
import { BoardState, BoardNode, Viewport, PizarraMetadata, BoardStructure, BoardResource, InteractionMode } from '../engine/types';

// Initial State
const INITIAL_STATE: BoardState = {
    nodes: {},
    order: [],
    selection: new Set(),
    viewport: { x: 0, y: 0, zoom: 1 },
    uiFlags: {
        gridEnabled: true,
        presentationMode: false,
        qualityTier: 'high',
        debug: false,
        activeTool: 'pointer',
        activeShapeType: 'rectangle' as 'rectangle' | 'circle' | 'triangle' | 'star',
        toolbarPinned: false,
        showLibrary: false,
        showOverview: false,
        grimorioPickerOpen: null
    },
    // Active Project Metadata
    activePizarra: undefined,
    interactionState: {
        mode: 'creative', // Fixed: Initialize mode
        // Coreography: Target Viewport for smooth transitions
        targetViewport: undefined // If set, renderer/loop should interpolate to this
    },
    presentationState: {
        isActive: false,
        route: 'order',
        currentIndex: 0,
        storyPath: [] // Initial empty path
    },
    savedTemplates: [] // Custom User Templates for Structures
};

type Listener = () => void;
type Selector<T> = (state: BoardState) => T;

class PizarronStore {
    private state: BoardState;
    private listeners: Set<Listener>;
    public itemCount: number = 0;

    constructor() {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE)); // Deep copy initial
        this.state.selection = new Set(); // Set doesn't survive JSON
        this.listeners = new Set();
    }

    getState(): BoardState {
        return this.state;
    }

    useState(): BoardState {
        return useSyncExternalStore(
            this.subscribe.bind(this),
            this.getState.bind(this)
        );
    }

    // Optimization: Granular Selector Hook
    useSelector<T>(selector: (state: BoardState) => T): T {
        return useSyncExternalStore(
            this.subscribe.bind(this),
            () => selector(this.state)
        );
    }

    // --- History (Undo/Redo) ---
    private history: string[] = [];
    private historyIndex = -1;
    private isUndoing = false;
    private maxHistory = 50;

    private pushHistory() {
        if (this.isUndoing) return;

        // Snapshot only critical data: nodes, order
        const snapshot = JSON.stringify({
            nodes: this.state.nodes,
            order: this.state.order
        });

        // Check if identical to current top
        if (this.historyIndex >= 0 && this.history[this.historyIndex] === snapshot) return;

        // Truncate future if we were in middle
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex <= 0) return; // Nothing to undo

        this.isUndoing = true;
        this.historyIndex--;
        const snapshot = JSON.parse(this.history[this.historyIndex]);

        this.setState(state => {
            state.nodes = snapshot.nodes;
            state.order = snapshot.order;
            // Deselect to avoid ghost selections
            state.selection = new Set();
        });
        this.isUndoing = false;
    }

    redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.isUndoing = true;
        this.historyIndex++;
        const snapshot = JSON.parse(this.history[this.historyIndex]);

        this.setState(state => {
            state.nodes = snapshot.nodes;
            state.order = snapshot.order;
            state.selection = new Set();
        });
        this.isUndoing = false;
    }

    /**
     * Updates state and notifies subscribers efficiently.
     * @param silent If true, does NOT notify subscribers (React won't re-render). Use for high-frequency RAF updates.
     */
    setState(updater: (draft: BoardState) => void, saveHistory = false, silent = false) {
        // If this is the FIRST time setup, ensure we have initial history
        if (this.history.length === 0) {
            this.history.push(JSON.stringify({ nodes: this.state.nodes, order: this.state.order }));
            this.historyIndex = 0;
        }

        updater(this.state);

        if (saveHistory) {
            this.pushHistory();
        }

        // We still create a new reference for the state object to ensure selectors that *do* run later pick it up
        // But if silent is true, we don't notify.
        this.state = { ...this.state };
        this.itemCount = Object.keys(this.state.nodes).length;

        if (!silent) {
            this.notify();
        }
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(cb => cb());
    }

    // --- Actions ---

    updateViewport(viewport: Partial<Viewport>, animate: boolean = false, silent: boolean = false) {
        this.setState(state => {
            if (animate) {
                // If animate is true, we set the TARGET.
                // The loop in CanvasStage/Renderer must handle the interpolation.
                // Merging with current if not provided
                const current = state.interactionState.targetViewport || state.viewport;
                state.interactionState.targetViewport = { ...current, ...viewport };
            } else {
                // Instant update
                state.interactionState.targetViewport = undefined; // Kill target to stop potential fight
                Object.assign(state.viewport, viewport);
            }
        }, false, silent);
    }

    // Helper for explicit animation calls
    animateViewport(viewport: Partial<Viewport>) {
        this.updateViewport(viewport, true);
    }

    addNode(node: BoardNode) {
        this.setState(state => {
            // Auto-assign Z-Index to be on top
            const maxZ = state.order.reduce((max, id) => Math.max(max, state.nodes[id]?.zIndex || 0), 0);
            node.zIndex = maxZ + 1;

            state.nodes[node.id] = node;
            state.order.push(node.id);
        }, true);
    }

    updateNode(id: string, patch: Partial<BoardNode> | any, saveHistory = true) {
        // We use setState to ensure React components (Inspector) re-render.
        this.setState(state => {
            const node = state.nodes[id];
            if (node) {
                // Resize/Move Propagation for Groups & Boards
                if (node.type === 'group' || node.type === 'board') {
                    const updates = patch as any;
                    // Check if resizing (Width or Height changed)
                    if ((updates.w !== undefined && updates.w !== node.w) || (updates.h !== undefined && updates.h !== node.h)) {
                        const newX = (updates.x !== undefined) ? updates.x : node.x;
                        const newY = (updates.y !== undefined) ? updates.y : node.y;
                        const newW = (updates.w !== undefined) ? updates.w : node.w;
                        const newH = (updates.h !== undefined) ? updates.h : node.h;

                        // Calculate Scale Factor
                        if (node.w > 0 && node.h > 0) {
                            const scaleX = newW / node.w;
                            const scaleY = newH / node.h;

                            const children = node.childrenIds || [];
                            children.forEach(cid => {
                                const child = state.nodes[cid];
                                if (child) {
                                    // Relative position to OLD group origin
                                    const relX = child.x - node.x;
                                    const relY = child.y - node.y;

                                    // Apply Scale to Position & Dimensions
                                    child.x = newX + (relX * scaleX);
                                    child.y = newY + (relY * scaleY);
                                    child.w *= scaleX;
                                    child.h *= scaleY;

                                    // Scale Text
                                    if (child.type === 'text' && child.content.fontSize) {
                                        const s = Math.max(scaleX, scaleY);
                                        child.content.fontSize = Math.max(8, Math.round(child.content.fontSize * s));
                                    }
                                }
                            });
                        }
                    }
                    // Check if translation ONLY (X or Y changed, but W/H same)
                    else if ((updates.x !== undefined && updates.x !== node.x) || (updates.y !== undefined && updates.y !== node.y)) {
                        const dx = (updates.x !== undefined ? updates.x : node.x) - node.x;
                        const dy = (updates.y !== undefined ? updates.y : node.y) - node.y;

                        const children = node.childrenIds || [];
                        children.forEach(cid => {
                            const child = state.nodes[cid];
                            if (child) {
                                child.x += dx;
                                child.y += dy;
                            }
                        });
                    }
                }


                Object.assign(node, patch);
                node.updatedAt = Date.now();
            }
        }, saveHistory);
    }

    deleteNode(id: string) {
        this.deleteNodes([id]);
    }

    deleteNodes(ids: string[]) {
        this.setState(state => {
            const set = new Set(ids);
            state.order = state.order.filter(oid => !set.has(oid));
            ids.forEach(id => {
                delete state.nodes[id];
                state.selection.delete(id);
            });
        }, true);
    }

    duplicateNode(id: string) {
        const node = this.state.nodes[id];
        if (!node) return;

        const newNode: BoardNode = JSON.parse(JSON.stringify(node));
        newNode.id = crypto.randomUUID();
        newNode.x += 20;
        newNode.y += 20;
        newNode.zIndex = this.state.order.length + 1;
        newNode.updatedAt = Date.now();
        newNode.createdAt = Date.now();

        this.addNode(newNode);
        this.setSelection([newNode.id]);
    }

    setSelection(ids: string[]) {
        this.setState(state => {
            state.selection = new Set(ids);
        });
    }

    selectNode(id: string) {
        this.setState(state => {
            state.selection.add(id);
        });
    }

    toggleSelection(id: string) {
        this.setState(state => {
            if (state.selection.has(id)) {
                state.selection.delete(id);
            } else {
                state.selection.add(id);
            }
        });
    }

    clearSelection() {
        this.setSelection([]);
    }

    resetBoard() {
        this.setState(state => {
            state.nodes = {};
            state.order = [];
            state.selection = new Set();
            state.viewport = { x: 0, y: 0, zoom: 1 };
        }, false, true); // Silent update

        // Critical: Clear History on Board Reset to avoid cross-contamination
        this.history = [];
        this.historyIndex = -1;
    }

    fitContent(padding = 100) {
        this.setState(state => {
            const nodeIds = Object.keys(state.nodes);
            if (nodeIds.length === 0) {
                state.viewport = { x: 0, y: 0, zoom: 1 };
                return;
            }

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            nodeIds.forEach(id => {
                const node = state.nodes[id];
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x + node.w);
                maxY = Math.max(maxY, node.y + node.h);
            });

            const contentW = maxX - minX;
            const contentH = maxY - minY;
            // Use browser window dimensions as approximation for canvas size
            const containerW = window.innerWidth || 1920;
            const containerH = window.innerHeight || 1080;

            const scaleX = (containerW - padding * 2) / contentW;
            const scaleY = (containerH - padding * 2) / contentH;
            let zoom = Math.min(scaleX, scaleY);

            // Clamp zoom
            zoom = Math.min(Math.max(zoom, 0.1), 1.2);

            const centerX = minX + contentW / 2;
            const centerY = minY + contentH / 2;

            // Calculate viewport offset to center content
            // Formula: vp.x = (ContainerCenter) - (WorldCenter * Zoom)
            state.viewport = {
                x: (containerW / 2) - (centerX * zoom),
                y: (containerH / 2) - (centerY * zoom),
                zoom
            };
        });
    }

    getSelectedNodes(): BoardNode[] {
        return Array.from(this.state.selection).map(id => this.state.nodes[id]).filter(Boolean);
    }

    setActiveTool(tool: BoardState['uiFlags']['activeTool']) {
        this.setState(state => {
            state.uiFlags = { ...state.uiFlags, activeTool: tool };
        });
    }

    setActiveShapeType(type: any) {
        this.setState(state => {
            state.uiFlags = { ...state.uiFlags, activeShapeType: type };
        });
    }

    setUIFlag(key: keyof BoardState['uiFlags'], value: any) {
        console.groupCollapsed(`[Store] setUIFlag: ${key} ->`, value);
        console.trace();
        console.groupEnd();
        this.setState(state => {
            state.uiFlags = { ...state.uiFlags, [key]: value };
        });
    }

    setInteractionMode(mode: InteractionMode) {
        this.setState(state => {
            state.interactionState.mode = mode;
            // Side Effects: Clear selection on mode switch to prevent ghost edits
            if (mode !== 'creative') {
                state.selection.clear();
                state.uiFlags.activeTool = 'pointer';
            }
        });
    }

    setActivePizarra(metadata: PizarraMetadata | undefined) {
        this.setState(state => {
            state.activePizarra = metadata;

            // Phase 5.FIX: Apply Default Mode
            if (metadata?.defaultMode) {
                state.interactionState.mode = metadata.defaultMode;
                if (metadata.defaultMode !== 'creative') {
                    state.selection.clear();
                    state.uiFlags.activeTool = 'pointer';
                }
            } else {
                state.interactionState.mode = 'creative';
            }
        });
    }

    /**
     * Phase 5.1: Canonical Notebook Support
     * Adds a "Page" (Board) to the current Notebook (Pizarra).
     */
    addBoard(board: { id: string; title: string; type: any; order: number; thumbnail?: string }) {
        this.setState(state => {
            if (!state.activePizarra) return;

            state.activePizarra = {
                ...state.activePizarra,
                boards: [...state.activePizarra.boards, board]
            };
        });
        this.saveSession();
    }


    /**
     * Phase 5.1: Canonical Notebook Support
     * Switches the "Active Page" within the Notebook.
     * Note: This primarily updates UI state. The REACT COMPONENT (PizarronRoot) 
     * detects this change via selector and triggers the Firestore Adapter init() logic.
     */
    switchBoard(boardId: string) {
        this.setState(state => {
            if (!state.activePizarra) return;
            // Move the target board to index 0?
            // "Active" in PizarronRoot is board[0].
            // To avoid complex rewriting, we can just re-order the array so [0] is the active one?
            // OR we fix PizarronRoot to look at a new 'activeBoardId' field.
            // For now, re-ordering is the safest way to maintain compatibility with PizarronRoot's existing logic
            // which likely just grabs boards[0].

            // Wait, PizarronRoot does: `const effectiveBoardId = activePizarra?.boards?.[0]?.id || boardId;`
            // So yes, we MUST rotate the array to make the selected board the first one.

            const boardIndex = state.activePizarra.boards.findIndex(b => b.id === boardId);
            if (boardIndex > -1) {
                // Immutable update to ensure React selectors trigger (PizarronRoot depends on reference)
                const newBoards = [...state.activePizarra.boards];
                const [board] = newBoards.splice(boardIndex, 1);
                newBoards.unshift(board);

                state.activePizarra = {
                    ...state.activePizarra,
                    boards: newBoards
                };
            }
        });
        this.saveSession(); // Persist session
    }

    // --- Session Persistence ---
    private saveSession() {
        if (!this.state.activePizarra) return;
        try {
            const session = {
                metadata: this.state.activePizarra,
                activeBoardId: this.state.activePizarra.boards[0]?.id
            };
            localStorage.setItem('pizarron_session_v3', JSON.stringify(session));
        } catch (e) {
            console.warn("Failed to save session", e);
        }
    }

    restoreLastSession(): PizarraMetadata | null {
        try {
            const raw = localStorage.getItem('pizarron_session_v3');
            if (!raw) return null;
            const session = JSON.parse(raw);
            if (session.metadata) {
                // Restore Metadata
                this.setState(state => {
                    state.activePizarra = session.metadata;
                    // Rotate boards if needed to match saved activeBoardId
                    // Although switchBoard logic rotates [0], if we just load metadata as-is, [0] is the first one based on saved state?
                    // Let's ensure consistency.
                    if (session.activeBoardId) {
                        const idx = state.activePizarra?.boards.findIndex(b => b.id === session.activeBoardId);
                        if (idx && idx > 0 && state.activePizarra) {
                            const b = state.activePizarra.boards.splice(idx, 1)[0];
                            state.activePizarra.boards.unshift(b);
                        }
                    }
                });
                return session.metadata;
            }
        } catch (e) {
            console.warn("Failed to restore session", e);
        }
        return null;
    }

    // --- Templates ---

    saveTemplate(template: BoardStructure) {
        this.setState(state => {
            if (!state.savedTemplates) state.savedTemplates = [];
            // generate ID if needed or check overwrite
            const newTemplate = { ...template, id: template.id || crypto.randomUUID() };
            state.savedTemplates.push(newTemplate);
        });
    }

    deleteTemplate(templateId: string) {
        this.setState(state => {
            if (!state.savedTemplates) return;
            state.savedTemplates = state.savedTemplates.filter(t => t.id !== templateId);
        });
    }

    // --- Board Resources (Prefabs) ---

    saveBoardAsResource(boardId: string, name: string, customId?: string) {
        this.setState(state => {
            if (!state.boardResources) state.boardResources = [];

            const rootNode = state.nodes[boardId];
            if (!rootNode) return;

            // Gather all descendants
            const gatheredNodes: BoardNode[] = [];
            const queue = [rootNode];
            const visited = new Set<string>();

            while (queue.length > 0) {
                const curr = queue.shift()!;
                if (visited.has(curr.id)) continue;
                visited.add(curr.id);

                // Clone node to detach references
                gatheredNodes.push(JSON.parse(JSON.stringify(curr)));

                // Add children
                if (curr.childrenIds) {
                    curr.childrenIds.forEach(childId => {
                        if (state.nodes[childId]) queue.push(state.nodes[childId]);
                    });
                }
            }

            const resource: BoardResource = {
                id: customId || crypto.randomUUID(),
                name: name,
                nodes: gatheredNodes,
                createdAt: Date.now()
            };

            state.boardResources.push(resource);
        });
    }

    applyResourceToBoard(targetBoardId: string, resourceId: string) {
        this.setState(state => {
            const resource = state.boardResources?.find(r => r.id === resourceId);
            const targetNode = state.nodes[targetBoardId];
            if (!resource || !targetNode) return;

            // 1. Clear existing children of target
            // (We should arguably delete them from state, but for simplicity just detaching)
            // Better to delete them to avoid orphans.
            const deleteQueue = [...(targetNode.childrenIds || [])];
            while (deleteQueue.length > 0) {
                const id = deleteQueue.pop()!;
                const node = state.nodes[id];
                if (node) {
                    if (node.childrenIds) deleteQueue.push(...node.childrenIds);
                    delete state.nodes[id];
                }
            }
            targetNode.childrenIds = [];

            // 2. Clone and Remap Resource Nodes
            // We must generate new IDs for all resource nodes to allow multiple instances
            const idMap = new Map<string, string>();
            resource.nodes.forEach(n => idMap.set(n.id, crypto.randomUUID()));

            resource.nodes.forEach((n, index) => {
                const newId = idMap.get(n.id)!;
                const isRoot = index === 0; // First node in resource is root

                if (isRoot) {
                    // Update Target Node Properties (Merge)
                    // Keep Target's Identity (ID, Position, ZIndex)
                    // Overwrite Content, Size, Style, Structure
                    state.nodes[targetBoardId] = {
                        ...targetNode,
                        w: n.w,
                        h: n.h,
                        content: JSON.parse(JSON.stringify(n.content)), // Deep copy content
                        structure: n.structure ? JSON.parse(JSON.stringify(n.structure)) : undefined,
                        structureId: n.structureId,
                        // Children will be repopulated below
                        childrenIds: []
                    };
                } else {
                    // Create New Child Node
                    const newNode: BoardNode = {
                        ...JSON.parse(JSON.stringify(n)),
                        id: newId,
                        // Remap children IDs if they exist
                        childrenIds: n.childrenIds?.map(cid => idMap.get(cid) || cid).filter(cid => idMap.has(cid as string))
                    };
                    state.nodes[newId] = newNode;
                }
            });

            // 3. Re-link Children for Root (Target) and others
            resource.nodes.forEach((n, index) => {
                const newId = idMap.get(n.id)!;
                if (index === 0) {
                    // Root's children -> Target's children
                    if (n.childrenIds) {
                        state.nodes[targetBoardId].childrenIds = n.childrenIds.map(cid => idMap.get(cid)!).filter(Boolean);
                    }
                }
            });

            // 4. Force selection update to target?
            state.selection = new Set([targetBoardId]);
        });
    }

    deleteBoardResource(resourceId: string) {
        this.setState(state => {
            if (!state.boardResources) return;
            state.boardResources = state.boardResources.filter(r => r.id !== resourceId);
        });
    }

    // --- Layer Management ---

    bringToFront() {
        this.setState(state => {
            const selected = Array.from(state.selection);
            if (selected.length === 0) return;

            const remaining = state.order.filter(id => !state.selection.has(id));
            state.order = [...remaining, ...selected];
            this.reindex(state);
        });
    }

    sendToBack() {
        this.setState(state => {
            const selected = Array.from(state.selection);
            if (selected.length === 0) return;

            const remaining = state.order.filter(id => !state.selection.has(id));
            state.order = [...selected, ...remaining];
            this.reindex(state);
        });
    }

    bringForward() {
        this.setState(state => {
            const selected = state.selection;
            if (selected.size === 0) return;

            // Bubble up: Iterate from top-1 down to 0
            for (let i = state.order.length - 2; i >= 0; i--) {
                const id = state.order[i];
                if (selected.has(id)) {
                    const nextId = state.order[i + 1];
                    if (!selected.has(nextId)) {
                        // Swap with unselected neighbor above
                        state.order[i] = nextId;
                        state.order[i + 1] = id;
                    }
                }
            }
            this.reindex(state);
        });
    }

    sendBackward() {
        this.setState(state => {
            const selected = state.selection;
            if (selected.size === 0) return;

            // Bubble down: Iterate from 1 up to length-1
            for (let i = 1; i < state.order.length; i++) {
                const id = state.order[i];
                if (selected.has(id)) {
                    const prevId = state.order[i - 1];
                    if (!selected.has(prevId)) {
                        // Swap with unselected neighbor below
                        state.order[i] = prevId;
                        state.order[i - 1] = id;
                    }
                }
            }
            this.reindex(state);
        });
    }

    private reindex(state: BoardState) {
        state.order.forEach((id, index) => {
            if (state.nodes[id]) {
                state.nodes[id].zIndex = index;
            }
        });
    }

    updateInteractionState(patch: Partial<BoardState['interactionState']>) {
        this.setState(state => {
            Object.assign(state.interactionState, patch);
        });
    }

    // --- Presentation ---

    calculateStoryPath(paramState?: BoardState) { // Accept state for atomic updates
        const state = paramState || this.getState();
        // Ensure nodes object exists
        if (!state.nodes) return [];

        let candidates = Object.values(state.nodes).filter(n => n.type === 'board');

        // Fallback 1: Significant items (Groups, Images, Frames, or Large Shapes)
        if (candidates.length === 0) {
            candidates = Object.values(state.nodes).filter(n =>
                !n.parentId && ( // Top level
                    n.type === 'group' ||
                    n.type === 'image' ||
                    (n.w * n.h > 20000) // Lowered threshold (approx 140x140)
                )
            );
        }

        // Fallback 2: ABSOLUTELY ANYTHING TOP LEVEL
        if (candidates.length === 0) {
            candidates = Object.values(state.nodes).filter(n => !n.parentId);
        }

        // Fallback 3: ABSOLUTELY ANYTHING (if they are all inside a root group?)
        if (candidates.length === 0) {
            candidates = Object.values(state.nodes);
        }

        // Row-Major Sort (Top-to-Bottom prioritized, then Left-to-Right)
        const ROW_TOLERANCE = 150;

        candidates.sort((a, b) => {
            const rowA = Math.floor((a.y || 0) / ROW_TOLERANCE);
            const rowB = Math.floor((b.y || 0) / ROW_TOLERANCE);

            if (rowA !== rowB) {
                return rowA - rowB;
            }
            return (a.x || 0) - (b.x || 0);
        });

        const path = candidates.map(b => b.id);
        console.log("[PizarronStore] Calculated Story Path:", path.length, "slides");
        return path;
    }

    setPresentationMode(active: boolean) {
        this.setState(s => {
            s.presentationState.isActive = active;
            console.log("[Presentation] Set Active:", active);
            if (active) {
                // Pass 's' to use the specific state slice being updated/current
                s.presentationState.storyPath = this.calculateStoryPath(s as BoardState);
                s.presentationState.currentIndex = 0;

                const pathLen = s.presentationState.storyPath.length;
                console.log("[Presentation] Path Length:", pathLen);

                // Jump to first
                if (pathLen > 0) {
                    // We can't call this.navigateToSlide here because it calls setState!
                    // We must just set the targetViewport directly on 's'
                    const firstId = s.presentationState.storyPath[0];
                    const node = s.nodes[firstId];
                    if (node) {
                        console.log("[Presentation] Jump to First Slide:", firstId, node);
                        // Copy-paste navigate logic for atomic update
                        s.uiFlags.focusMode = true;
                        s.interactionState.focusTargetId = firstId;

                        const padding = 50;
                        const containerW = window.innerWidth || 1920;
                        const containerH = window.innerHeight || 1080;
                        const scaleX = (containerW - padding * 2) / node.w;
                        const scaleY = (containerH - padding * 2) / node.h;
                        let zoom = Math.min(scaleX, scaleY);
                        zoom = Math.min(Math.max(zoom, 0.05), 3); // Allow zoom out for large boards
                        const centerX = node.x + node.w / 2;
                        const centerY = node.y + node.h / 2;

                        const tv = {
                            x: (containerW / 2) - (centerX * zoom),
                            y: (containerH / 2) - (centerY * zoom),
                            zoom
                        };
                        console.log("[Presentation] Target Viewport:", tv);
                        s.interactionState.targetViewport = tv;
                    } else {
                        console.warn("[Presentation] Node not found for ID:", firstId);
                    }
                }
            } else {
                // Exit
                s.uiFlags.focusMode = false;
                s.interactionState.focusTargetId = null;
                s.interactionState.targetViewport = undefined;
            }
        });
    }

    navigateToSlide(nodeId: string) {
        // 1. Get Node
        const state = this.getState();
        const node = state.nodes[nodeId];
        if (!node) {
            console.warn("[Presentation] Navigate: Node not found", nodeId);
            return;
        }

        console.log("[Presentation] Navigate To:", nodeId, node);

        // 2. Focus Highlighting
        this.setFocus(nodeId);

        // 3. Cinematic Viewport Move
        // Calculate nice padded viewport
        const padding = 50;
        const containerW = window.innerWidth || 1920;
        const containerH = window.innerHeight || 1080;

        const scaleX = (containerW - padding * 2) / node.w;
        const scaleY = (containerH - padding * 2) / node.h;
        let zoom = Math.min(scaleX, scaleY);
        zoom = Math.min(Math.max(zoom, 0.05), 3); // Allow zoom out for large boards

        const centerX = node.x + node.w / 2;
        const centerY = node.y + node.h / 2;

        const targetViewport = {
            x: (containerW / 2) - (centerX * zoom),
            y: (containerH / 2) - (centerY * zoom),
            zoom
        };

        console.log("[Presentation] Valid Target Viewport:", targetViewport);
        // Trigger smooth move
        this.animateViewport(targetViewport);
    }

    nextSlide() {
        this.setState(s => {
            const nextIdx = s.presentationState.currentIndex + 1;
            if (nextIdx < s.presentationState.storyPath.length) {
                s.presentationState.currentIndex = nextIdx;
                this.navigateToSlide(s.presentationState.storyPath[nextIdx]);
            }
        });
    }

    prevSlide() {
        this.setState(s => {
            const prevIdx = s.presentationState.currentIndex - 1;
            if (prevIdx >= 0) {
                s.presentationState.currentIndex = prevIdx;
                this.navigateToSlide(s.presentationState.storyPath[prevIdx]);
            }
        });
    }

    // --- Selectors ---

    // Helper to cache metric


    // Ephemeral Clipboard (run-time only)
    private clipboard: BoardNode[] = [];

    copySelection() {
        const selectedIds = Array.from(this.state.selection);
        this.clipboard = selectedIds
            .map(id => this.state.nodes[id])
            .filter(n => !!n)
            .map(n => JSON.parse(JSON.stringify(n))); // Deep copy
    }

    paste() {
        if (this.clipboard.length === 0) return;

        this.setState(state => {
            const newIds: string[] = [];
            this.clipboard.forEach(nodeData => {
                const newNode = { ...nodeData };
                newNode.id = crypto.randomUUID();
                newNode.x += 20; // Offset
                newNode.y += 20;
                newNode.zIndex = state.order.length + newIds.length;
                newNode.createdAt = Date.now();
                newNode.updatedAt = Date.now();

                state.nodes[newNode.id] = newNode;
                state.order.push(newNode.id);
                newIds.push(newNode.id);
            });
            state.selection = new Set(newIds);
        });

        // Cascade for subsequent pastes
        this.clipboard.forEach(n => { n.x += 20; n.y += 20; });
    }

    // --- Transformations & Alignment ---

    rotateSelected(angleDeg: number) {
        const rad = (angleDeg * Math.PI) / 180;
        this.setState(state => {
            state.selection.forEach(id => {
                const node = state.nodes[id];
                if (node) {
                    node.rotation = (node.rotation || 0) + rad;
                }
            });
        });
    }

    alignSelected(type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
        this.setState(state => {
            const selected = Array.from(state.selection).map(id => state.nodes[id]).filter(Boolean);
            if (selected.length < 2) return;

            // Calculate bounds of selection group
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            selected.forEach(n => {
                minX = Math.min(minX, n.x);
                maxX = Math.max(maxX, n.x + n.w);
                minY = Math.min(minY, n.y);
                maxY = Math.max(maxY, n.y + n.h);
            });

            const midX = minX + (maxX - minX) / 2;
            const midY = minY + (maxY - minY) / 2;

            selected.forEach(node => {
                switch (type) {
                    case 'left': node.x = minX; break;
                    case 'center': node.x = midX - node.w / 2; break;
                    case 'right': node.x = maxX - node.w; break;
                    case 'top': node.y = minY; break;
                    case 'middle': node.y = midY - node.h / 2; break;
                    case 'bottom': node.y = maxY - node.h; break;
                }
            });
        });
    }

    distributeSelected(axis: 'horizontal' | 'vertical') {
        this.setState(state => {
            const selected = Array.from(state.selection)
                .map(id => state.nodes[id])
                .filter(Boolean);

            if (selected.length < 3) return;

            if (axis === 'horizontal') {
                selected.sort((a, b) => a.x - b.x);

                const firstCenter = selected[0].x + selected[0].w / 2;
                const lastCenter = selected[selected.length - 1].x + selected[selected.length - 1].w / 2;
                const step = (lastCenter - firstCenter) / (selected.length - 1);

                selected.forEach((node, i) => {
                    if (i === 0 || i === selected.length - 1) return;
                    const center = firstCenter + step * i;
                    node.x = center - node.w / 2;
                });
            } else {
                selected.sort((a, b) => a.y - b.y);
                const firstCenter = selected[0].y + selected[0].h / 2;
                const lastCenter = selected[selected.length - 1].y + selected[selected.length - 1].h / 2;
                const step = (lastCenter - firstCenter) / (selected.length - 1);

                selected.forEach((node, i) => {
                    if (i === 0 || i === selected.length - 1) return;
                    const center = firstCenter + step * i;
                    node.y = center - node.h / 2;
                });
            }
        });
    }

    groupSelection() {
        this.setState(state => {
            const selectedIds = Array.from(state.selection);
            if (selectedIds.length < 2) return;

            const selectedNodes = selectedIds.map(id => state.nodes[id]).filter(Boolean);

            // Calculate bounds
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            selectedNodes.forEach(n => {
                minX = Math.min(minX, n.x);
                maxX = Math.max(maxX, n.x + n.w);
                minY = Math.min(minY, n.y);
                maxY = Math.max(maxY, n.y + n.h);
            });

            // Create Group Node
            const groupId = crypto.randomUUID();
            const groupNode: any = {
                id: groupId,
                type: 'group',
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY,
                zIndex: Math.max(...selectedNodes.map(n => n.zIndex || 0)) + 1,
                childrenIds: selectedIds, // Critical for InteractionManager
                content: { title: 'Group', children: selectedIds },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Update Children
            selectedNodes.forEach(n => {
                n.parentId = groupId;
                // Keep global coordinates? Or make relative?
                // For simplicity in this engine version, let's keep Global Coordinates 
                // but use parentId for logical operations (drag together).
                // If we moved to relative, we'd do: n.x -= minX; n.y -= minY;
            });

            state.nodes[groupId] = groupNode;
            state.order.push(groupId);
            state.selection = new Set([groupId]);
        });
    }

    ungroupSelection() {
        this.setState(state => {
            const selectedIds = Array.from(state.selection);

            const groupsToUngroup = selectedIds.filter(id => state.nodes[id]?.type === 'group');
            if (groupsToUngroup.length === 0) return;

            const newSelection: string[] = [];

            groupsToUngroup.forEach(groupId => {
                const group = state.nodes[groupId];
                if (!group || !group.childrenIds) return;

                group.childrenIds.forEach(cid => {
                    const child = state.nodes[cid];
                    if (child) {
                        child.parentId = undefined;
                        child.updatedAt = Date.now();
                        newSelection.push(cid);
                    }
                });

                delete state.nodes[groupId];
            });

            // Rebuild Order: Remove dead groups, append children
            state.order = state.order.filter(id => state.nodes[id]);
            state.order.push(...newSelection);

            state.selection.clear();
            newSelection.forEach(id => state.selection.add(id));
        });
    }

    // --- Structure & Scalability Actions ---

    toggleCollapse(id: string) {
        this.setState(state => {
            if (state.nodes[id]) {
                // Clone nodes map and target node to ensure reference change
                state.nodes = { ...state.nodes };
                state.nodes[id] = { ...state.nodes[id] };

                const node = state.nodes[id];
                // The following block was inserted based on the instruction.
                // Note: 'updates' is not defined in this context, which will cause a runtime error.
                node.collapsed = !node.collapsed;
                node.updatedAt = Date.now();


                // If collapsing, remove from selection to avoid ghost outline
                // Force new Set reference for reactivity
                const newSelection = new Set(state.selection);
                if (node.collapsed) {
                    newSelection.delete(id);
                    // Also clear focus if focused target is collapsing
                    if (state.interactionState.focusTargetId === id) {
                        state.interactionState.focusTargetId = null;
                        state.uiFlags.focusMode = false;
                    }
                } else {
                    // If uncollapsing, select it so user can find it
                    newSelection.clear();
                    newSelection.add(id);
                }
                state.selection = newSelection;
            }
        });
    }

    setFocus(id: string | null) {
        this.setState(state => {
            if (id) {
                // Determine if we should really focus (ensure exists)
                if (state.nodes[id]) {
                    state.interactionState.focusTargetId = id;
                    state.uiFlags.focusMode = true;
                    // Mark node as focused? 
                    // state.nodes[id].isFocus = true; // Optional redundancy
                }
            } else {
                state.interactionState.focusTargetId = null;
                state.uiFlags.focusMode = false;
            }
        });
    }

    updateStructure(id: string, structure: BoardStructure) {
        this.setState(state => {
            if (state.nodes[id]) {
                state.nodes = { ...state.nodes };
                state.nodes[id] = { ...state.nodes[id] };

                const node = state.nodes[id];
                node.structure = structure;
                node.updatedAt = Date.now();
            }
        });
    }

    stackSelected(direction: 'vertical' | 'horizontal', gap: number = 20) {
        this.setState(state => {
            const selected = Array.from(state.selection).map(id => state.nodes[id]).filter(Boolean);
            if (selected.length < 2) return;

            if (direction === 'vertical') {
                selected.sort((a, b) => a.y - b.y);
                // Start from the first item's top position
                let currentY = selected[0].y;
                const alignX = selected[0].x;

                selected.forEach((node) => {
                    node.x = alignX; // Align to first item
                    node.y = currentY;
                    currentY += node.h + gap;
                });
            } else {
                selected.sort((a, b) => a.x - b.x);
                let currentX = selected[0].x;
                const alignY = selected[0].y;

                selected.forEach(node => {
                    node.y = alignY; // Align to first item
                    node.x = currentX;
                    currentX += node.w + gap;
                });
            }
        });
    }

    autoLayoutGrid(cols: number = 3, gap: number = 20) {
        this.setState(state => {
            const selected = Array.from(state.selection).map(id => state.nodes[id]).filter(Boolean);
            if (selected.length === 0) return;

            // Sort roughly by reading order (top-left to bottom-right)
            selected.sort((a, b) => (a.y - b.y) || (a.x - b.x));

            const startX = selected[0].x;
            const startY = selected[0].y;
            let currentX = startX;
            let currentY = startY;
            let maxHeightInRow = 0;

            selected.forEach((node, index) => {
                const colIndex = index % cols;
                if (colIndex === 0 && index !== 0) {
                    currentX = startX;
                    currentY += maxHeightInRow + gap;
                    maxHeightInRow = 0;
                }

                node.x = currentX;
                node.y = currentY;

                currentX += node.w + gap;
                maxHeightInRow = Math.max(maxHeightInRow, node.h);
            });
        });
    }

    autoLayoutRadial(radius: number = 200) {
        this.setState(state => {
            const selected = Array.from(state.selection).map(id => state.nodes[id]).filter(Boolean);
            if (selected.length === 0) return;

            // Center of the group
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            selected.forEach(n => {
                minX = Math.min(minX, n.x);
                maxX = Math.max(maxX, n.x + n.w);
                minY = Math.min(minY, n.y);
                maxY = Math.max(maxY, n.y + n.h);
            });
            const centerX = minX + (maxX - minX) / 2;
            const centerY = minY + (maxY - minY) / 2;

            const angleStep = (2 * Math.PI) / selected.length;

            selected.forEach((node, index) => {
                const angle = index * angleStep - (Math.PI / 2); // Start top
                node.x = centerX + Math.cos(angle) * radius - (node.w / 2);
                node.y = centerY + Math.sin(angle) * radius - (node.h / 2);
            });
        });
    }

    updateAttachedLines(nodeId: string, nodeFrame: { x: number, y: number, w: number, h: number }) {
        this.setState(state => {
            Object.values(state.nodes).forEach(node => {
                if (node.type !== 'line') return;

                const startB = node.content.startBinding;
                const endB = node.content.endBinding;

                // Calculate connection points on the moved node
                const getPoint = (side: 'left' | 'right' | 'top' | 'bottom') => {
                    switch (side) {
                        case 'left': return { x: nodeFrame.x, y: nodeFrame.y + nodeFrame.h / 2 };
                        case 'right': return { x: nodeFrame.x + nodeFrame.w, y: nodeFrame.y + nodeFrame.h / 2 };
                        case 'top': return { x: nodeFrame.x + nodeFrame.w / 2, y: nodeFrame.y };
                        case 'bottom': return { x: nodeFrame.x + nodeFrame.w / 2, y: nodeFrame.y + nodeFrame.h };
                    }
                };

                let start = { x: node.x, y: node.y };
                let end = { x: node.x + node.w, y: node.y + node.h };
                let changed = false;

                if (startB && startB.nodeId === nodeId) {
                    start = getPoint(startB.side);
                    changed = true;
                }
                if (endB && endB.nodeId === nodeId) {
                    end = getPoint(endB.side);
                    changed = true;
                }

                if (changed) {
                    node.x = start.x;
                    node.y = start.y;
                    node.w = end.x - start.x;
                    node.h = end.y - start.y;
                    node.updatedAt = Date.now();
                }
            });
        });
    }

    distributeCorners() {
        this.setState(state => {
            const selected = Array.from(state.selection).map(id => state.nodes[id]).filter(Boolean);
            if (selected.length < 2) return;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            selected.forEach(n => {
                minX = Math.min(minX, n.x);
                minY = Math.min(minY, n.y);
                maxX = Math.max(maxX, n.x + n.w);
                maxY = Math.max(maxY, n.y + n.h);
            });

            // Top-Left, Top-Right, Bottom-Left, Bottom-Right
            // We apply to first 4 items
            const assign = [
                (n: any) => { n.x = minX; n.y = minY; },
                (n: any) => { n.x = maxX - n.w; n.y = minY; },
                (n: any) => { n.x = minX; n.y = maxY - n.h; },
                (n: any) => { n.x = maxX - n.w; n.y = maxY - n.h; }
            ];

            selected.forEach((node, i) => {
                if (assign[i]) assign[i](node);
            });
        });
    }
    moveBoardResource(id: string, direction: 'up' | 'down') {
        this.setState(state => {
            if (!state.savedTemplates) return;
            const index = state.savedTemplates.findIndex(r => r.id === id);
            if (index === -1) return;

            if (direction === 'up' && index > 0) {
                const temp = state.savedTemplates[index - 1];
                state.savedTemplates[index - 1] = state.savedTemplates[index];
                state.savedTemplates[index] = temp;
            } else if (direction === 'down' && index < state.savedTemplates.length - 1) {
                const temp = state.savedTemplates[index + 1];
                state.savedTemplates[index + 1] = state.savedTemplates[index];
                state.savedTemplates[index] = temp;
            }
        });
    }
    updateBoardThumbnail(boardId: string, thumbnail: string) {
        this.setState(state => {
            if (!state.activePizarra) return;
            const board = state.activePizarra.boards.find(b => b.id === boardId);
            if (board) {
                board.thumbnail = thumbnail;
            }
        });
    }

    setThumbnailRequest(enabled: boolean) {
        this.setState(state => {
            state.interactionState.requestThumbnailCapture = enabled;
        });
    }

}


export const pizarronStore = new PizarronStore();

export const usePizarronStore = <T>(selector: (state: BoardState) => T = (s) => s as any): T => {
    return useSyncExternalStore(
        (cb) => pizarronStore.subscribe(cb),
        () => selector(pizarronStore.getState()),
        () => selector(INITIAL_STATE)
    );
};

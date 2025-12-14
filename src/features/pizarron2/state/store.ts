import { BoardState, BoardNode, Viewport } from '../engine/types';

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
        activeShapeType: 'rectangle' as 'rectangle' | 'circle' | 'triangle' | 'star'
    },
    interactionState: {},
    presentationState: {
        isActive: false,
        route: 'order',
        currentIndex: 0
    }
};

type Listener = () => void;
type Selector<T> = (state: BoardState) => T;

class PizarronStore {
    private state: BoardState;
    private listeners: Set<Listener>;

    constructor() {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE)); // Deep copy initial
        this.state.selection = new Set(); // Set doesn't survive JSON
        this.listeners = new Set();
    }

    getState(): BoardState {
        return this.state;
    }

    /**
     * Updates state and notifies subscribers efficiently.
     * We don't use immutability libraries for perf, but we try to replace top-level objects.
     */
    setState(updater: (draft: BoardState) => void) {
        updater(this.state);
        this.itemCount = Object.keys(this.state.nodes).length; // Cache simple metric
        this.notify();
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(cb => cb());
    }

    // --- Actions ---

    updateViewport(viewport: Partial<Viewport>) {
        this.setState(state => {
            Object.assign(state.viewport, viewport);
        });
    }

    addNode(node: BoardNode) {
        this.setState(state => {
            state.nodes[node.id] = node;
            state.order.push(node.id);
        });
    }

    updateNode(id: string, patch: Partial<BoardNode>) {
        // Direct mutations for speed in heavy drags
        const node = this.state.nodes[id];
        if (node) {
            Object.assign(node, patch);
            node.updatedAt = Date.now();
            this.notify();
        }
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
        });
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

    setActiveTool(tool: BoardState['uiFlags']['activeTool']) {
        this.setState(state => {
            state.uiFlags.activeTool = tool;
        });
    }

    setActiveShapeType(type: any) {
        this.setState(state => {
            state.uiFlags.activeShapeType = type;
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
            const selected = Array.from(state.selection);
            if (selected.length !== 1) return;

            const id = selected[0];
            const idx = state.order.indexOf(id);
            if (idx < state.order.length - 1) {
                // Swap
                [state.order[idx], state.order[idx + 1]] = [state.order[idx + 1], state.order[idx]];
                this.reindex(state);
            }
        });
    }

    sendBackward() {
        this.setState(state => {
            const selected = Array.from(state.selection);
            if (selected.length !== 1) return;

            const id = selected[0];
            const idx = state.order.indexOf(id);
            if (idx > 0) {
                // Swap
                [state.order[idx], state.order[idx - 1]] = [state.order[idx - 1], state.order[idx]];
                this.reindex(state);
            }
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
    setPresentationMode(active: boolean) {
        this.setState(s => { s.presentationState.isActive = active; });
    }

    setPresentationIndex(idx: number) {
        this.setState(s => { s.presentationState.currentIndex = idx; });
    }

    setPresentationRoute(route: 'order' | 'selection') {
        this.setState(s => { s.presentationState.route = route; });
    }

    // --- Selectors ---

    // Helper to cache metric
    private itemCount = 0;

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
}

export const pizarronStore = new PizarronStore();

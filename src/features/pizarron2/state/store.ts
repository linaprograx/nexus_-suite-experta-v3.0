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
        newNode.zIndex = state.order.length + 1; // Ensure on top
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
}

export const pizarronStore = new PizarronStore();

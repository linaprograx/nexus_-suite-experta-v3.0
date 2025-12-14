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
        activeTool: 'pointer'
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
        this.setState(state => {
            delete state.nodes[id];
            state.order = state.order.filter(oid => oid !== id);
            state.selection.delete(id);
        });
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

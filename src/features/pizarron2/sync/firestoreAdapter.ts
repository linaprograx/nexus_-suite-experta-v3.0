import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebaseApp';
import { pizarronStore } from '../state/store';
import { BoardNode, PizarraMetadata } from '../engine/types';

class FirestoreAdapter {
    private unsubscribeSnapshot: (() => void) | null = null;
    private unsubscribeStore: (() => void) | null = null;
    // Enhanced State Tracking: ID -> { updatedAt, boardId }
    // This prevents "Ghost Deletions" where the adapter deletes nodes from Board A 
    // while managing Board B because of residual state or async race conditions.
    private lastKnownState: Record<string, { updatedAt: number; boardId: string }> = {};
    private pendingWrites: Map<string, BoardNode> = new Map();
    private pendingDeletes: Set<string> = new Set();
    private writeTimeout: NodeJS.Timeout | null = null;
    private isApplyingRemote = false;
    private currentAppId: string | null = null;
    private currentBoardId: string | null = null;

    init(appId: string, boardId: string = 'general') {
        this.stop(); // Cleanup previous if any

        // CRITICAL DEFENSE: Force clean slate. 
        // Even if stop() does it, we double-tap here to prevent ANY memory leak of previous board nodes.
        this.lastKnownState = {};
        this.pendingWrites.clear();
        this.pendingDeletes.clear();
        this.currentAppId = null;
        this.currentBoardId = null;

        if (!appId || !boardId) {
            console.warn("Cannot init Sync without AppID and BoardID");
            return;
        }

        this.currentAppId = appId;
        this.currentBoardId = boardId;

        // Init Template Sync
        this.initTemplates(appId);
        this.initBoardResources(appId);


        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);
        // STRICT FILTERING: Only listen to the current board!
        const q = query(colRef, where('boardId', '==', boardId));

        // 1. Inbound (Remote -> Local)
        this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            // ...
            this.isApplyingRemote = true;
            snapshot.docChanges().forEach((change) => {
                // ... existing node logic ...
                const data = change.doc.data() as any;
                const id = change.doc.id;

                if (change.type === 'removed') {
                    pizarronStore.deleteNode(id);
                    delete this.lastKnownState[id]; // Cleanup local state
                    return;
                }

                // Extra Safety: Ignore if not this board (logic redundancy, but safe)
                if (data.boardId && data.boardId !== boardId) return;

                const remoteNode: BoardNode = {
                    id: id,
                    type: data.type || 'card',
                    x: data.position?.x || data.x || 0,
                    y: data.position?.y || data.y || 0,
                    w: data.width || 200,
                    h: data.height || 100,
                    zIndex: data.zIndex || 0,
                    content: {
                        title: data.title || data.texto,
                        body: data.body || data.descripcion,
                        color: data.style?.backgroundColor || data.color,
                        shapeType: data.shapeType
                    },
                    createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
                    updatedAt: data.updatedAt || Date.now(),
                    // Sync Structure Data (for Board Nodes)
                    structureId: data.structureId,
                    structure: data.structure,
                    childrenIds: data.childrenIds // Sync Children
                };

                // Track state with BoardID
                this.lastKnownState[id] = {
                    updatedAt: remoteNode.updatedAt,
                    boardId: boardId // Tag it!
                };

                const localNode = pizarronStore.getState().nodes[id];
                if (!localNode || remoteNode.updatedAt > localNode.updatedAt) {
                    pizarronStore.addNode(remoteNode);
                }
            });
            this.isApplyingRemote = false;
        });

        // 2. Outbound
        this.unsubscribeStore = pizarronStore.subscribe(() => {
            if (this.isApplyingRemote) return;

            const state = pizarronStore.getState();
            const nodes = state.nodes;

            // Sync Nodes
            Object.values(nodes).forEach(node => {
                const lastKnown = this.lastKnownState[node.id];
                // Check timestamp AND ensure we are not overwriting a ghost
                if (!lastKnown || node.updatedAt > lastKnown.updatedAt) {
                    this.pendingWrites.set(node.id, node);
                    // Update state immediately to avoid loop
                    this.lastKnownState[node.id] = {
                        updatedAt: node.updatedAt,
                        boardId: boardId
                    };
                }
            });

            // SAFETY BREAKER: Mass Deletion Protection
            // If the store is empty (user wiped it locally) but we 'remember' significantly more nodes, 
            // it implies a race condition where we haven't disconnected from the old board yet.
            // In this case, we ABORT the sync to save data.
            const localNodeCount = Object.keys(nodes).length;
            const memoryNodeCount = Object.keys(this.lastKnownState).length;

            if (localNodeCount === 0 && memoryNodeCount > 5) {
                console.warn(`[FirestoreAdapter] SAFETY BREAKER ACTIVATED: Attempted to wipe ${memoryNodeCount} nodes. Aborting sync to protect data.`);
                return;
            }

            // Detect Deletions
            Object.keys(this.lastKnownState).forEach(id => {
                // SAFETY CHECK: Only delete if the node belongs to THIS board
                // If lastKnownState has a node from Board A, and we are in Board B,
                // and it's missing from store (obviously), DO NOT DELETE IT.
                if (this.lastKnownState[id].boardId !== this.currentBoardId) {
                    return;
                }

                if (!nodes[id]) {
                    this.pendingDeletes.add(id);
                    delete this.lastKnownState[id];
                }
            });

            this.scheduleFlush(appId, boardId);

            // Sync Templates
            state.savedTemplates?.forEach(t => {
                // But blindly writing every subscription is bad.
                // Let's assume for this sprint: The UI calls `adapter.persistTemplate` manually?
                // Or we check a `dirty` flag?
                // `store.ts` actions are synchronous. 
                // Let's modify store to call adapter? No.

                // Hack: We will rely on `persistTemplate` helper being called by UI for now 
                // OR we can just write them if we don't have them in a local cache.
                // Let's just expose `persistTemplate` and update the Inspector to use it.
            });
        });
    }

    stop() {
        if (this.writeTimeout) {
            clearTimeout(this.writeTimeout);
            this.writeTimeout = null;
            if (this.currentAppId && this.currentBoardId) {
                this.flush(this.currentAppId, this.currentBoardId);
            }
        }
        if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();
        if (this.unsubscribeStore) this.unsubscribeStore();
        if (this.unsubscribeTemplates) {
            this.unsubscribeTemplates();
            this.unsubscribeTemplates = null;
        }
        if (this.unsubscribeResources) {
            this.unsubscribeResources();
            this.unsubscribeResources = null;
        }

        this.currentAppId = null;
        this.currentBoardId = null;

        // CRITICAL FIX: Reset state tracking to prevent "ghost deletions"
        // When switching boards, we must forget the previous board's nodes
        // so we don't think they were deleted just because they aren't in the new board.
        this.lastKnownState = {};
        this.pendingWrites.clear();
        this.pendingDeletes.clear();
        this.isApplyingRemote = false;
    }

    private scheduleFlush(appId: string, boardId: string) {
        if (this.writeTimeout) return;

        this.writeTimeout = setTimeout(() => {
            this.flush(appId, boardId);
            this.writeTimeout = null;
        }, 500); // 500ms debounce
    }

    private async flush(appId: string, boardId: string) {
        if (this.pendingWrites.size === 0 && this.pendingDeletes.size === 0) return;

        const batch = writeBatch(db);
        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);

        // Deletions
        this.pendingDeletes.forEach(id => {
            batch.delete(doc(colRef, id));
        });
        this.pendingDeletes.clear();

        this.pendingWrites.forEach((node) => {
            const docRef = doc(colRef, node.id);
            // Map BoardNode -> Firestore Data
            // We use JSON parse/stringify to strip undefined values automatically
            const rawData = {
                type: node.type,
                position: { x: node.x, y: node.y },
                x: node.x, y: node.y,
                width: node.w,
                height: node.h,
                zIndex: node.zIndex,
                // Content
                title: node.content.title || '',
                texto: node.content.title || '',
                body: node.content.body || '',
                style: { backgroundColor: node.content.color },
                shapeType: node.content.shapeType,
                // Meta
                boardId: boardId,
                updatedAt: node.updatedAt,
                // Structure Persistence
                structureId: node.structureId,
                structure: node.structure,
                childrenIds: node.childrenIds
            };

            const cleanData = JSON.parse(JSON.stringify(rawData)); // Removes undefined

            batch.set(docRef, cleanData, { merge: true });
        });

        const count = this.pendingWrites.size;
        this.pendingWrites.clear();

        try {
            await batch.commit();
            console.log(`[Sync] Flushed batch to Firestore`);
        } catch (err) {
            console.error("[Sync] Write Failed", err);
        }
    }
    async createPizarraFromTemplate(appId: string, metadata: PizarraMetadata, nodes: BoardNode[]) {
        if (!appId) {
            console.warn("No AppID for creating Pizarra");
            return;
        }

        const batch = writeBatch(db);

        // 1. Save Metadata
        const metaRef = doc(db, `artifacts/${appId}/public/data/pizarras/${metadata.id}`);
        batch.set(metaRef, metadata);

        // 2. Save Nodes (Assigned to the first board of the pizarra)
        const nodesCol = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);
        const firstBoardId = metadata.boards[0].id;

        nodes.forEach(node => {
            const nodeRef = doc(nodesCol, node.id);
            const data = {
                type: node.type,
                x: node.x, y: node.y,
                width: node.w, height: node.h,
                zIndex: node.zIndex,
                title: node.content.title || '',
                texto: node.content.title || '',
                body: node.content.body || '',
                style: { backgroundColor: node.content.color || '#ffffff' },
                shapeType: node.content.shapeType || 'rectangle',
                boardId: firstBoardId,
                updatedAt: node.updatedAt,
                createdAt: node.createdAt
            };
            batch.set(nodeRef, data);
        });

        await batch.commit();
    }

    /**
     * Phase 5.1: Canonical Notebook Support
     * Adds a "Page" (Board) to an existing Notebook (Pizarra).
     * Atomic transaction: Updates metadata AND inserts initial nodes.
     */
    async addBoardToNotebook(appId: string, notebookId: string, board: { id: string; title: string, type: any, order: number }, nodes: BoardNode[]) {
        if (!appId || !notebookId) return;

        const batch = writeBatch(db);

        // 1. Update Metadata (Add Board to Array)
        // Note: Firestore arrayUnion is risky if we need order. ideally we read-modify-write or just trust the clean array passed from state?
        // Let's rely on the Store to provide the authoritative 'boards' array, OR just push this one.
        // For safety, we'll read the metadata first? Too slow. 
        // We will assume the UI passes the *UPDATED* metadata list or we use arrayUnion.
        // Actually, PizarronManager constructs the new board object.
        // Let's use arrayUnion for safety.

        const metaRef = doc(db, `artifacts/${appId}/public/data/pizarras/${notebookId}`);
        // We can't easily append to specific index with arrayUnion, but for 'add', it's fine.
        // But wait, we need to ensure unique ID.
        // Let's just update the whole board list if possible? 
        // No, let's use arrayUnion for atomic addition.
        batch.set(metaRef, {
            updatedAt: Date.now(),
            boards: (await import('firebase/firestore')).arrayUnion(board)
        }, { merge: true });

        // 2. Save Nodes (Assigned to the NEW boardId)
        const nodesCol = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);

        nodes.forEach(node => {
            // Ensure node has correct boardId
            const nodeRef = doc(nodesCol, node.id);
            const data = {
                type: node.type,
                x: node.x, y: node.y,
                width: node.w, height: node.h,
                zIndex: node.zIndex,
                title: node.content.title || '',
                texto: node.content.title || '',
                body: node.content.body || '',
                style: { backgroundColor: node.content.color || '#ffffff' },
                shapeType: node.content.shapeType || 'rectangle',
                boardId: board.id, // CRITICAL: Link to the specific board
                updatedAt: node.updatedAt,
                createdAt: node.createdAt
            };
            batch.set(nodeRef, data);
        });

        await batch.commit();
    }

    // --- Pizarra Management ---

    async savePizarraMetadata(appId: string, metadata: PizarraMetadata) {
        if (!appId) {
            console.warn("No AppID for saving Pizarra");
            return;
        }
        const ref = doc(db, `artifacts/${appId}/public/data/pizarras/${metadata.id}`);
        await setDoc(ref, metadata, { merge: true });
    }

    async listPizarras(appId: string): Promise<PizarraMetadata[]> {
        if (!appId) return [];
        const colRef = collection(db, `artifacts/${appId}/public/data/pizarras`);
        const q = query(colRef, orderBy('lastOpenedAt', 'desc'));

        try {
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data() as PizarraMetadata);
        } catch (e) {
            console.error("Error listing pizarras:", e);
            return [];
        }
    }

    // --- Template Persistence ---
    // Minimal implementation: Sync whole list on change (or individual logic)
    // For simplicity given low volume, we'll listen to separate collection

    // Call this from init
    private unsubscribeTemplates: (() => void) | null = null;

    initTemplates(appId: string) {
        if (this.unsubscribeTemplates) this.unsubscribeTemplates();

        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-templates`);

        // Read (Inbound)
        this.unsubscribeTemplates = onSnapshot(colRef, (snapshot) => {
            const templates: any[] = [];
            snapshot.forEach(doc => {
                templates.push(doc.data());
            });
            // Update Store
            pizarronStore.setState(state => {
                state.savedTemplates = templates;
            });
        });

        // Write (Outbound) - We hook into the main subscribe or adding a specific one?
        // Let's hook into the main store listener in init() but we need to track diffs or just overwrite?
        // Overwriting specific docs is better.
    }

    // We'll add this to the main sync loop or make it demand-driven?
    // The Store actions `saveTemplate` update the state.
    // We can just add a helper `persistTemplate` called by the UI or Store?
    // ideally adapter observes store.

    async persistTemplate(template: any) {
        if (!this.currentAppId) return;
        const colRef = collection(db, `artifacts/${this.currentAppId}/public/data/pizarron-templates`);
        const docRef = doc(colRef, template.id);
        await setDoc(docRef, template);
    }

    async removeTemplate(templateId: string) {
        if (!this.currentAppId) return;
        const colRef = collection(db, `artifacts/${this.currentAppId}/public/data/pizarron-templates`);
        await deleteDoc(doc(colRef, templateId));
    }

    // --- Board Resources (Prefabs) ---
    private unsubscribeResources: (() => void) | null = null;

    initBoardResources(appId: string) {
        if (this.unsubscribeResources) this.unsubscribeResources();

        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-board-resources`);

        this.unsubscribeResources = onSnapshot(colRef, (snapshot) => {
            const resources: any[] = [];
            snapshot.forEach(doc => resources.push(doc.data()));
            pizarronStore.setState(state => {
                state.boardResources = resources;
            });
        });
    }

    async persistBoardResource(resource: any) {
        if (!this.currentAppId) return;
        const colRef = collection(db, `artifacts/${this.currentAppId}/public/data/pizarron-board-resources`);
        const docRef = doc(colRef, resource.id);
        await setDoc(docRef, resource);
    }

    async removeBoardResource(resourceId: string) {
        if (!this.currentAppId) return;
        const colRef = collection(db, `artifacts/${this.currentAppId}/public/data/pizarron-board-resources`);
        await deleteDoc(doc(colRef, resourceId));
    }
}

export const firestoreAdapter = new FirestoreAdapter();

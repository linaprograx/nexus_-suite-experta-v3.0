import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebaseApp';
import { pizarronStore } from '../state/store';
import { BoardNode, PizarraMetadata } from '../engine/types';

class FirestoreAdapter {
    private unsubscribeSnapshot: (() => void) | null = null;
    private unsubscribeStore: (() => void) | null = null;
    private lastKnownState: Record<string, number> = {}; // id -> updatedAt
    private pendingWrites: Map<string, BoardNode> = new Map();
    private pendingDeletes: Set<string> = new Set();
    private writeTimeout: NodeJS.Timeout | null = null;
    private isApplyingRemote = false;
    private currentAppId: string | null = null;
    private currentBoardId: string | null = null;

    init(appId: string, boardId: string = 'general') {
        this.stop(); // Cleanup previous if any
        this.currentAppId = appId;
        this.currentBoardId = boardId;

        // Init Template Sync
        this.initTemplates(appId);
        this.initBoardResources(appId);


        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);

        // 1. Inbound (Remote -> Local)
        // ... (existing code) ...
        this.unsubscribeSnapshot = onSnapshot(colRef, (snapshot) => {
            // ...
            this.isApplyingRemote = true;
            snapshot.docChanges().forEach((change) => {
                // ... existing node logic ...
                const data = change.doc.data() as any;
                const id = change.doc.id;

                if (change.type === 'removed') {
                    pizarronStore.deleteNode(id);
                    return;
                }
                // ... rest of node sync ...
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
                // ...
                const localNode = pizarronStore.getState().nodes[id];
                if (!localNode || remoteNode.updatedAt > localNode.updatedAt) {
                    pizarronStore.addNode(remoteNode);
                    this.lastKnownState[id] = remoteNode.updatedAt;
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
                if (!lastKnown || node.updatedAt > lastKnown) {
                    this.pendingWrites.set(node.id, node);
                    this.lastKnownState[node.id] = node.updatedAt;
                }
            });
            // ... deletes ...
            Object.keys(this.lastKnownState).forEach(id => {
                if (!nodes[id]) {
                    this.pendingDeletes.add(id);
                    delete this.lastKnownState[id];
                }
            });

            this.scheduleFlush(appId, boardId);

            // Sync Templates (Simple One-way/Upsert for now)
            // Ideally we'd map "pendingTemplateWrites" but direct is safer for now
            state.savedTemplates?.forEach(t => {
                // If it's a new template (we could track lastSavedTemplates to compare)
                // For now, we trust the UI calls persistTemplate? 
                // NO, we want automatic sync.
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
    async createPizarraFromTemplate(metadata: PizarraMetadata, nodes: BoardNode[]) {
        if (!this.currentAppId) {
            console.warn("No AppID for creating Pizarra");
            return;
        }

        const batch = writeBatch(db);

        // 1. Save Metadata
        const metaRef = doc(db, `artifacts/${this.currentAppId}/public/data/pizarras/${metadata.id}`);
        batch.set(metaRef, metadata);

        // 2. Save Nodes (Assigned to the first board of the pizarra)
        const nodesCol = collection(db, `artifacts/${this.currentAppId}/public/data/pizarron-tasks`);
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

    // --- Pizarra Management ---

    async savePizarraMetadata(metadata: PizarraMetadata) {
        if (!this.currentAppId) {
            console.warn("No AppID for saving Pizarra");
            return;
        }
        const ref = doc(db, `artifacts/${this.currentAppId}/public/data/pizarras/${metadata.id}`);
        await setDoc(ref, metadata, { merge: true });
    }

    async listPizarras(): Promise<PizarraMetadata[]> {
        if (!this.currentAppId) return [];
        const colRef = collection(db, `artifacts/${this.currentAppId}/public/data/pizarras`);
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

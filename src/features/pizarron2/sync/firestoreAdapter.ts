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

        const colRef = collection(db, `artifacts/${appId}/public/data/pizarron-tasks`);

        // 1. Inbound (Remote -> Local)
        // Note: We might want a query to filter by boardId if sharing same collection
        // For now, assuming collection matches or we filter client side (less efficient but okay for prototype)
        // Or better: `query(colRef, where('boardId', '==', boardId))` if index exists.
        // Let's assume broad subscription for now or filtered if safe.

        this.unsubscribeSnapshot = onSnapshot(colRef, (snapshot) => {
            this.isApplyingRemote = true;

            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data() as any;
                const id = change.doc.id;

                // Mapper: Firestore Data -> BoardNode
                // We map existing fields.

                if (change.type === 'removed') {
                    pizarronStore.deleteNode(id);
                    return;
                }

                // If BoardId doesn't match, ignore (if we didn't filter in query)
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
                        title: data.title || data.texto, // Mapping legacy
                        body: data.body || data.descripcion,
                        color: data.style?.backgroundColor || data.color,
                        shapeType: data.shapeType
                    },
                    createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
                    updatedAt: data.updatedAt || Date.now()
                };

                // Conflict Resolution: Last Write Wins
                const localNode = pizarronStore.getState().nodes[id];
                if (!localNode || remoteNode.updatedAt > localNode.updatedAt) {
                    // Update Store without triggering a new sync back
                    pizarronStore.addNode(remoteNode); // addNode works for update too in our store logic (overwrite key)
                    this.lastKnownState[id] = remoteNode.updatedAt;
                }
            });

            this.isApplyingRemote = false;
        });

        // 2. Outbound (Local -> Remote)
        this.unsubscribeStore = pizarronStore.subscribe(() => {
            if (this.isApplyingRemote) return; // Don't echo back remote changes immediately

            const nodes = pizarronStore.getState().nodes;

            Object.values(nodes).forEach(node => {
                // Check if dirty
                const lastKnown = this.lastKnownState[node.id];
                if (!lastKnown || node.updatedAt > lastKnown) {
                    this.pendingWrites.set(node.id, node);
                    this.lastKnownState[node.id] = node.updatedAt;
                }
            });

            // Detect Deletions
            Object.keys(this.lastKnownState).forEach(id => {
                if (!nodes[id]) {
                    this.pendingDeletes.add(id);
                    delete this.lastKnownState[id];
                }
            });

            this.scheduleFlush(appId, boardId);
        });
    }

    stop() {
        if (this.writeTimeout) {
            clearTimeout(this.writeTimeout);
            this.writeTimeout = null;
            // Force flush if we have context
            if (this.currentAppId && this.currentBoardId) {
                this.flush(this.currentAppId, this.currentBoardId);
            }
        }
        if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();
        if (this.unsubscribeStore) this.unsubscribeStore();

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
                updatedAt: node.updatedAt
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
}

export const firestoreAdapter = new FirestoreAdapter();

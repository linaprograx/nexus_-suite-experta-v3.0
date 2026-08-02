
import { ExecutableAction } from './action.types';
import { Firestore, addDoc, collection } from 'firebase/firestore';

export interface AuditRecord {
    id: string;
    actionId: string;
    actionType: string;
    timestamp: number;
    userId: string;
    title: string;
    details: string;
    entityId?: string | null;
    status: 'success' | 'failed' | 'reverted';
}

export const AUDIT_COLLECTION = (userId: string) => `users/${userId}/audit_log`;

/**
 * Generic activity logger — records any user/system activity worth auditing
 * (recipe created/edited, stock movement, order received…), not just AI actions.
 */
export const logActivity = async (
    db: Firestore | null,
    userId: string | null,
    entry: { actionType: string; title: string; details: string; entityId?: string | null; status?: 'success' | 'failed' | 'reverted' }
): Promise<void> => {
    if (!db || !userId) return;
    try {
        await addDoc(collection(db, AUDIT_COLLECTION(userId)), {
            actionId: `${entry.actionType}_${Date.now()}`,
            actionType: entry.actionType,
            timestamp: Date.now(),
            userId,
            title: entry.title,
            details: entry.details,
            entityId: entry.entityId ?? null,
            status: entry.status || 'success',
        });
    } catch (err) {
        console.error('[AUDIT] Failed to persist activity:', err);
    }
};

/**
 * Records an executed intelligence action to the user's audit log in Firestore
 * so it can be reviewed later (Grimorio "Audit Trail" / trust principle).
 */
export const logActionExecution = async (
    db: Firestore,
    userId: string,
    action: ExecutableAction,
    status: 'success' | 'failed' | 'reverted' = 'success'
): Promise<void> => {
    const entityId = (action.data as any)?.ingredientId || (action.data as any)?.recipeId || (action.data as any)?.purchaseId || null;
    const record = {
        actionId: action.id,
        actionType: action.type,
        timestamp: Date.now(),
        userId,
        title: action.title || action.type,
        details: `Ejecutada acción ${action.type}${action.title ? `: ${action.title}` : ''}`,
        entityId,
        status,
    };
    console.log('[AUDIT] Action Executed:', record);
    try {
        await addDoc(collection(db, AUDIT_COLLECTION(userId)), record);
    } catch (err) {
        console.error('[AUDIT] Failed to persist audit record:', err);
    }
};

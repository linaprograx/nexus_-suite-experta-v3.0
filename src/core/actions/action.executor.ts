
import { ExecutableAction } from './action.types';
import { Firestore, doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

interface ExecutionContext {
    db: Firestore;
    userId: string;
    appId: string;
}

export const executeAction = async (action: ExecutableAction, context: ExecutionContext): Promise<boolean> => {
    const { db, userId, appId } = context;
    console.log(`[EXECUTOR] Executing ${action.type} for user ${userId}...`);

    try {
        switch (action.type) {
            case 'ACTION_SET_REFERENCE_SUPPLIER':
                return await executeSetReferenceSupplier(action, db, userId, appId);
            case 'ACTION_SET_COST_SOURCE':
                return await executeSetCostSource(action, db, userId);
            case 'ACTION_RESOLVE_STOCK_LINK':
                return await executeResolveStockLink(action, db, userId);
            default:
                console.warn(`[EXECUTOR] Unknown action type: ${action.type}`);
                return false;
        }
    } catch (error) {
        console.error(`[EXECUTOR] Failed to execute ${action.type}:`, error);
        return false;
    }
};

// --- HANDLERS ---

async function executeSetReferenceSupplier(action: ExecutableAction, db: Firestore, userId: string, appId: string): Promise<boolean> {
    // Payload: { ingredientId: string, supplierId?: string, newPrice: number }
    const { ingredientId, supplierId, newPrice, supplierName } = action.data || {};

    if (!ingredientId || newPrice == null) {
        console.error("Missing data for ACTION_SET_REFERENCE_SUPPLIER");
        return false;
    }

    // Write to the SAME collection the rest of the app reads ingredients from, and set the
    // canonical field the costing engine actually uses (standardPrice = price per base unit),
    // so accepting the suggestion visibly changes the computed cost.
    const ingredientRef = doc(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`, ingredientId);
    const update: Record<string, any> = {
        standardPrice: newPrice,
        lastUpdated: Date.now(),
    };
    if (supplierId) update.referenceSupplierId = supplierId;
    if (supplierName) update.proveedor = supplierName;
    await updateDoc(ingredientRef, update);

    console.log(`[EXECUTOR] Set reference price of ingredient ${ingredientId} to ${newPrice} (supplier ${supplierId || 'n/a'})`);
    return true;
}

async function executeSetCostSource(action: ExecutableAction, db: Firestore, userId: string): Promise<boolean> {
    // Expected Payload: { recipeId: string, mode: 'theoretical' | 'real' }
    const { recipeId, mode } = action.data || {};

    if (!recipeId || !mode) {
        console.error("Missing data for ACTION_SET_COST_SOURCE");
        return false;
    }

    // Recipes live in users/{uid}/grimorio (same collection the app reads)
    const recipeRef = doc(db, `users/${userId}/grimorio`, recipeId);
    await updateDoc(recipeRef, {
        costCalculationMode: mode,
        lastUpdated: Date.now()
    });

    return true;
}

async function executeResolveStockLink(action: ExecutableAction, db: Firestore, userId: string): Promise<boolean> {
    // Stock is derived from purchases; an "orphan" purchase is linked by setting its ingredientId
    // on users/{uid}/purchases/{purchaseId} (same path useStockResolver uses).
    const { purchaseId, stockItemId, ingredientId } = action.data || {};
    const targetId = purchaseId || stockItemId; // stockItemId kept for backward compatibility

    if (!targetId || !ingredientId) {
        console.error("Missing data for ACTION_RESOLVE_STOCK_LINK");
        return false;
    }

    const purchaseRef = doc(db, `users/${userId}/purchases`, targetId);
    await updateDoc(purchaseRef, {
        ingredientId: ingredientId,
        lastUpdated: Date.now()
    });

    return true;
}

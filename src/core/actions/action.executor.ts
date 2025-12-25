
import { ExecutableAction } from './action.types';
import { Firestore, doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

interface ExecutionContext {
    db: Firestore;
    userId: string;
}

export const executeAction = async (action: ExecutableAction, context: ExecutionContext): Promise<boolean> => {
    const { db, userId } = context;
    console.log(`[EXECUTOR] Executing ${action.type} for user ${userId}...`);

    try {
        switch (action.type) {
            case 'ACTION_SET_REFERENCE_SUPPLIER':
                return await executeSetReferenceSupplier(action, db, userId);
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

async function executeSetReferenceSupplier(action: ExecutableAction, db: Firestore, userId: string): Promise<boolean> {
    // Expected Payload: { ingredientId: string, supplierId: string, price: number }
    // If payload is missing, we might need to parse it from the suggestion or it should be enriched in creation.
    // For now assuming 'data' field has necessary info or extracting from logic.
    // In Phase 3.0 implementation, suggestion ID was 'SUGGEST_SWITCH_PROVIDER_PREVIEW'.
    // We need the data. Let's assume action.data contains { ingredientId, newPrice, supplierName }.

    const { ingredientId, newPrice, supplierName } = action.data || {};

    if (!ingredientId || !newPrice) {
        console.error("Missing data for ACTION_SET_REFERENCE_SUPPLIER");
        return false;
    }

    const ingredientRef = doc(db, `users/${userId}/ingredients`, ingredientId);
    await updateDoc(ingredientRef, {
        costo: newPrice,
        proveedor: supplierName || 'Unknown',
        lastUpdated: Date.now()
    });

    console.log(`[EXECUTOR] Updated ingredient ${ingredientId} price to ${newPrice}`);
    return true;
}

async function executeSetCostSource(action: ExecutableAction, db: Firestore, userId: string): Promise<boolean> {
    // Expected Payload: { recipeId: string, mode: 'theoretical' | 'real' }
    const { recipeId, mode } = action.data || {};

    if (!recipeId || !mode) {
        console.error("Missing data for ACTION_SET_COST_SOURCE");
        return false;
    }

    const recipeRef = doc(db, `users/${userId}/recipes`, recipeId);
    await updateDoc(recipeRef, {
        costCalculationMode: mode, // Assumed field name
        lastUpdated: Date.now()
    });

    return true;
}

async function executeResolveStockLink(action: ExecutableAction, db: Firestore, userId: string): Promise<boolean> {
    // Expected Payload: { stockItemId: string, ingredientId: string }
    const { stockItemId, ingredientId } = action.data || {};

    if (!stockItemId || !ingredientId) {
        console.error("Missing data for ACTION_RESOLVE_STOCK_LINK");
        return false;
    }

    const stockItemRef = doc(db, `users/${userId}/stockItems`, stockItemId);
    await updateDoc(stockItemRef, {
        ingredientId: ingredientId,
        status: 'linked',
        lastUpdated: Date.now()
    });

    return true;
}

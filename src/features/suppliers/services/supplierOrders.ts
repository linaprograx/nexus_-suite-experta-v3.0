import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    Firestore,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { SupplierOrder } from '../../../types';

const COLLECTION_NAME = 'supplierOrders';

export const supplierOrdersService = {
    /**
     * Get all supplier orders for the user.
     * Path: users/{uid}/supplierOrders
     */
    getOrders: async (db: Firestore, userId: string): Promise<SupplierOrder[]> => {
        try {
            const ordersRef = collection(db, `users/${userId}/${COLLECTION_NAME}`);
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SupplierOrder));
        } catch (error) {
            console.error("Error fetching supplier orders:", error);
            throw error;
        }
    },

    /**
     * Create a new order.
     */
    createOrder: async (db: Firestore, userId: string, order: Omit<SupplierOrder, 'id' | 'createdAt'>): Promise<string> => {
        try {
            const ordersRef = collection(db, `users/${userId}/${COLLECTION_NAME}`);
            const docRef = await addDoc(ordersRef, {
                ...order,
                status: 'draft',
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    /**
     * Update order status (e.g. to 'received').
     */
    updateOrderStatus: async (db: Firestore, userId: string, orderId: string, status: SupplierOrder['status']): Promise<void> => {
        try {
            const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, orderId);
            const updates: any = { status };

            if (status === 'received') {
                updates.receivedAt = serverTimestamp();
            }

            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    }
};

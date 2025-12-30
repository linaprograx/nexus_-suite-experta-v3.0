import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    Firestore,
    serverTimestamp
} from 'firebase/firestore';
import { SupplierProduct } from '../../../types';

// Sub-collection name
const SUB_COLLECTION_NAME = 'supplierProducts';

export const supplierProductsService = {
    /**
     * Get all products from a supplier's catalog (sub-collection).
     */
    getProducts: async (db: Firestore, userId: string, supplierId: string): Promise<SupplierProduct[]> => {
        try {
            // Path: users/{uid}/suppliers/{supplierId}/supplierProducts
            const productsRef = collection(db, `users/${userId}/suppliers/${supplierId}/${SUB_COLLECTION_NAME}`);
            const snapshot = await getDocs(productsRef);
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as any as SupplierProduct));
        } catch (error) {
            console.error("Error fetching supplier products:", error);
            throw error;
        }
    },

    /**
     * Add a product to the supplier's catalog.
     */
    addProduct: async (db: Firestore, userId: string, supplierId: string, product: Omit<SupplierProduct, 'id' | 'updatedAt'>): Promise<string> => {
        try {
            const productsRef = collection(db, `users/${userId}/suppliers/${supplierId}/${SUB_COLLECTION_NAME}`);
            const docRef = await addDoc(productsRef, {
                ...product,
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding supplier product:", error);
            throw error;
        }
    },

    /**
     * Update a product in the catalog.
     */
    updateProduct: async (db: Firestore, userId: string, supplierId: string, productId: string, updates: Partial<SupplierProduct>): Promise<void> => {
        try {
            const docRef = doc(db, `users/${userId}/suppliers/${supplierId}/${SUB_COLLECTION_NAME}`, productId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating supplier product:", error);
            throw error;
        }
    },

    /**
     * Remove a product from the catalog.
     */
    deleteProduct: async (db: Firestore, userId: string, supplierId: string, productId: string): Promise<void> => {
        try {
            const docRef = doc(db, `users/${userId}/suppliers/${supplierId}/${SUB_COLLECTION_NAME}`, productId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting supplier product:", error);
            throw error;
        }
    }
};

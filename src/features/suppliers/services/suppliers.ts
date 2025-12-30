import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    Firestore,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';
import { Supplier } from '../../../types';

const COLLECTION_NAME = 'suppliers';

export const suppliersService = {
    /**
     * Fetch all suppliers for a specific user.
     * Path: users/{userId}/suppliers
     */
    getSuppliers: async (db: Firestore, userId: string): Promise<Supplier[]> => {
        try {
            const suppliersRef = collection(db, `users/${userId}/${COLLECTION_NAME}`);
            const q = query(suppliersRef, orderBy('name'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Supplier));
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            throw new Error("Failed to fetch suppliers.");
        }
    },

    /**
     * Add a new supplier.
     */
    addSupplier: async (db: Firestore, userId: string, supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        // Validation
        if (!supplier.name || !supplier.phone || !supplier.email) {
            throw new Error("Name, Phone, and Email are required.");
        }

        try {
            const suppliersRef = collection(db, `users/${userId}/${COLLECTION_NAME}`);
            const docRef = await addDoc(suppliersRef, {
                ...supplier,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                productList: [] // Initialize empty
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding supplier:", error);
            throw error;
        }
    },

    /**
     * Update an existing supplier.
     */
    updateSupplier: async (db: Firestore, userId: string, supplierId: string, updates: Partial<Supplier>): Promise<void> => {
        try {
            const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, supplierId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating supplier:", error);
            throw error;
        }
    },

    /**
     * Delete a supplier.
     */
    deleteSupplier: async (db: Firestore, userId: string, supplierId: string): Promise<void> => {
        try {
            const docRef = doc(db, `users/${userId}/${COLLECTION_NAME}`, supplierId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            throw error;
        }
    }
};

import { collection, doc, getDoc, getDocs, Firestore, query, where, collectionGroup } from 'firebase/firestore';
import { Proveedor, CatalogoItem } from '../../types';

export const proveedoresService = {
    /**
     * Fetch all active providers for a user
     */
    getProveedores: async (db: Firestore, userId: string): Promise<Proveedor[]> => {
        try {
            const proveedoresRef = collection(db, `users/${userId}/proveedores`);
            const snapshot = await getDocs(proveedoresRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proveedor));
        } catch (error) {
            console.error("Error fetching proveedores:", error);
            return [];
        }
    },

    /**
     * Fetch the catalog for a specific provider
     */
    getCatalogo: async (db: Firestore, userId: string, proveedorId: string): Promise<CatalogoItem[]> => {
        try {
            const catalogoRef = collection(db, `users/${userId}/proveedores/${proveedorId}/catalogo`);
            const snapshot = await getDocs(catalogoRef);
            return snapshot.docs.map(doc => doc.data() as CatalogoItem);
        } catch (error) {
            console.error(`Error fetching catalogo for proveedor ${proveedorId}:`, error);
            return [];
        }
    }
};

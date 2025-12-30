import { useState, useEffect, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { Supplier } from '../../../types';
import { suppliersService } from '../services/suppliers';

interface UseSuppliersProps {
    db: Firestore | null;
    userId: string | null;
}

export const useSuppliers = ({ db, userId }: UseSuppliersProps) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSuppliers = useCallback(async () => {
        if (!db || !userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await suppliersService.getSuppliers(db, userId);
            setSuppliers(data);
        } catch (err: any) {
            setError(err.message || 'Error fetching suppliers');
        } finally {
            setLoading(false);
        }
    }, [db, userId]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!db || !userId) return;
        try {
            const id = await suppliersService.addSupplier(db, userId, supplier);
            await fetchSuppliers(); // Refresh list
            return id;
        } catch (err: any) {
            setError(err.message || 'Error adding supplier');
            throw err;
        }
    };

    const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
        if (!db || !userId) return;
        try {
            await suppliersService.updateSupplier(db, userId, id, updates);
            await fetchSuppliers();
        } catch (err: any) {
            setError(err.message || 'Error updating supplier');
            throw err;
        }
    };

    const deleteSupplier = async (id: string) => {
        if (!db || !userId) return;
        try {
            await suppliersService.deleteSupplier(db, userId, id);
            await fetchSuppliers();
        } catch (err: any) {
            setError(err.message || 'Error deleting supplier');
            throw err;
        }
    };

    return {
        suppliers,
        loading,
        error,
        refresh: fetchSuppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier
    };
};

import { useState, useCallback, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { SupplierProduct } from '../../../types';
import { supplierProductsService } from '../services/supplierProducts';

interface UseSupplierProductsProps {
    db: Firestore | null;
    userId: string | null;
    supplierId: string | null;
}

export const useSupplierProducts = ({ db, userId, supplierId }: UseSupplierProductsProps) => {
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        if (!db || !userId || !supplierId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await supplierProductsService.getProducts(db, userId, supplierId);
            setProducts(data);
        } catch (err: any) {
            setError(err.message || 'Error fetching products');
        } finally {
            setLoading(false);
        }
    }, [db, userId, supplierId]);

    useEffect(() => {
        if (supplierId) {
            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [fetchProducts, supplierId]);

    const addProduct = async (product: Omit<SupplierProduct, 'id' | 'updatedAt'>) => {
        if (!db || !userId || !supplierId) return;
        try {
            const id = await supplierProductsService.addProduct(db, userId, supplierId, product);
            await fetchProducts();
            return id;
        } catch (err: any) {
            setError(err.message || 'Error adding product');
            throw err;
        }
    };

    const updateProduct = async (productId: string, updates: Partial<SupplierProduct>) => {
        if (!db || !userId || !supplierId) return;
        try {
            await supplierProductsService.updateProduct(db, userId, supplierId, productId, updates);
            await fetchProducts();
        } catch (err: any) {
            setError(err.message || 'Error updating product');
            throw err;
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!db || !userId || !supplierId) return;
        try {
            await supplierProductsService.deleteProduct(db, userId, supplierId, productId);
            await fetchProducts();
        } catch (err: any) {
            setError(err.message || 'Error deleting product');
            throw err;
        }
    };

    return {
        products,
        loading,
        error,
        refresh: fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct
    };
};

import { useState, useCallback, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { SupplierOrder } from '../../../types';
import { supplierOrdersService } from '../services/supplierOrders';

interface UseOrdersProps {
    db: Firestore | null;
    userId: string | null;
}

export const useOrders = ({ db, userId }: UseOrdersProps) => {
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        if (!db || !userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await supplierOrdersService.getOrders(db, userId);
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Error fetching orders');
        } finally {
            setLoading(false);
        }
    }, [db, userId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const createOrder = async (order: Omit<SupplierOrder, 'id' | 'createdAt'>) => {
        if (!db || !userId) return;
        try {
            const id = await supplierOrdersService.createOrder(db, userId, order);
            await fetchOrders();
            return id;
        } catch (err: any) {
            setError(err.message || 'Error creating order');
            throw err;
        }
    };

    const updateOrderStatus = async (orderId: string, status: SupplierOrder['status']) => {
        if (!db || !userId) return;
        try {
            await supplierOrdersService.updateOrderStatus(db, userId, orderId, status);
            await fetchOrders();
        } catch (err: any) {
            setError(err.message || 'Error updating order status');
            throw err;
        }
    };

    return {
        orders,
        loading,
        error,
        refresh: fetchOrders,
        createOrder,
        updateOrderStatus
    };
};

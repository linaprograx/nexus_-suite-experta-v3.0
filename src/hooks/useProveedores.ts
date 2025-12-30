import { useState, useEffect, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import { Proveedor, CatalogoItem } from '../types';
import { proveedoresService } from '../features/grimorium/proveedoresService';

interface UseProveedoresProps {
    db: Firestore;
    userId: string;
}

export const useProveedores = ({ db, userId }: UseProveedoresProps) => {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(false);
    // Cache catalogs to avoid re-fetching: Record<proveedorId, CatalogoItem[]>
    const [catalogos, setCatalogos] = useState<Record<string, CatalogoItem[]>>({});

    // Load basic provider list on mount
    useEffect(() => {
        if (!db || !userId) return;

        const loadProveedores = async () => {
            setLoading(true);
            const data = await proveedoresService.getProveedores(db, userId);
            setProveedores(data);
            setLoading(false);
        };

        loadProveedores();
    }, [db, userId]);

    /**
     * Get catalog for a provider, using cache if available
     */
    const getCatalogoForProveedor = useCallback(async (proveedorId: string) => {
        if (catalogos[proveedorId]) return catalogos[proveedorId];

        const data = await proveedoresService.getCatalogo(db, userId, proveedorId);
        setCatalogos(prev => ({ ...prev, [proveedorId]: data }));
        return data;
    }, [db, userId, catalogos]);

    return {
        proveedores,
        loading,
        getCatalogoForProveedor
    };
};

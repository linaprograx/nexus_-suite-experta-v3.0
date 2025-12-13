import { useState, useCallback, useRef } from 'react';
import { PizarronTask } from '../../../types';

export interface CanvasElement extends PizarronTask {
    // Extended properties for canvas usage if needed
    // position is already added to PizarronTask interface
}

interface Position {
    x: number;
    y: number;
}

export const useCanvasState = (initialTasks: PizarronTask[]) => {
    // We might need a local state for optimistic updates while dragging
    // But ultimately we sync with Firestore.
    // For now, let's assume we manage selection and temporary drag state here.

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

    const toggleSelection = useCallback((id: string, multi: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(multi ? prev : []);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Auto-arrange function for tasks without position
    const getInitialPosition = useCallback((task: PizarronTask, index: number, totalInStatus: number): Position => {
        // Simple cluster algorithm based on status
        const statusMap: Record<string, { x: number, y: number }> = {
            'ideas': { x: 0, y: 0 },
            'pruebas': { x: 400, y: 0 },
            'aprobado': { x: 800, y: 0 },
            // default for others
            'default': { x: 0, y: 400 }
        };

        const base = statusMap[task.status?.toLowerCase()] || statusMap['default'];
        // Stagger them vertically
        return {
            x: base.x + (Math.random() * 20 - 10), // slight randomness
            y: base.y + (index * 150)
        };
    }, []);

    return {
        selectedIds,
        toggleSelection,
        clearSelection,
        getInitialPosition
    };
};

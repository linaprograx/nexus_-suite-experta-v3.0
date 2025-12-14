import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';
import { TextConfigModal, ShapeConfigModal, LineConfigModal, BoardConfigModal, CardConfigModal, ImageConfigModal } from './modals/ConfigModals';

export const ConfigModalRouter: React.FC = () => {
    const [selectedNode, setSelectedNode] = useState<BoardNode | null>(null);

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            if (state.selection.size === 1) {
                const id = Array.from(state.selection)[0];
                const node = state.nodes[id];
                if (node) {
                    // Force new reference to trigger React re-render
                    setSelectedNode({ ...node });
                    return;
                }
            }
            setSelectedNode(null);
        });
        return unsub;
    }, []);

    if (!selectedNode) return null;

    const closeModal = () => {
        pizarronStore.setSelection([]);
    };

    return (
        <>
            {/* Modal */}
            {selectedNode && (
                selectedNode.type === 'shape' ? <ShapeConfigModal node={selectedNode} /> :
                    selectedNode.type === 'line' ? <LineConfigModal node={selectedNode} /> :
                        selectedNode.type === 'text' ? <TextConfigModal node={selectedNode} /> :
                            selectedNode.type === 'board' ? <BoardConfigModal node={selectedNode} /> :
                                selectedNode.type === 'image' ? <ImageConfigModal node={selectedNode} /> :
                                    <CardConfigModal node={selectedNode} />
            )}
        </>
    );
};

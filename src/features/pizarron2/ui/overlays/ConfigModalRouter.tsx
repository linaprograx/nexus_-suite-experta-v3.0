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
                    setSelectedNode(node);
                    return;
                }
            }
            setSelectedNode(null);
        });
        return unsub;
    }, []);

    if (!selectedNode) return null;

    // Fixed position Config Panel (Top Right below toolbar)

    switch (selectedNode.type) {
        case 'text':
            return <TextConfigModal node={selectedNode} />;
        case 'shape':
            return <ShapeConfigModal node={selectedNode} />;
        case 'line':
            return <LineConfigModal node={selectedNode} />;
        case 'board':
            return <BoardConfigModal node={selectedNode} />;
        case 'card':
        case 'group':
            return <CardConfigModal node={selectedNode} />;
        case 'image':
            return <ImageConfigModal node={selectedNode} />;
        default:
            return null;
    }
};

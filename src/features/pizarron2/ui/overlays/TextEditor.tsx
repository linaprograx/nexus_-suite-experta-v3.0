import React, { useEffect, useState, useRef } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';

export const TextEditor: React.FC = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [node, setNode] = useState<BoardNode | null>(null);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [subId, setSubId] = useState<string | null>(null);

    useEffect(() => {
        // Track Editing State
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            const currentEditing = state.interactionState.editingNodeId;
            const currentSubId = state.interactionState.editingSubId; // Use new subId
            const currentViewport = state.viewport;

            if (currentEditing !== editingId || currentSubId !== subId) {
                setEditingId(currentEditing || null);
                setSubId(currentSubId || null);
                if (currentEditing) {
                    setNode(state.nodes[currentEditing] || null);
                } else {
                    setNode(null);
                }
            }

            if (currentEditing) {
                setViewport(currentViewport);
            }
        });
        return unsub;
    }, [editingId, subId]);

    // ... ref focus ...

    const handleCommit = () => {
        if (editingId) {
            pizarronStore.updateInteractionState({ editingNodeId: null, editingSubId: null });
            setEditingId(null);
            setNode(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (editingId && node) { // Check node exists
            const val = e.target.value;

            if (node.type === 'composite' && subId && node.content.composite) {
                const newCells = node.content.composite.cells.map(c =>
                    c.id === subId ? { ...c, text: val } : c
                );
                // Store Update
                pizarronStore.updateNode(editingId, {
                    content: {
                        ...node.content,
                        composite: { ...node.content.composite, cells: newCells }
                    }
                });
                // Local State Update
                setNode({
                    ...node,
                    content: {
                        ...node.content,
                        composite: { ...node.content.composite, cells: newCells }
                    }
                });
            } else {
                // Normal
                pizarronStore.updateNode(editingId, {
                    content: { ...node.content, title: val }
                });
                setNode({ ...node, content: { ...node.content, title: val } });
            }
        }
    };

    if (!editingId || !node) return null;

    // Calculate Node Screen Transform
    const nodeScreenX = node.x * viewport.zoom + viewport.x;
    const nodeScreenY = node.y * viewport.zoom + viewport.y;
    const nodeScreenW = node.w * viewport.zoom;
    const nodeScreenH = node.h * viewport.zoom;
    const rotation = node.rotation || 0;

    // Default: Editor fills the node
    let areaX = 0;
    let areaY = 0;
    let areaW = nodeScreenW;
    let areaH = nodeScreenH;
    let displayText = node.content.title || '';
    let targetPadding = node.type === 'text' ? '0px' : node.type === 'board' ? '20px' : '10px';
    let textAlign: 'left' | 'center' | 'right' = node.content.align as any || 'left';

    // Composite Cell Logic
    if (node.type === 'composite' && subId && node.content.composite) {
        const { composite } = node.content;
        const { structure, cells } = composite;
        const { rows, cols, gap = 0, padding = 0 } = structure;
        const cell = cells.find(c => c.id === subId);

        if (cell) {
            const availW = node.w - (padding * 2);
            const availH = node.h - (padding * 2);
            const cellW = (availW - ((cols - 1) * gap)) / cols;
            const cellH = (availH - ((rows - 1) * gap)) / rows;

            const cellLocalX = padding + (cell.col * (cellW + gap));
            const cellLocalY = padding + (cell.row * (cellH + gap));

            // Convert local cell metrics to screen size (scaled by zoom)
            areaX = cellLocalX * viewport.zoom;
            areaY = cellLocalY * viewport.zoom;
            areaW = cellW * viewport.zoom;
            areaH = cellH * viewport.zoom;

            displayText = cell.text || '';
            // Cells are usually centered
            textAlign = 'center';
            targetPadding = '5px';
        }
    }

    // Font Sizing
    const fontSize = (node.content.fontSize || 14) * viewport.zoom;

    return (
        <div
            className="absolute pointer-events-none" // Container is wrapper, let events pass through empty areas if needed (though we want to capture click outside usually? No, pointer-events-none on wrapper, auto on input)
            style={{
                left: nodeScreenX,
                top: nodeScreenY,
                width: nodeScreenW,
                height: nodeScreenH,
                transform: `rotate(${rotation}rad)`,
                transformOrigin: 'top left',
                zIndex: 50,
            }}
        >
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: areaX,
                    top: areaY,
                    width: areaW,
                    height: areaH,
                    minWidth: 50
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={displayText}
                    onChange={handleChange}
                    onBlur={handleCommit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommit();
                        }
                    }}
                    className="w-full h-full bg-transparent resize-none outline-none overflow-hidden"
                    style={{
                        fontSize: `${fontSize}px`,
                        color: node.content.color || '#1e293b',
                        fontFamily: node.content.fontFamily || 'Inter',
                        fontWeight: node.content.fontWeight || 'normal',
                        textAlign: textAlign,
                        lineHeight: 1.4,
                        padding: targetPadding,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                />
            </div>
        </div>
    );
};

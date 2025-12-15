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

    // ... handleCommit ...

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

    // Calculate Target Rect
    let targetX = node.x;
    let targetY = node.y;
    let targetW = node.w;
    let targetH = node.h;
    let displayText = node.content.title || '';
    let targetPadding = node.type === 'text' ? '0px' : node.type === 'board' ? '20px' : '10px';

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

            const cellX = padding + (cell.col * (cellW + gap));
            const cellY = padding + (cell.row * (cellH + gap));

            targetX = node.x + cellX;
            targetY = node.y + cellY;
            targetW = cellW;
            targetH = cellH;
            displayText = cell.text || '';
            targetPadding = '0px'; // Cells center logic is different?
            // Actually drawing centers text, so maybe 0 padding with center align?
            // But Textarea is generic. 
            // Let's use 5px padding and align center.
        }
    }

    const screenX = targetX * viewport.zoom + viewport.x;
    const screenY = targetY * viewport.zoom + viewport.y;
    const width = targetW * viewport.zoom;
    const height = targetH * viewport.zoom;
    const rotation = node.rotation || 0;

    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                left: screenX,
                top: screenY,
                width: width,
                height: height,
                minWidth: 50,
                zIndex: 50,
                transform: `rotate(${rotation}rad)`,
                transformOrigin: 'top left', // Wait, node rotation is around center usuall, check render? 
                // Renderer: translate(x,y), rotate. So rotation is around top-left (x,y).
                // But interaction manager rotates around center for handles? 
                // "rotatePoint(point, center)".
                // Check render: ctx.translate(node.x, node.y); ctx.rotate(node.rotation).
                // So (0,0) in local space is Top Left. Yes.
                // So transformOrigin '0 0' (top left) is correct if (left,top) are (node.x, node.y).
                // BUT if we are inside a cell, the cell matches rotation of parent.
                // WE are placing div at (screenX, screenY). 
                // If rotated:
                // screen point should be the rotated point of the target top-left?
                // CSS transform will rotate the DIV around its own origin.
                // If we position div at "unrotated top-left", and then rotate, it works IF the pivot is correct.
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
                    fontSize: `${(node.content.fontSize || 14) * viewport.zoom}px`,
                    color: node.content.color || '#1e293b',
                    fontFamily: node.content.fontFamily || 'Inter',
                    fontWeight: node.content.fontWeight || 'normal',
                    textAlign: 'center', // Cells are centered
                    lineHeight: 1.4,
                    padding: targetPadding,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center' // Vertically center? No textarea doesn't support flex.
                    // We'll need padding top for vertical center if simpler.
                    // For now basic top alignment or standard padding.
                }}
            />
        </div>
    );
};

import React, { useEffect, useState, useRef } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';

export const TextEditor: React.FC = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [node, setNode] = useState<BoardNode | null>(null);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        // Track Editing State
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            const currentEditing = state.interactionState.editingNodeId;
            const currentViewport = state.viewport;

            if (currentEditing !== editingId) {
                setEditingId(currentEditing || null);
                if (currentEditing) {
                    setNode(state.nodes[currentEditing] || null);
                } else {
                    setNode(null);
                }
            }

            // Should optimize this to not re-render on *every* viewport change unless editing,
            // but for now accurate positioning is key.
            if (currentEditing) {
                setViewport(currentViewport);
                // We need canvas rect to offset correctly?
                // The Overlay Container (PizarronRoot) assumes Overlays are relative to it.
                // CanvasStage assumes full width/height.
                // If PizarronRoot has padding or offset, we need client rect.
                // Let's assume PizarronRoot is the relative parent (w-full h-full).
            }
        });
        return unsub;
    }, [editingId]);

    // Focus on mount/show
    useEffect(() => {
        if (editingId && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [editingId]);

    const handleCommit = () => {
        if (editingId) {
            pizarronStore.updateInteractionState({ editingNodeId: undefined });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (editingId) {
            // Live update store
            pizarronStore.updateNode(editingId, {
                content: { ...node?.content, title: e.target.value }
            });
            // Update local node state for sync typing
            if (node) {
                setNode({ ...node, content: { ...node.content, title: e.target.value } });
            }
        }
    };

    if (!editingId || !node) return null;

    // Calculate Screen Position
    // Screen = World * Zoom + Viewport.x/y
    // IMPORTANT: Reference point is TopLeft of container.
    // If InteractionManager compensates for CanvasRect, we should too?
    // Since UI Overlays are usually siblings to Canvas in the same relative container, 
    // we use `viewport` which is relative to that container.
    // interactionManager's screenToWorld logic subtracts rect.left.
    // So `screen = world * zoom + viewport + rect.left`? 
    // No, InteractionManager *removes* rect to get to "viewport-local-screen" space.
    // So relative to the container dev:
    // x = node.x * zoom + viewport.x

    const screenX = node.x * viewport.zoom + viewport.x;
    const screenY = node.y * viewport.zoom + viewport.y;
    const width = node.w * viewport.zoom;
    const height = node.h * viewport.zoom;

    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                left: screenX,
                top: screenY,
                width: width,
                height: height, // Auto-expand?
                minWidth: 50,
                zIndex: 50
            }}
        >
            <textarea
                ref={textareaRef}
                value={node.content.title || ''}
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
                    fontSize: `${16 * viewport.zoom}px`, // Simple scaling
                    color: node.content.color || '#1e293b',
                    // Match renderer styles
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                    padding: '8px 16px', // Match renderer offset
                    // Renderer text draws at x+16, y+24. 
                    // So we must align padding carefully.
                    // Renderer: roundRect(x,y). Text at x+16, y+24.
                    // Textarea is at x,y.
                }}
            />
        </div>
    );
};

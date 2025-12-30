import React from 'react';
import { pizarronStore } from '../../state/store';
import { interactionManager } from '../../engine/interaction';
import { MenuDesignRendererCore } from '../../../../components/shared/MenuDesignRendererCore';

export const MenuNodesOverlay: React.FC = () => {
    // Subscribe to nodes and order. Viewport is handled by parent CanvasStage.
    const nodes = pizarronStore.useSelector(s => s.nodes);
    const order = pizarronStore.useSelector(s => s.order);
    // const viewport = pizarronStore.useSelector(s => s.viewport); // Removed for performance

    // Filter only menu-design nodes
    const menuNodes = order.map(id => nodes[id]).filter(n => n && n.type === 'menu-design');

    if (menuNodes.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none custom-overlay-layer">
            {menuNodes.map(node => {
                // Phase 6.8: Use World Coordinates (Parent handles Viewport Transform)
                const x = node.x;
                const y = node.y;
                // Optimization: Simple culling based on viewport bounds in world space could go here, 
                // but for now, let's rely on browser compositing or simple margin check if performance is an issue.

                return (
                    <div
                        key={node.id}
                        className="absolute pointer-events-auto select-none"
                        style={{
                            transform: `translate(${x}px, ${y}px)`,
                            width: node.w,
                            height: node.h,
                            zIndex: node.zIndex // Respect canvas z-index
                        }}
                        onPointerDown={(e) => {
                            e.preventDefault(); // Prevent text selection/native drag
                            e.stopPropagation();
                            // Select if not selected
                            if (!pizarronStore.getState().selection.has(node.id)) {
                                pizarronStore.selectNode(node.id);
                            }
                            interactionManager.startExternalDrag(node.id, e);
                            e.currentTarget.setPointerCapture(e.pointerId);
                        }}
                        onPointerMove={(e) => {
                            if (pizarronStore.getState().interactionState.isDragging) {
                                interactionManager.onPointerMove(e as any);
                            }
                        }}
                        onPointerUp={(e) => {
                            interactionManager.onPointerUp(e as any);
                            e.currentTarget.releasePointerCapture(e.pointerId);
                        }}
                    >
                        {/* Wrapper for rounded corners/shadow matching native nodes */}
                        <div
                            className="w-full h-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800"
                            style={{ borderRadius: (node.content as any).borderRadius || 16 }}
                        >
                            <MenuDesignRendererCore
                                themeName={(node.content as any).title}
                                description={(node.content as any).styleHints}
                                suggestedTypography={(node.content as any).suggestedTypography}
                                htmlContent={(node.content as any).htmlContent || '<p class="p-4 text-slate-400">Rendering...</p>'}
                                // Phase 6.11: Scale content based on node width (Base 400px)
                                scale={node.w / 400}
                                backgroundColor={(node.content as any).backgroundColor || (node.content as any).color || (node.content as any).style?.backgroundColor}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

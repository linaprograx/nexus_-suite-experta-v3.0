import React from 'react';
import { useSyncExternalStore } from 'react';
import { pizarronStore } from '../../state/store';
import { GuideLine } from '../../engine/types';

export const GuideOverlay = () => {
    const guides = useSyncExternalStore(
        (cb) => pizarronStore.subscribe(cb),
        () => pizarronStore.getState().interactionState.guides
    );

    const viewport = useSyncExternalStore(
        (cb) => pizarronStore.subscribe(cb),
        () => pizarronStore.getState().viewport
    );

    if (!guides || guides.length === 0) return null;

    // Helper to project World -> Screen
    const toScreenX = (val: number) => (val * viewport.zoom) + viewport.x;
    const toScreenY = (val: number) => (val * viewport.zoom) + viewport.y;
    const toScreenLen = (val: number) => val * viewport.zoom;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[45]">
            <svg className="w-full h-full">
                {guides.map((g, i) => {
                    // Coordinates need to be projected
                    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

                    if (g.type.includes('vertical') || g.type.includes('center-x') || g.type.includes('edge-left') || g.type.includes('edge-right')) {
                        // Vertical Line
                        const sx = toScreenX(g.x || 0);
                        const sy = toScreenY(g.start || g.startY || 0);
                        const len = toScreenLen(g.length || (g.end ? g.end - (g.start || 0) : 100)); // Handle both length and start/end
                        x1 = sx; x2 = sx;
                        y1 = sy; y2 = g.end ? toScreenY(g.end) : sy + len;
                    } else if (g.type.includes('horizontal') || g.type.includes('center-y') || g.type.includes('edge-top') || g.type.includes('edge-bottom')) {
                        // Horizontal Line
                        const sy = toScreenY(g.y || 0);
                        const sx = toScreenX(g.start || g.startX || 0);
                        const len = toScreenLen(g.length || (g.end ? g.end - (g.start || 0) : 100));
                        y1 = sy; y2 = sy;
                        x1 = sx; x2 = g.end ? toScreenX(g.end) : sx + len;
                    }

                    return (
                        <g key={i}>
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="#ec4899"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                            />
                            {/* Optional: Add indicators or little 'x' markers at intersections */}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

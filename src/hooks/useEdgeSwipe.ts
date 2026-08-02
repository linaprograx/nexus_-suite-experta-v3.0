import React from 'react';

/** How close to the screen edge a touch must start to count as an edge drag. */
const EDGE_ZONE = 28;
/** Horizontal travel required to commit to opening a panel. */
const COMMIT_DISTANCE = 60;

interface EdgeSwipeOptions {
    onSwipeFromLeft?: () => void;
    onSwipeFromRight?: () => void;
    /** Skip listening entirely (e.g. a sheet is already open). */
    disabled?: boolean;
}

/**
 * Drag in from a screen edge to open a side panel.
 *
 * Returns touch handlers to spread onto the container element.
 *
 * Two details keep it from fighting the content:
 *  - The gesture must START within EDGE_ZONE of the edge, so a swipe that begins
 *    mid-screen (carousel, chart pan) is never hijacked.
 *  - The moment vertical travel exceeds horizontal, the gesture is abandoned:
 *    scrolling a long list must always win over opening a panel, or the page
 *    feels like it is grabbing at the thumb.
 *
 * Nothing calls preventDefault, so native scrolling and momentum are untouched.
 */
export const useEdgeSwipe = ({ onSwipeFromLeft, onSwipeFromRight, disabled }: EdgeSwipeOptions) => {
    const state = React.useRef<{ x0: number; y0: number; side: 'left' | 'right' | null }>({
        x0: 0, y0: 0, side: null,
    });

    const onTouchStart = React.useCallback((e: React.TouchEvent) => {
        if (disabled || e.touches.length !== 1) { state.current.side = null; return; }
        const t = e.touches[0];
        const w = window.innerWidth;
        const side = t.clientX <= EDGE_ZONE ? 'left'
            : t.clientX >= w - EDGE_ZONE ? 'right'
                : null;
        state.current = { x0: t.clientX, y0: t.clientY, side };
    }, [disabled]);

    const onTouchMove = React.useCallback((e: React.TouchEvent) => {
        const s = state.current;
        if (!s.side || e.touches.length !== 1) return;
        const t = e.touches[0];
        // Vertical intent wins — let the list scroll.
        if (Math.abs(t.clientY - s.y0) > Math.abs(t.clientX - s.x0)) s.side = null;
    }, []);

    const onTouchEnd = React.useCallback((e: React.TouchEvent) => {
        const s = state.current;
        state.current.side = null;
        if (!s.side) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - s.x0;
        if (s.side === 'left' && dx > COMMIT_DISTANCE) onSwipeFromLeft?.();
        if (s.side === 'right' && -dx > COMMIT_DISTANCE) onSwipeFromRight?.();
    }, [onSwipeFromLeft, onSwipeFromRight]);

    return { onTouchStart, onTouchMove, onTouchEnd };
};

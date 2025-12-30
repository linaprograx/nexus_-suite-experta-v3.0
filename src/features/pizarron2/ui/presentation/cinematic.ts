import { Viewport, BoardNode } from '../../engine/types';
import { pizarronStore } from '../../state/store';

// Easing Functions
export const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
};

let currentAnimation: number | null = null;

export const cancelCameraAnimation = () => {
    if (currentAnimation) {
        cancelAnimationFrame(currentAnimation);
        currentAnimation = null;
    }
};

export const animateViewportTo = (
    target: Partial<Viewport>,
    durationMs: number = 600,
    onComplete?: () => void
) => {
    cancelCameraAnimation();

    const start = pizarronStore.getState().viewport;
    const startTime = performance.now();

    // Fill missing target values with current
    const end = {
        x: target.x ?? start.x,
        y: target.y ?? start.y,
        zoom: target.zoom ?? start.zoom
    };

    const loop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = easeInOutCubic(progress);

        pizarronStore.updateViewport({
            x: lerp(start.x, end.x, ease),
            y: lerp(start.y, end.y, ease),
            zoom: lerp(start.zoom, end.zoom, ease)
        });

        if (progress < 1) {
            currentAnimation = requestAnimationFrame(loop);
        } else {
            currentAnimation = null;
            if (onComplete) onComplete();
        }
    };

    currentAnimation = requestAnimationFrame(loop);
};

export const getNodeFocusViewport = (
    node: BoardNode,
    containerWidth: number,
    containerHeight: number,
    padding: number = 40
): Viewport | null => {
    if (!node) return null;

    // Calculate Zoom to fit
    // Available space
    const availW = containerWidth - (padding * 2);
    const availH = containerHeight - (padding * 2);

    // Ratios
    const ratioW = availW / node.w;
    const ratioH = availH / node.h;

    // Choose fit (min ratio), clamped
    const zoom = Math.min(Math.max(Math.min(ratioW, ratioH), 0.1), 3.0);

    // Calculate Center
    // screenCenter = world * zoom + pan
    // pan = screenCenter - world * zoom
    // We want NodeCenter to be at ScreenCenter

    const nodeCenterX = node.x + node.w / 2;
    const nodeCenterY = node.y + node.h / 2;

    const screenCenterX = containerWidth / 2;
    const screenCenterY = containerHeight / 2;

    const panX = screenCenterX - (nodeCenterX * zoom);
    const panY = screenCenterY - (nodeCenterY * zoom);

    return {
        x: panX,
        y: panY,
        zoom: zoom
    };
};

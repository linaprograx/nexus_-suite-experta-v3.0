import { BoardNode } from './types';

export interface SnapResult {
    x: number;
    y: number;
    guides: GuideLine[];
}

export interface GuideLine {
    type: 'center-x' | 'center-y' | 'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right' | 'spacing-x' | 'spacing-y';
    x?: number;
    y?: number;
    start?: number;
    end?: number;
}

/**
 * SnapEngine
 * Handles smart guides and magnetic snapping during drag operations
 * Implements Figma/Miro-style alignment guides
 */
export class SnapEngine {
    private threshold = 5; // Snap distance in world coords (adjusted by zoom)

    /**
     * Calculate snap position for a node being dragged
     * @param node - The node being moved
     * @param allNodes - All other nodes on the canvas
     * @param threshold - Optional custom threshold
     */
    calculateSnapPosition(
        node: { x: number; y: number; w: number; h: number },
        allNodes: BoardNode[],
        threshold?: number
    ): SnapResult {
        const snapThreshold = threshold || this.threshold;
        const guides: GuideLine[] = [];
        let snapX = node.x;
        let snapY = node.y;

        // Calculate node bounds
        const nodeCenter = {
            x: node.x + node.w / 2,
            y: node.y + node.h / 2
        };
        const nodeRight = node.x + node.w;
        const nodeBottom = node.y + node.h;

        let minXDist = Infinity;
        let minYDist = Infinity;

        // Filter out collapsed nodes and the node itself
        const otherNodes = allNodes.filter(n =>
            !n.collapsed &&
            !(n.x === node.x && n.y === node.y && n.w === node.w && n.h === node.h)
        );

        otherNodes.forEach(other => {
            const otherCenter = {
                x: other.x + other.w / 2,
                y: other.y + other.h / 2
            };
            const otherRight = other.x + other.w;
            const otherBottom = other.y + other.h;

            // --- HORIZONTAL ALIGNMENT ---

            // Center-X alignment
            const centerXDist = Math.abs(nodeCenter.x - otherCenter.x);
            if (centerXDist < snapThreshold && centerXDist < minXDist) {
                minXDist = centerXDist;
                snapX = otherCenter.x - node.w / 2;
                guides.push({
                    type: 'center-x',
                    x: otherCenter.x,
                    start: Math.min(node.y, other.y),
                    end: Math.max(nodeBottom, otherBottom)
                });
            }

            // Left edge alignment
            const leftEdgeDist = Math.abs(node.x - other.x);
            if (leftEdgeDist < snapThreshold && leftEdgeDist < minXDist) {
                minXDist = leftEdgeDist;
                snapX = other.x;
                guides.push({
                    type: 'edge-left',
                    x: other.x,
                    start: Math.min(node.y, other.y),
                    end: Math.max(nodeBottom, otherBottom)
                });
            }

            // Right edge alignment
            const rightEdgeDist = Math.abs(nodeRight - otherRight);
            if (rightEdgeDist < snapThreshold && rightEdgeDist < minXDist) {
                minXDist = rightEdgeDist;
                snapX = otherRight - node.w;
                guides.push({
                    type: 'edge-right',
                    x: otherRight,
                    start: Math.min(node.y, other.y),
                    end: Math.max(nodeBottom, otherBottom)
                });
            }

            // --- VERTICAL ALIGNMENT ---

            // Center-Y alignment
            const centerYDist = Math.abs(nodeCenter.y - otherCenter.y);
            if (centerYDist < snapThreshold && centerYDist < minYDist) {
                minYDist = centerYDist;
                snapY = otherCenter.y - node.h / 2;
                guides.push({
                    type: 'center-y',
                    y: otherCenter.y,
                    start: Math.min(node.x, other.x),
                    end: Math.max(nodeRight, otherRight)
                });
            }

            // Top edge alignment
            const topEdgeDist = Math.abs(node.y - other.y);
            if (topEdgeDist < snapThreshold && topEdgeDist < minYDist) {
                minYDist = topEdgeDist;
                snapY = other.y;
                guides.push({
                    type: 'edge-top',
                    y: other.y,
                    start: Math.min(node.x, other.x),
                    end: Math.max(nodeRight, otherRight)
                });
            }

            // Bottom edge alignment
            const bottomEdgeDist = Math.abs(nodeBottom - otherBottom);
            if (bottomEdgeDist < snapThreshold && bottomEdgeDist < minYDist) {
                minYDist = bottomEdgeDist;
                snapY = otherBottom - node.h;
                guides.push({
                    type: 'edge-bottom',
                    y: otherBottom,
                    start: Math.min(node.x, other.x),
                    end: Math.max(nodeRight, otherRight)
                });
            }
        });

        // Remove duplicate guides (keep only the best match for each type)
        const uniqueGuides: GuideLine[] = [];
        ['center-x', 'edge-left', 'edge-right', 'center-y', 'edge-top', 'edge-bottom'].forEach(type => {
            const guide = guides.find(g => g.type === type);
            if (guide) uniqueGuides.push(guide);
        });

        return {
            x: snapX,
            y: snapY,
            guides: uniqueGuides
        };
    }

    /**
     * Calculate snap position with grid snapping
     * @param x - Original X position
     * @param y - Original Y position
     * @param gridSize - Grid cell size
     */
    snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    /**
     * Set custom snap threshold
     */
    setThreshold(threshold: number) {
        this.threshold = threshold;
    }
}

export const snapEngine = new SnapEngine();

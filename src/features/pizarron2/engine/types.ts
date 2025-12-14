export type NodeType = 'card' | 'group' | 'image' | 'text' | 'shape' | 'line' | 'board';

export interface LineBinding {
    nodeId: string;
    side: 'left' | 'right' | 'top' | 'bottom';
}

export interface BoardNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number; // radians
    zIndex: number;

    // Group Props
    parentId?: string;
    childrenIds?: string[];

    // Content Data
    // Content Data
    // Content Data
    content: {
        title?: string;
        body?: string;
        // Fill props
        color?: string; // hex or theme var
        gradient?: {
            type: 'linear' | 'radial';
            start: string; // color
            end: string;   // color
            angle?: number; // deg
        };

        // Advanced Filters
        filters?: {
            blur?: number; // px
            shadow?: {
                color: string;
                blur: number; // px
                offsetX: number;
                offsetY: number;
                opacity?: number;
            };
        };

        // Typography (TextNode)
        fontSize?: number;
        textAlign?: 'left' | 'center' | 'right';
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline';
        textSizing?: 'auto' | 'fixed'; // New

        // Shape/Board props
        shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'freeform';
        borderColor?: string;
        borderWidth?: number;
        borderStyle?: 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;

        // Board Specific
        grid?: {
            columns: number;
            rows: number;
            gap: number;
            showLines?: boolean;
        };

        // Image props
        src?: string;
        caption?: string;
        opacity?: number; // 0-1

        // Line props
        lineType?: 'straight' | 'curved';
        strokeWidth?: number;
        startArrow?: boolean;
        endArrow?: boolean;
        startBinding?: LineBinding;
        endBinding?: LineBinding;

        // Card props (Task/Idea)
        status?: 'todo' | 'in-progress' | 'done';
        tags?: string[];
    };

    // Meta
    createdAt: number;
    updatedAt: number;
    locked?: boolean;
    isFixed?: boolean; // Background mode
    parentId?: string; // For grouping (future)
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface BoardState {
    nodes: Record<string, BoardNode>;
    order: string[]; // Ordered list of IDs for painting order (z-index abstraction)
    selection: Set<string>;
    viewport: Viewport;
    uiFlags: {
        gridEnabled: boolean;
        presentationMode: boolean;
        qualityTier: 'high' | 'medium' | 'low';
        debug: boolean;
        activeTool: 'pointer' | 'hand' | 'rectangle' | 'text' | 'shape' | 'line' | 'image';
        activeShapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'freeform';
        toolbarPinned?: boolean;
    };
    interactionState: {
        selectionBounds?: { x: number; y: number; w: number; h: number };
        marquee?: { x: number; y: number; w: number; h: number };
        creationDraft?: any; // BoardNode partial
        editingImageId?: string;
        editingGroupId?: string;
        snapLines?: Array<{
            type: 'horizontal' | 'vertical';
            x?: number;
            y?: number;
            start: number;
            end: number;
        }>;
    };
    presentationState: {
        isActive: boolean;
        route: 'order' | 'selection';
        currentIndex: number;
    };
}

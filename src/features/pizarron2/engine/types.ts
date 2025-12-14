export type NodeType = 'card' | 'group' | 'image' | 'text' | 'shape' | 'line' | 'board';
export interface BoardNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number; // radians
    zIndex: number;

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

        // Typography (TextNode)
        fontSize?: number;
        textAlign?: 'left' | 'center' | 'right';
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline';

        // Shape/Board props
        shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'freeform';
        borderColor?: string;
        borderWidth?: number;
        borderStyle?: 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;

        // Image props
        src?: string;
        caption?: string;
        opacity?: number; // 0-1

        // Line props
        lineType?: 'straight' | 'curved';
        strokeWidth?: number;
        startArrow?: boolean;
        endArrow?: boolean;

        // Card props (Task/Idea)
        status?: 'todo' | 'in-progress' | 'done';
        tags?: string[];
    };

    // Meta
    createdAt: number;
    updatedAt: number;
    locked?: boolean;
    isFixed?: boolean; // Background mode
    parentId?: string; // for groups
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
    };
    interactionState: {
        marquee?: { x: number; y: number; w: number; h: number };
        isDragging?: boolean;
        creationDraft?: Partial<BoardNode>; // Shadow/Ghost node being created
        editingNodeId?: string; // ID of node being inline edited (Text)
        editingImageId?: string; // ID of node being edited (Image Modal)
    };
    presentationState: {
        isActive: boolean;
        route: 'order' | 'selection';
        currentIndex: number;
    };
}

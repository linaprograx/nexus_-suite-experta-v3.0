export type NodeType = 'card' | 'group' | 'image' | 'text' | 'shape';

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
    content: {
        title?: string;
        body?: string;
        color?: string; // hex or theme var
        src?: string; // for images
        shapeType?: 'rectangle' | 'circle' | 'triangle' | 'arrow';
    };

    // Meta
    createdAt: number;
    updatedAt: number;
    locked?: boolean;
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
        activeTool: 'pointer' | 'hand' | 'rectangle' | 'text' | 'image';
    };
    interactionState: {
        marquee?: { x: number; y: number; w: number; h: number };
        isDragging?: boolean;
        creationDraft?: Partial<BoardNode>; // Shadow/Ghost node being created
        editingNodeId?: string; // ID of node being inline edited
    };
    presentationState: {
        isActive: boolean;
        route: 'order' | 'selection';
        currentIndex: number;
    };
}

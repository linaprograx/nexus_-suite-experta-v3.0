export type NodeType = 'card' | 'group' | 'image' | 'text' | 'shape' | 'line' | 'board' | 'icon';

export interface LineBinding {
    nodeId: string;
    side: 'left' | 'right' | 'top' | 'bottom';
}

export interface CompositeCell {
    id: string;
    row: number;
    col: number;
    text?: string;
    color?: string; // Background color override
    textColor?: string;
    // Optional rendering overrides
}

export interface CompositeContent {
    layout: 'grid' | 'swot' | 'list' | 'card';
    structure: {
        rows: number;
        cols: number;
        padding?: number;
        gap?: number;
        headers?: string[]; // For lists/tables
        rowHeaders?: string[];
    };
    cells: CompositeCell[];
    // Base styles for the container
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
}

export interface BoardStructure {
    template: 'custom' | 'kanban' | 'grid';
    rows: Array<{ height: number, id: string }>; // Proportional (flex) weights
    cols: Array<{ width: number, id: string }>; // Proportional (flex) weights
    cells: Record<string, { content: string, style?: any }>; // Key: "rowId_colId"
}

export interface BoardNode {
    id: string;
    type: 'text' | 'shape' | 'sticker' | 'image' | 'line' | 'group' | 'board' | 'card' | 'composite' | 'icon';

    // Structure & Scalability
    structure?: BoardStructure;
    collapsed?: boolean;
    isFocus?: boolean;

    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number;
    zIndex?: number;
    createdAt?: number;
    updatedAt?: number;
    locked?: boolean;
    isFixed?: boolean;
    parentId?: string;
    childrenIds?: string[]; // For groups
    content: {
        title?: string;
        body?: string; // For notes/cards
        color?: string; // Fill color or Text color
        opacity?: number;

        // Gradient Support
        gradient?: {
            type: 'linear' | 'radial';
            start: string;
            end: string;
            angle?: number;
        };
        // Transform
        rotation?: number;


        // Effects
        filters?: {
            blur?: number;
            shadow?: {
                color: string;
                blur: number;
                offsetX: number;
                offsetY: number;
                opacity?: number;
            };
        };

        // Text Specific
        fontSize?: number;
        fontWeight?: 'normal' | 'bold' | 'light';
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'line-through';
        align?: 'left' | 'center' | 'right';
        fontFamily?: string;
        textAlign?: 'left' | 'center' | 'right';

        // Shape Specific
        shapeType?: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'arrow_right' | 'arrow_left' | 'arrow_up' | 'arrow_down' | 'star' | 'speech_bubble' | 'bubble' | 'cloud' | 'pill' | 'pentagon' | 'octagon' | 'trapezoid' | 'parallelogram' | 'triangle_right' | 'cross' | 'chevron_right';
        borderWidth?: number;
        borderColor?: string;
        borderRadius?: number;

        // Line Specific
        startArrow?: boolean;
        endArrow?: boolean;
        lineType?: 'straight' | 'curved' | 'elbow';
        strokeWidth?: number;
        strokeStyle?: 'solid' | 'dashed' | 'dotted';

        // Image Specific
        src?: string; // URL or Base64
        url?: string; // Alias for src

        // Icon Specific
        path?: string;

        // Board Specific
        grid?: {
            columns: number;
            rows: number;
            gap: number;
        };

        // Card Specific
        status?: 'todo' | 'in-progress' | 'done';
        tags?: string[];

        // Line Specific (Explicit Points Override)
        start?: { x: number, y: number };
        end?: { x: number, y: number };
        startBinding?: LineBinding;
        endBinding?: LineBinding;

        // Composite Specific
        composite?: CompositeContent;

        // Meta
        locked?: boolean;
        isFixed?: boolean; // Background mode
        parentId?: string; // For grouping (future)
    }
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
        showLibrary?: boolean;
        showProjectManager?: boolean;
        focusMode?: boolean;
    };
    activePizarra?: PizarraMetadata;
    interactionState: {
        selectionBounds?: { x: number; y: number; w: number; h: number };
        marquee?: { x: number; y: number; w: number; h: number };
        creationDraft?: any; // BoardNode partial
        editingImageId?: string;
        editingGroupId?: string;
        editingNodeId?: string; // Currently active text editor
        editingSubId?: string; // Currently active cell in composite
        guides?: GuideLine[];
        snapLines?: Array<{
            type: 'horizontal' | 'vertical';
            x?: number;
            y?: number;
            start: number;
            end: number;
        }>;
        // Focus Mode
        focusTargetId?: string | null;

        // Choreography
        targetViewport?: Viewport; // Smooth transition target
    };
    presentationState: {
        isActive: boolean;
        route: 'order' | 'selection';
        currentIndex: number;
    };
}

export interface GuideLine {
    type: 'center-x' | 'center-y' | 'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right' | 'spacing-x' | 'spacing-y' | 'vertical' | 'horizontal';
    x?: number;
    y?: number;
    start?: number;
    end?: number;
    startX?: number;
    startY?: number;
    length?: number; // Visual length of the guide
}

// --- Pizarra (Project) System ---

export interface PizarraMetadata {
    id: string;
    title: string;
    description?: string; // Optional description
    ownerId: string;      // User ID of owner
    createdAt: number;
    updatedAt: number;
    lastOpenedAt: number; // For "Recent" sorting
    isArchived?: boolean; // Soft delete
    thumbnail?: string;   // URL or Base64 placeholder

    // State Snapshot for Preview/Restore
    canvasState?: {
        viewport: { x: number; y: number; zoom: number };
    };

    boards: {
        id: string;
        title: string;
        type: string;
        order: number;
    }[];
}

export interface BoardTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    focus: string;
    structure: {
        title: string;
        type: string;
        description?: string;
    }[];
}

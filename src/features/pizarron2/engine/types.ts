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


export interface ZoneStyle {
    shading?: string; // Legacy? Keep for compat
    backgroundColor?: string;
    dashed?: boolean;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    titleGap?: number;
    titleFontSize?: number;
    titleAlign?: 'left' | 'center' | 'right';
    showLabel?: boolean; // Toggle visibility of the zone title
    titleColor?: string;
    titleBackgroundColor?: string; // Background for title section
    gradient?: { start: string; end: string; angle?: number };
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
}

export interface ZoneSection {
    id: string;
    label?: string; // Optional label for the section (e.g. "Conclusions")
    content?: {
        text: string;
        style?: {
            fontSize?: number;
            align?: 'left' | 'center' | 'right';
            color?: string;
            backgroundColor?: string;
            lineHeight?: number;
        };
    };
    height?: number; // Optional fixed height or flex ratio? For now, we'll auto-layout.
    style?: {
        backgroundColor?: string;
    }
}

export interface BoardZone {
    id: string;
    x: number; // Percentage 0-1
    y: number; // Percentage 0-1
    w: number; // Percentage 0-1
    h: number; // Percentage 0-1
    label: string; // The "Title" of the zone
    style?: ZoneStyle;
    lineHeight?: number;
    listType?: 'none' | 'bullet' | 'number';
    padding?: number;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    content?: {
        text?: string;
        style?: {
            fontSize?: number;
            fontFamily?: string;
            align?: 'left' | 'center' | 'right';
            color?: string;
            backgroundColor?: string;
            lineHeight?: number;
        };
    };
    sections?: ZoneSection[];
}

export interface BoardStructure {
    id: string;
    name?: string; // For templates
    description?: string; // For templates
    gap?: number; // Spacing between zones (px)
    zones: BoardZone[];
    // Legacy support (optional)
    rows?: any[];
    cols?: any[];
    cells?: any;
    template?: string;
}

export interface BoardNode {
    id: string;
    type: 'text' | 'shape' | 'sticker' | 'image' | 'line' | 'group' | 'board' | 'card' | 'composite' | 'icon';

    // Structure & Scalability
    // structure property moved to specific extended interface below or consolidated
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
    // Structure
    structureId?: string;
    structure?: BoardStructure;
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

        // Rich Text Props
        lineHeight?: number;
        letterSpacing?: string;
        listType?: 'none' | 'bullet' | 'number';
        padding?: number;
        verticalAlign?: 'top' | 'middle' | 'bottom';
        backgroundColor?: string; // Box background (distinct from text color)

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

    interactionState: InteractionState;
    presentationState: {
        isActive: boolean;
        route: 'order' | 'manual';
        currentIndex: number;
        storyPath: string[]; // Node IDs
    };
    savedTemplates?: BoardStructure[]; // User saved templates (Structure Only)
    boardResources?: BoardResource[]; // User saved boards (Full Content Prefabs)
}

export interface BoardResource {
    id: string;
    name: string;
    description?: string;
    nodes: BoardNode[]; // [0] is root. Others are relative children.
    createdAt: number;
}


export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface InteractionState {
    // Interaction
    selectionBounds?: { x: number, y: number, w: number, h: number };
    marquee?: { x: number, y: number, w: number, h: number };
    hoveredNodeId?: string; // For hover effects
    dragNodeId?: string; // For drag lift effects
    creationDraft?: any; // To visualize what's being drawn
    editingTextId?: string; // ID of text node currently being edited
    editingImageId?: string; // ID of image node currently being cropped/adjusted
    editingGroupId?: string; // ID of group currently being "entered"
    editingNodeId?: string; // Generic editing (popover)
    editingSubId?: string; // Sub-element ID (e.g. cell in a grid)
    resizeHandle?: ResizeHandle;
    isDraggingMap?: boolean;
    activeZoneId?: string; // ID of the specific zone selected within a board
    activeZoneSection?: string; // Specific section ID ('title', 'content', or UUID)
    targetViewport?: Viewport; // For cinematic transitions
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
    // Phase 6.3: Planning Intelligence (Read-Only)
    planningHints?: Record<string, { type: 'cost' | 'market' | 'stock'; severity: 'critical' | 'warning' | 'info'; message: string; icon: string; }[]>;
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

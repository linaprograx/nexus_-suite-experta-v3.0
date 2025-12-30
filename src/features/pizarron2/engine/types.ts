export type NodeType = 'card' | 'group' | 'image' | 'text' | 'shape' | 'line' | 'board' | 'icon' | 'ingredient' | 'recipe' | 'menu-item' | 'menu-section' | 'menu-design';

export type InteractionMode = 'creative' | 'operational' | 'executive' | 'training';

export type BoardCapability = 'costing' | 'checklist' | 'variants' | 'staff_read' | 'time_tracking' | 'layout' | 'status_tracking';

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
    placeholderText?: string; // Phase 7: Default text when empty
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
    defaultType?: NodeType | 'grid' | 'list'; // Phase 6.2: Suggest default node type for zone
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
    type: 'text' | 'shape' | 'sticker' | 'image' | 'line' | 'group' | 'board' | 'card' | 'composite' | 'icon' | 'ingredient' | 'recipe' | 'costing' | 'costing-scenario' | 'menu-item' | 'menu-section' | 'menu-design';

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
        titleColor?: string; // Phase 6.2: Header color for boards/cards
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
        thumbnail?: string; // DataURL or Image URL for preview

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

        // Phase 6: Grimorio Integration
        ingredientId?: string; // Reference to Grimorio Ingredient
        recipeId?: string;     // Reference to Grimorio Recipe
        format?: string;       // Optional format override for Ingredients

        // Phase 6.6: Snapshot Fields (for immediate rendering without externalData)
        cost?: number;         // Snapshot cost at creation time
        unit?: string;         // Snapshot unit (e.g., 'kg', 'L')
        margin?: number;       // Snapshot margin (for recipes)
        snapshotData?: any;    // Complete Grimorio item data

        // Phase 6.1: Escandallator Integration (READ-ONLY REFERENCES)
        recipeIdForCosting?: string;      // For costing nodes - ONLY stores reference
        scenarioId?: string;               // For costing-scenario nodes
        recipeIdsInScenario?: string[];   // For costing-scenario nodes
        salePriceOverride?: number;       // Optional price override for what-if analysis

        // Phase 6.2: Menu Design Integration
        menuItemId?: string;
        menuSectionId?: string;
        order?: number;
        price?: number;

        // Phase 6.4: Make Menu In-Pizarrón
        designId?: string;
        sections?: any[];
        items?: any[]; // Resolved items (Snapshot: { id, name, price, ... })
        styleHints?: string;
        proposalId?: string; // A, B, C
        htmlContent?: string;
        suggestedTypography?: string;
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
    appId?: string; // Phase 6.4: Cross-module persistence
    db?: any;       // Phase 6.4: Firestore instance access
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
        showOverview?: boolean; // New: Grid view of all boards
        focusMode?: boolean;
        grimorioPickerOpen?: 'ingredients' | 'recipes' | null; // Phase 6: Picker Modal State
        showMenuGenerator?: boolean; // Phase 6.4: In-Pizarrón Menu Generation
    };
    activePizarra?: PizarraMetadata;

    interactionState: InteractionState;
    presentationState: {
        isActive: boolean;
        route: 'order' | 'manual';
        currentIndex: number;
        storyPath: string[]; // Node IDs
    };
    // Transient Signals

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
    isDragging?: boolean;
    dragStart?: { x: number, y: number } | null;
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

    // Phase 5: Interaction Modes
    mode: InteractionMode;

    // Default Mode for this Board
    defaultMode?: InteractionMode;

    // Choreography
    // Phase 6.3: Planning Intelligence (Read-Only)
    planningHints?: Record<string, { type: 'cost' | 'market' | 'stock'; severity: 'critical' | 'warning' | 'info'; message: string; icon: string; }[]>;

    // Transient Signals
    requestThumbnailCapture?: boolean;
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
    capabilities?: BoardCapability[]; // Phase 5: Intent Capabilities
    defaultMode?: InteractionMode; // Phase 5.FIX
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
        type: 'board' | 'group' | 'zone'; // Phase 5: Zone Support
        order: number;
        thumbnail?: string;
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

import { Timestamp, Firestore } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';
import { PlanTier } from './core/product/plans.types';

// --- STOCK & PURCHASE TYPES (Centralized) ---

export interface StockItem {
    ingredientId: string;
    ingredientName: string;
    unit: string;
    quantityAvailable: number;
    totalValue: number;
    averageUnitCost: number; // Weighted Average Cost
    lastPurchaseDate: Date | string | number;
    providerName: string; // Most recent provider
    lastPurchaseQuantity: number;
}

/**
 * A stock OUT/adjustment movement. Complements PurchaseEvent (stock IN): stock available =
 * purchases − movements. `quantity` is always the amount removed (positive number).
 *  - 'consumption': used by producing/selling a recipe
 *  - 'waste': breakage/spillage
 *  - 'adjustment': physical count reconciliation (digital − counted)
 */
/**
 * De dónde nace un movimiento de stock. **Ortogonal a `type`.**
 *
 * `type` dice qué le pasó a la cantidad (se consumió, se tiró, se ajustó).
 * `origen` dice **quién o qué lo provocó**, que es una pregunta distinta: un
 * `consumption` puede venir de producir una receta, de una venta del TPV o de
 * una invitación, y para analizar rotación —o para auditar un TPV mal
 * configurado— hay que poder distinguirlos.
 *
 * Se añade antes de que nada lo consuma, y a propósito: retrofitar el origen
 * sobre movimientos ya escritos es imposible, porque el dato se perdió al
 * escribirlos. Los documentos anteriores a este campo no lo tienen; quien lea
 * debe tratar la ausencia como «desconocido», nunca suponer un valor.
 */
export type StockMovementOrigin =
    | 'manual'       // registrado a mano por el usuario
    | 'produccion'   // descuento al producir/servir una receta
    | 'conteo'       // ajuste nacido de un conteo físico
    | 'recepcion'    // entrada por recepción de pedido
    | 'venta'        // consumo teórico desde un TPV externo
    | 'invitacion'   // cortesía, personal, catas
    | 'importacion'; // carga masiva de datos

export interface StockMovement {
    id: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;   // amount removed, in `unit`
    unit: string;
    type: 'consumption' | 'waste' | 'adjustment';
    /** Ausente en los movimientos anteriores a 2026-08-09: tratar como desconocido. */
    origen?: StockMovementOrigin;
    reason?: string;
    recipeId?: string;
    recipeName?: string;
    createdAt: Date | any;
}

export interface PurchaseEvent {
    id: string;
    ingredientId: string;
    ingredientName: string;
    providerId: string;
    providerName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    createdAt: Date;
    status: 'pending' | 'completed' | 'cancelled';
}

// ------------------------------------------

export interface Ingredient {
    id: string;
    nombre: string;
    familia?: string;
    categoria?: string;
    costo: number;
    unidad: string;

    /** @deprecated Use 'supplierData' for multi-provider support */
    unidadCompra?: string;
    /** @deprecated Use 'supplierData' or StockItem.averageUnitCost */
    precioCompra?: number;

    standardUnit?: string;
    standardQuantity?: number;
    standardPrice?: number; // Price per standard unit (waste-adjusted) — €/ml, €/g, etc.
    stock?: number;
    emoji?: string;
    recipe?: {
        yield: number;
        yieldUnit: string;
        prepTime: number;
        steps: string[];
        ingredients: {
            id: string; // Grimorium ID
            name: string;
            quantity: number;
            unit: string;
        }[];
    };
    minStock?: number;

    /** @deprecated Use 'proveedores' array */
    proveedor?: string;

    createdAt?: any;
    ingredientId?: string; // For compatibility
    cantidad?: number; // For compatibility
    marca?: string;
    merma?: number;
    wastePercentage?: number;

    proveedores?: string[]; // List of Provider IDs

    /**
     * Si está presente, este documento es un ALIAS de otro producto maestro y
     * sus existencias se consolidan en él. Ausente = es su propio maestro.
     * Se resuelve EN LECTURA (`core/identity/masterProduct.ts`): los históricos
     * siguen apuntando aquí, así que quitar el campo deshace la fusión.
     */
    masterProductId?: string;

    /**
     * Creado desde el alta exprés de una receta: datos aproximados, pendiente de
     * completar. Lo que impide que un precio estimado se confunda con catálogo
     * real. Ver `QuickIngredientModal`.
     */
    pendienteRevision?: boolean;

    /**
     * Proveedor preferente para este producto. La preferencia pertenece a la
     * relación producto ↔ oferta, nunca a la configuración global del negocio:
     * se compra el Campari a uno y el limón a otro.
     */
    proveedorPreferente?: string;
    supplierData?: Record<string, {
        price: number;
        unit: string;
        formatQty?: number;
        formatUnit?: string;
        lastUpdated?: any;
    }>;
}

export interface Proveedor {
    id: string;
    nombre: string;
    contacto: string;
    email: string;
    telefono: string;
    tiempoEntrega: number; // días
    costoEnvio: number;
    pedidoMinimo: number;
    descuentosDisponibles: string[];
    activo: boolean;
}

// --- SUPPLIERS MODULE TYPES ---

export interface SupplierProduct {
    productId: string; // Internal or External ID
    productName: string;
    price: number;
    unit: string;
    updatedAt: any; // Timestamp
}

export interface Supplier {
    id: string;
    name: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    /**
     * Categorías del proveedor, separadas por coma («Alcoholes, Mixers»).
     * Era una unión cerrada de cinco valores que los datos reales nunca
     * respetaron —hay «FRUTERIA» y «ALCOHOL, MIXERS»—, así que el formulario
     * escribía con `as any`. Las sugeridas viven en `features/suppliers/categorias.ts`.
     */
    category: string;
    deliveryDays: string[];
    leadTimeDays: number;
    paymentTerms: string;
    productList: SupplierProduct[]; // Summary of products for quick access
    createdAt: any;
    updatedAt: any;
}

export interface SupplierOrder {
    id: string;
    supplierId: string;
    supplierName: string;
    status: 'draft' | 'pending' | 'received' | 'cancelled';
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        unit: string;
        total: number;
    }[];
    totalAmount: number;
    createdAt: any;
    deliveryDate?: any;
    receivedAt?: any;
}

export interface OrderDraft {
    id: string;
    items: {
        ingredientId: string;
        name: string;
        quantity: number;
        unit: string;
        currentStock?: number;
    }[];
    status: 'draft';
    createdAt: any;
    updatedAt: any;
}

// ---------------------------

export interface StockRule {
    id: string;
    ingredientId: string;
    ingredientName: string;
    minStock: number;
    /**
     * Techo, opcional. Ausente significa «no lo he decidido», NO cero: las 611
     * reglas que ya existen no lo tienen, y tratarlo como cero pondría el
     * inventario entero en sobrestock. Ver `core/stock/nivelDeStock.ts`.
     */
    maxStock?: number;
    reorderQuantity: number;
    active: boolean;
    providerId?: string;
}

export interface CatalogoItem {
    ingredienteId: string;
    precioUnidad: number;
    unidadCompra: string;
    formato: string;
    contenidoPorUnidad: number;
    ultimaActualizacionPrecio: any; // Timestamp
}

// --- RECIPE Helpers ---
export interface IngredientLineItem {
    ingredientId: string | null;
    nombre: string;
    cantidad: number;
    unidad: string;
    /** @deprecated Legacy reference to another Recipe used as a sub-recipe. */
    subRecipeId?: string | null;
    /** Marks this line as an inline SUB-RECIPE box. Its `subItems` define the batch;
     *  cost is prorated: (batch total cost / batch total volume) × cantidad (ml used). */
    isSubRecipe?: boolean;
    /** Marks this line as a GARNISH. Same batch machinery as a sub-recipe, but solid-first
     *  (measured in grams/units) and linked to the garnish catalog. */
    isGarnish?: boolean;
    /** The sub-recipe's / garnish's own components (only when isSubRecipe or isGarnish). */
    subItems?: IngredientLineItem[];
}

export interface Recipe {
    id: string;
    nombre: string;
    categorias?: string[]; // Added
    ingredientes: IngredientLineItem[] | Ingredient[]; // Support both for legacy/compatibility
    instrucciones?: string;
    preparacion?: string; // Alias for UI
    storytelling?: string;
    imageUrl?: string | null;
    costoTotal?: number;
    costoReceta?: number; // Alias for legacy code
    precioVenta?: number;
    margen?: number;
    createdAt?: any;
    glassware?: string;
    ice?: string;
    garnish?: string;
    technique?: string;
    abv?: number;
    /** Nº de porciones/raciones/tragos que rinde la receta (para coste por porción). */
    porciones?: number;
    /**
     * Sobrescrituras de coste de ESTA receta sobre la configuración del negocio.
     * Agrupado a propósito: son seis conceptos que pertenecen juntos, y sueltos
     * en la raíz ensuciarían el modelo sin ganar nada.
     * Ausente = la receta hereda todo del negocio y se comporta como siempre.
     */
    costingOverrides?: import('./core/costing/profitability.types').RecipeCostOverrides;
}

export interface CerebrityResult {
    storytelling: string;
    mejora: string;
    garnishComplejo: string;
    promptImagen: string;
    imageUrl: string | null;
    createdAt?: any;
}

export interface TrendResult {
    id?: string; // Added optional ID
    titulo?: string; // Legacy
    resumen?: string; // Legacy
    fuente?: string; // Legacy
    url?: string;
    date?: string;

    // New AI Fields
    conceptName?: string;
    trendScore?: number;
    description?: string;
    ingredientsKey?: string[];
    popularityRegion?: string;
    visualStyle?: string;
}

export interface MenuLayout {
    themeName: string;
    description: string;
    suggestedTypography: string;
    htmlContent: string;
}

export interface MenuItem {
    id: string;
    recipeId: string;
    name: string;
    cost: number;
    price: number;
    margin: number;
    status: 'active' | 'draft' | 'archived';
}

export interface MenuSection {
    id: string;
    title: string;
    order: number;
    items: string[]; // List of MenuItem IDs
}

export interface MenuDraft {
    id: string;
    sections: MenuSection[];
    averageMargin: number;
    warnings: string[];
}

export interface PizarronBoard {
    id: string;
    name: string;
    category: 'general' | 'creativo' | 'operativo' | 'carta' | 'producción' | 'marketing';
    themeColor: string;
    icon: string;
    description: string;
    columns?: string[];
    enabledTools?: string[];
    createdAt?: any;
}

export interface PizarronTask {
    id: string;
    content?: string; // Legacy
    texto?: string; // Legacy Title
    title?: string;
    description?: string;
    status: string;
    boardId: string;
    category: string; // Made generic to avoid conflict, or use union if strict
    priority?: 'low' | 'medium' | 'high' | 'urgent' | 'baja' | 'media' | 'alta';
    tags?: string[];
    labels?: string[];
    linkedIngredients?: string[]; // IDs of ingredients from Grimorium
    createdAt?: any;
    dueDate?: any;
    assignee?: string; // Legacy
    assignees?: string[];
    authorName?: string;
    authorPhotoURL?: string;
    attachments?: any[];
    upvotes?: string[];
    starRating?: Record<string, number>;
    history?: any[];
    recipe?: {
        yield?: number;
        yieldUnit?: string;
        prepTime?: number;
        ingredients?: {
            id: string;
            name: string;
            quantity: number;
            unit: string;
        }[];
        steps?: string[];
    };
    position?: { x: number, y: number };
    // Canvas Props
    type?: 'task' | 'text' | 'shape' | 'line' | 'frame' | 'image' | 'sticker';
    style?: Record<string, any>;
    frameId?: string; // ID of the parent Visual Board (Frame)
    zIndex?: number;
    width?: number;
    height?: number;
    rotation?: number;
    // Specifics for non-tasks
    // content is already defined in PizarronTask legacy fields, reusing it for Text elements
    shapeType?: 'rectangle' | 'circle' | 'triangle'; // For shapes
    lineStart?: { x: number, y: number }; // For lines
    lineEnd?: { x: number, y: number }; // For lines
    path?: string; // For free drawing (SVG path data)
    strokeColor?: string;
    strokeWidth?: number;
}

export interface CanvasItem extends PizarronTask {
    // Union type alias for clearer code, even if PizarronTask has optional fields
    // This allows us to treat everything as an item with a position.
}

export interface Tag {
    id: string;
    label: string;
    color: string;
}

export type ViewName = 'dashboard' | 'grimorium' | 'pizarron' | 'cerebrity' | 'unleash' | 'colegium' | 'settings' | 'menu' | string;

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    role?: string;
    jobTitle?: string;
    bio?: string;
    instagramHandle?: string;
    mantra?: string;
    mantraAuthor?: string;
    experience?: number; // Total XP (progression system)
    level?: number;      // Cached level derived from XP
}

export interface ZeroWasteResult {
    nombre: string;
    ingredientes: string;
    preparacion: string;
}

export interface Escandallo {
    id: string;
    recipeId: string;
    recipeName: string;
    costo: number;
    baseImponible: number;
    ivaSoportado: number;
    margenBruto: number;
    rentabilidad: number;
    precioVenta: number;
    createdAt?: any;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    type: 'multiple-choice' | 'true-false';
    explanation?: string; // AI rationale shown after answering
    visualGlass?: string; // glassware name → renders an SVG icon as a visual prompt
}

export interface ColegiumResult {
    id?: string;
    score: number;
    total: number;
    topic: string;
    difficulty: string;
    createdAt: any;
    xpEarned?: number;
}

export interface UIContextType {
    theme: string;
    /** Tema efectivo que se está pintando; resuelve `system` según el dispositivo. */
    isDarkMode: boolean;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    /** Alterna claro/oscuro partiendo del tema realmente aplicado, no del guardado. */
    toggleTheme: () => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    compactMode: boolean;
    toggleCompactMode: () => void;
    focusMode: boolean;
    toggleFocusMode: () => void;
}

/** Legacy auth-only context (see context/AuthContext.tsx). AppContextType supersedes it. */
export interface AuthContextType {
    app: FirebaseApp | null;
    userId: string | null;
    db: Firestore | null;
    auth: Auth | null;
    storage: FirebaseStorage | null;
    user: User | null;
    isAuthReady: boolean;
    appId?: string;
}

export interface AppContextType {
    app: FirebaseApp | null;
    db: Firestore | null;
    auth: Auth | null;
    storage: FirebaseStorage | null;
    user: User | null;
    userId: string | null;
    isAuthReady: boolean;
    appId: string;
    userProfile?: Partial<UserProfile>;
    userPlan: PlanTier;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    createdAt?: any;
}

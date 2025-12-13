import { Timestamp, Firestore } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';

export interface Ingredient {
    id: string;
    nombre: string;
    familia?: string;
    categoria?: string; // Added
    costo: number;
    unidad: string;
    unidadCompra?: string; // Added
    precioCompra?: number; // Added
    standardUnit?: string; // Added
    standardQuantity?: number; // Added
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
    proveedor?: string;
    createdAt?: any;
    ingredientId?: string; // For compatibility
    cantidad?: number; // For compatibility
    marca?: string;
    merma?: number;
    wastePercentage?: number;
    proveedores?: string[]; // Added: List of Provider IDs
    supplierData?: Record<string, {
        price: number;
        unit: string;
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
    category: "Bebidas" | "Frutas" | "Lácteos" | "Secos" | "Otros";
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

// ---------------------------

export interface CatalogoItem {
    ingredienteId: string;
    precioUnidad: number;
    unidadCompra: string;
    formato: string;
    contenidoPorUnidad: number;
    ultimaActualizacionPrecio: any; // Timestamp
}

export interface Recipe {
    id: string;
    nombre: string;
    categorias?: string[]; // Added
    ingredientes: Ingredient[];
    instrucciones?: string;
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
}

export interface ColegiumResult {
    id?: string;
    score: number;
    total: number;
    topic: string;
    difficulty: string;
    createdAt: any;
}

export interface UIContextType {
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    compactMode: boolean;
    toggleCompactMode: () => void;
    focusMode: boolean;
    toggleFocusMode: () => void;
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


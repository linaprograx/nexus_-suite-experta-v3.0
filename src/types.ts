import { Timestamp } from 'firebase/firestore';

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
    title: string;
    description?: string;
    status: string;
    boardId: string;
    category?: string;
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
}

export interface Tag {
    id: string;
    label: string;
    color: string;
}

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    role?: string;
}

export interface ZeroWasteResult {
    recipeName: string;
    description: string;
    ingredientsUsed: string[];
    savings: string;
    difficulty: 'Fácil' | 'Media' | 'Avanzada';
}

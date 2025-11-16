// types.ts
import * as React from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

export type ViewName = 
  'dashboard' | 
  'grimorium' | 
  'pizarron' | 
  'cerebrIty' | 
  'escandallator' | 
  'trendLocator' | 
  'zeroWaste' | 
  'makeMenu' | 
  'colegium' | 
  'personal';


export interface Ingredient {
  id: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  unidadCompra: string; // ej. "Botella (700ml)", "Saco (1kg)"
  standardUnit: 'g' | 'ml' | 'und' | ''; // La unidad base (gramo, mililitro, unidad)
  standardQuantity: number; // ej. 700 (ml), 1000 (g)
  standardPrice: number; // El precio calculado (ej. precioCompra / standardQuantity)
}

export interface IngredientLineItem {
  ingredientId: string | null;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Recipe {
  id: string;
  nombre: string;
  categorias: string[];
  costoReceta?: number;
  precioVenta?: number;
  ingredientes?: IngredientLineItem[];
  preparacion?: string;
  garnish?: string;
  elaboracionesComplejas?: string;
  elementoCreativo?: string;
  ingredientesTexto?: string;
  imageUrl?: string | null;
  storytelling?: string;
}

export type PizarronStatus = 'ideas' | 'pruebas' | 'aprobado';
export type TaskCategory = 'Ideas' | 'Desarrollo' | 'Marketing' | 'Admin' | 'Urgente';

export interface PizarronTask {
  id: string;
  texto: string;
  status: PizarronStatus;
  category: string;
  createdAt: any;

  // --- NUEVOS CAMPOS (Iteración 7) ---
  boardId: string; // ID del tablero al que pertenece la tarea
  labels: string[]; // Etiquetas inteligentes
  priority: 'baja' | 'media' | 'alta';
  upvotes: string[]; // Array de UserIDs que han votado
  starRating: Record<string, number>; // { [userId]: rating (1-5) }
  attachments: { name: string, url: string, type: 'image' | 'pdf' | 'link' }[];
  assignees: string[]; // Array de UserIDs
  dueDate: any; // Timestamp (para el Calendario)
  authorName?: string;
  authorPhotoURL?: string;
}

export interface PizarronBoard {
  id: string;
  name: string;
  filters: any;
}


export interface PizarronComment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export interface AppNotification {
  id?: string;
  text: string;
  taskId: string; // ID de la tarea a la que enlaza
  taskText: string;
  read: boolean;
  createdAt: any; // serverTimestamp
}

export interface Escandallo {
  id: string;
  recipeId: string;
  recipeName: string;
  costo: number;
  precioVenta: number;
  ivaSoportado: number;
  margenBruto: number;
  rentabilidad: number;
  createdAt: any; // Timestamp
}

export interface TrendResult {
  id: string; // ID de Firestore (para el historial)
  titulo: string;
  resumen: string;
  fuente: string;
  createdAt?: any;
}

export interface MenuLayout {
  id?: string; // ID de Firestore
  themeName: string;
  description: string;
  suggestedTypography: string;
  htmlContent: string; // HTML + Tailwind como string
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

export interface UserProfile {
  displayName: string;
  photoURL: string;
  jobTitle: string;
  bio: string;
  coverPhotoURL: string;
  instagramHandle: string;
}

export interface UIContextType {
  // FIX: Replaced isDarkMode/toggleDarkMode with theme/setTheme to match implementation
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
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

export interface CerebrityResult {
  mejora: string;
  storytelling: string;
  promptImagen: string;
  imageUrl: string | null;
  garnishComplejo: string;
  createdAt?: any; // For Firestore serverTimestamp
}

export interface ZeroWasteResult {
  nombre: string;
  ingredientes: string; // Markdown
  preparacion: string; // Markdown
}

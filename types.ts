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
  'personal' |
  'lab';


export interface Ingredient {
  id: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  unidadCompra: string; // ej. "Botella (700ml)", "Saco (1kg)"
  standardUnit: 'g' | 'ml' | 'und' | ''; // La unidad base (gramo, mililitro, unidad)
  standardQuantity: number; // ej. 700 (ml), 1000 (g)
  standardPrice: number; // El precio calculado (ej. precioCompra / standardQuantity)
  wastePercentage?: number; // Merma (0-100)
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

export type PizarronStatus = string; // Was 'ideas' | 'pruebas' | 'aprobado'. Changed to string for dynamic columns.
export type TaskCategory = 'Ideas' | 'Desarrollo' | 'Marketing' | 'Admin' | 'Urgente';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface PizarronTask {
  id: string;
  texto: string;
  description?: string; // Added field
  status: PizarronStatus;
  category: string;
  createdAt: any;
  updatedAt?: any; // Added field

  // --- NUEVOS CAMPOS (Iteración 7) ---
  boardId: string; // ID del tablero al que pertenece la tarea
  labels: string[]; // Etiquetas inteligentes
  tags: string[]; // Etiquetas de usuario (colores)
  priority: 'baja' | 'media' | 'alta';
  upvotes: string[]; // Array de UserIDs que han votado
  starRating: Record<string, number>; // { [userId]: rating (1-5) }
  attachments: { name: string, url: string, type: 'image' | 'pdf' | 'link' }[];
  assignees: string[]; // Array de UserIDs
  dueDate: any; // Timestamp (para el Calendario)
  authorName?: string;
  authorPhotoURL?: string;
  history?: any[]; // Added field for embedded history if needed
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'file';
  url: string;
  name: string;
  size?: number;
  metadata?: any;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  message: string;
  mentions: string[];
  attachments?: Attachment[];
  createdAt: number;
  updatedAt?: number;
  isSystem?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface PizarronBoard {
  id: string;
  name: string;
  filters: any;
  category?: 'creativo' | 'operativo' | 'carta' | 'producción' | 'general';
  themeColor?: string;
  icon?: string;
  description?: string;
  columns?: string[];
  automations?: string[];
  linkedViews?: string[];
  isTemplateBased?: boolean;
  templateId?: string;
}


export interface PizarronComment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
  mentions?: { userId: string, userName: string }[];
}

export interface PizarronActivity {
  id?: string;
  taskId: string;
  type: 'creation' | 'status_change' | 'edit' | 'priority_change' | 'comment' | 'mention';
  details: string;
  userId: string;
  userName: string;
  timestamp: any;
}

export interface TaskHistoryItem {
  id: string;
  taskId: string;
  type: string;
  authorId: string;
  authorName: string; 
  description: string;
  createdAt: number;
}

export interface PizarronSavedView {
  id?: string;
  name: string;
  userId: string;
  filters: any;
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

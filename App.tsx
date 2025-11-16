import * as React from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, Auth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, Firestore, serverTimestamp, query, orderBy, limit, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage, uploadBytes } from 'firebase/storage';
import { ViewName, Ingredient, Recipe, PizarronTask, PizarronStatus, UIContextType, AppContextType, TaskCategory, IngredientLineItem, CerebrityResult, Escandallo, TrendResult, MenuLayout, QuizQuestion, ColegiumResult, UserProfile, ZeroWasteResult, PizarronComment, PizarronBoard, AppNotification } from './types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FaBook, FaBolt, FaWineGlassAlt } from 'react-icons/fa';


// --- HARDCODED CONFIGURATIONS (as per requirement) ---
const firebaseConfig = {
  apiKey: "AIzaSyDHMuaMc8AQhaENjI-8-wmC8YiScmRPUnc",
  authDomain: "fenomeno-suit.firebaseapp.com",
  projectId: "fenomeno-suit",
  storageBucket: "fenomeno-suit.firebasestorage.app",
  messagingSenderId: "368869694849",
  appId: "1:368869694849:web:5d6b8efb3305d374dddc80"
};

// --- API HELPERS ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("API Key de Gemini no encontrada. Asegúrate de que VITE_GEMINI_API_KEY está en tu archivo .env");
}

const callGeminiApi = async (userQuery: string | { parts: any[], role?: string }, systemPrompt: string, generationConfig: any = null) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: typeof userQuery === 'string' ? [{ parts: [{ text: userQuery }] }] : userQuery,
          config: { 
              systemInstruction: systemPrompt,
              ...(generationConfig && generationConfig)
          }
      });
      return response;
  } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Error en la llamada a la API de Gemini. Verifique la consola para más detalles.");
  }
};


const generateImage = async (prompt: string) => {
    if (!prompt || prompt.trim() === "") {
        throw new Error("El prompt de la imagen estaba vacío. No se puede generar.");
    }
    
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    try {
        // FIX: Se asegura que la llamada a la API se asigna a una constante 'response'.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        // FIX: Se define 'base64Data' a partir de la 'response' obtenida.
        const base64Data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64Data) {
            throw new Error("La respuesta de la API de Imagen (flash) no contenía datos de imagen válidos.");
        }
        return { predictions: [{ bytesBase64Encoded: base64Data }] };
    } catch (error) {
        console.error("Error en la API de Imagen (flash):", error);
        throw new Error("La llamada a la API de imagen falló. Revisa la consola.");
    }
};

// Helper de API para llamadas con Google Search (para Trend Locator)
const callGeminiApiWithSearch = async (userQuery: string, systemPrompt: string, generationConfig: any = null) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        ...(generationConfig || {}),
        tools: [{googleSearch: {}}],
        systemInstruction: systemPrompt,
      }
  });
  
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// Helper para exportar datos a CSV
const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Fila de cabecera
    ...data.map(row => 
      headers.map(header => 
        String(row[header]).replace(/"/g, '""') // Escapar comillas
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper para parsear bloques simples (ej: [Ingredientes] ... [Preparacion])
const parseSimpleBlock = (text: string, key: string): string => {
  const regex = new RegExp(`\\[${key}\\]([\\s\\S]*?)(?=\\[[^\\]]+\\]|---|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

// Helper para convertir Blob a Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // remove data url prefix
            resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


// Componente para inyectar los estilos de impresión
const PrintStyles: React.FC = () => (
  <style>{`
    @media print {
      /* Oculta todo por defecto al imprimir */
      body * {
        visibility: hidden;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }

      /* Muestra solo la sección de impresión y sus hijos */
      #print-section, #print-section * {
        visibility: visible;
        height: auto;
        overflow: visible;
        margin: unset;
        padding: unset;
      }

      /* Ajusta la sección de impresión para que ocupe la página */
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 2rem;
      }

      .no-print {
          display: none !important;
      }
    }
  `}</style>
);

const applyTheme = (theme: string) => {
    localStorage.setItem('theme', theme);
    let isDark;
    if (theme === 'dark') {
        isDark = true;
    } else if (theme === 'light') {
        isDark = false;
    } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// --- CONTEXT DEFINITIONS ---
const UIContext = React.createContext<UIContextType | undefined>(undefined);
const AppContext = React.createContext<AppContextType | undefined>(undefined);

// --- HOOKS for consuming contexts ---
const useUI = (): UIContextType => {
  const context = React.useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

const useApp = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// --- ICON COMPONENTS & DEFINITIONS ---
const ICONS = {
    grid: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 3v18"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h.08"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v0A2.5 2.5 0 0 0 14.5 7h-.08"/><path d="M12 15a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 12 10h0a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 12 15Z"/><path d="M4.5 7A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 7h-5Z"/><path d="M19.5 7A2.5 2.5 0 0 0 17 4.5v0A2.5 2.5 0 0 0 14.5 7h5Z"/><path d="M7 10.5A2.5 2.5 0 0 1 4.5 13v0A2.5 2.5 0 0 1 7 15.5h.08"/><path d="M17 10.5A2.5 2.5 0 0 0 19.5 13v0A2.5 2.5 0 0 0 17 15.5h-.08"/><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-5 0v0A2.5 2.5 0 0 0 12 22Z"/>',
    calculator: '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM9 18H7v-2h2v2zm0-4H7v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v3zM15 5h-2V4h2v1zM11 5h-2V4h2v1zM9 5H7V4h2v1z"/>',
    trending: '<path d="m23 6-9.5 9.5-5-5L1 18"/>',
    trendingUp: '<path d="m23 6-9.5 9.5-5-5L1 18"/>',
    recycle: '<path d="M12 2v4l3 3h-6l3-3V2Z"/><path d="m7 9 1.5 1.5-3.8 3.8 1.4 1.4L10 12l1.5 1.5-5 5L5 20l6-6 6 6-1.5-1.5-5-5L17.5 14l1.4-1.4-3.8-3.8L17 7l-5 5-5-5Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    school: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    collapse: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    moon: '<path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<path fill="currentColor" d="M12 3a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1zM4.929 6.343a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414L4.93 6.343zM3 12a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1zm1.929 6.071a1 1 0 0 0 1.414 1.414l1.414-1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414zM12 21a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1zm6.071-3.515a1 1 0 0 0 1.414-1.414l-1.414-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414zM21 12a1 1 0 0 0-1-1h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1zm-1.929-6.071a1 1 0 0 0-1.414-1.414L16.243 6.343a1 1 0 0 0 1.414 1.414l1.414-1.414zM12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5z"/>',
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    trash: '<path fill="currentColor" d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
    x: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    upArrow: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
    chevronDown: 'M7 10l5 5 5-5z',
    galeria: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    settings: '<path fill="currentColor" d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM19.4 12a7.4 7.4 0 1 1-10.23 6.57l.02.04 2.14 3.66a1 1 0 0 0 1.74 0l2.14-3.66.02-.04a7.4 7.4 0 0 1 4.17-6.57zm-13.62.8a5.4 5.4 0 1 0 8.44 0 5.4 5.4 0 0 0-8.44 0z"/>',
    user: '<path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0-8a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 10a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z"/>',
    logOut: '<path fill="currentColor" d="M13 11V3a1 1 0 0 0-2 0v8H9.41l2.3-2.29a1 1 0 1 0-1.42-1.42l-4 4a1 1 0 0 0 0 1.42l4 4a1 1 0 0 0 1.42-1.42L11.41 13H19a1 1 0 0 0 1-1 1 1 0 0 0-1-1h-6z"/>',
    flask: '<path d="M10 2v7.31L6 14v6c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-6l-4-4.69V2" /><path d="M8.5 2h7" /><path d="M14 2v4" />',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
    critic: '<path d="M2 21a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-8h-2v7H4V4h7V2H3a1 1 0 0 0-1 1v18z" /><path d="m14.5 7.5-2.5 2.5-1.5-1.5-1.41 1.41 2.91 2.91 3.91-3.91z" /><path d="M21.71 3.29a1 1 0 0 0-1.42 0l-6.29 6.3 1.41 1.41 6.3-6.29a1 1 0 0 0 0-1.42z" />',
    messageCircle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />',
    tag: '<path d="M12.586 2.586a2 2 0 0 0-2.828 0L2.586 9.757a2 2 0 0 0 0 2.828l9.172 9.172a2 2 0 0 0 2.828 0l7.171-7.171V2.586h-6.17Z" /><circle cx="16" cy="16" r="1" />',
    layoutGrid: '<path d="M4 11V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" /><path d="M4 11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2" /><path d="M20 11V4a2 2 0 0 0-2-2h-2" /><path d="M20 11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2" /><path d="M12 2v20" /><path d="M12 11h9.5a2.5 2.5 0 0 1 0 5H12" /><path d="M12 16h-9.5a2.5 2.5 0 0 1 0-5H12" />',
    plusCircle: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />',
    chevronRight: '<polyline points="9 18 15 12 9 6" />',
    chevronLeft: '<polyline points="15 18 9 12 15 6" />',
    sliders: '<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />',
    arrowUp: '<path d="M12 5l-6 6h12l-6-6" />',
    chevronsUp: '<path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />',
    minus: '<line x1="5" y1="12" x2="19" y2="12" />',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />',
    paperclip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
};

// Helper para colores de categoría (Sutil)
const getCategoryColor = (category: string | undefined) => {
  if (!category) return 'border-gray-500';
  const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [
    "border-blue-500", "border-green-500", "border-yellow-500",
    "border-red-500", "border-purple-500", "border-pink-500",
    "border-indigo-500", "border-teal-500",
  ];
  return colors[Math.abs(hash) % colors.length];
};

// Helper para iconos de prioridad
const getPriorityIcon = (priority: 'baja' | 'media' | 'alta') => {
  if (priority === 'alta') return { icon: ICONS.chevronsUp, color: "text-red-500" };
  if (priority === 'media') return { icon: ICONS.arrowUp, color: "text-yellow-500" };
  return { icon: ICONS.minus, color: "text-gray-500" };
};

// (Helpers para la lógica del calendario)
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};
const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=Domingo, 1=Lunes
};
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};
const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];


const Icon: React.FC<{ svg: string, className?: string }> = ({ svg, className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: svg }} />
);

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const Alert: React.FC<{variant?: 'default' | 'destructive', title: string, description: string}> = ({variant = 'default', title, description}) => {
    const colors = {
        default: 'bg-background border-border text-foreground',
        destructive: 'bg-destructive/10 border-destructive text-destructive'
    }
    return (
        <div className={`relative w-full rounded-lg border px-4 py-3 text-sm ${colors[variant]}`} role="alert">
            <span className="font-medium">{title}</span>
            <div className="text-sm">{description}</div>
        </div>
    );
};


// --- PROVIDER COMPONENTS ---
const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'system';
    }
    return 'system';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isSidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  React.useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <UIContext.Provider value={{ theme, setTheme, isSidebarCollapsed, toggleSidebar }}>
      {children}
    </UIContext.Provider>
  );
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [app, setApp] = React.useState<FirebaseApp | null>(null);
    const [db, setDb] = React.useState<Firestore | null>(null);
    const [auth, setAuth] = React.useState<Auth | null>(null);
    const [storage, setStorage] = React.useState<FirebaseStorage | null>(null);
    const [user, setUser] = React.useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = React.useState(false);
    const [userProfile, setUserProfile] = React.useState<Partial<UserProfile>>({});

    React.useEffect(() => {
        const appInstance = initializeApp(firebaseConfig);
        const authInstance = getAuth(appInstance);
        const dbInstance = getFirestore(appInstance);
        const storageInstance = getStorage(appInstance);
        setApp(appInstance);
        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUser(user);
            } else {
                const initialToken = (window as any).__initial_auth_token as string;
                if (initialToken) {
                    try {
                        const userCredential = await signInWithCustomToken(authInstance, initialToken);
                        setUser(userCredential.user);
                    } catch (error) {
                        console.error("Error al iniciar sesión con token personalizado:", error);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    const userId = user ? user.uid : null;
    const appId = firebaseConfig.appId;

    React.useEffect(() => {
        if (db && userId) {
            const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
            const unsubscribe = onSnapshot(profileDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                }
            });
            return () => unsubscribe();
        }
    }, [db, userId]);

    return (
        <AppContext.Provider value={{ app, db, auth, storage, user, userId, isAuthReady, appId, userProfile }}>
            {children}
        </AppContext.Provider>
    );
};

// --- STYLED UI COMPONENTS (Shadcn/UI Emulation) ---
const Card: React.FC<{ children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
const CardContent: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const CardFooter: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

// FIX: Update Button component props to be a discriminated union based on the `as` prop.
// This allows the component to be correctly typed as either a button or a label,
// fixing errors with incompatible props like `htmlFor`.
const Button = React.forwardRef<
  HTMLButtonElement | HTMLLabelElement,
  {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  } & (
    | ({ as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ as: 'label' } & React.LabelHTMLAttributes<HTMLLabelElement>)
  )
>(({ className, variant = 'default', size = 'default', as: Component = 'button' as any, ...props }, ref) => {
  const variants = {
    default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
    outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9',
  };
  return <Component className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} ref={ref as any} {...(props as any)} />;
});

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return <input className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} ref={ref} {...props} />;
});

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} ref={ref} {...props} />;
});

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => {
    return (
        <div className="relative w-full">
            <select
                className={`appearance-none flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            >
                {children}
            </select>
            <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
    );
});


const Label: React.FC<{children: React.ReactNode, htmlFor?: string, className?: string}> = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;

const Modal: React.FC<{isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode, className?: string, size?: 'default' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'}> = ({ isOpen, onClose, title, children, className, size = 'default' }) => {
    if (!isOpen) return null;
    const sizes = {
        default: 'max-w-lg',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className={`relative w-full ${sizes[size]} ${className}`} onClick={e => e.stopPropagation()}>
                <Card className="m-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        {title && <CardTitle>{title}</CardTitle>}
                        <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto"><Icon svg={ICONS.x} /></Button>
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const Checkbox: React.FC<{checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, id?: string}> = ({ checked, onChange, id }) => (
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600" />
);


// --- AUTHENTICATION COMPONENT ---
const AuthComponent = () => {
  const { auth } = useApp();
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl">{isLogin ? 'Acceder a Nexus' : 'Crear Cuenta en Nexus'}</CardTitle>
          <CardDescription>{isLogin ? "Introduce tus credenciales para acceder a la suite." : "Crea una cuenta para empezar."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="executive@hotel.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : (isLogin ? 'Acceder' : 'Registrarse')}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="mx-auto" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Accede"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};


// --- MODULE VIEWS ---
const PlaceholderView: React.FC<{title: string, icon?: string}> = ({ title, icon }) => (
    <div className="p-6 lg:p-8">
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                {icon && <Icon svg={icon} className="w-8 h-8 text-primary" />}
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Este módulo está en construcción.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p>La funcionalidad para el módulo {title} se implementará en una futura iteración del Ecosistema v2.</p>
            </CardContent>
        </Card>
    </div>
);

// --- DASHBOARD VIEW (CEO Style) ---
const DashboardView: React.FC<{
  allRecipes: Recipe[];
  allPizarronTasks: PizarronTask[];
  allIngredients: Ingredient[];
  auth: Auth;
}> = ({ allRecipes, allPizarronTasks, allIngredients, auth }) => {
    const { userProfile } = useApp();

    const kpis = React.useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalTasks = allPizarronTasks.length;
        const tiempoAhorrado = (totalRecipes * 0.5) + (totalTasks * 0.25);
        return { totalRecipes, totalTasks, tiempoAhorrado };
    }, [allRecipes, allPizarronTasks]);

    const creativeTrendData = React.useMemo(() => {
        const activityByDate: { [key: string]: { recipes: number, tasks: number } } = {};
        
        allPizarronTasks.forEach(item => {
            if (item.createdAt?.toDate) {
                const date = item.createdAt.toDate().toISOString().split('T')[0];
                if (!activityByDate[date]) {
                    activityByDate[date] = { recipes: 0, tasks: 0 };
                }
                activityByDate[date].tasks++;
            }
        });

        return Object.entries(activityByDate)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [allRecipes, allPizarronTasks]);

    const balanceData = [
        { subject: 'Dulce', A: 8, fullMark: 10 },
        { subject: 'Cítrico', A: 9, fullMark: 10 },
        { subject: 'Amargo', A: 6, fullMark: 10 },
        { subject: 'Alcohol', A: 7, fullMark: 10 },
        { subject: 'Herbal', A: 5, fullMark: 10 },
        { subject: 'Especiado', A: 4, fullMark: 10 },
    ];

    const KPICard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`text-white p-2 rounded-full ${color}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 lg:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {userProfile?.displayName || auth.currentUser?.email}</h1>
                <p className="text-muted-foreground">Una vista de alto nivel del ecosistema Nexus.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl">
                    <CardHeader>
                        <CardTitle>Métrica de Impacto (ROI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">Tiempo Ahorrado (Estimado)</p>
                        <p className="text-6xl font-extrabold tracking-tighter">{kpis.tiempoAhorrado.toFixed(2)}</p>
                        <p className="text-lg">Horas Reales Ahorradas</p>
                    </CardContent>
                </Card>
                <KPICard title="Total Recetas" value={kpis.totalRecipes} icon={<FaBook size={24} />} color="bg-blue-500" />
                <KPICard title="Total Tareas" value={kpis.totalTasks} icon={<FaBolt size={24} />} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Tendencia Creativa</CardTitle>
                        <CardDescription>Actividad de creación por fecha.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={creativeTrendData}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="recipes" stackId="1" stroke="#8884d8" fill="url(#colorUv)" name="Recetas" />
                                <Area type="monotone" dataKey="tasks" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Tareas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Equilibrio de la Carta</CardTitle>
                        <CardDescription>Perfil de sabor general (simulado).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={balanceData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis />
                                <Radar name="Balance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


// --- CEREBRITY VIEW ---
const CerebrityHistorySidebar: React.FC<{
    db: Firestore;
    userId: string;
    onLoadHistory: (item: CerebrityResult) => void;
    onClose: () => void;
}> = ({ db, userId, onLoadHistory, onClose }) => {
    const [history, setHistory] = React.useState<(CerebrityResult & { id: string })[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db || !userId) return;
        setLoading(true);
        const historyCol = collection(db, `users/${userId}/cerebrity-history`);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(20));
        
        const unsubscribe = onSnapshot(q, snapshot => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CerebrityResult & { id: string }));
            setHistory(historyData);
            setLoading(false);
        }, err => {
            console.error("Error fetching history:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId]);

    return (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={onClose}
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Historial Creativo</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon svg={ICONS.x} className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading && <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>}
                {!loading && history.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No hay historial.</div>}
                {history.map(item => (
                    <button key={item.id} onClick={() => onLoadHistory(item)} className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors flex items-start gap-3">
                        {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 rounded object-cover flex-shrink-0" alt="Generated recipe" />}
                        <div className="flex-1">
                            <p className="text-xs font-semibold line-clamp-2">{item.storytelling || item.mejora}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
          </div>
        </>
    );
};

const TheLabHistorySidebar: React.FC<{
    db: Firestore;
    historyPath: string;
    onClose: () => void;
}> = ({ db, historyPath, onClose }) => {
    const [history, setHistory] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, historyPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, historyPath]);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-96 bg-card p-4 z-50 flex flex-col border-l">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Historial del Laboratorio</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && <p>Cargando historial...</p>}
                    {!loading && history.length === 0 && <p>No hay historial.</p>}
                    {history.map(item => (
                        <Card key={item.id}>
                           <CardContent className="p-3">
                                <p className="font-semibold text-sm">Análisis de: {item.ingredient || item.combination}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.result?.perfil}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

const Combobox: React.FC<{
    items: (Ingredient | Recipe)[];
    onSelect: (item: Ingredient | Recipe) => void;
    placeholder: string;
}> = ({ items, onSelect, placeholder }) => {
    const [search, setSearch] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredItems = React.useMemo(() => {
        if (!search) return [];
        return items.filter(item => item.nombre.toLowerCase().includes(search.toLowerCase()));
    }, [search, items]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setIsOpen(true)}
            />
            {isOpen && search && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="px-4 py-2 hover:bg-accent cursor-pointer"
                                onClick={() => {
                                    onSelect(item);
                                    setSearch('');
                                    setIsOpen(false);
                                }}
                            >
                                {item.nombre}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-muted-foreground">No se encontraron resultados.</div>
                    )}
                </div>
            )}
        </div>
    );
}

const CreativityTab: React.FC<{
    db: Firestore;
    userId: string;
    allRecipes: Recipe[];
    selectedRecipe: Recipe | null;
    setSelectedRecipe: (recipe: Recipe | null) => void;
    rawInput: string;
    setRawInput: (input: string) => void;
    handleGenerate: () => void;
    loading: boolean;
    imageLoading: boolean;
    error: string | null;
    result: CerebrityResult | null;
    setResult: (result: CerebrityResult | null) => void;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
}> = ({ db, userId, allRecipes, selectedRecipe, setSelectedRecipe, rawInput, setRawInput, handleGenerate, loading, imageLoading, error, result, setResult, showHistory, setShowHistory, onOpenRecipeModal }) => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Generador Creativo</CardTitle>
                    <Button variant="outline" onClick={() => setShowHistory(true)}>Ver Historial</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="recipe-select">Elegir Receta Existente</Label>
                        <Select id="recipe-select" value={selectedRecipe?.id || ''} onChange={e => setSelectedRecipe(allRecipes.find(r => r.id === e.target.value) || null)}>
                            <option value="">Seleccionar una receta...</option>
                            {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </Select>
                    </div>
                    <div>
                       <Label htmlFor="raw-input">O introduce ingredientes crudos</Label>
                       <Textarea id="raw-input" placeholder="Ej: Ginebra, tónica, piel de limón, romero" value={rawInput} onChange={e => setRawInput(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleGenerate} disabled={loading || imageLoading}>
                        {(loading || imageLoading) && <Spinner className="mr-2"/>}
                        {loading ? 'Generando Texto...' : imageLoading ? 'Generando Imagen...' : 'Generar'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
            {loading && !result && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12"/></div>}
            {error && <Alert variant="destructive" title="Error" description={error} />}
            {result && (
                <>
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-2">
                                <div className="h-64 bg-secondary rounded-md flex items-center justify-center">
                                    {imageLoading ? <Spinner className="w-10 h-10"/> :
                                     result.imageUrl ? <img src={result.imageUrl} alt="Receta generada" className="w-full h-full object-cover rounded-md"/> :
                                     <Icon svg={ICONS.galeria} className="w-16 h-16 text-muted-foreground"/>}
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Mejora Táctica</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.mejora}</p>}</CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Garnish de Alto Nivel</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.garnishComplejo}</p>}</CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Storytelling</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.storytelling}</p>}</CardContent>
                        </Card>
                    </div>
                    <div className="flex gap-4">
                        <Button className="w-full" onClick={async () => {
                          if (!result) return;
                          try {
                            const dataToSave: Partial<Recipe> = {
                              preparacion: result.mejora || '',
                              garnish: result.garnishComplejo || '',
                              storytelling: result.storytelling || '',
                              ...(result.imageUrl && { imageUrl: result.imageUrl })
                            };
                        
                            if (selectedRecipe) {
                              const recipeDoc = doc(db, `users/${userId}/grimorio`, selectedRecipe.id);
                              await updateDoc(recipeDoc, dataToSave);
                              alert("Receta actualizada con éxito.");
                            } else {
                              onOpenRecipeModal({
                                nombre: 'Nueva Receta (Editar)',
                                ...dataToSave
                              });
                            }
                          } catch (e) {
                            console.error("Error guardando en Receta: ", e);
                            alert("Error al guardar en la receta.");
                          }
                        }}>Guardar en Recetas</Button>
                        <Button className="w-full" variant="outline" onClick={async () => {
                            if (!result) return;
                            try {
                              const taskText = `[CerebrIty] ${result.storytelling || result.mejora}`.substring(0, 500);
                              await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
                                content: taskText,
                                status: 'Ideas',
                                category: 'Ideas',
                                createdAt: serverTimestamp()
                              });
                              alert("Idea guardada en el Pizarrón.");
                            } catch (e) {
                              console.error("Error guardando en Pizarrón: ", e);
                              alert("Error al guardar en el Pizarrón.");
                            }
                          }}>Guardar en Pizarrón</Button>
                    </div>
                </>
            )}
        </div>
        {showHistory && (
            <CerebrityHistorySidebar
                db={db}
                userId={userId}
                onLoadHistory={(item) => {
                    setResult(item);
                    setShowHistory(false);
                }}
                onClose={() => setShowHistory(false)}
            />
        )}
    </div>
);

const TheLabTab: React.FC<{
    db: Firestore;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    labInputs: (Recipe | Ingredient)[];
    setLabInputs: (inputs: (Recipe | Ingredient)[]) => void;
    handleAnalyzeLab: () => void;
    labLoading: boolean;
    labError: string | null;
    labResult: { perfil: string; clasicos: string[]; moleculares: string[]; tecnica: string; perfilSabor: Record<string, number> } | null;
    handleSaveLabResultToPizarron: (title: string, content: string) => void;
    showLabHistory: boolean;
    setShowLabHistory: (show: boolean) => void;
    theLabHistoryPath: string;
}> = ({ db, allIngredients, allRecipes, labInputs, setLabInputs, handleAnalyzeLab, labLoading, labError, labResult, handleSaveLabResultToPizarron, showLabHistory, setShowLabHistory, theLabHistoryPath }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];
    const flavorProfileData = labResult?.perfilSabor ? Object.entries(labResult.perfilSabor).map(([name, value]) => ({ name, value: Number(value) || 0 })) : [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>The Lab: Análisis Molecular</CardTitle>
                        <CardDescription>Construya un "pool" de análisis con recetas e ingredientes.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setShowLabHistory(true)}>Ver Historial</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Combobox items={allIngredients} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir ingrediente..." />
                        <Combobox items={allRecipes} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir receta..." />
                    </div>
                    <div className="p-2 border rounded-md min-h-[60px] flex flex-wrap gap-2">
                        {labInputs.length === 0 ? <p className="text-sm text-muted-foreground p-2">Seleccione ingredientes y/o recetas a analizar.</p> :
                            labInputs.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                                    <span>{item.nombre}</span>
                                    <button onClick={() => setLabInputs(labInputs.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-foreground">
                                        <Icon svg={ICONS.x} className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                    <Button onClick={handleAnalyzeLab} disabled={labLoading} className="w-full">
                        {labLoading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.flask} className="mr-2 h-5 w-5" />}
                        Analizar Combinación
                    </Button>
                </CardContent>
            </Card>

            {labLoading && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12"/></div>}
            {labError && <Alert variant="destructive" title="Error de Análisis" description={labError} />}
            
            {labResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-3">
                        <CardHeader><CardTitle>Perfil de Sabor Molecular</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={flavorProfileData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label={p => `${p.name} (${p.value})`}>
                                        {flavorProfileData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-3">
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Perfil Aromático Combinado</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Perfil Aromático', labResult.perfil)}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <p>{labResult.perfil}</p>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Emparejamientos Clásicos</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Clásicos', labResult.clasicos.join(', '))}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <ul className="list-disc list-inside space-y-1">{labResult.clasicos.map((item, index) => <li key={index}>{item}</li>)}</ul>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Emparejamientos Moleculares</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Moleculares', labResult.moleculares.join(', '))}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <ul className="list-disc list-inside space-y-1">{labResult.moleculares.map((item, index) => <li key={index}>{item}</li>)}</ul>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Técnica Sugerida</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Técnica Sugerida', labResult.tecnica)}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <p>{labResult.tecnica}</p>}</CardContent>
                    </Card>
                </div>
            )}
            {showLabHistory && <TheLabHistorySidebar db={db} historyPath={theLabHistoryPath} onClose={() => setShowLabHistory(false)} />}
        </div>
    );
}

const CerebrItyView: React.FC<{
    db: Firestore;
    userId: string;
    storage: FirebaseStorage;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    initialText: string | null;
    onAnalysisDone: () => void;
}> = ({ db, userId, storage, appId, allRecipes, allIngredients, onOpenRecipeModal, initialText, onAnalysisDone }) => {
    const [activeTab, setActiveTab] = React.useState<'creativity' | 'lab'>('creativity');

    // --- Cerebrity State ---
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [rawInput, setRawInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CerebrityResult | null>(null);
    const [showHistory, setShowHistory] = React.useState(false);
    
    // --- The Lab State ---
    const [labInputs, setLabInputs] = React.useState<(Recipe | Ingredient)[]>([]);
    const [labLoading, setLabLoading] = React.useState(false);
    const [labError, setLabError] = React.useState<string | null>(null);
    const [labResult, setLabResult] = React.useState<{ perfil: string; clasicos: string[]; moleculares: string[]; tecnica: string; perfilSabor: Record<string, number> } | null>(null);
    const [showLabHistory, setShowLabHistory] = React.useState(false);
    const theLabHistoryPath = `users/${userId}/the-lab-history`;

    React.useEffect(() => {
        if (initialText) {
          setRawInput(initialText); // Pone el texto en el textarea
          setActiveTab('creativity'); // Asegura que la pestaña correcta esté activa
          onAnalysisDone(); // Limpia el trigger
        }
    }, [initialText, onAnalysisDone]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        if (!selectedRecipe && !rawInput.trim()) {
            setError("Por favor, seleccione una receta o introduzca ingredientes.");
            setLoading(false);
            return;
        }
        
        const promptBase = selectedRecipe
            ? `Receta: ${selectedRecipe.nombre}. Ingredientes: ${selectedRecipe.ingredientes?.map(i => i.nombre).join(', ')}`
            : `Ingredientes crudos: ${rawInput}`;
        
        let textResult: Omit<CerebrityResult, 'imageUrl' | 'createdAt'>;

        try {
            const response = await callGeminiApi(`Analiza la siguiente base y genera las mejoras: ${promptBase}`, "Eres un director creativo de mixología, nivel 3 estrellas Michelin. Tu objetivo es la innovación extrema. Responde únicamente con el objeto JSON solicitado.", {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mejora: { type: Type.STRING, description: "Una Técnica de alta cocina o elaboración compleja para el líquido." },
                        garnishComplejo: { type: Type.STRING, description: "Un garnish compuesto por 2 o más sub-garnishes, descrito en detalle." },
                        storytelling: { type: Type.STRING, description: "Breve storytelling con gancho emocional sobre el cóctel." },
                        promptImagen: { type: Type.STRING, description: "Un prompt detallado en inglés para un generador de imágenes hiperrealista basado en el garnish complejo." },
                    }
                }
            });
            
            const responseText = response.text;
            const cleanJsonString = responseText.replace(/^```json\s*/, '').replace(/```$/, '');
            const parsedResult = JSON.parse(cleanJsonString);
            textResult = {
                mejora: parsedResult.mejora,
                garnishComplejo: parsedResult.garnishComplejo,
                storytelling: parsedResult.storytelling,
                promptImagen: parsedResult.promptImagen,
            };
            setResult({ ...textResult, imageUrl: null });
        } catch (textError: any) {
            console.error("Error en API de Texto:", textError);
            setError("Error al generar texto. Revisa la API Key de Gemini y la entrada.");
            setLoading(false);
            return;
        }

        let downloadURL: string | null = null;
        try {
            setImageLoading(true);
            const imageResponse = await generateImage(textResult.promptImagen);
            const base64Data = imageResponse.predictions[0].bytesBase64Encoded;
            const storageRef = ref(storage, `users/${userId}/recipe-images/${Date.now()}.jpg`);
            await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
            downloadURL = await getDownloadURL(storageRef);
            setResult(prev => prev ? ({ ...prev, imageUrl: downloadURL }) : null);
        } catch (imageError: any) {
            console.error("Error en API de Imagen:", imageError);
            setError("Texto generado con éxito, pero la imagen falló. " + imageError.message);
        } finally {
            setImageLoading(false);
        }
        
        try {
            const historyItem = { ...textResult, imageUrl: downloadURL, createdAt: serverTimestamp() };
            await addDoc(collection(db, `users/${userId}/cerebrity-history`), historyItem);
        } catch (historyError) {
            console.error("Error guardando en historial:", historyError);
        }

        setLoading(false);
    };
    
    const handleAnalyzeLab = async () => {
        if (labInputs.length === 0) {
            setLabError('Por favor, añada ingredientes o recetas para analizar.');
            return;
        }
        setLabLoading(true);
        setLabError(null);
        setLabResult(null);

        const promptData = labInputs.map(item => item.nombre).join(', ');
        const systemPrompt = "Eres un científico de alimentos experto en Flavor Pairing. Analiza la sinergia molecular y el perfil de sabor de la siguiente combinación. Tu respuesta debe ser estrictamente un objeto JSON válido.";
        const userQuery = `Analiza la combinación: ${promptData}. Devuelve un JSON con: 'perfil', 'clasicos' (array), 'moleculares' (array), 'tecnica' (string), y 'perfilSabor' (un objeto JSON con claves 'dulce', 'acido', 'amargo', 'salado', 'umami', 'herbal', 'especiado' y valores numéricos de 0 a 10).`;
        
        try {
            const response = await callGeminiApi(userQuery, systemPrompt, {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        perfil: { type: Type.STRING },
                        clasicos: { type: Type.ARRAY, items: { type: Type.STRING } },
                        moleculares: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tecnica: { type: Type.STRING },
                        perfilSabor: {
                            type: Type.OBJECT,
                            properties: {
                                dulce: { type: Type.NUMBER }, acido: { type: Type.NUMBER }, amargo: { type: Type.NUMBER },
                                salado: { type: Type.NUMBER }, umami: { type: Type.NUMBER }, herbal: { type: Type.NUMBER },
                                especiado: { type: Type.NUMBER },
                            }
                        },
                    },
                }
            });
            const parsedResult = JSON.parse(response.text);
            setLabResult(parsedResult);
            await addDoc(collection(db, theLabHistoryPath), { combination: promptData, result: parsedResult, createdAt: serverTimestamp() });
        } catch (e: any) {
            setLabError('Error al analizar. Por favor, intente de nuevo. ' + (e.message || String(e)));
        } finally {
            setLabLoading(false);
        }
    };
    
    const handleSaveLabResultToPizarron = async (title: string, content: string) => {
        const combination = labInputs.map(i => i.nombre).join(', ');
        const taskContent = `[The Lab: ${combination}] ${title} - ${content}`.substring(0, 500);
        await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
            content: taskContent, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp()
        });
        alert("Idea guardada en el Pizarrón.");
    };

    return (
        <div className="p-6 lg:p-8 h-full overflow-y-auto">
             <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('creativity')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'creativity' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                    CerebrIty (Creativo)
                </button>
                 <button onClick={() => setActiveTab('lab')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'lab' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                    The Lab (Científico)
                </button>
            </div>
            {activeTab === 'creativity' ? (
                <CreativityTab
                    db={db}
                    userId={userId}
                    allRecipes={allRecipes}
                    selectedRecipe={selectedRecipe}
                    setSelectedRecipe={setSelectedRecipe}
                    rawInput={rawInput}
                    setRawInput={setRawInput}
                    handleGenerate={handleGenerate}
                    loading={loading}
                    imageLoading={imageLoading}
                    error={error}
                    result={result}
                    setResult={setResult}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    onOpenRecipeModal={onOpenRecipeModal}
                />
            ) : (
                <TheLabTab
                    db={db}
                    allIngredients={allIngredients}
                    allRecipes={allRecipes}
                    labInputs={labInputs}
                    setLabInputs={setLabInputs}
                    handleAnalyzeLab={handleAnalyzeLab}
                    labLoading={labLoading}
                    labError={labError}
                    labResult={labResult}
                    handleSaveLabResultToPizarron={handleSaveLabResultToPizarron}
                    showLabHistory={showLabHistory}
                    setShowLabHistory={setShowLabHistory}
                    theLabHistoryPath={theLabHistoryPath}
                />
            )}
        </div>
    );
};

const IngredientFormModal: React.FC<{isOpen: boolean, onClose: () => void, db: Firestore, userId: string, appId: string, editingIngredient: Ingredient | null}> = 
  ({ isOpen, onClose, db, userId, appId, editingIngredient }) => {

  const [formData, setFormData] = React.useState({
    nombre: '',
    categoria: 'General',
    precioCompra: 0,
    unidadCompra: 'Botella (700ml)',
    standardUnit: 'ml',
    standardQuantity: 700,
  });

  React.useEffect(() => {
    if (editingIngredient) {
      setFormData(editingIngredient as any);
    } else {
      // Resetear
      setFormData({
        nombre: '', categoria: 'General', precioCompra: 0, unidadCompra: 'Botella (700ml)', standardUnit: 'ml', standardQuantity: 700
      });
    }
  }, [editingIngredient, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    const precioCompra = parseFloat(String(formData.precioCompra)) || 0;
    const standardQuantity = parseFloat(String(formData.standardQuantity)) || 0;

    let standardPrice = 0;
    if (standardQuantity > 0 && precioCompra > 0) {
      standardPrice = precioCompra / standardQuantity;
    }

    const dataToSave = {
      ...formData,
      precioCompra,
      standardQuantity,
      standardPrice
    };

    if (editingIngredient) {
      await setDoc(doc(db, ingredientsColPath, editingIngredient.id), dataToSave);
    } else {
      await addDoc(collection(db, ingredientsColPath), dataToSave);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingIngredient ? "Editar Ingrediente" : "Añadir Ingrediente"}>
      <div className="space-y-4">
        <Label>Nombre</Label>
        <Input name="nombre" value={formData.nombre} onChange={handleChange} />
        <Label>Categoría</Label>
        <Input name="categoria" value={formData.categoria} onChange={handleChange} />
        <Label>Precio de Compra (€)</Label>
        <Input name="precioCompra" type="number" value={formData.precioCompra} onChange={handleChange} />
        <Label>Unidad de Compra (ej. Botella 700ml, Saco 1kg)</Label>
        <Input name="unidadCompra" value={formData.unidadCompra} onChange={handleChange} />
        <Label>Unidad Estándar</Label>
        <Select name="standardUnit" value={formData.standardUnit} onChange={handleChange}>
          <option value="ml">ml (Líquidos)</option>
          <option value="g">g (Sólidos)</option>
          <option value="und">und (Unidad)</option>
        </Select>
        <Label>Cantidad Estándar (en esa unidad)</Label>
        <Input name="standardQuantity" type="number" value={formData.standardQuantity} onChange={handleChange} />
        <Button onClick={handleSubmit} className="w-full">Guardar</Button>
      </div>
    </Modal>
  );
};

const RecipeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    db: Firestore;
    userId: string;
    initialData: Partial<Recipe> | null;
    allIngredients: Ingredient[];
}> = ({ isOpen, onClose, db, userId, initialData, allIngredients }) => {
    const [recipe, setRecipe] = React.useState<Partial<Recipe>>({});
    const [lineItems, setLineItems] = React.useState<IngredientLineItem[]>([]);

    React.useEffect(() => {
        setRecipe(initialData || {});
        setLineItems(initialData?.ingredientes || []);
    }, [initialData]);

    const handleRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRecipe(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const addLineItem = () => setLineItems(prev => [...prev, { ingredientId: null, nombre: '', cantidad: 0, unidad: 'ml' }]);
    
    const updateLineItem = (index: number, field: keyof IngredientLineItem, value: any) => {
        const items = [...lineItems];
        if (field === 'ingredientId') {
            const selected = allIngredients.find(i => i.id === value);
            items[index] = { ...items[index], ingredientId: value, nombre: selected?.nombre || '', unidad: selected?.standardUnit || 'ml' };
        } else {
            items[index] = { ...items[index], [field]: value };
        }
        setLineItems(items);
    };

    const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

    const calculateCost = React.useCallback(() => {
        return lineItems.reduce((total, item) => {
            const ingredient = allIngredients.find(i => i.id === item.ingredientId);
            if (!ingredient || !ingredient.standardPrice) return total;
            return total + (ingredient.standardPrice * item.cantidad);
        }, 0);
    }, [lineItems, allIngredients]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...recipe, ingredientes: lineItems, costoReceta: calculateCost() };
        if (dataToSave.id) {
            await updateDoc(doc(db, `users/${userId}/grimorio`, dataToSave.id), dataToSave);
        } else {
            await addDoc(collection(db, `users/${userId}/grimorio`), dataToSave);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={recipe.id ? "Editar Receta" : "Nueva Receta"} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="nombre" value={recipe.nombre || ''} onChange={handleRecipeChange} placeholder="Nombre de la Receta" required />
                <Input name="categorias" value={recipe.categorias?.join(', ') || ''} onChange={e => setRecipe(r => ({...r, categorias: e.target.value.split(',').map(c => c.trim())}))} placeholder="Categorías (separadas por coma)" />
                <Textarea name="preparacion" value={recipe.preparacion || ''} onChange={handleRecipeChange} placeholder="Preparación" />
                <Textarea name="garnish" value={recipe.garnish || ''} onChange={handleRecipeChange} placeholder="Garnish" />
                
                <div>
                    <h4 className="font-semibold mb-2">Ingredientes</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {lineItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <Select className="col-span-6" value={item.ingredientId || ''} onChange={e => updateLineItem(index, 'ingredientId', e.target.value)}>
                                    <option value="">Seleccionar ingrediente</option>
                                    {allIngredients.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                                </Select>
                                <Input className="col-span-2" type="number" step="0.1" value={item.cantidad} onChange={e => updateLineItem(index, 'cantidad', parseFloat(e.target.value))} placeholder="Cant." />
                                <Select className="col-span-3" value={item.unidad} onChange={e => updateLineItem(index, 'unidad', e.target.value)}>
                                    <option>ml</option><option>g</option><option>und</option>
                                </Select>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="col-span-1"><Icon svg={ICONS.trash} className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                     <Button type="button" size="sm" variant="outline" onClick={addLineItem} className="mt-2">Añadir Ingrediente</Button>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <p>Costo Total: <span className="font-bold">€{calculateCost().toFixed(2)}</span></p>
                    <Button type="submit">Guardar Receta</Button>
                </div>
            </form>
        </Modal>
    );
};

const RecipeCard: React.FC<{ recipe: Recipe; onEdit: () => void; onDragStart: (e: React.DragEvent, recipe: Recipe) => void; }> = ({ recipe, onEdit, onDragStart }) => (
    <Card 
      className="overflow-hidden cursor-grab"
      draggable="true"
      onDragStart={(e) => onDragStart(e, recipe)}
      onClick={onEdit}
    >
        <img src={recipe.imageUrl || 'https://placehold.co/600x400/27272a/FFF?text=Receta'} alt={recipe.nombre} className="h-32 w-full object-cover" />
        <CardHeader>
            <CardTitle>{recipe.nombre}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
                {recipe.categorias?.map(cat => (
                    <span key={cat} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{cat}</span>
                ))}
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between text-sm">
                <span>Costo:</span>
                <span className="font-bold">€{(recipe.costoReceta || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span>PVP:</span>
                <span className="font-bold">€{(recipe.precioVenta || 0).toFixed(2)}</span>
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full" onClick={onEdit}>Ver / Editar</Button>
        </CardFooter>
    </Card>
);


const GrimoriumView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    onDragRecipeStart: (recipe: Recipe) => void;
}> = ({ db, userId, appId, allIngredients, allRecipes, onOpenRecipeModal, onDragRecipeStart }) => {
    const [loading, setLoading] = React.useState(false);
    const [recipeSearch, setRecipeSearch] = React.useState("");
    const [ingredientSearch, setIngredientSearch] = React.useState("");
    const [showIngredientModal, setShowIngredientModal] = React.useState(false);
    const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [showCsvImportModal, setShowCsvImportModal] = React.useState(false);
    const [showTxtImportModal, setShowTxtImportModal] = React.useState(false);

    const ingredientsColPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

    const handleDeleteIngredient = async (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar este ingrediente?")) {
            await deleteDoc(doc(db, ingredientsColPath, id));
        }
    };

    const handleSelectIngredient = (id: string) => {
        setSelectedIngredients(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAllIngredients = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIngredients(allIngredients.map(i => i.id));
        } else {
            setSelectedIngredients([]);
        }
    };

    const handleDeleteSelectedIngredients = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar ${selectedIngredients.length} ingredientes?`)) {
            const batch = writeBatch(db);
            selectedIngredients.forEach(id => {
                batch.delete(doc(db, ingredientsColPath, id));
            });
            await batch.commit();
            setSelectedIngredients([]);
        }
    };

    const handleTxtImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;
        setLoading(true);
        const text = await file.text();
        const recipesText = text.split('---').filter(t => t.trim());
        
        const batch = writeBatch(db);
        recipesText.forEach(recipeText => {
            const newDocRef = doc(collection(db, `users/${userId}/grimorio`));
            const newRecipe = {
                nombre: parseSimpleBlock(recipeText, 'Nombre') || 'Sin Nombre',
                categorias: parseSimpleBlock(recipeText, 'Categorias')?.split(',').map(c => c.trim()) || [],
                ingredientesTexto: parseSimpleBlock(recipeText, 'Ingredientes'),
                preparacion: parseSimpleBlock(recipeText, 'Preparacion'),
                garnish: parseSimpleBlock(recipeText, 'Garnish'),
            };
            batch.set(newDocRef, newRecipe);
        });
        
        try {
            await batch.commit();
            alert(`${recipesText.length} recetas importadas.`);
        } catch (error) {
            console.error("Error importing TXT:", error);
            alert("Error al importar el archivo.");
        } finally {
            setLoading(false);
            setShowTxtImportModal(false);
            event.target.value = ''; 
        }
    };

    const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !db || !userId) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1); // Asumir cabecera
            const batch = writeBatch(db);
            let count = 0;
            let errors: string[] = [];

            for (const row of rows) {
                if (!row) continue;
                const cols = row.split(';');

                if (!cols[0]) continue;

                try {
                    const nombre = cols[0].replace(/\uFEFF/g, '').trim();
                    const categoria = cols[1]?.trim() || 'General';
                    
                    const cleanPrice = (str: string) => {
                        if (!str) return 0;
                        const precioLimpio = str.replace(/[^\d,.-]/g, '').replace(',', '.');
                        return parseFloat(precioLimpio) || 0;
                    };

                    const precioCompra = cleanPrice(cols[2]);
                    const unidadCompra = cols[3]?.trim() || 'und';
                    const standardUnit = cols[4]?.trim() || 'und';
                    const standardQuantity = cleanPrice(cols[5]);

                    let standardPrice = 0;
                    if (standardQuantity > 0 && precioCompra > 0) {
                        standardPrice = precioCompra / standardQuantity;
                    }

                    const newDocRef = doc(collection(db, ingredientsColPath));

                    batch.set(newDocRef, {
                        nombre: nombre,
                        categoria: categoria,
                        precioCompra,
                        unidadCompra: unidadCompra,
                        standardUnit: standardUnit,
                        standardQuantity,
                        standardPrice
                    });
                    count++;

                } catch (e: any) {
                    errors.push(cols[0]);
                }
            }

            try {
                await batch.commit();
                alert(`Importación CSV completada. ${count} ingredientes añadidos. Errores: ${errors.length}`);
            } catch (err) {
                console.error("Error en batch de CSV: ", err);
            } finally {
                setLoading(false);
                setShowCsvImportModal(false);
            }
        };
        reader.readAsText(file);
    };


    const filteredIngredients = React.useMemo(() => {
        return allIngredients.filter(ing => ing.nombre.toLowerCase().includes(ingredientSearch.toLowerCase()));
    }, [allIngredients, ingredientSearch]);

    const filteredRecipes = React.useMemo(() => {
        return allRecipes.filter(rec => rec.nombre.toLowerCase().includes(recipeSearch.toLowerCase()));
    }, [allRecipes, recipeSearch]);

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-8">
            <Card className="h-[40vh] flex flex-col min-h-[300px]">
                <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Ingredientes ({allIngredients.length})</CardTitle>
                      <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelectedIngredients}
                            disabled={selectedIngredients.length === 0}
                        >
                            Eliminar ({selectedIngredients.length})
                        </Button>
                        <Button size="sm" onClick={() => { setEditingIngredient(null); setShowIngredientModal(true); }}>Añadir</Button>
                        <Button onClick={() => setShowCsvImportModal(true)} variant="outline" size="sm">Importar CSV</Button>
                      </div>
                    </div>
                    <Input placeholder="Buscar ingrediente..." value={ingredientSearch} onChange={e => setIngredientSearch(e.target.value)} />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
                            <tr className="border-b">
                                <th className="p-2 w-10"><Input type="checkbox" onChange={handleSelectAllIngredients} /></th>
                                <th className="p-2 text-left font-semibold">Nombre</th>
                                <th className="p-2 text-left font-semibold">Categoría</th>
                                <th className="p-2 text-left font-semibold">Costo Estándar</th>
                                <th className="p-2 text-left font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIngredients.map(ing => (
                                <tr key={ing.id} className="border-b even:bg-secondary/50 hover:bg-primary/10 transition-colors duration-150">
                                    <td className="p-2">
                                        <Input
                                            type="checkbox"
                                            checked={selectedIngredients.includes(ing.id)}
                                            onChange={() => handleSelectIngredient(ing.id)}
                                        />
                                    </td>
                                    <td className="p-2">{ing.nombre}</td>
                                    <td className="p-2">{ing.categoria}</td>
                                    <td className="p-2">€{(ing.standardPrice || 0).toFixed(4)} / {ing.standardUnit}</td>
                                    <td className="p-2 flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingIngredient(ing); setShowIngredientModal(true); }}>
                                            <Icon svg={ICONS.edit} className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ing.id)}>
                                            <Icon svg={ICONS.trash} className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Card className="h-[60vh] flex flex-col min-h-[500px]">
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle>Recetas ({allRecipes.length})</CardTitle>
                        <div className="flex gap-2">
                           <Button size="sm" onClick={() => onOpenRecipeModal(null)}>Añadir</Button>
                           <Button onClick={() => setShowTxtImportModal(true)} variant="outline" size="sm">Importar TXT</Button>
                        </div>
                    </div>
                    <Input placeholder="Buscar receta..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onEdit={() => onOpenRecipeModal(recipe)} onDragStart={(e, rec) => onDragRecipeStart(rec)} />
                        ))}
                    </div>
                </CardContent>
            </Card>
            {showIngredientModal && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => setShowIngredientModal(false)}
                    db={db}
                    userId={userId}
                    appId={appId}
                    editingIngredient={editingIngredient}
                />
            )}
            <Modal isOpen={showCsvImportModal} onClose={() => setShowCsvImportModal(false)} title="Importar Ingredientes desde CSV">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">El archivo CSV debe tener las siguientes columnas separadas por punto y coma (;):</p>
                    <code className="block text-xs bg-secondary p-2 rounded-md">Nombre;Categoria;Precio;UnidadCompra;UnidadMedida;Cantidad</code>
                    <p className="text-sm">Ejemplo de precio: <code className="text-xs">0,54 €</code>. Ejemplo de cantidad: <code className="text-xs">700</code>.</p>
                    <Input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" id="csv-upload" />
                    <Button as="label" htmlFor="csv-upload" className="w-full">
                        <Icon svg={ICONS.upload} className="mr-2 h-4 w-4" />
                        Seleccionar archivo CSV
                    </Button>
                </div>
            </Modal>
            <Modal isOpen={showTxtImportModal} onClose={() => setShowTxtImportModal(false)} title="Importar Recetas desde TXT">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">El archivo TXT debe separar cada receta con tres guiones (<code className="text-xs">---</code>).</p>
                    <p className="text-sm">Cada campo de la receta debe estar precedido por una etiqueta entre corchetes, por ejemplo:</p>
                    <pre className="block text-xs bg-secondary p-2 rounded-md overflow-auto">
                        <code>
                            [Nombre] Old Fashioned<br/>
                            [Categorias] Clásico, Whisky<br/>
                            [Ingredientes]<br/>
                            - 60ml Bourbon<br/>
                            - 1 terrón de azúcar<br/>
                            [Preparacion]<br/>
                            1. Macerar el azúcar...
                        </code>
                    </pre>
                    <Input type="file" accept=".txt" onChange={handleTxtImport} className="hidden" id="txt-upload" />
                    <Button as="label" htmlFor="txt-upload" className="w-full">
                        <Icon svg={ICONS.upload} className="mr-2 h-4 w-4" />
                        Seleccionar archivo TXT
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const EscandalloHistoryCard: React.FC<{
    item: Escandallo;
    onLoadHistory: (item: Escandallo) => void;
    db: Firestore;
    escandallosColPath: string;
}> = ({ item, onLoadHistory, db, escandallosColPath }) => {
    return (
        <Card onClick={() => onLoadHistory(item)} className="cursor-pointer hover:bg-accent p-2">
            <p className="font-semibold text-sm">{item.recipeName}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Costo: €{(item.costo || 0).toFixed(2)}</span>
                <span>PVP: €{(item.precioVenta || 0).toFixed(2)}</span>
            </div>
            <div className="text-xs">
                <span className="text-muted-foreground">Rentab: <span className="font-medium text-primary">{item.rentabilidad.toFixed(1)}%</span></span>
            </div>
        </Card>
    );
};

const EscandalloHistorySidebar: React.FC<{
    db: Firestore;
    escandallosColPath: string;
    onLoadHistory: (item: Escandallo) => void;
    onClose: () => void;
}> = ({ db, escandallosColPath, onLoadHistory, onClose }) => {
    const [history, setHistory] = React.useState<Escandallo[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        const historyCol = collection(db, escandallosColPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(50));
        
        const unsubscribe = onSnapshot(q, snapshot => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Escandallo));
            setHistory(historyData);
            setLoading(false);
        }, err => {
            console.error("Error fetching escandallo history:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, escandallosColPath]);

    return (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Historial de Escandallos</h3>
              <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading && <p className="p-4 text-center text-sm text-muted-foreground">Cargando...</p>}
                {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No hay historial.</p>}
                {history.map(item => (
                    <EscandalloHistoryCard key={item.id} item={item} onLoadHistory={onLoadHistory} db={db} escandallosColPath={escandallosColPath} />
                ))}
            </div>
          </div>
        </>
    );
};

const EscandallatorView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
}> = ({ db, userId, appId, allRecipes, allIngredients }) => {
    const [activeTab, setActiveTab] = React.useState<'escandallo' | 'batcher' | 'stock'>('escandallo');

    // Escandallo State
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [precioVenta, setPrecioVenta] = React.useState<number>(0);
    const [showHistory, setShowHistory] = React.useState(false);
    const escandallosColPath = `users/${userId}/escandallo-history`;

    // Batcher State
    const [batchSelectedRecipeId, setBatchSelectedRecipeId] = React.useState('');
    const [targetQuantityStr, setTargetQuantityStr] = React.useState('1');
    const [targetUnit, setTargetUnit] = React.useState<'Litros' | 'Botellas'>('Litros');
    const [includeDilution, setIncludeDilution] = React.useState(false);
    const [batchResult, setBatchResult] = React.useState<{ ingredient: string; originalQty: string; batchQty: string; }[] | null>(null);

    // Stock Manager State
    const [ventaQuantities, setVentaQuantities] = React.useState<Record<string, string>>({});
    const [shoppingList, setShoppingList] = React.useState<{ 'Ingrediente': string; 'Total (L/KG)': string; 'Unidades (Compra)': string; 'Botellas a Pedir': number }[] | null>(null);

    const EscandalloTab = () => {
        const handleSaveToHistory = async (reportData: any) => {
            const { baseImponible, ...dataToSave} = reportData;
            const newEscandallo = {
                recipeId: selectedRecipe!.id,
                recipeName: selectedRecipe!.nombre,
                ...dataToSave,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, escandallosColPath), newEscandallo);
            alert('Escandallo guardado en el historial.');
        };
        
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-grow space-y-1 min-w-[200px]">
                                <Label htmlFor="recipe-select-esc">Seleccionar Receta</Label>
                                <Select id="recipe-select-esc" value={selectedRecipe?.id || ''} onChange={e => {
                                    const recipe = allRecipes.find(r => r.id === e.target.value) || null;
                                    setSelectedRecipe(recipe);
                                    setPrecioVenta(recipe?.precioVenta || 0);
                                }}>
                                    <option value="">Seleccionar...</option>
                                    {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="pvp-input">Precio de Venta (PVP)</Label>
                                <Input id="pvp-input" type="number" placeholder="Ej: 12.50" value={precioVenta || ''} onChange={e => setPrecioVenta(parseFloat(e.target.value) || 0)} />
                            </div>
                            <Button variant="outline" onClick={() => setShowHistory(true)}>Ver Historial</Button>
                        </div>
                    </CardContent>
                </Card>

                {selectedRecipe && precioVenta > 0 ? (() => {
                    const IVA_RATE = 0.21;
                    const costo = selectedRecipe.costoReceta || 0;
                    const baseImponible = precioVenta > 0 ? precioVenta / (1 + IVA_RATE) : 0;
                    const ivaSoportado = precioVenta - baseImponible;
                    const margenBruto = baseImponible - costo;
                    const rentabilidad = baseImponible > 0 ? (margenBruto / baseImponible) * 100 : 0;
                    const reportData = { costo, precioVenta, baseImponible, ivaSoportado, margenBruto, rentabilidad };

                    const pieData = [{ name: 'Costo', value: reportData.costo }, { name: 'Margen', value: reportData.margenBruto }, { name: 'IVA', value: reportData.ivaSoportado }];
                    const COLORS = ['#ef4444', '#22c55e', '#64748b'];

                    return (
                        <div>
                            <div id="print-section">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <Card className="lg:col-span-1">
                                        <CardHeader><CardTitle>Resultados: {selectedRecipe.nombre}</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Costo</p><p className="font-semibold text-lg">€{reportData.costo.toFixed(2)}</p></div>
                                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Base Imponible</p><p className="font-semibold text-lg">€{reportData.baseImponible.toFixed(2)}</p></div>
                                            <div className="space-y-1"><p className="text-sm text-muted-foreground">Margen Bruto (€)</p><p className="font-semibold text-lg">€{reportData.margenBruto.toFixed(2)}</p></div>
                                            <div className="space-y-1"><p className="text-sm text-muted-foreground">IVA Soportado</p><p className="font-semibold text-lg">€{reportData.ivaSoportado.toFixed(2)}</p></div>
                                            <div className="space-y-1 col-span-2"><p className="text-sm text-muted-foreground">Rentabilidad (%)</p><p className="font-bold text-2xl text-primary">{reportData.rentabilidad.toFixed(2)}%</p></div>
                                        </CardContent>
                                    </Card>
                                    <Card className="lg:col-span-1">
                                        <CardHeader><CardTitle>Distribución del PVP</CardTitle></CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4 no-print">
                                <Button onClick={() => handleSaveToHistory(reportData)} className="w-full">Guardar en Historial</Button>
                                <Button variant="outline" onClick={() => window.print()} className="w-full">Exportar/Imprimir</Button>
                            </div>
                        </div>
                    );
                })() : (
                    <Card className="flex-1 flex items-center justify-center min-h-[300px]"><CardContent className="p-4 text-center text-muted-foreground"><p>Selecciona una receta e introduce un PVP.</p></CardContent></Card>
                )}
                {showHistory && <EscandalloHistorySidebar db={db} escandallosColPath={escandallosColPath} onLoadHistory={(item) => { setSelectedRecipe(allRecipes.find(r => r.id === item.recipeId) || null); setPrecioVenta(item.precioVenta); setShowHistory(false); }} onClose={() => setShowHistory(false)} />}
            </div>
        );
    };

    const BatcherTab = () => {
        const handleCalculateBatch = () => {
            const recipe = allRecipes.find(r => r.id === batchSelectedRecipeId);
            const targetQuantity = parseFloat(targetQuantityStr);

            if (!recipe || !recipe.ingredientes || !targetQuantity || targetQuantity <= 0) {
                setBatchResult(null);
                return;
            };

            const originalVolume = recipe.ingredientes.reduce((acc, ing) => { if (ing.unidad === 'ml' || ing.unidad === 'g') return acc + ing.cantidad; return acc; }, 0);
            if (originalVolume === 0) return;

            const BOTTLE_SIZE_ML = 700;
            const targetVolumeMl = targetUnit === 'Litros' ? targetQuantity * 1000 : targetQuantity * BOTTLE_SIZE_ML;
            const scalingFactor = targetVolumeMl / originalVolume;

            const newBatchData = recipe.ingredientes.map(ing => ({ ingredient: ing.nombre, originalQty: `${ing.cantidad} ${ing.unidad}`, batchQty: `${(ing.cantidad * scalingFactor).toFixed(1)} ml` }));

            if (includeDilution) {
                newBatchData.push({ ingredient: 'Agua (Dilución 20%)', originalQty: '-', batchQty: `${(targetVolumeMl * 0.20).toFixed(1)} ml` });
            }
            setBatchResult(newBatchData);
        };
        
        const handleSaveToPizarron = async () => {
            const recipeName = allRecipes.find(r => r.id === batchSelectedRecipeId)?.nombre;
            const taskContent = `[Batch] Producir ${targetQuantityStr} ${targetUnit} de ${recipeName}. Dilución: ${includeDilution ? 'Sí' : 'No'}`;
            await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
                content: taskContent, status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp()
            });
            alert("Tarea de batch guardada en el Pizarrón.");
        };

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Batcher: Producción Masiva</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1 space-y-1">
                                <Label htmlFor="batch-recipe">Receta</Label>
                                <Select id="batch-recipe" value={batchSelectedRecipeId} onChange={e => setBatchSelectedRecipeId(e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-grow space-y-1"><Label htmlFor="batch-qty">Cantidad</Label><Input id="batch-qty" type="number" value={targetQuantityStr} onChange={e => setTargetQuantityStr(e.target.value)} min="1" /></div>
                                <div className="space-y-1"><Label htmlFor="batch-unit">Unidad</Label><Select id="batch-unit" value={targetUnit} onChange={e => setTargetUnit(e.target.value as any)}><option>Litros</option><option>Botellas</option></Select></div>
                            </div>
                            <div className="flex items-center space-x-2 pt-4">
                                <Checkbox id="dilution" checked={includeDilution} onChange={e => setIncludeDilution(e.target.checked)} />
                                <Label htmlFor="dilution">Incluir Dilución (20%)</Label>
                            </div>
                        </div>
                         <Button onClick={handleCalculateBatch} disabled={!batchSelectedRecipeId} className="w-full"><Icon svg={ICONS.layers} className="mr-2 h-5 w-5" />Calcular Batch</Button>
                    </CardContent>
                </Card>
                {batchResult && (
                     <Card>
                        <div id="print-section">
                            <CardHeader>
                                <CardTitle>Hoja de Producción: {allRecipes.find(r => r.id === batchSelectedRecipeId)?.nombre}</CardTitle>
                                <CardDescription>Objetivo: {targetQuantityStr} {targetUnit}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full text-sm text-left"><thead className="text-xs uppercase bg-secondary"><tr><th className="px-6 py-3">Ingrediente</th><th className="px-6 py-3">Cant. Original</th><th className="px-6 py-3">Cant. Batch</th></tr></thead><tbody>{batchResult.map((row, index) => (<tr key={index} className="border-b"><td className="px-6 py-4 font-medium">{row.ingredient}</td><td className="px-6 py-4">{row.originalQty}</td><td className="px-6 py-4">{row.batchQty}</td></tr>))}</tbody></table>
                            </CardContent>
                        </div>
                        <CardFooter className="gap-2"><Button variant="outline" onClick={() => window.print()} className="no-print">Imprimir</Button><Button variant="secondary" onClick={handleSaveToPizarron} className="no-print">Guardar en Pizarrón</Button></CardFooter>
                     </Card>
                )}
            </div>
        );
    };

    const StockManagerTab = () => {
        const handleGenerate = () => {
            const totalIngredientNeeds: Record<string, number> = {}; 
            Object.entries(ventaQuantities).forEach(([recipeId, cocktailCountStr]) => {
                const cocktailCount = parseInt(cocktailCountStr);
                if (cocktailCount > 0) {
                    allRecipes.find(r => r.id === recipeId)?.ingredientes?.forEach(ing => {
                        if (ing.ingredientId) {
                            totalIngredientNeeds[ing.ingredientId] = (totalIngredientNeeds[ing.ingredientId] || 0) + (ing.cantidad * cocktailCount);
                        }
                    });
                }
            });
            
            const finalList = Object.entries(totalIngredientNeeds).map(([ingredientId, totalNeededMlG]) => {
                const ingredientInfo = allIngredients.find(ing => ing.id === ingredientId);
                if (!ingredientInfo) {
                    return { 'Ingrediente': `ID Desconocido: ${ingredientId}`, 'Total (L/KG)': `${(totalNeededMlG / 1000).toFixed(2)}`, 'Unidades (Compra)': 'N/A', 'Botellas a Pedir': 0 };
                }

                const unit = ingredientInfo.standardUnit || (ingredientInfo.unidadCompra.toLowerCase().includes('kg') ? 'g' : 'ml');
                const standardQty = ingredientInfo.standardQuantity > 0 ? ingredientInfo.standardQuantity : (unit === 'ml' ? 700 : 1000);
                
                const bottlesToOrder = Math.ceil(totalNeededMlG / standardQty);
                const unitLabel = `${bottlesToOrder} x (${standardQty}${unit})`;
                
                return {
                    'Ingrediente': ingredientInfo.nombre,
                    'Total (L/KG)': (totalNeededMlG / 1000).toFixed(2),
                    'Unidades (Compra)': unitLabel,
                    'Botellas a Pedir': bottlesToOrder,
                };
            });
            setShoppingList(finalList);
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-fit">
                    <CardHeader><CardTitle>Paso 1: Proyección de Ventas</CardTitle></CardHeader>
                    <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {allRecipes.map(recipe => (
                             <div key={recipe.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-secondary">
                                <Label htmlFor={`recipe-${recipe.id}`}>{recipe.nombre}</Label>
                                <Input 
                                    id={`recipe-${recipe.id}`}
                                    type="number"
                                    className="w-24"
                                    placeholder="Nº Cócteles"
                                    value={ventaQuantities[recipe.id] || ''}
                                    onChange={e => setVentaQuantities(prev => ({...prev, [recipe.id]: e.target.value}))}
                                />
                            </div>
                        ))}
                    </CardContent>
                     <CardFooter><Button onClick={handleGenerate} className="w-full"><Icon svg={ICONS.box} className="mr-2 h-5 w-5" />Generar Pedido</Button></CardFooter>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Paso 2: Lista de Compra</CardTitle> <Button variant="outline" size="sm" onClick={() => shoppingList && exportToCSV(shoppingList, 'lista_compra')}>Exportar CSV</Button></CardHeader>
                    <CardContent>
                        {!shoppingList ? <p className="text-muted-foreground">La lista de compra aparecerá aquí.</p> :
                        (<table className="w-full text-sm text-left"><thead className="text-xs uppercase bg-secondary"><tr><th className="px-6 py-3">Ingrediente</th><th className="px-6 py-3">Total (L/KG)</th><th className="px-6 py-3">Unidades (Compra)</th><th className="px-6 py-3">Botellas</th></tr></thead><tbody>{shoppingList.map((item, index) => (<tr key={index} className="border-b"><td className="px-6 py-4 font-medium">{item['Ingrediente']}</td><td className="px-6 py-4">{item['Total (L/KG)']}</td><td className="px-6 py-4">{item['Unidades (Compra)']}</td><td className="px-6 py-4 font-bold text-lg text-primary">{item['Botellas a Pedir']}</td></tr>))}</tbody></table>)}
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col">
            <div className="flex border-b mb-6 flex-shrink-0">
                <button onClick={() => setActiveTab('escandallo')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'escandallo' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Escandallo</button>
                <button onClick={() => setActiveTab('batcher')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'batcher' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Batcher</button>
                <button onClick={() => setActiveTab('stock')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'stock' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Gestor de Stock</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'escandallo' && <EscandalloTab />}
                {activeTab === 'batcher' && <BatcherTab />}
                {activeTab === 'stock' && <StockManagerTab />}
            </div>
        </div>
    );
};

// --- TREND LOCATOR VIEW ---
const TREND_SOURCES = ["Coctelería General", "Inspirado en 50 Best Bars", "Revistas (Diffords/Punch)", "Competiciones (World Class)"];
const TREND_TOPICS = ["Garnish Game", "Tecnicas de Alta Cocina", "Infusiones y Maceraciones", "Elaboraciones Complejas", "Ingredientes"];

const TrendResultCard: React.FC<{
    item: TrendResult;
    db: Firestore;
    userId: string;
    trendHistoryPath: string;
}> = ({ item, db, userId, trendHistoryPath }) => {

    const handleSaveToPizarron = async () => {
        if(!db || !userId) return;
        const taskText = `[Trend] ${item.titulo}: ${item.resumen}`.substring(0, 500);
        await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
            content: taskText, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp()
        });
        alert("Idea guardada en el Pizarrón.");
    };

    const handleSaveToHistory = async () => {
        if(!db || !userId) return;
        await addDoc(collection(db, trendHistoryPath), { ...item, createdAt: serverTimestamp() });
        alert("Tendencia guardada en el historial.");
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{item.titulo}</CardTitle>
                <CardDescription>Fuente: {item.fuente}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{item.resumen}</p>
            </CardContent>
            <CardFooter className="gap-4">
                <Button size="sm" onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
                <Button size="sm" variant="outline" onClick={handleSaveToHistory}>Guardar en Historial</Button>
            </CardFooter>
        </Card>
    );
};

const TrendHistorySidebar: React.FC<{
    db: Firestore;
    trendHistoryPath: string;
    onClose: () => void;
}> = ({ db, trendHistoryPath, onClose }) => {
    const [history, setHistory] = React.useState<TrendResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, trendHistoryPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrendResult)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, trendHistoryPath]);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-96 bg-card p-4 z-50 flex flex-col border-l">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Historial de Tendencias</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && <p>Cargando historial...</p>}
                    {!loading && history.length === 0 && <p>No hay historial.</p>}
                    {history.map(item => (
                        <Card key={item.id}>
                           <CardContent className="p-3">
                                <p className="font-semibold text-sm">{item.titulo}</p>
                                <p className="text-xs text-muted-foreground">{item.fuente}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

const TrendLocatorView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
}> = ({ db, userId, appId }) => {
    const [sourceFilter, setSourceFilter] = React.useState("Inspirado en 50 Best Bars");
    const [topicFilter, setTopicFilter] = React.useState("Tecnicas de Alta Cocina");
    const [keyword, setKeyword] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [trendResults, setTrendResults] = React.useState<TrendResult[]>([]);
    const [trendSources, setTrendSources] = React.useState<any[]>([]);
    const [showHistory, setShowHistory] = React.useState(false);

    const trendHistoryPath = `users/${userId}/trend-locator-history`;

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setTrendResults([]);
        setTrendSources([]);
        
        const systemPrompt = "Eres un analista de tendencias de coctelería de élite. Tu respuesta debe ser únicamente un array JSON válido, sin texto adicional, markdown o explicaciones.";
        const userQuery = `Busca tendencias sobre ${topicFilter} y ${keyword} inspiradas en ${sourceFilter}. Devuelve un array JSON de 3 a 5 tendencias clave. Cada objeto debe tener 'titulo', 'resumen' (un snippet de 2-3 líneas) y 'fuente' (el título del sitio web). Devuelve NADA MÁS que el array JSON. No incluyas '\`\`\`json' o cualquier otro texto introductorio.`;
        
        try {
            const response = await callGeminiApiWithSearch(userQuery, systemPrompt);
            setTrendSources(response.sources);
            
            let jsonText = '';
            const jsonMatch = response.text.match(/\[\s*\{[\s\S]*\}\s*\]/);

            if (jsonMatch && jsonMatch[0]) {
              jsonText = jsonMatch[0];
            } else {
              const objectMatch = response.text.match(/\{\s*"titulo"[\s\S]*\}/);
              if (objectMatch && objectMatch[0]) {
                jsonText = `[${objectMatch[0]}]`;
              } else {
                throw new Error("La respuesta de la API no contenía un JSON de tendencias válido.");
              }
            }
            
            const results = JSON.parse(jsonText);
            setTrendResults(results);
        } catch (e: any) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError(String(e));
            }
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="source-filter">Fuente</Label>
                            <Select id="source-filter" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                {TREND_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                         <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="topic-filter">Tema</Label>
                            <Select id="topic-filter" value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
                                {TREND_TOPICS.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="keyword">Palabra Clave</Label>
                            <Input id="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Ej: Fermentación"/>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleSearch} disabled={loading} className="w-full">
                                {loading ? <Spinner className="w-4 h-4 mr-2"/> : <Icon svg={ICONS.search} className="w-4 h-4 mr-2"/>}
                                Buscar Trend
                             </Button>
                             <Button variant="outline" onClick={() => setShowHistory(true)}>Historial</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Búsqueda" description={error} />}
                {trendResults && trendResults.length > 0 && (
                    <div className="space-y-4">
                        {trendResults.map((item, index) => <TrendResultCard key={index} item={item} db={db} userId={userId} trendHistoryPath={trendHistoryPath} />)}
                        {trendSources && trendSources.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Fuentes de Información</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {trendSources.map((source, index) => (
                                            <li key={index}>
                                                <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    {source.web?.title || source.web?.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
                 {!loading && trendResults.length === 0 && (
                    <Card className="flex items-center justify-center min-h-[200px]"><p>Los resultados de la búsqueda aparecerán aquí.</p></Card>
                )}
            </div>
             {showHistory && <TrendHistorySidebar db={db} trendHistoryPath={trendHistoryPath} onClose={() => setShowHistory(false)}/>}
        </div>
    );
};

// --- ZERO WASTE VIEW ---
const ZeroWasteView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe>) => void;
}> = ({ db, userId, appId, allIngredients, onOpenRecipeModal }) => {
    const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>([]);
    const [rawIngredients, setRawIngredients] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [recipeResults, setRecipeResults] = React.useState<ZeroWasteResult[]>([]);

    const handleIngredientToggle = (ingredientName: string) => {
        setSelectedIngredients(prev =>
            prev.includes(ingredientName)
                ? prev.filter(name => name !== ingredientName)
                : [...prev, ingredientName]
        );
    };

    const handleGenerateRecipes = async () => {
        setLoading(true);
        setError(null);
        setRecipeResults([]);

        const promptIngredients = [...selectedIngredients, rawIngredients].filter(Boolean).join(', ');
        if (!promptIngredients) {
            setError("Por favor, seleccione o introduzca al menos un ingrediente.");
            setLoading(false);
            return;
        }

        const systemPrompt = "Eres un chef de I+D 'zero waste' de élite. NO eres un bartender. Tu foco es crear *elaboraciones complejas* (cordiales, siropes, polvos, aceites, shrubs) a partir de desperdicios, para que *luego* un bartender las use. NO generes un cóctel completo. Tu respuesta debe ser estrictamente un array JSON.";
        const userQuery = `Usando estos ingredientes: ${promptIngredients}. Genera de 3 a 5 elaboraciones 'zero waste'. Devuelve un array JSON. Cada objeto debe tener: 'nombre' (string), 'ingredientes' (string con markdown para una lista de viñetas), 'preparacion' (string con markdown para una lista numerada).`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nombre: { type: Type.STRING },
                        ingredientes: { type: Type.STRING },
                        preparacion: { type: Type.STRING },
                    },
                },
            },
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            setRecipeResults(JSON.parse(response.text));
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    const ZeroWasteResultCard: React.FC<{
        recipe: ZeroWasteResult;
        db: Firestore;
        userId: string;
        appId: string;
    }> = ({ recipe, db, userId, appId }) => {

        const handleSaveToPizarron = async () => {
            const taskContent = `[Zero Waste] Desarrollar: ${recipe.nombre}`.substring(0, 500);
            await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
                content: taskContent,
                status: 'Ideas',
                category: 'Desarrollo',
                createdAt: serverTimestamp(),
            });
            alert("Elaboración guardada en el Pizarrón.");
        };

        const handleAddToCritic = () => {
            const criticText = `## Elaboración Zero Waste: ${recipe.nombre}\n\n**Ingredientes:**\n${recipe.ingredientes}\n\n**Preparación:**\n${recipe.preparacion}`;
            localStorage.setItem('criticText', criticText);
            alert("¡Enviado a 'El Crítico'! Ve a la pestaña 'MakeMenu' para analizarlo.");
        };
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{recipe.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Ingredientes</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.ingredientes.replace(/\n/g, '<br/>') }} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm mb-1">Preparación</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: recipe.preparacion.replace(/\n/g, '<br/>') }} />
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button size="sm" onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
                    <Button size="sm" variant="secondary" onClick={handleAddToCritic}>Añadir a El Crítico</Button>
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Ingredientes del Grimorium</Label>
                            <div className="border rounded-md p-2 h-32 overflow-y-auto space-y-1 text-sm">
                                {allIngredients.map(ing => (
                                    <div key={ing.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`zw-${ing.id}`}
                                            checked={selectedIngredients.includes(ing.nombre)}
                                            onChange={() => handleIngredientToggle(ing.nombre)}
                                        />
                                        <Label htmlFor={`zw-${ing.id}`} className="font-normal">{ing.nombre}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="raw-ingredients">Otros Ingredientes (sobras, etc.)</Label>
                            <Textarea
                                id="raw-ingredients"
                                value={rawIngredients}
                                onChange={e => setRawIngredients(e.target.value)}
                                placeholder="Ej: Pieles de cítricos, restos de sirope, pulpa de fruta..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <Button onClick={handleGenerateRecipes} disabled={loading} className="mt-4 w-full">
                         {loading ? <Spinner className="w-4 h-4 mr-2"/> : <Icon svg={ICONS.recycle} className="w-4 h-4 mr-2"/>}
                        Generar Elaboraciones
                    </Button>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Generación" description={error} />}
                {recipeResults && recipeResults.length > 0 && (
                    <div className="space-y-4">
                        {recipeResults.map((recipe, index) => (
                            <ZeroWasteResultCard
                                key={index}
                                recipe={recipe}
                                db={db}
                                userId={userId}
                                appId={appId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAKEMENU VIEW ---
const MenuResultCard: React.FC<{
    item: MenuLayout;
    db: Firestore;
    userId: string;
}> = ({ item, db, userId }) => {
    const handleSaveToPizarron = async () => {
        const taskContent = `[Diseño Menú] Adaptar el concepto '${item.themeName}'. Descripción: ${item.description}`.substring(0, 500);
        await addDoc(collection(db, `users/${userId}/pizarron-tasks`), {
            content: taskContent,
            status: 'ideas',
            category: 'Marketing',
            createdAt: serverTimestamp()
        });
        alert("Concepto de menú guardado en Pizarrón.");
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>{item.themeName}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto border-t border-b p-4 bg-secondary/30">
                <style>{item.suggestedTypography}</style>
                <div 
                    className="prose dark:prose-invert max-w-none" 
                    dangerouslySetInnerHTML={{ __html: item.htmlContent }} 
                />
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveToPizarron}>Guardar en Pizarrón</Button>
            </CardFooter>
        </Card>
    );
};

type CriticResult = {
    puntosFuertes: string[],
    debilidades: string[],
    oportunidades: string[],
    feedback: string,
    createdAt?: any,
    id?: string,
};

const CriticHistorySidebar: React.FC<{
    db: Firestore;
    historyPath: string;
    onClose: () => void;
}> = ({ db, historyPath, onClose }) => {
    const [history, setHistory] = React.useState<CriticResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, historyPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CriticResult)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, historyPath]);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-96 bg-card p-4 z-50 flex flex-col border-l">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Historial de Críticas</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && <p>Cargando historial...</p>}
                    {!loading && history.length === 0 && <p>No hay historial.</p>}
                    {history.map(item => (
                        <Card key={item.id}>
                           <CardContent className="p-3">
                                <p className="font-semibold text-sm">Análisis del {item.createdAt?.toDate().toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.feedback}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

const MakeMenuView: React.FC<{
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}> = ({ db, userId, appId, allRecipes, allPizarronTasks }) => {
    const [activeTab, setActiveTab] = React.useState<'designer' | 'critic'>('designer');
    
    // --- Designer State ---
    const [selectedRecipeIds, setSelectedRecipeIds] = React.useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [menuResults, setMenuResults] = React.useState<MenuLayout[]>([]);
    const [activeDesignerTab, setActiveDesignerTab] = React.useState(0);

    // --- El Crítico State ---
    const [criticMenuText, setCriticMenuText] = React.useState('');
    const [criticMenuImage, setCriticMenuImage] = React.useState<File | null>(null);
    const [criticLoading, setCriticLoading] = React.useState(false);
    const [criticError, setCriticError] = React.useState<string | null>(null);
    const [criticResult, setCriticResult] = React.useState<CriticResult | null>(null);
    const [showCriticHistory, setShowCriticHistory] = React.useState(false);
    const criticHistoryPath = `users/${userId}/critic-history`;

    const pizarronAprobado = React.useMemo(() => allPizarronTasks.filter(task => task.status === 'aprobado'), [allPizarronTasks]);
    const makeMenuHistoryPath = `users/${userId}/makemenu-history`;

    const handleSelection = (id: string, type: 'recipe' | 'task') => {
        const updater = type === 'recipe' ? setSelectedRecipeIds : setSelectedTaskIds;
        updater(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGenerateMenus = async () => {
        setLoading(true);
        setError(null);
        setMenuResults([]);

        const selectedRecipes = allRecipes.filter(r => selectedRecipeIds.includes(r.id)).map(r => r.nombre);
        const selectedTasks = pizarronAprobado.filter(t => selectedTaskIds.includes(t.id)).map(t => t.texto);
        const promptData = `Recetas: ${selectedRecipes.join(', ')}. Ideas Aprobadas: ${selectedTasks.join('. ')}`;

        const systemPrompt = "Eres un diseñador gráfico de élite y director de arte para bares de lujo. Tu trabajo es generar 3 opciones *completamente distintas* en concepto, tipografía y estructura. Tu respuesta debe ser estrictamente un array JSON válido, sin ningún texto adicional o markdown.";
        const userQuery = `Usando estas recetas e ideas: ${promptData}. Genera 3 maquetas de menú únicas...`;

        const generationConfig = { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { themeName: { type: Type.STRING }, description: { type: Type.STRING }, suggestedTypography: { type: Type.STRING }, htmlContent: { type: Type.STRING } } } } };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            const results: MenuLayout[] = JSON.parse(response.text);
            setMenuResults(results);
            setActiveDesignerTab(0);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    
    const handleInvokeCritic = async () => {
        if (!criticMenuText.trim() && !criticMenuImage) return;
        setCriticLoading(true);
        setCriticError(null);
        setCriticResult(null);

        const systemPrompt = "Eres un crítico de cócteles y consultor de marcas. Analiza el menú proporcionado. Devuelve un objeto JSON con un análisis DAFO: 'puntosFuertes', 'debilidades', 'oportunidades', y un 'feedback' estratégico.";
        
        const parts = [];
        if (criticMenuImage) {
            const base64Data = await blobToBase64(criticMenuImage);
            parts.push({ text: "Analiza la IMAGEN de este menú de cócteles. Si hay texto, analízalo. Si no, analiza el diseño, estilo y concepto." });
            parts.push({ inlineData: { mimeType: criticMenuImage.type, data: base64Data } });
        }
        if (criticMenuText.trim()) {
            parts.push({ text: `Analiza también (o en su lugar) este TEXTO de menú:\n\n${criticMenuText}` });
        }

        const userQueryPayload = { parts };
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    puntosFuertes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    debilidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    oportunidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    feedback: { type: Type.STRING },
                },
            }
        };

        try {
            const response = await callGeminiApi(userQueryPayload, systemPrompt, generationConfig);
            const parsedResult = JSON.parse(response.text);
            setCriticResult(parsedResult);
            await addDoc(collection(db, criticHistoryPath), { ...parsedResult, createdAt: serverTimestamp() });
        } catch(e: any) {
            setCriticError(e.message);
        } finally {
            setCriticLoading(false);
        }
    };

    const DesignerView = () => (
         <div className={`grid grid-cols-1 ${menuResults.length > 0 ? 'lg:grid-cols-2' : ''} gap-4`}>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Seleccionar Recetas</Label>
                            <div className="border rounded-md p-2 h-24 overflow-y-auto space-y-1 text-sm">{allRecipes.map(r => (<div key={r.id} className="flex items-center gap-2"><Checkbox id={`menu-r-${r.id}`} checked={selectedRecipeIds.includes(r.id)} onChange={() => handleSelection(r.id, 'recipe')} /><Label htmlFor={`menu-r-${r.id}`} className="font-normal">{r.nombre}</Label></div>))}</div>
                        </div>
                        <div className="space-y-2">
                            <Label>Seleccionar Ideas Aprobadas</Label>
                             <div className="border rounded-md p-2 h-24 overflow-y-auto space-y-1 text-sm">{pizarronAprobado.map(t => (<div key={t.id} className="flex items-center gap-2"><Checkbox id={`menu-t-${t.id}`} checked={selectedTaskIds.includes(t.id)} onChange={() => handleSelection(t.id, 'task')} /><Label htmlFor={`menu-t-${t.id}`} className="font-normal truncate">{t.texto}</Label></div>))}</div>
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleGenerateMenus} disabled={loading || (selectedRecipeIds.length + selectedTaskIds.length < 4)}>
                        {loading ? <Spinner className="mr-2"/> : <Icon svg={ICONS.menu} className="mr-2 w-4 h-4" />} Generar 3 Menús
                    </Button>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Generación" description={error} />}
                {menuResults && menuResults.length > 0 && (
                    <div className="flex flex-col h-full">
                        <div className="flex border-b">{menuResults.map((_, index) => (<button key={index} onClick={() => setActiveDesignerTab(index)} className={`py-2 px-4 text-sm font-medium ${activeDesignerTab === index ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Opción {index + 1}</button>))}</div>
                        <div className="flex-1 pt-4"><MenuResultCard item={menuResults[activeDesignerTab]} db={db} userId={userId} /></div>
                    </div>
                )}
            </div>
        </div>
    );

    const CriticView = () => {
        React.useEffect(() => {
          const textFromStorage = localStorage.getItem('criticText');
          if (textFromStorage) {
            setCriticMenuText(prev => prev ? `${prev}\n\n${textFromStorage}` : textFromStorage);
            localStorage.removeItem('criticText');
          }
        }, []);

        return (
            <div className={`grid grid-cols-1 ${criticResult ? 'lg:grid-cols-2' : ''} gap-4`}>
                <div>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>El Crítico</CardTitle><Button variant="outline" onClick={() => setShowCriticHistory(true)}>Historial</Button></CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea placeholder="Pega el contenido de tu menú aquí..." rows={10} value={criticMenuText} onChange={(e) => setCriticMenuText(e.target.value)} />
                            <div><Label>O sube una imagen del menú</Label><Input type="file" accept=".txt,.jpg,.png,.jpeg" onChange={(e) => setCriticMenuImage(e.target.files?.[0] || null)} /></div>
                            <Button className="w-full" onClick={handleInvokeCritic} disabled={criticLoading}>
                                {criticLoading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.critic} className="mr-2 h-4 w-4" />} Invocar al Crítico
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div>
                     {criticLoading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                     {criticError && <Alert variant="destructive" title="Error de Análisis" description={criticError} />}
                     {criticResult && (
                        <div className="space-y-4">
                            <Card className="border-l-4 border-green-500"><CardHeader><CardTitle>Puntos Fuertes</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.puntosFuertes.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                            <Card className="border-l-4 border-red-500"><CardHeader><CardTitle>Debilidades</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.debilidades.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                            <Card className="border-l-4 border-yellow-500"><CardHeader><CardTitle>Oportunidades</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.oportunidades.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                            <Card className="border-l-4 border-blue-500"><CardHeader><CardTitle>Feedback Estratégico</CardTitle></CardHeader><CardContent>{criticResult && <p className="text-sm">{criticResult.feedback}</p>}</CardContent></Card>
                        </div>
                     )}
                     {showCriticHistory && <CriticHistorySidebar db={db} historyPath={criticHistoryPath} onClose={() => setShowCriticHistory(false)} />}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
             <div className="flex border-b">
                <button onClick={() => setActiveTab('designer')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'designer' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Diseñador</button>
                <button onClick={() => setActiveTab('critic')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'critic' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>El Crítico</button>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
                {activeTab === 'designer' ? <DesignerView /> : <CriticView />}
            </div>
        </div>
    );
};

// --- COLEGIUM VIEW ---
const ProgressDashboard: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const lastScores = [
        { name: 'Partida 1', score: 8 },
        { name: 'Partida 2', score: 6 },
        { name: 'Partida 3', score: 9 },
        { name: 'Partida 4', score: 7 },
        { name: 'Partida 5', score: 10 },
    ];

    const improvementAreas = [
        { question: '¿Cuál es el garnish de un Negroni?', answer: 'Piel de naranja' },
        { question: '¿Qué significa "stir"?', answer: 'Remover con cucharilla' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Tu Progreso en Colegium</CardTitle>
                    <CardDescription>Revisa tus últimas partidas y áreas a mejorar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-4">Últimos 5 Puntajes</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={lastScores}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8884d8" name="Puntaje" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Áreas de Mejora</h3>
                        <div className="space-y-4">
                            {improvementAreas.map((item, index) => (
                                <div key={index} className="text-sm p-3 bg-secondary rounded-md">
                                    <p className="font-bold">{item.question}</p>
                                    <p className="text-primary">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={onStart}>Comenzar Nuevo Ejercicio</Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const GameModeSelector: React.FC<{ onSelectMode: (mode: string) => void }> = ({ onSelectMode }) => {
    const modes = [
        { name: 'Quiz Clásico', icon: <FaBook className="w-12 h-12 mx-auto mb-4" />, description: "Pon a prueba tu teoría." },
        { name: 'Speed Round', icon: <FaBolt className="w-12 h-12 mx-auto mb-4" />, description: "30 segundos. ¿Cuántas aciertas?" },
        { name: 'Cata a Ciegas', icon: <FaWineGlassAlt className="w-12 h-12 mx-auto mb-4" />, description: "Adivina el cóctel por su sabor." },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto text-center">
             <h2 className="text-2xl font-bold mb-2">Elige tu modo de juego</h2>
             <p className="text-muted-foreground mb-8">Selecciona una de las opciones para continuar.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {modes.map(mode => (
                    <Card key={mode.name} className="p-6 text-center cursor-pointer hover:shadow-lg hover:border-primary transition-all" onClick={() => onSelectMode(mode.name)}>
                        {mode.icon}
                        <h3 className="font-semibold text-lg">{mode.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{mode.description}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const ColegiumView: React.FC<{
    db: Firestore;
    userId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}> = ({ db, userId, allRecipes, allPizarronTasks }) => {
    const [quizPhase, setQuizPhase] = React.useState<'dashboard' | 'selection' | 'setup' | 'quiz' | 'result'>('dashboard');
    const [quizSettings, setQuizSettings] = React.useState({ topic: 'Quiz Clásico', difficulty: 'Fácil', numQuestions: 5 });
    const [quizData, setQuizData] = React.useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [answerFeedback, setAnswerFeedback] = React.useState<number | null>(null);
    const [timer, setTimer] = React.useState(30);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (quizPhase === 'quiz' && quizSettings.topic === 'Speed Round') {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setQuizPhase('result');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [quizPhase, quizSettings.topic]);

    const handleSaveResult = async () => {
        const resultData: Omit<ColegiumResult, 'id'> = {
            score,
            total: quizData.length,
            topic: quizSettings.topic,
            difficulty: quizSettings.difficulty,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, `users/${userId}/colegium-results`), resultData);
    };

    const handleStartQuiz = async () => {
        setLoading(true);
        setError(null);

        let dataContext = "";
        if (quizSettings.topic === 'Recetas') {
            dataContext = JSON.stringify(allRecipes.map(r => ({ nombre: r.nombre, categoria: r.categorias, ingredientes: r.ingredientes?.map(i => i.nombre) })));
        } else if (quizSettings.topic === 'Pizarrón') {
            dataContext = JSON.stringify(allPizarronTasks.map(t => ({ content: t.texto, category: t.category, status: t.status })));
        }

        const systemPrompt = "Eres un educador y maestro de coctelería de élite. Tu respuesta debe ser estrictamente un array JSON válido.";
        
        let userQuery = "";

        switch (quizSettings.topic) {
            case 'Speed Round':
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de dificultad ${quizSettings.difficulty}. Devuelve un array JSON de objetos. Cada objeto debe tener: 'question', 'type' ('multiple-choice' o 'true-false'), 'options' (array de 4 strings para 'multiple-choice', o 2 para 'true-false'), 'correctAnswerIndex' (número 0-3 o 0-1). Incluye al menos un 'true-false'.`;
                break;
            case 'Cata a Ciegas':
                userQuery = `Genera ${quizSettings.numQuestions} preguntas para una 'Cata a Ciegas'. Cada pregunta debe ser la descripción del sabor y aroma de un cóctel clásico, sin revelar su nombre. Las opciones deben ser nombres de cócteles. Formato: array JSON de objetos con 'question', 'options' (4 nombres de cócteles, uno correcto), y 'correctAnswerIndex'.`;
                break;
            case 'Verdadero o Falso':
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de tipo 'Verdadero o Falso' sobre coctelería, con dificultad ${quizSettings.difficulty}. Formato: array JSON de objetos con 'question', 'options' (siempre ['Verdadero', 'Falso']), y 'correctAnswerIndex' (0 para Verdadero, 1 para Falso).`;
                break;
            default: // Quiz Clásico
                userQuery = `Basado en este contexto: ${dataContext}. Genera un quiz de ${quizSettings.numQuestions} preguntas de dificultad ${quizSettings.difficulty}. Devuelve un array JSON de objetos. Cada objeto debe tener: 'question', 'type' ('multiple-choice' o 'true-false'), 'options' (array de 4 strings para 'multiple-choice', o 2 para 'true-false'), 'correctAnswerIndex' (número 0-3 o 0-1). Incluye al menos un 'true-false'.`;
                break;
        }

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswerIndex: { type: Type.INTEGER },
                        type: { type: Type.STRING }
                    },
                }
            }
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            setQuizData(JSON.parse(response.text));
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimer(30); // Reset timer
            setQuizPhase('quiz');
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (answerFeedback !== null) return;
        
        if (selectedIndex === quizData[currentQuestionIndex].correctAnswerIndex) {
            setScore(s => s + 1);
        }
        setAnswerFeedback(selectedIndex);

        setTimeout(() => {
            setAnswerFeedback(null);
            if (currentQuestionIndex < quizData.length - 1) {
                setCurrentQuestionIndex(i => i + 1);
            } else {
                setQuizPhase('result');
                handleSaveResult();
            }
        }, 1200);
    };
    
    const handleSelectMode = (mode: string) => {
        setQuizSettings(s => ({ ...s, topic: mode }));
        setQuizPhase('setup');
    };

    const QuizSetup = () => (
        <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Configurar Ejercicio: {quizSettings.topic}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <Label>Dificultad</Label>
                    <Select value={quizSettings.difficulty} onChange={e => setQuizSettings(s => ({...s, difficulty: e.target.value}))}>
                        <option>Fácil</option><option>Media</option><option>Difícil</option>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Nº Preguntas</Label>
                    <Select value={quizSettings.numQuestions} onChange={e => setQuizSettings(s => ({...s, numQuestions: parseInt(e.target.value)}))}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                    </Select>
                </div>
                <Button className="w-full" onClick={handleStartQuiz}>Iniciar Ejercicio</Button>
                <Button variant="outline" className="w-full" onClick={() => setQuizPhase('selection')}>Volver</Button>
            </CardContent>
        </Card>
    );

    const QuizInProgress = () => {
        const currentQ = quizData[currentQuestionIndex];
        if (!currentQ) return null;
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Pregunta {currentQuestionIndex + 1} / {quizData.length}</CardTitle>
                        {quizSettings.topic === 'Speed Round' && (
                            <div className="text-2xl font-bold text-primary">{timer}s</div>
                        )}
                    </div>
                    <CardDescription>{currentQ.question}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((option, index) => {
                        let variant: "default" | "secondary" | "destructive" = "secondary";
                        if (answerFeedback !== null) {
                           if(index === currentQ.correctAnswerIndex) variant = "default";
                           else if (index === answerFeedback) variant = "destructive";
                        }
                        return <Button key={index} variant={variant} className="h-auto py-3 justify-start text-left whitespace-normal" onClick={() => handleAnswer(index)}>{option}</Button>
                    })}
                </CardContent>
            </Card>
        );
    };

    const QuizResult = () => (
        <Card className="w-full max-w-md text-center">
            <CardHeader><CardTitle>¡Ejercicio Completo!</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg">Tu puntaje:</p>
                <p className="text-5xl font-bold text-primary">{score} / {quizData.length}</p>
                <Button className="w-full" onClick={() => setQuizPhase('dashboard')}>Volver al Dashboard</Button>
            </CardContent>
        </Card>
    );

    return (
         <div className="flex flex-col h-full p-4 lg:p-8 gap-4 items-center justify-center">
            {loading && <Spinner className="w-10 h-10"/>}
            {!loading && error && <Alert variant="destructive" title="Error" description={error} />}
            {!loading && !error && (
                <>
                    {quizPhase === 'dashboard' && <ProgressDashboard onStart={() => setQuizPhase('selection')} />}
                    {quizPhase === 'selection' && <GameModeSelector onSelectMode={handleSelectMode} />}
                    {quizPhase === 'setup' && <QuizSetup />}
                    {quizPhase === 'quiz' && quizData.length > 0 && <QuizInProgress />}
                    {quizPhase === 'result' && <QuizResult />}
                </>
            )}
        </div>
    );
};

// --- PERSONAL VIEW ---
const PersonalView: React.FC<{
    db: Firestore;
    userId: string;
    storage: FirebaseStorage;
    auth: Auth;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}> = ({ db, userId, storage, auth, allRecipes, allPizarronTasks }) => {
    const [profile, setProfile] = React.useState<Partial<UserProfile>>({});
    const [newAvatar, setNewAvatar] = React.useState<File | null>(null);
    const [newCover, setNewCover] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [quizHistory, setQuizHistory] = React.useState<ColegiumResult[]>([]);

    React.useEffect(() => {
        if (!userId) return;
        const profileDocRef = doc(db, `users/${userId}/profile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (doc) => {
            if (doc.exists()) {
                setProfile(doc.data());
            } else {
                setProfile({
                    displayName: auth.currentUser?.displayName || '',
                    photoURL: auth.currentUser?.photoURL || '',
                    jobTitle: '',
                    bio: '',
                    coverPhotoURL: '',
                    instagramHandle: '',
                });
            }
        });
        
        const resultsPath = `users/${userId}/colegium-results`;
        const q = query(collection(db, resultsPath), orderBy('createdAt', 'desc'), limit(10));
        const unsubQuiz = onSnapshot(q, (snap) => {
            setQuizHistory(snap.docs.map(d => d.data() as ColegiumResult));
        });

        return () => {
            unsubscribe();
            unsubQuiz();
        };
    }, [userId, db, auth]);

    const handleProfileSave = async () => {
        if (!userId) return;
        setLoading(true);

        let avatarURL = profile.photoURL || '';
        if (newAvatar) {
            const storageRef = ref(storage, `users/${userId}/profile-images/avatar.jpg`);
            await uploadBytes(storageRef, newAvatar);
            avatarURL = await getDownloadURL(storageRef);
        }

        let coverURL = profile.coverPhotoURL || '';
        if (newCover) {
            const storageRef = ref(storage, `users/${userId}/profile-images/cover.jpg`);
            await uploadBytes(storageRef, newCover);
            coverURL = await getDownloadURL(storageRef);
        }

        const profileDataToSave: UserProfile = {
            displayName: profile.displayName || auth.currentUser?.email || '',
            photoURL: avatarURL,
            jobTitle: profile.jobTitle || '',
            bio: profile.bio || '',
            coverPhotoURL: coverURL,
            instagramHandle: profile.instagramHandle || '',
        };

        try {
            await setDoc(doc(db, `users/${userId}/profile`, 'main'), profileDataToSave, { merge: true });
            setNewAvatar(null);
            setNewCover(null);
            alert("Perfil guardado con éxito.");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error al guardar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    const recipesCount = allRecipes.length;
    const avgQuizScore = quizHistory.length > 0 ? (quizHistory.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / quizHistory.length * 100) : 0;
    const ideasCount = allPizarronTasks.filter(task => task.assignees?.includes(userId)).length;

    const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
        <Card className="text-center p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </Card>
    );

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="relative h-40 bg-secondary rounded-t-xl">
                            <img
                                src={newCover ? URL.createObjectURL(newCover) : profile.coverPhotoURL || 'https://placehold.co/600x200/27272a/FFF?text=Cover'}
                                alt="Cover"
                                className="w-full h-full object-cover rounded-t-xl"
                            />
                            <Button as="label" htmlFor="cover-upload" size="sm" className="absolute top-2 right-2">
                                <Icon svg={ICONS.upload} className="h-4 w-4 mr-2" /> Subir
                            </Button>
                            <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={e => setNewCover(e.target.files?.[0] || null)} />
                        </div>
                        <div className="relative p-6 flex flex-col items-center text-center">
                            <div className="absolute -top-12">
                                <img
                                    src={newAvatar ? URL.createObjectURL(newAvatar) : profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName || 'A'}&background=random`}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-card"
                                />
                                <Button as="label" htmlFor="avatar-upload" size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8">
                                    <Icon svg={ICONS.edit} className="h-4 w-4" />
                                </Button>
                                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={e => setNewAvatar(e.target.files?.[0] || null)} />
                            </div>
                            <div className="mt-12 w-full space-y-2">
                                <Input
                                    placeholder="Tu Nombre"
                                    className="text-xl font-bold text-center border-none focus-visible:ring-0"
                                    value={profile.displayName || ''}
                                    onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                                />
                                <Input
                                    placeholder="Cargo (ej. Head Bartender)"
                                    className="text-center text-muted-foreground border-none focus-visible:ring-0"
                                    value={profile.jobTitle || ''}
                                    onChange={e => setProfile(p => ({ ...p, jobTitle: e.target.value }))}
                                />
                                <Textarea
                                    placeholder="Una bio corta sobre ti..."
                                    className="text-center text-sm min-h-[60px] border-none focus-visible:ring-0"
                                    value={profile.bio || ''}
                                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                />
                                <div className="relative">
                                    <Icon svg={ICONS.tag} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="usuario_instagram"
                                        className="pl-8"
                                        value={profile.instagramHandle || ''}
                                        onChange={e => setProfile(p => ({ ...p, instagramHandle: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Button onClick={handleProfileSave} disabled={loading} className="w-full">
                        {loading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.check} className="mr-2 h-4 w-4" />}
                        Guardar Perfil
                    </Button>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Estadísticas y Logros</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <StatCard title="Recetas en Grimorio" value={recipesCount} />
                            <StatCard title="Nivel Colegium" value={`${avgQuizScore.toFixed(0)}%`} />
                            <StatCard title="Ideas Aportadas" value={ideasCount} />
                            <StatCard title="Próximamente" value="N/A" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
// --- PIZARRON VIEW (Refactor 7.0+) ---
interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Firestore;
  appId: string;
  userId: string;
  auth: Auth;
  initialStatus: 'ideas' | 'pruebas' | 'aprobado';
  activeBoardId: string | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, db, appId, userId, auth, initialStatus, activeBoardId }) => {
  const [texto, setTexto] = React.useState('');
  const [category, setCategory] = React.useState<TaskCategory>('Ideas');
  const [priority, setPriority] = React.useState<'baja' | 'media' | 'alta'>('media');
  const [labels, setLabels] = React.useState('');

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;

  const handleAddTask = async () => {
    if (!texto.trim() || !activeBoardId) {
        alert("El texto es obligatorio y debe haber un tablero activo.");
        return;
    };
    
    const labelsArray = labels.split(',').map(l => l.trim()).filter(l => l);

    const newTask: Omit<PizarronTask, 'id'> = {
      texto: texto,
      status: initialStatus,
      category: category,
      createdAt: serverTimestamp(),
      boardId: activeBoardId,
      labels: labelsArray,
      priority: priority,
      upvotes: [],
      starRating: {},
      attachments: [],
      assignees: [auth.currentUser?.email || userId],
      dueDate: null
    };

    try {
      await addDoc(collection(db, pizarronColPath), newTask);
      onClose();
      setTexto('');
      setCategory('Ideas');
      setPriority('media');
      setLabels('');
    } catch (err) {
      console.error("Error al añadir tarea: ", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nueva Idea">
      <div className="space-y-4">
        <Textarea 
          placeholder="Escribe tu idea aquí..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="h-32"
        />
        <div className="grid grid-cols-2 gap-4">
            <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="Ideas">Ideas</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="Marketing">Marketing</option>
              <option value="Admin">Admin</option>
              <option value="Urgente">Urgente</option>
            </Select>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="baja">Baja Prioridad</option>
              <option value="media">Media Prioridad</option>
              <option value="alta">Alta Prioridad</option>
            </Select>
        </div>
        <div>
            <Label htmlFor="labels-input">Etiquetas (separadas por coma)</Label>
            <Input 
                id="labels-input"
                placeholder="Ej: innovación, verano, ginebra"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
            />
        </div>
        <Button onClick={handleAddTask} className="w-full">Guardar Tarea</Button>
      </div>
    </Modal>
  );
};


interface TaskDetailModalProps {
  task: PizarronTask;
  onClose: () => void;
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth;
  storage: FirebaseStorage;
  onAnalyze: (text: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, db, userId, appId, auth, storage, onAnalyze }) => {
  const [comments, setComments] = React.useState<PizarronComment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [loadingComments, setLoadingComments] = React.useState(true);
  const [newLabel, setNewLabel] = React.useState("");
  const [taskText, setTaskText] = React.useState(task.texto);

  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const taskDocRef = doc(db, pizarronColPath, task.id);

  React.useEffect(() => {
    const commentsPath = `${pizarronColPath}/${task.id}/comments`;
    const q = query(collection(db, commentsPath), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PizarronComment)));
      setLoadingComments(false);
    });
    return () => unsubscribe();
  }, [task.id, pizarronColPath, db]);

  const handleUpdate = async (field: string, value: any) => {
    try {
      await updateDoc(taskDocRef, { [field]: value });
    } catch (err) { console.error("Error actualizando: ", err); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
  
    const commentsPath = `${pizarronColPath}/${task.id}/comments`;
    const userName = auth.currentUser?.email || 'Usuario Anónimo';
  
    await addDoc(collection(db, commentsPath), {
      userId: userId,
      userName: userName,
      text: newComment,
      createdAt: serverTimestamp()
    });
  
    const notificationText = `${userName} comentó en: ${task.texto}`;
    const uniqueAssignees = [...new Set(task.assignees || [])];
  
    for (const assigneeId of uniqueAssignees) {
      if (assigneeId === userId) continue; 
  
      const notifPath = `artifacts/${appId}/users/${assigneeId}/notifications`;
      await addDoc(collection(db, notifPath), {
        text: notificationText,
        taskId: task.id,
        taskText: task.texto,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  
    setNewComment("");
  };

  const handleLabel = async (action: 'add' | 'remove', label: string) => {
    await updateDoc(taskDocRef, { labels: action === 'add' ? arrayUnion(label) : arrayRemove(label) });
    if (action === 'add') setNewLabel("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const storageRef = ref(storage, `${pizarronColPath}/${task.id}/attachments/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    const newAttachment = { name: file.name, url: downloadURL, type: file.type.startsWith('image') ? 'image' : 'pdf' };
    await updateDoc(taskDocRef, { attachments: arrayUnion(newAttachment) });
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} size="3xl">
       <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
            <Textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} onBlur={() => handleUpdate('texto', taskText)} className="text-lg font-semibold border-none p-0 focus-visible:ring-0 h-auto" />
            <div className="space-y-2">
                <h3 className="font-semibold">Comentarios</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {loadingComments ? <p>Cargando...</p> : comments.map(c => (
                        <div key={c.id} className="text-sm bg-secondary p-2 rounded-md">
                            <span className="font-semibold">{c.userName}</span>: {c.text}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Añadir comentario..."/>
                    <Button onClick={handlePostComment}>Enviar</Button>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold">Adjuntos</h3>
                <div className="flex flex-wrap gap-2">
                    {task.attachments.map((att, i) => <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm bg-secondary px-2 py-1 rounded-md">{att.name}</a>)}
                </div>
                <Input type="file" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="col-span-1 space-y-4">
            <div><Label>Estado</Label><Select value={task.status} onChange={(e) => handleUpdate('status', e.target.value)}><option value="ideas">Ideas</option><option value="pruebas">Pruebas</option><option value="aprobado">Aprobado</option></Select></div>
            <div><Label>Categoría</Label><Select value={task.category} onChange={(e) => handleUpdate('category', e.target.value)}><option value="Ideas">Ideas</option><option value="Desarrollo">Desarrollo</option><option value="Marketing">Marketing</option><option value="Admin">Admin</option><option value="Urgente">Urgente</option></Select></div>
            <div><Label>Prioridad</Label><Select value={task.priority} onChange={(e) => handleUpdate('priority', e.target.value)}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></Select></div>
            <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-1">
                    {task.labels.map(label => <div key={label} className="bg-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1">{label} <button onClick={() => handleLabel('remove', label)}>&times;</button></div>)}
                </div>
                <div className="flex gap-2"><Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nueva etiqueta..."/><Button onClick={() => handleLabel('add', newLabel)}>Añadir</Button></div>
            </div>
             <Button variant="outline" onClick={() => onAnalyze(taskText)}>
                <Icon svg={ICONS.brain} className="h-4 w-4 mr-2" />
                Analizar en CerebrIty
             </Button>
        </div>
       </div>
    </Modal>
  );
};


const KanbanColumn: React.FC<{
  title: string,
  status: 'ideas' | 'pruebas' | 'aprobado',
  tasks: PizarronTask[],
  onAddTask: (status: 'ideas' | 'pruebas' | 'aprobado') => void,
  onDragStart: (e: React.DragEvent, taskId: string) => void,
  onDropOnColumn: (status: 'ideas' | 'pruebas' | 'aprobado') => void,
  onOpenTaskDetail: (task: PizarronTask) => void,
}> = ({ title, status, tasks, onAddTask, onDragStart, onDropOnColumn, onOpenTaskDetail }) => {
  return (
    <div 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 flex flex-col w-80 flex-shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumn(status);
      }}
    >
      <h2 className="font-semibold text-center p-2">{title}</h2>
      <div className="flex-1 overflow-y-auto space-y-2 p-1">
        {tasks.map(task => <PizarronCard key={task.id} task={task} onDragStart={(e) => onDragStart(e, task.id)} onOpenDetail={() => onOpenTaskDetail(task)} />)}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onAddTask(status)}>
        <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Añadir Idea
      </Button>
    </div>
  );
};

interface PizarronCardProps {
  task: PizarronTask;
  onDragStart: (e: React.DragEvent) => void;
  onOpenDetail: () => void;
}

const PizarronCard: React.FC<PizarronCardProps> = ({ task, onDragStart, onOpenDetail }) => {
  const { icon: priorityIcon, color: priorityColor } = getPriorityIcon(task.priority);

  const averageRating = React.useMemo(() => {
    const ratings = Object.values(task.starRating || {});
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => Number(sum) + Number(rating), 0);
    return Number(total) / ratings.length;
  }, [task.starRating]);

  return (
    <Card 
      className={`p-3 cursor-pointer group relative mb-2 ${getCategoryColor(task.category)} border-l-4`}
      draggable="true"
      onDragStart={onDragStart}
      onClick={onOpenDetail}
    >
      {/* Task Text */}
      <p className="text-sm font-medium leading-snug mb-2">{task.texto}</p>

      {/* Labels */}
      <div className="flex flex-wrap gap-1">
        {task.labels?.slice(0, 3).map(label => (
          <span key={label} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{label}</span>
        ))}
      </div>

      {/* Footer Icons and Info */}
      <div className="flex justify-between items-center mt-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className={priorityColor}>
            <Icon svg={priorityIcon} className="h-4 w-4" />
          </span>
          {task.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Icon svg={ICONS.paperclip} className="h-4 w-4" />
              {task.attachments.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.upvotes?.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <Icon svg={ICONS.arrowUp} className="h-4 w-4" />
              {task.upvotes.length}
            </span>
          )}
          {averageRating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <Icon svg={ICONS.star} className="h-4 w-4" />
              {averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

const TopIdeasDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tasks: PizarronTask[];
  onTaskClick: (task: PizarronTask) => void;
}> = ({ isOpen, onClose, tasks, onTaskClick }) => {
  const topTasks = React.useMemo(() => {
    return [...tasks]
      .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
      .slice(0, 10);
  }, [tasks]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Contenido del Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Top Ideas (por Votos)</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon svg={ICONS.x} className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto space-y-2">
          {topTasks.map(task => (
            <div 
              key={task.id} 
              className="p-2 rounded-md bg-secondary shadow-sm cursor-pointer hover:bg-accent"
              onClick={() => { onTaskClick(task); onClose(); }}
            >
              <p className="text-sm font-medium truncate">{task.texto}</p>
              <span className="text-xs text-primary">{task.upvotes?.length || 0} Votos</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

interface DayCellProps {
    date: Date;
    tasks: PizarronTask[];
    onDropTask: (date: Date) => void;
    onTaskClick: (task: PizarronTask) => void;
}

const DayCell: React.FC<DayCellProps> = ({ date, tasks, onDropTask, onTaskClick }) => {
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        onDropTask(date);
    };

    return (
        <div 
            className="border dark:border-gray-700 p-1 min-h-[50px] overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <span className="text-xs font-semibold">{date.getDate()}</span>
            <div className="space-y-1 mt-1">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${getCategoryColor(task.category).replace('border-l-4', '').replace('border-', 'bg-')}`}
                        onClick={() => onTaskClick(task)}
                        title={task.texto}
                    >
                        {task.texto}
                    </div>
                ))}
            </div>
        </div>
    );
};


const CalendarView: React.FC<{
  tasks: PizarronTask[],
  onDropTask: (date: Date) => void,
  onTaskClick: (task: PizarronTask) => void,
}> = ({ tasks, onDropTask, onTaskClick }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const calendarGrid = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const grid = [];
    let day = 1;
    for (let i = 0; i < 6; i++) { // 6 semanas
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null);
        } else if (day > daysInMonth) {
          week.push(null);
        } else {
          week.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
          day++;
        }
      }
      grid.push(week);
      if (day > daysInMonth) break;
    }
    return grid;
  }, [currentDate]);

  return (
    <div className="bg-card p-2 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><Icon svg={ICONS.chevronLeft} /></Button>
            <h3 className="font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><Icon svg={ICONS.chevronRight} /></Button>
        </div>
        <div className="grid grid-cols-7 text-xs font-bold text-center border-l border-t border-r">
            {DAYS_OF_WEEK.map(day => <div key={day} className="p-1">{day}</div>)}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l">
            {calendarGrid.flat().map((date, index) => 
                date ? (
                    <DayCell 
                        key={index}
                        date={date}
                        tasks={tasks.filter(t => t.dueDate && isSameDay(t.dueDate.toDate(), date))}
                        onDropTask={onDropTask}
                        onTaskClick={onTaskClick}
                    />
                ) : <div key={index} className="border-t border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" />
            )}
        </div>
    </div>
  );
};

const PizarronView: React.FC<{
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth;
  storage: FirebaseStorage;
  allPizarronTasks: PizarronTask[];
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: Recipe | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
}> = ({ db, userId, appId, auth, storage, allPizarronTasks, taskToOpen, onTaskOpened, draggingRecipe, draggingTask, onDropEnd, onDragTaskStart, onAnalyze }) => {
  const [showAddTaskModal, setShowAddTaskModal] = React.useState(false);
  const [initialStatusForModal, setInitialStatusForModal] = React.useState<PizarronStatus>('ideas');
  const [selectedTask, setSelectedTask] = React.useState<PizarronTask | null>(null);

  const [boards, setBoards] = React.useState<PizarronBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);
  const [showAddBoard, setShowAddBoard] = React.useState(false);
  const [newBoardName, setNewBoardName] = React.useState("");

  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [showTopIdeasDrawer, setShowTopIdeasDrawer] = React.useState(false);
  
  const pizarronColPath = `artifacts/${appId}/public/data/pizarron-tasks`;
  const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;

  React.useEffect(() => {
    if (taskToOpen && allPizarronTasks.length > 0) {
      const task = allPizarronTasks.find(t => t.id === taskToOpen);
      if (task) {
        setSelectedTask(task);
      }
      onTaskOpened();
    }
  }, [taskToOpen, allPizarronTasks, onTaskOpened, setSelectedTask]);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, boardsColPath), (snap) => {
        const boardsData = snap.docs.map(d => ({...d.data(), id: d.id} as PizarronBoard));
        setBoards(boardsData);
        if (!activeBoardId && boardsData.length > 0) {
            setActiveBoardId(boardsData[0].id);
        }
    });
    return () => unsub();
  }, [db, boardsColPath, activeBoardId]);
  
  const handleAddBoard = async () => {
    if (!newBoardName.trim()) return;
    await addDoc(collection(db, boardsColPath), { name: newBoardName, filters: {} });
    setNewBoardName("");
    setShowAddBoard(false);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    onDragTaskStart(taskId);
  };

  const handleDropOnColumn = async (newStatus: 'ideas' | 'pruebas' | 'aprobado') => {
    if (draggingTask) {
        const taskDocRef = doc(db, pizarronColPath, draggingTask);
        await updateDoc(taskDocRef, { status: newStatus });
    } else if (draggingRecipe) {
        const newTask: Omit<PizarronTask, 'id'> = {
            texto: `TESTEO: ${draggingRecipe.nombre}`,
            status: newStatus,
            category: 'Desarrollo',
            createdAt: serverTimestamp(),
            boardId: activeBoardId || 'general',
            labels: ['Grimorio', ...(draggingRecipe.categorias || [])],
            priority: 'media',
            upvotes: [],
            starRating: {},
            attachments: draggingRecipe.imageUrl ? [{ name: 'Imagen de referencia', url: draggingRecipe.imageUrl, type: 'image' }] : [],
            assignees: [userId],
            dueDate: null,
        };
        await addDoc(collection(db, pizarronColPath), newTask);
    }
    onDropEnd();
  };
  
  const handleDropOnCalendar = async (date: Date) => {
      if (!draggingTask) return;
      const taskDocRef = doc(db, pizarronColPath, draggingTask);
      await updateDoc(taskDocRef, { dueDate: date });
      onDropEnd();
  };
  
  const filteredTasks = React.useMemo(() => {
      if (!activeBoardId) return [];
      const activeBoard = boards.find(b => b.id === activeBoardId);
      if (!activeBoard) return [];
      return allPizarronTasks.filter(task => task.boardId === activeBoardId);
  }, [allPizarronTasks, activeBoardId, boards]);

  if (!db || !userId || !auth || !storage) return <Spinner />;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-4 lg:px-8">
            <div className="flex items-center gap-2">
                {!isLeftPanelOpen && <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(true)}><Icon svg={ICONS.chevronRight} /></Button>}
                <h1 className="text-2xl font-semibold">Pizarrón Creativo</h1>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowTopIdeasDrawer(true)}>
                    <Icon svg={ICONS.trendingUp} className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="flex flex-1 min-h-0">
            <div className={`bg-background border-r overflow-y-auto flex-shrink-0 transition-all duration-300 ${isLeftPanelOpen ? 'w-64 p-4' : 'w-0 p-0 hidden'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Tableros</h2>
                  <Button size="icon" variant="ghost" onClick={() => setIsLeftPanelOpen(false)}><Icon svg={ICONS.chevronLeft} /></Button>
                </div>
                {boards.map(board => (
                    <Button key={board.id} variant={activeBoardId === board.id ? "secondary" : "ghost"} className="w-full justify-start mb-1" onClick={() => setActiveBoardId(board.id)}>{board.name}</Button>
                ))}
                {showAddBoard ? (
                    <div className="mt-2 space-y-2">
                        <Input value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="Nombre del tablero..." />
                        <div className="flex gap-2"><Button size="sm" onClick={handleAddBoard}>Crear</Button><Button size="sm" variant="ghost" onClick={() => setShowAddBoard(false)}>Cancelar</Button></div>
                    </div>
                ) : <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowAddBoard(true)}><Icon svg={ICONS.plus} className="h-4 w-4 mr-2"/>Nuevo Tablero</Button>}
            </div>

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex p-4 gap-4 overflow-x-auto">
                    {(['ideas', 'pruebas', 'aprobado'] as const).map(status => (
                        <KanbanColumn
                            key={status}
                            title={status.charAt(0).toUpperCase() + status.slice(1)}
                            status={status}
                            tasks={filteredTasks.filter(t => t.status === status)}
                            onAddTask={(s) => { setInitialStatusForModal(s); setShowAddTaskModal(true); }}
                            onDragStart={handleDragStart}
                            onDropOnColumn={handleDropOnColumn}
                            onOpenTaskDetail={setSelectedTask}
                        />
                    ))}
                </div>
                <div className="border-t">
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="w-full p-2 text-sm font-medium flex justify-center items-center gap-2 hover:bg-secondary">
                        <Icon svg={ICONS.calendar} className="h-5 w-5" /> Calendario <Icon svg={isCalendarOpen ? ICONS.chevronDown : ICONS.upArrow} className="h-4 w-4" />
                    </button>
                    {isCalendarOpen && (
                        <div className="h-96">
                            <CalendarView tasks={filteredTasks} onDropTask={handleDropOnCalendar} onTaskClick={setSelectedTask} />
                        </div>
                    )}
                </div>
            </main>
        </div>

        {showAddTaskModal && activeBoardId && <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} db={db} appId={appId} userId={userId} auth={auth} initialStatus={initialStatusForModal} activeBoardId={activeBoardId} />}
        {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} db={db} userId={userId} appId={appId} auth={auth} storage={storage} onAnalyze={onAnalyze} />}
        {showTopIdeasDrawer && <TopIdeasDrawer isOpen={showTopIdeasDrawer} onClose={() => setShowTopIdeasDrawer(false)} tasks={filteredTasks} onTaskClick={setSelectedTask} />}
    </div>
  );
};



// --- CONTENT VIEW ---
const ContentView: React.FC<{
  currentView: ViewName;
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  userId: string;
  appId: string;
  allRecipes: Recipe[];
  allIngredients: Ingredient[];
  allPizarronTasks: PizarronTask[];
  onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: Recipe | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
  initialText: string | null;
  onAnalysisDone: () => void;
  onDragRecipeStart: (recipe: Recipe) => void;
}> = (props) => {
  const { currentView, ...rest } = props;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} allIngredients={rest.allIngredients} auth={rest.auth} />;
      case 'grimorium':
        return <GrimoriumView 
            db={rest.db}
            userId={rest.userId}
            appId={rest.appId}
            allIngredients={rest.allIngredients}
            allRecipes={rest.allRecipes}
            onOpenRecipeModal={rest.onOpenRecipeModal}
            onDragRecipeStart={rest.onDragRecipeStart}
        />;
      case 'pizarron':
        return <PizarronView db={rest.db} userId={rest.userId} appId={rest.appId} auth={rest.auth} storage={rest.storage} allPizarronTasks={rest.allPizarronTasks} taskToOpen={rest.taskToOpen} onTaskOpened={rest.onTaskOpened} draggingRecipe={rest.draggingRecipe} draggingTask={rest.draggingTask} onDropEnd={rest.onDropEnd} onDragTaskStart={rest.onDragTaskStart} onAnalyze={rest.onAnalyze} />;
      case 'cerebrIty':
        return <CerebrItyView {...rest} initialText={rest.initialText} onAnalysisDone={rest.onAnalysisDone}/>;
      case 'escandallator':
        return <EscandallatorView {...rest} />;
      case 'trendLocator':
          return <TrendLocatorView db={rest.db} userId={rest.userId} appId={rest.appId} />;
      case 'zeroWaste':
          return <ZeroWasteView db={rest.db} userId={rest.userId} appId={rest.appId} allIngredients={rest.allIngredients} onOpenRecipeModal={rest.onOpenRecipeModal} />;
      case 'makeMenu':
          return <MakeMenuView db={rest.db} userId={rest.userId} appId={rest.appId} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks}/>;
      case 'colegium':
          return <ColegiumView db={rest.db} userId={rest.userId} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} />;
      case 'personal':
          return <PersonalView db={rest.db} userId={rest.userId} storage={rest.storage} auth={rest.auth} allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} />;
      default:
        return <PlaceholderView title={currentView} />;
    }
  };

  return <div className="flex-1 overflow-y-auto">{renderView()}</div>;
};

// --- SIDEBAR ---
const APP_ROUTES: { view: ViewName; label: string; icon: string }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: ICONS.grid },
    { view: 'grimorium', label: 'Grimorium', icon: ICONS.book },
    { view: 'pizarron', label: 'Pizarrón', icon: ICONS.layoutGrid },
    { view: 'cerebrIty', label: 'CerebrIty', icon: ICONS.brain },
    { view: 'escandallator', label: 'Escandallator', icon: ICONS.calculator },
    { view: 'trendLocator', label: 'Trend Locator', icon: ICONS.trending },
    { view: 'zeroWaste', label: 'Zero Waste Chef', icon: ICONS.recycle },
    { view: 'makeMenu', label: 'MakeMenu', icon: ICONS.menu },
    { view: 'colegium', label: 'Colegium', icon: ICONS.school },
];

const NavLink: React.FC<{
  view: ViewName;
  label: string;
  icon: string;
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  isCollapsed: boolean;
}> = ({ view, label, icon, currentView, setCurrentView, isCollapsed }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center p-2 rounded-lg transition-colors ${
        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon svg={icon} className="h-5 w-5" />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </button>
  );
};

const Sidebar: React.FC<{
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  onShowNotifications: () => void;
  unreadNotifications: boolean;
}> = ({ currentView, setCurrentView, onShowNotifications, unreadNotifications }) => {
  const { auth, userProfile } = useApp();
  const { theme, setTheme, isSidebarCollapsed, toggleSidebar } = useUI();
  
  if (!auth) return null;

  return (
    <aside className={`flex flex-col bg-card border-r transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isSidebarCollapsed && <h1 className="font-bold text-lg">Nexus Suite</h1>}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Icon svg={isSidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft} />
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {APP_ROUTES.map(route => (
          <NavLink key={route.view} {...route} currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isSidebarCollapsed} />
        ))}
      </nav>
      <div className="p-2 border-t">
        <NavLink view="personal" label={userProfile?.displayName || auth.currentUser?.email || "Mi Perfil"} icon={ICONS.user} currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isSidebarCollapsed} />
        <button
          onClick={onShowNotifications}
          className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full relative ${isSidebarCollapsed ? 'justify-center' : ''}`}
        >
          <Icon svg={ICONS.bell} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">Notificaciones</span>}
          {unreadNotifications && (
            <span className={`absolute ${isSidebarCollapsed ? 'top-2 right-2' : 'ml-auto'} w-2 h-2 bg-red-500 rounded-full`} />
          )}
        </button>
        <button onClick={() => setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')} className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
           <Icon svg={theme === 'dark' ? ICONS.sun : ICONS.moon} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>
        <button onClick={() => auth.signOut()} className={`flex items-center p-2 rounded-lg hover:bg-accent transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <Icon svg={ICONS.logOut} className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="ml-3">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

// --- CHATBOT WIDGET ---
type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [...messages, userMessage],
            });
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Lo siento, ha ocurrido un error." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-transform hover:scale-110"
                aria-label="Open chatbot"
            >
                <Icon svg={ICONS.chat} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[60vh] bg-card border rounded-lg shadow-xl flex flex-col z-50">
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Asistente Nexus</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-foreground">
                    <Icon svg={ICONS.x} className="h-4 w-4" />
                </Button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="max-w-[80%] p-3 rounded-lg bg-secondary flex items-center">
                            <Spinner className="w-4 h-4" />
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pregunta algo..."
                        disabled={loading}
                    />
                    <Button onClick={handleSend} disabled={loading}>Enviar</Button>
                </div>
            </footer>
        </div>
    );
};

const NotificationsDrawer: React.FC<{
  isOpen: boolean,
  onClose: () => void,
  notifications: AppNotification[],
  db: Firestore,
  userId: string,
  appId: string,
  onTaskClick: (taskId: string) => void
}> = ({ isOpen, onClose, notifications, db, userId, appId, onTaskClick }) => {

  const handleMarkAsRead = async (id: string) => {
    const notifPath = `artifacts/${appId}/users/${userId}/notifications/${id}`;
    await updateDoc(doc(db, notifPath), { read: true });
  };

  const handleClearAll = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (n.id) {
        const notifPath = `artifacts/${appId}/users/${userId}/notifications/${n.id}`;
        batch.update(doc(db, notifPath), { read: true });
      }
    });
    await batch.commit();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>Marcar todas como leídas</Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes notificaciones nuevas.</p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 rounded-md cursor-pointer ${!n.read ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-secondary'}`}
                onClick={() => {
                  if (!n.read && n.id) handleMarkAsRead(n.id);
                  onTaskClick(n.taskId);
                  onClose();
                }}
              >
                <p className="text-sm">{n.text}</p>
                <p className="text-xs text-muted-foreground truncate">{n.taskText}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};


// --- MAIN APP COMPONENT ---
const MainAppContent = () => {
    const { db, userId, auth, storage, appId } = useApp();
    const [currentView, setCurrentView] = React.useState<ViewName>('dashboard');
    const [allRecipes, setAllRecipes] = React.useState<Recipe[]>([]);
    const [allIngredients, setAllIngredients] = React.useState<Ingredient[]>([]);
    const [allPizarronTasks, setAllPizarronTasks] = React.useState<PizarronTask[]>([]);
    
    const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
    const [showNotificationsDrawer, setShowNotificationsDrawer] = React.useState(false);

    const [showRecipeModal, setShowRecipeModal] = React.useState(false);
    const [recipeToEdit, setRecipeToEdit] = React.useState<Partial<Recipe> | null>(null);

    // --- Vinculación States ---
    const [taskToOpen, setTaskToOpen] = React.useState<string | null>(null);
    const [draggingRecipe, setDraggingRecipe] = React.useState<Recipe | null>(null);
    const [draggingTask, setDraggingTask] = React.useState<string | null>(null);
    const [textToAnalyze, setTextToAnalyze] = React.useState<string | null>('');

    React.useEffect(() => {
        if (!db || !userId) return;
        const recipeUnsub = onSnapshot(query(collection(db, `users/${userId}/grimorio`), orderBy('nombre')), snap => setAllRecipes(snap.docs.map(d => ({ ...d.data(), id: d.id } as Recipe))));
        const ingredientUnsub = onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre')), snap => setAllIngredients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient))));
        const taskUnsub = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), orderBy('createdAt', 'desc')), snap => setAllPizarronTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as PizarronTask))));
        
        const notifPath = `artifacts/${appId}/users/${userId}/notifications`;
        const q = query(collection(db, notifPath), orderBy('createdAt', 'desc'), limit(20));
        const notifUnsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification));
            setNotifications(data);
        });

        return () => { recipeUnsub(); ingredientUnsub(); taskUnsub(); notifUnsub(); };
    }, [db, userId, appId]);

    const handleOpenRecipeModal = (recipe: Partial<Recipe> | null) => { setRecipeToEdit(recipe); setShowRecipeModal(true); };
    
    const handleDropEnd = () => {
        setDraggingTask(null);
        setDraggingRecipe(null);
    };

    const handleAnalyzeRequest = (text: string) => {
        setTextToAnalyze(text);
        setCurrentView('cerebrIty');
    };

    if (!db || !userId || !auth || !storage || !appId) return <div className="flex h-screen items-center justify-center"><Spinner className="w-12 h-12"/></div>;

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                onShowNotifications={() => setShowNotificationsDrawer(true)}
                unreadNotifications={notifications.some(n => !n.read)}
            />
            <ContentView 
                currentView={currentView} 
                db={db}
                auth={auth}
                storage={storage}
                userId={userId}
                appId={appId}
                allRecipes={allRecipes}
                allIngredients={allIngredients}
                allPizarronTasks={allPizarronTasks}
                onOpenRecipeModal={handleOpenRecipeModal}
                taskToOpen={taskToOpen}
                onTaskOpened={() => setTaskToOpen(null)}
                draggingRecipe={draggingRecipe}
                onDragRecipeStart={setDraggingRecipe}
                draggingTask={draggingTask}
                onDragTaskStart={setDraggingTask}
                onDropEnd={handleDropEnd}
                onAnalyze={handleAnalyzeRequest}
                initialText={textToAnalyze}
                onAnalysisDone={() => setTextToAnalyze('')}
            />
            {showRecipeModal && <RecipeFormModal isOpen={showRecipeModal} onClose={() => setShowRecipeModal(false)} db={db} userId={userId} initialData={recipeToEdit} allIngredients={allIngredients}/>}
            {showNotificationsDrawer && (
                <NotificationsDrawer
                    isOpen={showNotificationsDrawer}
                    onClose={() => setShowNotificationsDrawer(false)}
                    notifications={notifications}
                    db={db}
                    userId={userId}
                    appId={appId}
                    onTaskClick={(taskId: string) => {
                        setCurrentView('pizarron');
                        setTaskToOpen(taskId);
                    }}
                />
            )}
            <ChatbotWidget />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <UIProvider>
                <AppContent />
            </UIProvider>
        </AppProvider>
    );
};

const AppContent: React.FC = () => {
    const { isAuthReady, user } = useApp();

    if (!isAuthReady) {
        return <div className="flex h-screen items-center justify-center"><Spinner className="w-12 h-12"/></div>;
    }

    return (
      <>
        <PrintStyles />
        {user ? <MainAppContent /> : <AuthComponent />}
      </>
    );
};

export default App;

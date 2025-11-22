import * as React from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, Auth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, Firestore, serverTimestamp, query, orderBy, limit, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage, uploadBytes } from 'firebase/storage';
import { parseEuroNumber } from "./src/utils/parseEuroNumber";
import { ViewName, Ingredient, Recipe, PizarronTask, PizarronStatus, UIContextType, AppContextType, TaskCategory, IngredientLineItem, CerebrityResult, Escandallo, TrendResult, MenuLayout, QuizQuestion, ColegiumResult, UserProfile, ZeroWasteResult, PizarronComment, PizarronBoard, AppNotification } from './types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FaBook, FaBolt, FaWineGlassAlt } from 'react-icons/fa';
import TodayTasks from './src/components/dashboard/TodayTasks';
import DashboardView from './src/views/DashboardView';
import GrimoriumView from './src/views/GrimoriumView';
import PizarronView from './src/views/PizarronView';
import CerebrityView from './src/views/CerebrityView';
import LabView from './src/views/LabView';
import TrendLocatorView from './src/views/TrendLocatorView';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './src/components/ui/Card';
import { ICONS } from './src/components/ui/icons';
import { Icon } from './src/components/ui/Icon';
import { Spinner } from './src/components/ui/Spinner';
import { Alert } from './src/components/ui/Alert';
import { Button } from './src/components/ui/Button';
import { Input } from './src/components/ui/Input';
import { Textarea } from './src/components/ui/Textarea';
import { Select } from './src/components/ui/Select';
import { Label } from './src/components/ui/Label';
import { Modal } from './src/components/ui/Modal';
import { Checkbox } from './src/components/ui/Checkbox';


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
export const useUI = (): UIContextType => {
  const context = React.useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

export const useApp = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// --- ICON COMPONENTS & DEFINITIONS ---
// Moved to src/components/ui/icons.ts
// Helpers moved to respective components




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
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                content: taskContent, status: 'Ideas', category: 'Desarrollo', createdAt: serverTimestamp(), boardId: 'general'
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
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                content: taskContent,
                status: 'Ideas',
                category: 'Desarrollo',
                createdAt: serverTimestamp(),
                boardId: 'general',
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
    appId: string;
}> = ({ item, db, userId, appId }) => {
    const handleSaveToPizarron = async () => {
        const taskContent = `[Diseño Menú] Adaptar el concepto '${item.themeName}'. Descripción: ${item.description}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent,
            status: 'ideas',
            category: 'Marketing',
            createdAt: serverTimestamp(),
            boardId: 'general'
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
                        <div className="flex-1 pt-4"><MenuResultCard item={menuResults[activeDesignerTab]} db={db} userId={userId} appId={appId} /></div>
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
// Moved to src/views/PizarronView.tsx



// --- CONTENT VIEW ---
const ContentView: React.FC<{
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
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
  userProfile: Partial<UserProfile>;
}> = (props) => {
  const { currentView, ...rest } = props;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView allRecipes={rest.allRecipes} allPizarronTasks={rest.allPizarronTasks} allIngredients={rest.allIngredients} auth={rest.auth} setCurrentView={props.setCurrentView} />;
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
        return <PizarronView db={rest.db} userId={rest.userId} appId={rest.appId} auth={rest.auth} storage={rest.storage} allPizarronTasks={rest.allPizarronTasks} taskToOpen={rest.taskToOpen} onTaskOpened={rest.onTaskOpened} draggingRecipe={rest.draggingRecipe} draggingTask={rest.draggingTask} onDropEnd={rest.onDropEnd} onDragTaskStart={rest.onDragTaskStart} onAnalyze={rest.onAnalyze} userProfile={rest.userProfile} />;
      case 'cerebrIty':
        return <CerebrityView {...rest} initialText={rest.initialText} onAnalysisDone={rest.onAnalysisDone}/>;
      case 'lab':
        return <LabView db={rest.db} userId={rest.userId} appId={rest.appId} allIngredients={rest.allIngredients} allRecipes={rest.allRecipes} />;
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
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
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
    const { db, userId, auth, storage, appId, userProfile } = useApp();
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
                setCurrentView={setCurrentView}
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
                userProfile={userProfile}
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
// Refrescando para Vercel

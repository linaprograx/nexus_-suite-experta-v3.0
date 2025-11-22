import * as React from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, Auth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, Firestore, serverTimestamp, query, orderBy, limit, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage, uploadBytes } from 'firebase/storage';
import { parseEuroNumber } from "./src/utils/parseEuroNumber";
import { ViewName, Ingredient, Recipe, PizarronTask, PizarronStatus, UIContextType, AppContextType, TaskCategory, IngredientLineItem, CerebrityResult, Escandallo, TrendResult, MenuLayout, ColegiumResult, UserProfile, ZeroWasteResult, PizarronComment, PizarronBoard, AppNotification } from './types';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import TodayTasks from './src/components/dashboard/TodayTasks';
import DashboardView from './src/views/DashboardView';
import GrimoriumView from './src/views/GrimoriumView';
import PizarronView from './src/views/PizarronView';
import CerebrityView from './src/views/CerebrityView';
import LabView from './src/views/LabView';
import TrendLocatorView from './src/views/TrendLocatorView';
import ZeroWasteView from './src/views/ZeroWasteView';
import EscandallatorView from './src/views/EscandallatorView';
import MakeMenuView from './src/views/MakeMenuView';
import ColegiumView from './src/views/ColegiumView';
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

// Helper para parsear bloques simples (ej: [Ingredientes] ... [Preparacion])
const parseSimpleBlock = (text: string, key: string): string => {
  const regex = new RegExp(`\\[${key}\\]([\\s\\S]*?)(?=\\[[^\\]]+\\]|---|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
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



// --- MAKEMENU VIEW ---
// Refactored to src/views/MakeMenuView.tsx

// --- COLEGIUM VIEW ---
// Refactored to src/views/ColegiumView.tsx

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

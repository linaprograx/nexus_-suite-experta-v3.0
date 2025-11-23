import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Recipe, Ingredient, CerebrityResult } from '../../types';
import { CreativityTab } from '../components/cerebrity/CreativityTab';
import { CerebrityHistorySidebar } from '../components/cerebrity/CerebrityHistorySidebar';
import { TheLabHistorySidebar } from '../components/cerebrity/TheLabHistorySidebar';
import PowerTreeColumn from '../components/cerebrity/PowerTreeColumn';
import LabView from './LabView';
import { callGeminiApi, generateImage } from '../utils/gemini';
import { Type } from "@google/genai";
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

interface CerebrityViewProps {
    db: Firestore;
    userId: string;
    storage: FirebaseStorage;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    initialText: string | null;
    onAnalysisDone: () => void;
}

const CerebrityView: React.FC<CerebrityViewProps> = ({ db, userId, storage, appId, allRecipes, allIngredients, onOpenRecipeModal, initialText, onAnalysisDone }) => {
    const [activeTab, setActiveTab] = React.useState<'creativity' | 'lab'>('creativity');
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [rawInput, setRawInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CerebrityResult | null>(null);
    const [labResult, setLabResult] = React.useState<any | null>(null);
    const [labInputs, setLabInputs] = React.useState<(Recipe | Ingredient)[]>([]);
    const [powerResult, setPowerResult] = React.useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isPowerModalOpen, setIsPowerModalOpen] = React.useState(false);
    const [powerLoading, setPowerLoading] = React.useState(false);

    const allPowers = [
        { name: 'Intensidad Creativa', description: 'Analiza la creatividad de la receta.', locked: false, size: 'medium square' as const, color: 'purple' as const, icon: 'sparkles' },
        { name: 'Coherencia Técnica', description: 'Detecta conflictos técnicos.', locked: false, size: 'vertical' as const, color: 'cyan' as const, icon: 'lab' },
        { name: 'Optimización del Garnish', description: 'Sugiere 3 tipos de garnish.', locked: false, size: 'small square' as const, color: 'green' as const, icon: 'leaf' },
        { name: 'Mejora de Storytelling', description: 'Crea 2 variaciones de storytelling.', locked: false, size: 'horizontal' as const, color: 'purple' as const, icon: 'book' },
        { name: 'Creative Booster Avanzado', description: 'Genera nuevas ideas de cócteles.', locked: true, size: 'large square' as const, color: 'gray' as const, icon: 'sparkles' },
        { name: 'Analizador de Storytelling', description: 'Analiza el storytelling existente.', locked: true, size: 'medium square' as const, color: 'gray' as const, icon: 'book' },
        { name: 'Identificador de Rarezas', description: 'Identifica ingredientes inusuales.', locked: true, size: 'small square' as const, color: 'orange' as const, icon: 'alert' },
        { name: 'Harmony Optimizer', description: 'Propone mejoras de sabor.', locked: true, size: 'vertical' as const, color: 'gray' as const, icon: 'wave' },
    ];

    const handlePowerClick = async (powerName: string) => {
      if (powerLoading) return;
    
      const currentContext = activeTab === 'creativity' ? (selectedRecipe ? `la receta "${selectedRecipe.nombre}"` : (rawInput ? `los ingredientes: ${rawInput}` : null)) : (labInputs.length > 0 ? `la combinación de The Lab` : null);
    
      if (!currentContext) {
        setPowerResult({ title: "Error", content: "Necesitas seleccionar una receta, introducir ingredientes o tener una combinación en The Lab para usar un superpoder." });
        setIsPowerModalOpen(true);
        return;
      }
    
      setPowerLoading(true);
      setIsPowerModalOpen(true);
      setPowerResult({ title: `Analizando con ${powerName}...`, content: <div className="flex justify-center items-center p-8"><Spinner /></div> });
    
      try {
        let prompt = "";
        let responseSchema = {};
    
        switch (powerName) {
          case 'Intensidad Creativa':
            prompt = `Analiza la creatividad de ${currentContext}. Devuelve un score de 0 a 100 y una explicación concisa de por qué.`;
            responseSchema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } };
            break;
          case 'Coherencia Técnica':
            prompt = `Analiza ${currentContext} y detecta posibles combinaciones conflictivas, errores técnicos o técnicas incompatibles. Devuelve un listado de problemas encontrados.`;
            responseSchema = { type: Type.OBJECT, properties: { issues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, suggestion: { type: Type.STRING } } } } } };
            break;
          case 'Optimización del Garnish':
            prompt = `Basado en ${currentContext}, genera 3 propuestas de garnish: una simple, una avanzada y una premium.`;
            responseSchema = { type: Type.OBJECT, properties: { simple: { type: Type.STRING }, advanced: { type: Type.STRING }, premium: { type: Type.STRING } } };
            break;
          case 'Mejora de Storytelling':
            prompt = `Crea 2 variaciones y una versión premium del storytelling para ${currentContext}, coherentes con un estilo de marca premium y evocador.`;
            responseSchema = { type: Type.OBJECT, properties: { variation1: { type: Type.STRING }, variation2: { type: Type.STRING }, premium: { type: Type.STRING } } };
            break;
          default:
            throw new Error("Superpoder no implementado.");
        }
    
        const response = await callGeminiApi(prompt, "Eres un experto en mixología y creatividad.", { responseMimeType: "application/json", responseSchema });
        const data = JSON.parse(response.text.replace(/^```json\s*/, '').replace(/```$/, ''));
    
        // ... (resto de la lógica de handlePowerClick)
      } catch (e: any) {
        setPowerResult({ title: "Error", content: `Hubo un error al usar el superpoder: ${e.message}` });
      } finally {
        setPowerLoading(false);
      }
    };

    React.useEffect(() => {
        if (initialText) {
          setRawInput(initialText);
          setActiveTab('creativity');
          onAnalysisDone();
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
        const promptBase = selectedRecipe ? `Receta: ${selectedRecipe.nombre}. Ingredientes: ${selectedRecipe.ingredientes?.map(i => i.nombre).join(', ')}` : `Ingredientes crudos: ${rawInput}`;
        try {
            const response = await callGeminiApi(`Analiza la siguiente base y genera las mejoras: ${promptBase}`, "Eres un director creativo de mixología...", {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { mejora: { type: Type.STRING }, garnishComplejo: { type: Type.STRING }, storytelling: { type: Type.STRING }, promptImagen: { type: Type.STRING } } }
            });
            const textResult = JSON.parse(response.text.replace(/^```json\s*/, '').replace(/```$/, ''));
            setResult({ ...textResult, imageUrl: null });

            setImageLoading(true);
            const imageResponse = await generateImage(textResult.promptImagen);
            const base64Data = imageResponse.predictions[0].bytesBase64Encoded;
            const storageRef = ref(storage, `users/${userId}/recipe-images/${Date.now()}.jpg`);
            await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
            const downloadURL = await getDownloadURL(storageRef);
            setResult(prev => prev ? ({ ...prev, imageUrl: downloadURL }) : null);
            await addDoc(collection(db, `users/${userId}/cerebrity-history`), { ...textResult, imageUrl: downloadURL, createdAt: serverTimestamp() });
        } catch (e: any) {
            setError("Error en la generación. " + e.message);
        } finally {
            setLoading(false);
            setImageLoading(false);
        }
    };
    
    const handleSaveLabResultToPizarron = async (title: string, content: string) => {
        if (!labResult) return;
        const combination = labInputs.map(i => i.nombre).join(', ');
        const taskContent = `[The Lab: ${combination}] ${title} - ${content}`.substring(0, 500);
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                content: taskContent, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
            });
            alert("Idea guardada en el Pizarrón.");
        } catch (e) {
            console.error("Error guardando en Pizarrón: ", e);
        }
    };

    const backgroundClass = activeTab === 'creativity'
        ? "from-[#EDE9FE] to-white dark:from-[#1E1B2A] dark:to-slate-950"
        : "from-[#CCFBF1] to-white dark:from-[#1A2A29] dark:to-slate-950";

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
             <div className="flex-shrink-0 mb-4">
                <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-full w-fit">
                    <button onClick={() => setActiveTab('creativity')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'creativity' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>CerebrIty</button>
                    <button onClick={() => setActiveTab('lab')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'lab' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>The Lab</button>
                </div>
            </div>
            <div className={`flex-1 grid grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px] gap-6 overflow-hidden rounded-3xl bg-gradient-to-b ${backgroundClass} p-6`}>
               <div className="h-full min-h-0 overflow-y-auto">
                   {activeTab === 'creativity' ? (
                       <CerebrityHistorySidebar db={db} userId={userId} onLoadHistory={(item) => setResult(item)} />
                   ) : (
                       <TheLabHistorySidebar db={db} historyPath={`users/${userId}/the-lab-history`} onLoadHistory={(item) => setLabResult(item.result)} />
                   )}
               </div>
                <div className="h-full min-h-0 overflow-y-auto">
                    {activeTab === 'creativity' ? (
                        <CreativityTab db={db} userId={userId} appId={appId} allRecipes={allRecipes} selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe} rawInput={rawInput} setRawInput={setRawInput} handleGenerate={handleGenerate} loading={loading} imageLoading={imageLoading} error={error} result={result} setResult={setResult} onOpenRecipeModal={onOpenRecipeModal} />
                    ) : (
                        <LabView db={db} userId={userId} appId={appId} allIngredients={allIngredients} allRecipes={allRecipes} labResult={labResult} setLabResult={setLabResult} labInputs={labInputs} setLabInputs={setLabInputs} />
                    )}
                </div>
               <div className="h-full min-h-0 overflow-hidden">
                   <PowerTreeColumn
                     mode={activeTab === 'creativity' ? 'cerebrity' : 'lab'}
                     powers={allPowers}
                     onClickPower={handlePowerClick}
                   />
               </div>
            </div>
            {isPowerModalOpen && (
                <Modal title={powerResult?.title || ''} isOpen={isPowerModalOpen} onClose={() => setIsPowerModalOpen(false)}>
                    <div className="p-4">
                        {powerResult?.content}
                    </div>
                    <div className="p-4 flex justify-end">
                        <Button onClick={() => setIsPowerModalOpen(false)} variant="secondary">Cerrar</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CerebrityView;

import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Recipe, Ingredient, CerebrityResult } from '../../types';
import { CreativityTab } from '../components/cerebrity/CreativityTab';
import { CerebrityHistorySidebar } from '../components/cerebrity/CerebrityHistorySidebar';
import { TheLabHistorySidebar } from '../components/cerebrity/TheLabHistorySidebar';
import PowerTreeColumn from '../components/cerebrity/PowerTreeColumn';
import LabView from './LabView';
import {
  powerCreativeBooster,
  powerStorytellingAnalyzer,
  powerRarenessIdentifier,
  powerHarmonyOptimizer
} from '../modules/cerebrity/powers';
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
    const [powerModalState, setPowerModalState] = React.useState<{ title: string; content?: React.ReactNode } | null>(null);
    const [powerOutput, setPowerOutput] = React.useState<any>(null);
    const [isPowerModalOpen, setIsPowerModalOpen] = React.useState(false);
    const [powerLoading, setPowerLoading] = React.useState(false);
    // --- Helper fun/ti/ -fee renuernctontructur d pr rerrcsdlrl ------
    const renderPowerContent = (data: any) => {
        if (!data) return null;

        // Case 1: Intensidad Creativa (old power)
        if (typeof data.explanation === "string" && typeof data.score === "number") {
            return (
                <>
                    <p>{data.explanation}</p>
                    <p><strong>Puntuación creativa:</strong> {data.score} / 100</p>
                </>
            );
        }

        // Case 2: Optimización del Garnish (old power)
        if (data.simple || data.premium || data.advanced) {
            return (
                <ul>
                    {data.simple && (
                        <li>
                            <strong>Simple:</strong> {data.simple}
                        </li>
                    )}
                    {data.premium && (
                        <li>
                            <strong>Premium:</strong> {data.premium}
                        </li>
                    )}
                    {data.advanced && (
                        <li>
                            <strong>Avanzado:</strong> {data.advanced}
                        </li>
                    )}
                </ul>
            );
        }
        
        // Case 3: New generic schema
        if (data.summary || Array.isArray(data.sections) || Array.isArray(data.lists) || Array.isArray(data.tables)) {
            return (
                <div className="power-structured-result">
                    {data.summary && <p>{data.summary}</p>}

                    {Array.isArray(data.sections) && data.sections.length > 0 && (
                        <div className="power-sections">
                            {data.sections.map((section: any, idx: number) => (
                                <section key={idx}>
                                    {section.heading && <h4>{section.heading}</h4>}
                                    {section.content && <p>{section.content}</p>}
                                </section>
                            ))}
                        </div>
                    )}

                    {Array.isArray(data.lists) && data.lists.length > 0 && (
                        <div className="power-lists">
                            {data.lists.map((list: any, idx: number) => (
                                <div key={idx}>
                                    {list.heading && <h4>{list.heading}</h4>}
                                    {Array.isArray(list.items) && (
                                        <ul>
                                            {list.items.map((item: string, i: number) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {Array.isArray(data.tables) && data.tables.length > 0 && (
                        <div className="power-tables">
                            {data.tables.map((table: any, idx: number) => (
                                <div key={idx}>
                                    {table.heading && <h4>{table.heading}</h4>}
                                    <table>
                                        <thead>
                                            <tr>
                                                {Array.isArray(table.columns) &&
                                                    table.columns.map((col: string, i: number) => <th key={i}>{col}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(table.rows) &&
                                                table.rows.map((row: string[], rIdx: number) => (
                                                    <tr key={rIdx}>
                                                        {row.map((cell: string, cIdx: number) => (
                                                            <td key={cIdx}>{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Fallback: unknown shape -> show JSON as before
        return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }


    const allPowers = [
        { name: 'Intensidad Creativa', description: 'Analiza la creatividad de la receta.', locked: false, size: 'medium square' as const, color: 'purple' as const, icon: 'sparkles' },
        { name: 'Coherencia Técnica', description: 'Detecta conflictos técnicos.', locked: false, size: 'vertical' as const, color: 'cyan' as const, icon: 'lab' },
        { name: 'Optimización del Garnish', description: 'Sugiere 3 tipos de garnish.', locked: false, size: 'small square' as const, color: 'green' as const, icon: 'leaf' },
        { name: 'Mejora de Storytelling', description: 'Crea 2 variaciones de storytelling.', locked: false, size: 'horizontal' as const, color: 'purple' as const, icon: 'book' },
        { name: 'Creative Booster Avanzado', description: 'Genera nuevas ideas de cócteles.', locked: false, size: 'large square' as const, color: 'purple' as const, icon: 'sparkles' },
        { name: 'Analizador de Storytelling', description: 'Analiza el storytelling existente.', locked: false, size: 'medium square' as const, color: 'cyan' as const, icon: 'book' },
        { name: 'Identificador de Rarezas', description: 'Identifica ingredientes inusuales.', locked: false, size: 'small square' as const, color: 'orange' as const, icon: 'alert' },
        { name: 'Harmony Optimizer', description: 'Propone mejoras de sabor.', locked: false, size: 'vertical' as const, color: 'green' as const, icon: 'wave' },
    ];

    const handlePowerClick = async (powerName: string) => {
      if (powerLoading) return;
    
      const currentContext = activeTab === 'creativity' ? (selectedRecipe ? `la receta "${selectedRecipe.nombre}"` : (rawInput ? `los ingredientes: ${rawInput}` : null)) : (labInputs.length > 0 ? `la combinación de The Lab` : null);
    
      if (!currentContext) {
        setPowerModalState({ title: "Error", content: "Necesitas seleccionar una receta, introducir ingredientes o tener una combinación en The Lab para usar un superpoder." });
        setPowerOutput(null);
        setIsPowerModalOpen(true);
        return;
      }
    
      setPowerLoading(true);
      setIsPowerModalOpen(true);
      setPowerModalState({ title: `Activando ${powerName}...`, content: <div className="flex justify-center items-center p-8"><Spinner /></div> });
      setPowerOutput(null);

      try {
        let run: ((ingredients: string[]) => Promise<any>) | null = null;
        const ingredients = activeTab === 'creativity' 
            ? (selectedRecipe?.ingredientes?.map(i => i.nombre) || rawInput.split(',').map(s => s.trim()))
            : labInputs.map(i => i.nombre);

        if (ingredients.length === 0) {
            throw new Error("No hay ingredientes suficientes para activar el poder.");
        }

        switch (powerName) {
            case 'Creative Booster Avanzado':
                run = powerCreativeBooster;
                break;
            case 'Analizador de Storytelling':
                run = powerStorytellingAnalyzer;
                break;
            case 'Identificador de Rarezas':
                run = powerRarenessIdentifier;
                break;
            case 'Harmony Optimizer':
                run = powerHarmonyOptimizer;
                break;
            // TODO: Migrar los poderes antiguos al nuevo sistema.
            default:
                 // Mantener la lógica anterior para los poderes no migrados
                const oldPowerPrompt = getOldPowerPrompt(powerName, currentContext);
                if (!oldPowerPrompt) {
                    setPowerModalState({ title: "Poder no implementado", content: "Este poder aún no ha sido conectado al nuevo sistema."});
                    setPowerOutput(null);
                    setPowerLoading(false);
                    return;
                }
                const response = await callGeminiApi(oldPowerPrompt.prompt, "Eres un experto en mixología y creatividad.", { responseMimeType: "application/json", responseSchema: oldPowerPrompt.responseSchema });
                const data = JSON.parse(response.text.replace(/^```json\s*/, '').replace(/```$/, ''));
                setPowerModalState({ title: powerName });
                setPowerOutput(data);
                setPowerLoading(false);
                return;
        }
        
        const rawData = await run(ingredients);
        
        if (rawData?.error) {
          throw new Error(rawData.message || "La respuesta del modelo contenía un error.");
        }
        
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

        // Validar estructura básica
        if (!data.title || !data.summary) {
             throw new Error("La respuesta del modelo no tiene el formato JSON esperado.");
        }
        
        setPowerModalState({ title: data.title });
        setPowerOutput(data);

      } catch (e: any) {
        setPowerModalState({ title: "Error", content: `Error procesando el poder. Intenta de nuevo.` });
        setPowerOutput(null);
      } finally {
        setPowerLoading(false);
      }
    };

    const getOldPowerPrompt = (powerName: string, context: string) => {
        switch (powerName) {
          case 'Intensidad Creativa':
            return {
              prompt: `Analiza la creatividad de ${context}. Devuelve un score de 0 a 100 y una explicación concisa de por qué.`,
              responseSchema: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } }
            };
          case 'Coherencia Técnica':
            return {
              prompt: `Analiza ${context} y detecta posibles combinaciones conflictivas, errores técnicos o técnicas incompatibles. Devuelve un listado de problemas encontrados.`,
              responseSchema: { type: Type.OBJECT, properties: { issues: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, suggestion: { type: Type.STRING } } } } } }
            };
          case 'Optimización del Garnish':
            return {
              prompt: `Basado en ${context}, genera 3 propuestas de garnish: una simple, una avanzada y una premium.`,
              responseSchema: { type: Type.OBJECT, properties: { simple: { type: Type.STRING }, advanced: { type: Type.STRING }, premium: { type: Type.STRING } } }
            };
          case 'Mejora de Storytelling':
            return {
              prompt: `Crea 2 variaciones y una versión premium del storytelling para ${context}, coherentes con un estilo de marca premium y evocador.`,
              responseSchema: { type: Type.OBJECT, properties: { variation1: { type: Type.STRING }, variation2: { type: Type.STRING }, premium: { type: Type.STRING } } }
            };
          default:
            return null;
        }
    }

    React.useEffect(() => {
        if (initialText) {
          setRawInput(initialText);
          setActiveTab('creativity');
          onAnalysisDone();
        }
    }, [initialText, onAnalysisDone]);

    // Automatic Test for Phase 6
    React.useEffect(() => {
        const testPower = async () => {
            console.log("--- STARTING AUTOMATED TEST ---");
            // Set mock ingredients
            setRawInput("pomelo, canela");
            
            // Allow state to update before calling the handler
            await new Promise(resolve => setTimeout(resolve, 100));

            // Call the power click handler
            await handlePowerClick("Creative Booster Avanzado");
            console.log("--- AUTOMATED TEST COMPLETE ---");
        };

        // Run the test once on mount
        // testPower(); // Temporarily disabled to avoid unwanted side effects on every load.
    }, []);

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
                <Modal title={powerModalState?.title || ''} isOpen={isPowerModalOpen} onClose={() => setIsPowerModalOpen(false)}>
                    <div className="p-4">
                        {powerModalState?.content ? powerModalState.content : renderPowerContent(powerOutput)}
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

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
    const [powerModalState, setPowerModalState] = React.useState<{ title: string; content?: React.ReactNode } | null>(null);
    const [powerOutput, setPowerOutput] = React.useState<any>(null);
    const [isPowerModalOpen, setIsPowerModalOpen] = React.useState(false);
    const [powerLoading, setPowerLoading] = React.useState(false);
    const [storytellingTheme, setStorytellingTheme] = React.useState("");
    const [saveModalState, setSaveModalState] = React.useState<{ isOpen: boolean; options: any[]; powerName: string; }>({ isOpen: false, options: [], powerName: '' });

    const safeJsonParse = (raw: string): any => {
      try {
        return JSON.parse(raw);
      } catch {
        try {
          const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleaned);
        } catch {
          try {
            // Fallback for more complex cases, not implemented yet.
            return { summary: raw };
          } catch {
            return { summary: "Error irrecuperable al parsear la respuesta." };
          }
        }
      }
    };

    const runStorytellingImprovement = async () => {
      const storytellingSource = result?.storytelling || rawInput;
      if (!storytellingSource || !storytellingSource.trim()) {
          setPowerModalState({
              title: "Error",
              content: "Necesitas un storytelling generado o un texto en el input principal.",
          });
          setIsPowerModalOpen(true);
          return;
      }

      setIsPowerModalOpen(false); // Close input modal
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update

      setPowerLoading(true);
      setPowerModalState({ title: 'Mejorando Storytelling...' });
      setPowerOutput(null);
      setIsPowerModalOpen(true); // Reopen as loading modal

      try {
          const powerPrompt = getPowerPrompt('Mejora de Storytelling', storytellingSource, storytellingTheme);
          if (!powerPrompt) throw new Error("Poder no implementado.");

          const response = await callGeminiApi(
              powerPrompt.prompt,
              powerPrompt.systemInstruction,
              { responseMimeType: "application/json", responseSchema: powerPrompt.responseSchema }
          );

          const data = safeJsonParse(response.text);
          setPowerModalState({ title: 'Mejora de Storytelling' });
          setPowerOutput(data);
      } catch (err: any) {
          setPowerModalState({ title: "Error", content: err.message || "Error al procesar el poder." });
          setPowerOutput(null);
      } finally {
          setPowerLoading(false);
      }
  };

    // --- Helper fun/ti/ -fee renuernctontructur d pr rerrcsdlrl ------
    const renderPowerContent = (data: any) => {
        if (!data) return null;

        const renderContent = () => {
            if (typeof data.explanation === "string" && typeof data.score === "number") {
                return <><p>{data.explanation}</p><p><strong>Puntuación:</strong> {data.score}/100</p></>;
            }
            if (data.simple || data.avanzado || data.experto) {
                return (
                    <ul>
                        {data.simple && <li><strong>Simple:</strong> {data.simple}</li>}
                        {data.avanzado && <li><strong>Avanzado:</strong> {data.avanzado}</li>}
                        {data.experto && <li><strong>Experto:</strong> {data.experto}</li>}
                    </ul>
                );
            }
            if (data.summary || data.sections || data.lists || data.tables) {
                return (
                    <div className="space-y-4">
                        {data.summary && <p className="mb-4">{data.summary}</p>}
                        {data.sections?.map((s: any, i: number) => <section key={i} className="mb-4"><h4>{s.heading}</h4><p>{s.content}</p></section>)}
                        {data.lists?.map((l: any, i: number) => <div key={i} className="mb-4"><h4>{l.heading}</h4><ul>{l.items?.map((item: string, j: number) => <li key={j}>{item}</li>)}</ul></div>)}
                        {data.tables?.map((t: any, i: number) => (
                            <div key={i} className="mb-4">
                                <h4>{t.heading}</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>{t.columns?.map((col: string, j: number) => <th key={j} style={{ padding: '8px', fontWeight: 600, textAlign: 'left' }}>{col}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {t.rows?.map((row: string[], r: number) => <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: '8px', verticalAlign: 'top' }}>{cell}</td>)}</tr>)}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                );
            }
            return <pre>{JSON.stringify(data, null, 2)}</pre>;
        };
        return <div className="power-structured-result">{renderContent()}</div>;
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
        { name: 'Mapeo de Sabores', description: 'Analiza perfil y familias aromáticas.', locked: false, size: 'medium square' as const, color: 'orange' as const, icon: 'map' },
    ];

    const handlePowerClick = async (powerName: string) => {
      const hasCreativityContext = selectedRecipe || rawInput.trim().length > 0;
      const hasLabContext = labInputs.length > 0;
      const currentContext = activeTab === 'creativity' ? (hasCreativityContext ? 'contexto' : null) : (hasLabContext ? 'contexto' : null);

      if (!currentContext) {
        setPowerModalState({ title: "Error", content: "Necesitas seleccionar una receta, ingredientes o una combinación en The Lab." });
        setIsPowerModalOpen(true);
        return;
      }

      if (powerName === 'Mejora de Storytelling') {
        setIsPowerModalOpen(true);
        setPowerModalState({ title: 'Mejora de Storytelling', content: undefined });
        setPowerOutput(null);
        return;
      }

      setPowerLoading(true);
      setIsPowerModalOpen(true);
      setPowerModalState({ title: `Activando ${powerName}...`, content: undefined });
      setPowerOutput(null);

      try {
        const ingredientNames = activeTab === 'creativity'
            ? (selectedRecipe?.ingredientes?.map(i => i.nombre) || rawInput.split(',').map(s => s.trim()).filter(Boolean))
            : labInputs.map(i => i.nombre);

        let contextText = '';
        if (powerName === 'Analizador de Storytelling') {
          contextText = result?.storytelling || rawInput;
        } else if (selectedRecipe) {
          contextText = `Receta: ${selectedRecipe.nombre}. Ingredientes: ${ingredientNames.join(', ')}`;
        } else {
          contextText = `Ingredientes: ${ingredientNames.join(', ')}`;
        }

        const powerPrompt = getPowerPrompt(powerName, contextText);
        if (!powerPrompt) throw new Error("Poder no implementado.");

        const response = await callGeminiApi(
          powerPrompt.prompt,
          powerPrompt.systemInstruction || "Eres un experto en mixología y creatividad.",
          { responseMimeType: "application/json", responseSchema: powerPrompt.responseSchema }
        );

        const data = safeJsonParse(response.text);
        setPowerModalState({ title: powerName });
        setPowerOutput(data);
      } catch (e: any) {
        setPowerModalState({ title: "Error", content: e.message || "Error procesando el poder." });
        setPowerOutput(null);
      } finally {
        setPowerLoading(false);
      }
    };

    const getPowerPrompt = (powerName: string, context: string, theme?: string) => {
      const genericSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          },
          lists: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                rows: {
                  type: Type.ARRAY,
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          },
          // Campos antiguos para compatibilidad con casos 1 y 2 de renderPowerContent
          score: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          simple: { type: Type.STRING },
          advanced: { type: Type.STRING },
          premium: { type: Type.STRING },
          variation1: { type: Type.STRING },
          variation2: { type: Type.STRING },
        }
      };

      switch (powerName) {
        case 'Intensidad Creativa':
          return {
            prompt: `Analiza la creatividad de ${context}. Devuelve un JSON con un 'summary' breve y, si procede, 'score' (0-100) y 'explanation'.`,
            systemInstruction: 'Eres un director creativo de coctelería de alto nivel.',
            responseSchema: genericSchema
          };
        case 'Coherencia Técnica':
          return {
            prompt: `Analiza ${context} y detecta posibles conflictos técnicos, técnicas incompatibles y riesgos. Devuelve un 'summary' y al menos una lista ('lists') con fortalezas y otra con posibles problemas.`,
            systemInstruction: 'Eres un experto técnico en coctelería y procesos de bar.',
            responseSchema: genericSchema
          };
        case 'Optimización del Garnish':
          return {
            prompt: `Basado en ${context}, genera 3 propuestas de garnish: simple (60-90 palabras), avanzado (80-120 palabras) y experto (100-140 palabras). Experto debe ser multisensorial. Devuelve JSON con simple, avanzado, experto.`,
            systemInstruction: 'Eres un experto en garnish creativo.',
            responseSchema: genericSchema
          };
        case 'Mejora de Storytelling': {
          const themePrompt = theme ? `Integrando el tema creativo: "${theme}".` : '';
          return {
            prompt: `A partir de: "${context}", ${themePrompt} genera un JSON con title, summary, y 5 sections: 'Versión Base Mejorada', 'Variación 1', 'Variación 2', 'Premium', y 'Tagline Final'. Cada sección no debe superar las 200 palabras.`,
            systemInstruction: 'Eres un copywriter experto en storytelling para coctelería.',
            responseSchema: genericSchema
          };
        }
        case 'Creative Booster Avanzado':
          return {
            prompt: `A partir de ${context}, genera 3 nuevas ideas de cócteles. Cada idea debe tener nombre, concepto, base alcohólica y twist. Devuelve un 'summary' general y una tabla en 'tables' con columnas ['Nombre', 'Concepto', 'Base alcohólica', 'Twist'] y 3 filas (una por idea).`,
            systemInstruction: 'Eres un creador de cócteles innovador.',
            responseSchema: genericSchema
          };
        case 'Analizador de Storytelling':
          return {
            prompt: `Analiza el siguiente storytelling: \"${context}\". Devuelve un 'summary' con el diagnóstico general y varias 'lists': una con fortalezas, otra con debilidades y otra con sugerencias concretas de mejora.`,
            systemInstruction: 'Eres un editor experto en storytelling para coctelería.',
            responseSchema: genericSchema
          };
        case 'Identificador de Rarezas':
          return {
            prompt: `Analiza los ingredientes de ${context} y detecta cuáles son poco usuales o raros en coctelería clásica. Devuelve un 'summary' y una tabla en 'tables' con columnas ['Ingrediente', 'Motivo', 'Nivel de rareza (baja/media/alta)'].`,
            systemInstruction: 'Eres un historiador de coctelería y analista de tendencias de ingredientes.',
            responseSchema: genericSchema
          };
        case 'Harmony Optimizer':
          return {
            prompt: `Analiza ${context} en términos de equilibrio dulce/ácido/amargo/alcohólico/aromático. Devuelve un 'summary', una lista con diagnóstico y otra lista con cambios propuestos muy concretos (qué subir, qué bajar, qué añadir o quitar), y una breve descripción de la versión optimizada.`,
            systemInstruction: 'Eres un experto en balance de sabores en coctelería.',
            responseSchema: genericSchema
          };
        case 'Mapeo de Sabores':
          return {
            prompt: `A partir de los ingredientes de ${context}, realiza un mapeo de sabores: agrupa en familias (cítrico, herbal, floral, especiado, tostado, lácteo, umami, etc.), asigna una intensidad de 1 a 10 y menciona qué ingredientes componen cada familia. Devuelve un 'summary' y una tabla en 'tables' con columnas ['Familia', 'Intensidad (1-10)', 'Ingredientes'].`,
            systemInstruction: 'Eres un sommelier de sabores especializado en coctelería.',
            responseSchema: genericSchema
          };
        default:
          return null;
      }
    };

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

    const confirmSave = async (content: string, destination: 'pizarron' | 'recetas', powerName: string) => {
        try {
            if (destination === 'pizarron') {
                await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                    content: `[Cerebrity: ${powerName}] ${content}`.substring(0, 500), status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
                });
                alert("Guardado en Pizarrón.");
            } else {
                 onOpenRecipeModal({ nombre: `[${powerName}] Idea`, storytelling: content });
            }
            setSaveModalState({ isOpen: false, options: [], powerName: '' });
        } catch (err) {
            console.error("Error al guardar:", err);
            setError("No se pudo guardar el resultado.");
        }
    };

    const handleSavePowerResult = (powerName: string, output: any) => {
        let options: { label: string, value: string }[] = [];

        if (powerName === 'Creative Booster Avanzado' && output.tables?.[0]?.rows) {
            options = output.tables[0].rows.map((row: string[]) => ({ label: row[0] || 'Idea', value: row.join('\n') }));
        } else if (powerName === 'Mejora de Storytelling' && output.sections) {
            options = output.sections.map((s: any) => ({ label: s.heading, value: s.content })).filter((opt: any) => opt.value);
        } else if (powerName === 'Optimización del Garnish' && (output.simple || output.avanzado || output.experto)) {
            options = [
                { label: 'Simple', value: output.simple },
                { label: 'Avanzado', value: output.avanzado },
                { label: 'Experto', value: output.experto },
            ].filter(opt => opt.value);
        }
        
        if (options.length > 0) {
            setSaveModalState({ isOpen: true, options, powerName });
        } else {
            const contentToSave = JSON.stringify(output, null, 2);
            // For single result, we could ask with a simpler modal or save directly.
            // For now, let's just use Pizarron as default for single complex objects.
            confirmSave(contentToSave, 'pizarron', powerName);
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
                <Modal title={powerModalState?.title || ''} isOpen={isPowerModalOpen} onClose={() => { setIsPowerModalOpen(false); setStorytellingTheme(''); }}>
                    <div className="p-4 max-h-[55vh] overflow-y-auto pr-2">
                        {powerLoading ? (
                          <div className="flex justify-center items-center p-8"><Spinner /></div>
                        ) : (
                          <>
                            {powerModalState?.title === 'Mejora de Storytelling' && !powerOutput && (
                              <div className="mb-4">
                                <label htmlFor="storytelling-theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tema (Opcional)</label>
                                <input
                                  id="storytelling-theme"
                                  type="text"
                                  value={storytellingTheme}
                                  onChange={(e) => setStorytellingTheme(e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md"
                                />
                              </div>
                            )}
                            {powerModalState?.content ? powerModalState.content : renderPowerContent(powerOutput)}
                          </>
                        )}
                    </div>
                    <div className="p-4 flex justify-between items-center border-t">
                        <div>
                            {powerModalState?.title === 'Mejora de Storytelling' && !powerOutput && !powerLoading && (
                                <Button onClick={runStorytellingImprovement}>Activar Poder</Button>
                            )}
                            {!powerLoading && powerOutput && (
                                <Button onClick={() => handleSavePowerResult(powerModalState?.title || 'Resultado', powerOutput)}>Guardar</Button>
                            )}
                        </div>
                        <Button onClick={() => { setIsPowerModalOpen(false); setStorytellingTheme(''); }} variant="secondary">Cerrar</Button>
                    </div>
                </Modal>
            )}

            {saveModalState.isOpen && (
                <SaveModal 
                    isOpen={saveModalState.isOpen}
                    onClose={() => setSaveModalState({ isOpen: false, options: [], powerName: '' })}
                    options={saveModalState.options}
                    powerName={saveModalState.powerName}
                    onConfirm={confirmSave}
                />
            )}
        </div>
    );
};

const SaveModal = ({ isOpen, onClose, options, powerName, onConfirm }: { isOpen: boolean; onClose: () => void; options: {label: string, value: string}[]; powerName: string; onConfirm: (content: string, destination: 'pizarron' | 'recetas', powerName: string) => void; }) => {
    const [selectedOption, setSelectedOption] = React.useState(options[0]?.value || '');
    const [destination, setDestination] = React.useState<'pizarron' | 'recetas'>('pizarron');

    React.useEffect(() => {
        if (options.length > 0) {
            setSelectedOption(options[0].value);
        }
    }, [options]);

    const handleConfirm = () => {
        if (!selectedOption) {
            // Maybe show an alert here
            return;
        }
        onConfirm(selectedOption, destination, powerName);
        onClose();
    };

    return (
        <Modal title={`Guardar resultado de ${powerName}`} isOpen={isOpen} onClose={onClose}>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona la idea a guardar:</label>
                    <div className="mt-2 space-y-2">
                        {options.map(option => (
                            <div key={option.label} className="flex items-center">
                                <input 
                                    type="radio"
                                    id={option.label}
                                    name="save-option"
                                    value={option.value}
                                    checked={selectedOption === option.value}
                                    onChange={() => setSelectedOption(option.value)}
                                    className="h-4 w-4 text-violet-600 border-gray-300 focus:ring-violet-500"
                                />
                                <label htmlFor={option.label} className="ml-3 block text-sm text-gray-800 dark:text-gray-200">{option.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destino:</label>
                    <div className="mt-2 flex gap-4">
                         <Button onClick={() => setDestination('pizarron')} variant={destination === 'pizarron' ? 'default' : 'secondary'}>Pizarrón</Button>
                         <Button onClick={() => setDestination('recetas')} variant={destination === 'recetas' ? 'default' : 'secondary'}>Recetas</Button>
                    </div>
                </div>
            </div>
            <div className="p-4 flex justify-end gap-2">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleConfirm}>Confirmar Guardado</Button>
            </div>
        </Modal>
    )
}

export default CerebrityView;

import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { StackedMobileShell } from '../components/layout/StackedMobileShell';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useLocation } from 'react-router-dom';
import { Recipe, Ingredient, CerebrityResult } from '../types';
import { CreativityTab } from '../components/cerebrity/CreativityTab';
import { CerebrityHistorySidebar } from '../components/cerebrity/CerebrityHistorySidebar';
import { TheLabHistorySidebar } from '../components/cerebrity/TheLabHistorySidebar';
import PowerTreeColumn from '../components/cerebrity/PowerTreeColumn';
import LabView from './LabView';
import { generateText, isGatewayDown, checkGatewayReachable } from '../services/ai/textService';
import { ImageGenerator } from '../lib/ai/image/imageGenerator';
import { Type } from "@google/genai";
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { TrendLocatorTab } from '../components/trend-locator/TrendLocatorTab';
import { TrendLocatorControls } from '../components/trend-locator/TrendLocatorControls';
import { TrendHistorySidebar } from '../components/trend-locator/TrendHistorySidebar';
import { TrendResult } from '../types';
import MakeMenuView from './MakeMenuView';
import CriticView from './unleash/CriticView';
import { motion } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useApp } from '../context/AppContext';

// Define SaveModal before it is used or move to separate file. 
// Ideally it should be at top or hoisted.
const SaveModal = ({ isOpen, onClose, options, powerName, onConfirm }: { isOpen: boolean; onClose: () => void; options: { label: string, value: string }[]; powerName: string; onConfirm: (content: string, destination: 'pizarron' | 'recetas', powerName: string) => void; }) => {
  const [selectedOption, setSelectedOption] = React.useState(options[0]?.value || '');
  const [destination, setDestination] = React.useState<'pizarron' | 'recetas'>('pizarron');

  React.useEffect(() => {
    if (options.length > 0) {
      setSelectedOption(options[0].value);
    }
  }, [options]);

  const handleConfirm = () => {
    if (!selectedOption) {
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

import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { useCerebrityOrchestrator } from '../hooks/useCerebrityOrchestrator';
import { usePizarronData } from '../hooks/usePizarronData';

interface CerebrityViewProps {
  // No persistent props needed as they are stored in Zustand or Auth context
}

const CerebrityView: React.FC<CerebrityViewProps> = () => {
  const { db, userId, storage, appId } = useApp();
  const setShowRecipeModal = useUIStore(state => state.setShowRecipeModal);
  const initialText = useUIStore(state => state.textToAnalyze);
  const setTextToAnalyze = useUIStore(state => state.setTextToAnalyze);

  const { recipes: allRecipes } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();
  const { actions: orchestratorActions, state: orchestratorState } = useCerebrityOrchestrator();
  const { activeBoardId } = usePizarronData();
  const location = useLocation();
  const [saveToast, setSaveToast] = React.useState<string | null>(null);
  const [aiOffline, setAiOffline] = React.useState(isGatewayDown());

  // Reliable AI-off indicator via proactive health check (independent of the
  // circuit-breaker cooldown, so the badge stays accurate while the gateway is down).
  React.useEffect(() => {
    let alive = true;
    const probe = async () => {
      const reachable = await checkGatewayReachable();
      if (alive) setAiOffline(!reachable);
    };
    probe(); // immediate on mount
    const id = setInterval(probe, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const [activeTab, setActiveTab] = React.useState<'creativity' | 'makeMenu' | 'critic' | 'lab' | 'trendLocator'>(() => {
    // Honor a tab requested from another module (e.g. Grimorio recipe tools)
    try {
      const requested = sessionStorage.getItem('cerebrity_tab');
      if (requested) {
        sessionStorage.removeItem('cerebrity_tab');
        if (['creativity', 'makeMenu', 'critic', 'lab', 'trendLocator'].includes(requested)) {
          return requested as any;
        }
      }
    } catch { /* ignore */ }
    return 'creativity';
  });
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

  // Trend Locator State
  const [trendResults, setTrendResults] = React.useState<TrendResult[]>([]);
  const [trendLoading, setTrendLoading] = React.useState(false);
  const [trendError, setTrendError] = React.useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = React.useState("Coctelería General");
  const [topicFilter, setTopicFilter] = React.useState("Conceptos");
  const [keyword, setKeyword] = React.useState("");

  // Apply Avatar-based filtering to trends
  const filteredTrendResults = React.useMemo(() => {
    return orchestratorActions.filterTrendsByAvatar(trendResults);
  }, [trendResults, orchestratorActions]);

  /* Safe JSON Parse Helper */
  const safeJsonParse = (raw: string): any => {
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { summary: "Error al parsear respuesta IA: " + raw.substring(0, 50) + "..." };
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

      const { CORE_CREATIVE_DIRECTOR } = await import('../services/ai/systemPersonas');

      // Prompt Engineering for JSON
      const systemInstruction = `
      ${CORE_CREATIVE_DIRECTOR}
      
      SPECIFIC EXPERTISE: Eres un copywriter experto en storytelling para coctelería.
      
      CRITICAL: Return ONLY valid JSON matching the schema below.
      ${JSON.stringify(powerPrompt.responseSchema, null, 2)}`;

      const response = await generateText(
        powerPrompt.prompt,
        systemInstruction
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

  const handleTrendSearch = async () => {
    setTrendLoading(true);
    setTrendError(null);
    setTrendResults([]);

    const fullPrompt = `Analiza tendencias actuales de coctelería.
    Fuente: ${sourceFilter}.
    Tema: ${topicFilter}.
    Palabra clave: ${keyword || "General"}.
    Genera 3 conceptos de cócteles innovadores basados en estas tendencias.
    Devuelve SOLO un array JSON válido.`;

    const generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            conceptName: { type: Type.STRING },
            trendScore: { type: Type.NUMBER },
            description: { type: Type.STRING },
            ingredientsKey: { type: Type.ARRAY, items: { type: Type.STRING } },
            popularityRegion: { type: Type.STRING },
            visualStyle: { type: Type.STRING }
          }
        }
      }
    };

    try {
      // JSON enforcement via prompt since Gateway is text-only
      const fullPromptWithSchema = `${fullPrompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema.`;

      const response = await generateText(fullPromptWithSchema, "Eres un experto mixólogo y cazador de tendencias.");

      let data: TrendResult[] = [];
      try {
        data = safeJsonParse(response.text);
        if (!Array.isArray(data)) throw new Error("Format invalid");
      } catch (e) {
        // Fallback or retry logic could go here
        throw new Error("Failed to parse Trends JSON");
      }

      try {
        const trendDoc = {
          titulo: `${topicFilter} - ${keyword || sourceFilter}`,
          resumen: JSON.stringify(data),
          fuente: sourceFilter,
          results: data,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db!, `users/${userId}/trend-history`), trendDoc);
      } catch (e) { console.warn("Failed to save history", e) }

      setTrendResults(data);
    } catch (e: any) {
      setTrendError(e.message || "Error al buscar tendencias");
    } finally {
      setTrendLoading(false);
    }
  };

  // --- Helper fun/ti/ -fee renuernctontructur d pr rerrcsdlrl ------
  const renderPowerContent = (data: any) => {
    if (!data) return null;

    return (
      <div className="space-y-8 text-gray-800 dark:text-gray-200">

        {data.title && (
          <h2 className="text-2xl font-bold tracking-tight text-center mb-6 text-gray-900 dark:text-gray-100">
            {data.title}
          </h2>
        )}

        {data.summary && (
          <p className="text-lg leading-relaxed text-center opacity-90">
            {data.summary}
          </p>
        )}

        {data.sections && (
          <div className="space-y-6">
            {data.sections.map((section: any, i: number) => (
              <div key={i} className="p-5 rounded-xl bg-white/5 dark:bg-black/20 border border-white/10 shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-violet-600 dark:text-violet-400">
                  {section.heading}
                </h3>
                <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {data.lists && (
          <div className="space-y-6">
            {data.lists.map((list: any, i: number) => (
              <div key={i} className="p-5 rounded-xl bg-white/5 dark:bg-black/20 border border-white/10">
                <h3 className="text-xl font-semibold mb-3 text-cyan-600 dark:text-cyan-400">
                  {list.heading}
                </h3>

                <ul className="space-y-3">
                  {list.items.map((item: string, j: number) => (
                    <li key={j} className="leading-relaxed text-gray-700 dark:text-gray-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {data.tables && (
          <div className="space-y-10">
            {data.tables.map((table: any, i: number) => (
              <div key={i} className="space-y-4">
                <h3 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {table.heading}
                </h3>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-full border-collapse backdrop-blur bg-white/5 dark:bg-black/20">
                    <thead>
                      <tr className="text-left bg-white/10 dark:bg-white/5">
                        {table.columns.map((col: string, j: number) => (
                          <th key={j} className="px-4 py-3 font-semibold border-b border-white/10">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row: string[], r: number) => (
                        <tr key={r} className="border-b border-white/5 hover:bg-white/5 transition">
                          {row.map((cell: string, c: number) => (
                            <td key={c} className="px-4 py-3 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  };

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

      // Build Prompt with explicit Schema instruction
      // Dynamic import to avoid cycles or load delay
      const { CORE_CREATIVE_DIRECTOR } = await import('../services/ai/systemPersonas');

      const schemaString = JSON.stringify(powerPrompt.responseSchema, null, 2);

      // Merge Core Persona + Specific System Instruction + JSON Enforcement
      const systemInstruction = `
      ${CORE_CREATIVE_DIRECTOR}
      
      SPECIFIC EXPERTISE: ${powerPrompt.systemInstruction || "Experto en mixología."}
      
      CRITICAL: Return ONLY valid JSON.
      Expected Schema:
      ${schemaString}`;

      const response = await generateText(
        powerPrompt.prompt,
        systemInstruction
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
          prompt: `Basado en ${context}, genera 3 propuestas de garnish con ESTRICTA PRECISIÓN TÉCNICA:
          
          1. Opción Minimalista (Elegancia pura)
          2. Opción Avanzada (Técnica moderna)
          3. Opción Conceptual (Multisensorial/Experiencial)

          PARA CADA OPCIÓN DETALLA:
          - Herramientas exactas (ej. "Tijeras de precisión", "Pelador Y en juliana").
          - Técnica de corte o preparación (ej. "Corte al bies 45º", "Deshidratado 6h a 50ºC").
          - Posicionamiento exacto en el vaso.
          - Justificación olfativa/gustativa (Por qué funciona).
          
          Devuelve JSON con claves: 'simple', 'avanzado', 'experto'.`,
          systemInstruction: 'Eres un experto en garnish de alta cocina y diseño industrial. No uses términos vagos como "cortar". Usa términos técnicos.',
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
      setTextToAnalyze(null); // Mark as processed
    } else if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [initialText, setTextToAnalyze, location.state]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!selectedRecipe && !rawInput.trim()) {
      setError("Por favor, seleccione una receta o introduzca ingredientes.");
      setLoading(false);
      return;
    }

    const promptBase = selectedRecipe ? `Receta: ${selectedRecipe.nombre}.\nIngredientes: ${selectedRecipe.ingredientes?.map(i => i.nombre).join(', ')}` : `Concepto/Ingredientes: ${rawInput}`;

    try {
      // 1. Text Generation via Orchestrator (World Class Logic)
      const worldClassResult = await orchestratorActions.generateWorldClassOutput(promptBase);

      // Map Orchestrator Output to CerebrityResult structure
      // Note: We map 'ejecucion_tecnica' to 'mejora' approx, or combine fields.
      // Dynamic Visual Prompt Construction
      // We extract key visual elements to prevent "generic cup" syndrome
      const techDetails = worldClassResult.ejecucion_tecnica || "";
      const visualCues = [
        worldClassResult.titulo,
        techDetails.includes("hielo") ? "clear ice block" : "",
        techDetails.includes("espuma") ? "velvet foam" : "",
        techDetails.includes("rojo") ? "ruby red liquid" : "",
        techDetails.includes("azul") ? "deep blue liquid" : "",
        techDetails.includes("verde") ? "vibrant green liquid" : "",
        techDetails.includes("oro") ? "gold flakes" : "",
        techDetails.includes("humo") ? "subtle smoke" : "",
        // Add random variaiton hints
        Math.random() > 0.5 ? "minimalist concrete bar" : "dark moody marble bar",
        Math.random() > 0.5 ? "top down angle" : "45 degree angle macro"
      ].filter(Boolean).join(", ");

      const textResult: CerebrityResult & { isWorldClass?: boolean } = {
        mejora: `[${worldClassResult.titulo}] ${worldClassResult.intencion_cognitiva}\n\nDECISIONES CLAVE:\n${worldClassResult.decisiones_clave.join('\n- ')}\n\nEJECUCIÓN TÉCNICA:\n${worldClassResult.ejecucion_tecnica}`,
        garnishComplejo: "Garnish alineado con " + worldClassResult.firma_world_class,
        storytelling: worldClassResult.is_world_class ? `NARRATIVA WORLD CLASS: ${worldClassResult.firma_world_class} - ${worldClassResult.intencion_cognitiva}` : worldClassResult.intencion_cognitiva,
        // The raw input to the Image Generator.
        // We rely on ImageGenerator to handle the "Style" but we provide the "Subject" specifics here.
        promptImagen: `Cocktail: ${worldClassResult.titulo}. Visual cues: ${visualCues}. Garnish details from: ${techDetails.slice(0, 100)}.`,
        imageUrl: null,
        isWorldClass: worldClassResult.is_world_class
      };

      setResult(textResult);

      // 2. Image Generation (Unified Engine)
      setImageLoading(true);

      // We use the imported ImageGenerator directly (no dynamic import needed if top-level works)
      const imageUrlOrBase64 = await ImageGenerator.generateImageUrl(textResult.promptImagen);
      let downloadURL = imageUrlOrBase64;

      if (!storage) throw new Error("Storage no disponible");
      const storageRef = ref(storage, `users/${userId}/recipe-images/${Date.now()}.jpg`);

      // Prepare data for upload
      let base64Data = "";

      if (imageUrlOrBase64.startsWith('data:image')) {
        // If it's base64 (Gemini), we upload it
        base64Data = imageUrlOrBase64.split(',')[1];
      }

      // If it's strictly a URL (Pollinations), we just save the URL directly to Firestore.
      // Trying to fetch -> blob -> upload often triggers CORS hurdles.
      // We rely on the hotlink.

      // Upload if we have data
      if (base64Data) {
        await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
        downloadURL = await getDownloadURL(storageRef);
      }

      setResult(prev => prev ? ({ ...prev, imageUrl: downloadURL }) : null);

      await addDoc(collection(db!, `users/${userId}/cerebrity-history`), {
        ...textResult,
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
        orchestratorData: worldClassResult
      });

    } catch (e: any) {
      setError("Error en la generación visual: " + e.message);
      // Don't kill the text result if image fails
      if (result) {
        // Just ensure loading is off
      }
    } finally {
      setLoading(false);
      setImageLoading(false);
      setAiOffline(isGatewayDown());
    }
  };

  const confirmSave = async (content: string, destination: 'pizarron' | 'recetas', powerName: string) => {
    try {
      if (destination === 'pizarron') {
        // Write a proper Pizarrón card shape so it renders correctly on the
        // user's active board (title/texto + type + position are required by
        // the board reader; boardId must match a real board).
        const title = `💡 ${powerName}`;
        await addDoc(collection(db!, `artifacts/${appId}/public/data/pizarron-tasks`), {
          type: 'card',
          title,
          texto: title,
          body: content.substring(0, 1000),
          position: { x: 80 + Math.round(Math.random() * 200), y: 80 + Math.round(Math.random() * 160) },
          width: 240,
          height: 140,
          zIndex: 1,
          boardId: activeBoardId,
          style: { backgroundColor: '#ede9fe' },
          createdAt: serverTimestamp(),
          updatedAt: Date.now(),
        });
        setSaveToast('Idea guardada en el Pizarrón');
        setTimeout(() => setSaveToast(null), 2500);
      } else {
        setShowRecipeModal(true, { nombre: `[${powerName}] Idea`, storytelling: content });
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
      // Single-result powers (analysis, mapping...) → flatten to readable text
      // instead of dumping raw JSON into the Pizarrón card.
      confirmSave(flattenPowerOutput(output), 'pizarron', powerName);
    }
  };

  /** Turns a structured power result into clean, human-readable text. */
  const flattenPowerOutput = (output: any): string => {
    if (!output || typeof output !== 'object') return String(output ?? '');
    const parts: string[] = [];
    if (output.summary) parts.push(output.summary);
    if (typeof output.score === 'number') parts.push(`Puntuación: ${output.score}/100`);
    if (output.explanation) parts.push(output.explanation);
    (output.sections || []).forEach((s: any) => parts.push(`${s.heading}: ${s.content}`));
    (output.lists || []).forEach((l: any) => parts.push(`${l.heading}:\n- ${(l.items || []).join('\n- ')}`));
    (output.tables || []).forEach((t: any) => {
      parts.push(t.heading);
      (t.rows || []).forEach((row: string[]) => parts.push(`• ${row.join(' · ')}`));
    });
    return parts.filter(Boolean).join('\n\n') || 'Resultado generado por Cerebrity.';
  };

  // ── Columnas declaradas una vez, consumidas por escritorio y por móvil ──
  const { isMobile, isTablet } = useResponsive();
  const useStackedLayout = isMobile || isTablet;
  const isSingleColumn = activeTab === 'makeMenu' || activeTab === 'critic';

  // El color del módulo tiñe el agarre de las hojas y las pestañas de borde.
  const accentClass = activeTab === 'creativity' ? 'bg-fuchsia-500'
    : activeTab === 'lab' ? 'bg-violet-500'
      : 'bg-cyan-500';

  const historyColumn = activeTab === 'creativity'
    ? <CerebrityHistorySidebar db={db!} userId={userId!} onLoadHistory={(item) => setResult(item)} />
    : activeTab === 'lab'
      ? <TheLabHistorySidebar db={db!} historyPath={`users/${userId}/the-lab-history`} onLoadHistory={(item) => setLabResult(item.result)} />
      : <TrendHistorySidebar db={db!} trendHistoryPath={`users/${userId}/trend-history`} onLoadHistory={(item) => setTrendResults((item as any).results || [])} />;

  const mainColumn = isSingleColumn
    ? (activeTab === 'makeMenu' ? <MakeMenuView db={db!} userId={userId!} appId={appId!} /> : <CriticView />)
    : activeTab === 'creativity'
      ? <CreativityTab db={db!} userId={userId!} appId={appId!} allRecipes={allRecipes} selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe} rawInput={rawInput} setRawInput={setRawInput} handleGenerate={handleGenerate} loading={loading} imageLoading={imageLoading} error={error} result={result} setResult={setResult} onOpenRecipeModal={(r) => setShowRecipeModal(true, r)} />
      : activeTab === 'lab'
        ? <LabView db={db!} userId={userId!} appId={appId!} allIngredients={allIngredients} allRecipes={allRecipes} labResult={labResult} setLabResult={setLabResult} labInputs={labInputs} setLabInputs={setLabInputs} />
        : <TrendLocatorTab loading={trendLoading} error={trendError} trendResults={filteredTrendResults} trendSources={[]} db={db!} userId={userId!} appId={appId!} trendHistoryPath={`users/${userId}/trend-history`} />;

  const toolsColumn = activeTab === 'trendLocator'
    ? <TrendLocatorControls sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} topicFilter={topicFilter} setTopicFilter={setTopicFilter} keyword={keyword} setKeyword={setKeyword} loading={trendLoading} onSearch={handleTrendSearch} />
    : <PowerTreeColumn mode={activeTab === 'creativity' ? 'cerebrity' : 'lab'} powers={allPowers} onClickPower={handlePowerClick} />;

  return (
    <div className="min-h-full lg:h-[calc(100dvh-2rem)] w-full flex flex-col px-3 lg:px-8 pt-1 pb-3 lg:py-6 relative">
      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-[60] px-4 py-2.5 bg-emerald-500/90 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
          <span>✓</span> {saveToast}
        </div>
      )}

      {/* Vibrant Gradient Background (Mobile Style) - First Child = Behind */}
      <div
        className="fixed lg:absolute inset-x-0 top-0 h-[100dvh] lg:h-full pointer-events-none transition-all duration-700 ease-in-out rounded-3xl z-0"
        style={{
          background: activeTab === 'creativity'
            ? 'linear-gradient(180deg, #FF00CC 0%, rgba(255, 0, 204, 0.4) 30%, rgba(255, 0, 204, 0) 45%)'
            : activeTab === 'makeMenu'
              ? 'linear-gradient(180deg, #84CC16 0%, rgba(132, 204, 22, 0.4) 30%, rgba(132, 204, 22, 0) 45%)'
              : activeTab === 'critic'
                ? 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.4) 30%, rgba(6, 182, 212, 0) 45%)'
                : activeTab === 'lab'
                  ? 'linear-gradient(180deg, #8b5cf6 0%, rgba(139, 92, 246, 0.4) 30%, rgba(139, 92, 246, 0) 45%)'
                  : 'linear-gradient(180deg, #F59E0B 0%, rgba(245, 158, 11, 0.4) 30%, rgba(245, 158, 11, 0) 45%)'
        }}
      />

      {/* Mobile-Style Header (Desktop Adapted) - z-10 to stay on top */}
      <div className="flex-shrink-0 mb-3 lg:mb-6 z-10 text-white relative">
        <div className="mb-4 pl-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[3.75rem] lg:text-7xl font-black italic tracking-tighter leading-[0.8] mb-1 drop-shadow-xl"
              style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
              Cerebrity
            </h1>
            {aiOffline && (
              <span
                title="La IA no está disponible — el motor creativo necesita el AI Gateway activo"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-50 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm self-start mt-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                Modo IA-off
              </span>
            )}
          </div>
          <p className="text-xl font-bold tracking-widest uppercase opacity-90 pl-1">
            {activeTab === 'creativity' ? 'SYNTHESIS' :
              activeTab === 'makeMenu' ? 'MAKE MENU' :
                activeTab === 'critic' ? 'THE CRITIC' :
                  activeTab === 'lab' ? 'THE LAB' : 'TRENDS'}
          </p>
        </div>

        <div className="flex gap-2 lg:gap-3 overflow-x-auto snap-x snap-mandatory py-2 lg:py-4 px-2 lg:px-6 scrollbar-hide">
          {[
            { id: 'creativity', label: 'SYNTHESIS', icon: 'auto_awesome', color: '#FF00CC' },
            { id: 'makeMenu', label: 'MAKE MENU', icon: 'edit_note', color: '#84CC16' },
            { id: 'critic', label: 'CRITIC', icon: 'rate_review', color: '#06b6d4' },
            { id: 'lab', label: 'THE LAB', icon: 'science', color: '#8b5cf6' },
            { id: 'trendLocator', label: 'TRENDS', icon: 'trending_up', color: '#F59E0B' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest 
                  flex items-center gap-2 transition-all duration-300
                  ${isActive
                    ? 'bg-white shadow-xl scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }
                `}
                style={{ color: isActive ? tab.color : undefined }}
              >
                <span className={`material-symbols-outlined !text-base ${isActive ? 'fill-1' : ''}`}
                  style={{ color: 'inherit' }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Las tres columnas se declaran una sola vez y las consumen ambos
          modelos: la rejilla de escritorio y la pila móvil. */}
      {isSingleColumn ? (
        <div className="grow lg:h-full w-full lg:min-h-0 flex flex-col relative lg:overflow-y-auto rounded-3xl p-0 lg:p-6">
          {mainColumn}
        </div>
      ) : useStackedLayout ? (
        <StackedMobileShell
          main={mainColumn}
          left={historyColumn}
          right={toolsColumn}
          leftLabel="Historial"
          rightLabel={activeTab === 'trendLocator' ? 'Filtros' : 'Poderes'}
          accentClass={accentClass}
        />
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px] gap-4 lg:gap-6 lg:overflow-hidden rounded-3xl relative p-3 lg:p-6">
          <div className="lg:h-full lg:min-h-0 flex flex-col relative">{historyColumn}</div>
          <div className="lg:h-full lg:min-h-0 flex flex-col relative">{mainColumn}</div>
          <div className="lg:h-full lg:min-h-0 flex flex-col relative">{toolsColumn}</div>
        </div>
      )}
      {
        isPowerModalOpen && (
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
        )
      }

      {
        saveModalState.isOpen && (
          <SaveModal
            isOpen={saveModalState.isOpen}
            onClose={() => setSaveModalState({ isOpen: false, options: [], powerName: '' })}
            options={saveModalState.options}
            powerName={saveModalState.powerName}
            onConfirm={confirmSave}
          />
        )
      }
    </div >
  );
};

export default CerebrityView;

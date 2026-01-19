import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { CerebrityHeader } from '../components/CerebrityHeader';
import { CerebrityResponseModal } from '../components/CerebrityResponseModal';
import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { useApp } from '../../../context/AppContext';
import { collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useRecipes } from '../../../hooks/useRecipes';
import { Modal } from '../../../components/ui/Modal';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { safeParseJson } from '../../../utils/json';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebritySynthesis: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { recipes: allRecipes } = useRecipes();
    const { state, actions } = useCerebrityOrchestrator();

    const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
    const [rawInput, setRawInput] = useState("");
    const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
    const [powerModalState, setPowerModalState] = useState<{ title: string; content?: React.ReactNode; loading?: boolean }>({ title: '' });
    const [powerOutput, setPowerOutput] = useState<any>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'success' | 'error' | 'info' | 'ai' } | null>(null);

    // Fetch real history
    const { data: history = [], refetch } = useQuery({
        queryKey: ['cerebrity-history', userId],
        queryFn: async () => {
            if (!db || !userId) return [];
            const { getDocs } = await import('firebase/firestore');
            const q = query(
                collection(db, `users/${userId}/cerebrity-history`),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!db && !!userId
    });

    const allPowers = [
        { name: 'Intensidad Creativa', icon: 'sparkles', color: 'purple' },
        { name: 'Coherencia Técnica', icon: 'lab', color: 'cyan' },
        { name: 'Optimización del Garnish', icon: 'leaf', color: 'green' },
        { name: 'Mejora de Storytelling', icon: 'book', color: 'purple' },
        { name: 'Creative Booster Avanzado', icon: 'bolt', color: 'purple' },
        { name: 'Analizador de Storytelling', icon: 'search_check', color: 'cyan' },
        { name: 'Identificador de Rarezas', icon: 'warning', color: 'orange' },
        { name: 'Harmony Optimizer', icon: 'equalizer', color: 'green' },
        { name: 'Mapeo de Sabores', icon: 'map', color: 'orange' },
    ];

    const getPowerPrompt = (powerName: string, context: string) => {
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
                }
            }
        };

        switch (powerName) {
            case 'Intensidad Creativa':
                return {
                    prompt: `Analiza la creatividad de ${context}. Devuelve un JSON con un 'summary' breve y 'sections' con diagnóstico.`,
                    systemInstruction: 'Eres un director creativo de coctelería de alto nivel.',
                    responseSchema: genericSchema
                };
            case 'Coherencia Técnica':
                return {
                    prompt: `Analiza ${context} y detecta conflictos técnicos. Devuelve 'summary' y 'sections' con fortalezas y problemas.`,
                    systemInstruction: 'Eres un experto técnico en coctelería.',
                    responseSchema: genericSchema
                };
            case 'Optimización del Garnish':
                return {
                    prompt: `Basado en ${context}, genera 3 propuestas de garnish (Simple, Avanzado, Experto). Devuelve JSON con 'summary' y 'sections'.`,
                    systemInstruction: 'Eres un experto en garnish creativo.',
                    responseSchema: genericSchema
                };
            case 'Mejora de Storytelling':
                return {
                    prompt: `A partir de: "${context}", genera 2 variaciones de storytelling. Devuelve JSON con 'summary' y 'sections'.`,
                    systemInstruction: 'Eres un copywriter experto en storytelling para coctelería.',
                    responseSchema: genericSchema
                };
            default:
                return {
                    prompt: `Analiza ${powerName} para el contexto: ${context}. Devuelve JSON con 'summary' y 'sections'.`,
                    systemInstruction: 'Eres un experto en mixología avanzada.',
                    responseSchema: genericSchema
                };
        }
    };

    const handlePowerClick = async (powerName: string) => {
        const recipe = allRecipes.find(r => r.id === selectedRecipeId);
        const contextText = recipe
            ? `Receta: ${recipe.nombre}. Ingredientes: ${recipe.ingredientes?.map(i => i.nombre).join(', ')}`
            : rawInput;

        if (!contextText.trim()) {
            showAlert("Atención", "Necesitas seleccionar una receta o introducir ingredientes en el área de texto.", "info");
            return;
        }

        setIsPowerModalOpen(true);
        setPowerModalState({ title: powerName, loading: true });
        setPowerOutput(null);

        try {
            const powerPrompt = getPowerPrompt(powerName, contextText);
            const response = await callGeminiApi(
                powerPrompt.prompt,
                powerPrompt.systemInstruction,
                { responseMimeType: "application/json", responseSchema: powerPrompt.responseSchema }
            );

            const data = safeParseJson(response.text);
            if (data) {
                setPowerOutput(data);
                setPowerModalState({ title: powerName, loading: false });
            } else {
                throw new Error("Formato de respuesta inválido.");
            }
        } catch (e) {
            console.error("Power Error:", e);
            setPowerModalState({ title: "Error", content: "No se pudo procesar la solicitud.", loading: false });
        }
    };

    const handleSynthesize = async () => {
        const recipeList = allRecipes || [];
        const recipe = recipeList.find(r => r.id === selectedRecipeId);

        // Comprehensive synthesis prompt
        const prompt_base = recipe
            ? `Evoluciona esta receta: ${recipe.nombre}. Complementos: ${rawInput || 'ninguno'}`
            : rawInput || "Genera un concepto de coctelería disruptivo desde cero.";

        // Apply Avatar's cognitive filter
        const finalPrompt = actions.getSynthesisFilter(prompt_base);

        try {
            const worldClassResult = await actions.generateWorldClassOutput(finalPrompt);

            // Save to Firestore (Desk parity)
            if (db && userId) {
                const textResult = {
                    mejora: `[${worldClassResult.titulo}] ${worldClassResult.intencion_cognitiva}\n\nDECISIONES CLAVE:\n${worldClassResult.decisiones_clave.join('\n- ')}\n\nEJECUCIÓN TÉCNICA:\n${worldClassResult.ejecucion_tecnica}`,
                    garnishComplejo: "Garnish alineado con " + worldClassResult.firma_world_class,
                    storytelling: worldClassResult.is_world_class ? `NARRATIVA WORLD CLASS: ${worldClassResult.firma_world_class} - ${worldClassResult.intencion_cognitiva}` : worldClassResult.intencion_cognitiva,
                    promptImagen: `Professional cocktail photography, ${worldClassResult.titulo}, ${worldClassResult.ejecucion_tecnica}, cinematic lighting, 8k, highly detailed`,
                    imageUrl: null,
                    createdAt: serverTimestamp(),
                    orchestratorData: worldClassResult
                };

                await addDoc(collection(db, `users/${userId}/cerebrity-history`), textResult);
                refetch();
                showAlert('Síntesis Completada', 'La nueva síntesis se ha guardado correctamente en tu historial creativo.', 'success');
            }
        } catch (e) {
            console.error("Synthesis Error:", e);
            showAlert('Error', 'Hubo un problema al generar la síntesis.', 'error');
        }
    };

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'ai' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <CerebrityHeader
                currentPage={PageName.CerebritySynthesis}
                onNavigate={onNavigate}
            />




            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Action Card */}
                <GlassCard rounded="3xl" padding="lg" className="bg-gradient-to-r from-pink-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF00CC] flex items-center justify-center text-white shadow-xl action-glow-pink flex-shrink-0">
                            <span className="material-symbols-outlined text-3xl fill-1">auto_awesome</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-0.5">Síntesis Cognitiva</h3>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight opacity-70">
                                Punto de partida para exploración creativa
                            </p>
                        </div>
                    </div>

                    {/* Desktop Parity Form */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2 px-1">Anclaje Material</label>
                            <select
                                value={selectedRecipeId}
                                onChange={(e) => setSelectedRecipeId(e.target.value)}
                                className="w-full bg-white/50 border border-zinc-200 rounded-2xl py-3 px-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-pink-500/20 transition-all appearance-none"
                            >
                                <option value="">Seleccionar receta base...</option>
                                {(allRecipes || []).map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5 px-1">Elementos Libres</label>
                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                placeholder="Ej: Ginebra, tónica, piel de limón, romero..."
                                className="w-full bg-white/50 border border-zinc-200 rounded-2xl py-3 px-4 text-[11px] font-medium text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-pink-500/20 transition-all resize-none h-20"
                            />
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#FF00CC"
                        customGradient="linear-gradient(135deg, #FF00CC 0%, #D946EF 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        onClick={handleSynthesize}
                        loading={state.isGenerating}
                        icon={<span className="material-symbols-outlined !text-base">bolt</span>}
                        iconPosition="right"
                    >
                        {state.isGenerating ? 'SINTETIZANDO...' : 'SINTETIZAR'}
                    </PremiumButton>
                </GlassCard>

                {/* AI Powers Grid */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Herramientas de IA</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {allPowers.map((power, i) => (
                            <button
                                key={i}
                                onClick={() => handlePowerClick(power.name)}
                                className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-white/10 backdrop-blur-md border border-white/20 active:scale-95 transition-all text-center group"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-${power.color}-500/20 flex items-center justify-center mb-2 group-hover:bg-${power.color}-500/40 transition-colors`}>
                                    <span className={`material-symbols-outlined text-${power.color}-400 text-xl`}>{power.icon}</span>
                                </div>
                                <span className="text-[8px] font-black text-white leading-tight uppercase tracking-tight opacity-80">{power.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI History */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Investigaciones Recientes</h3>
                    {history.length === 0 ? (
                        <div className="text-center p-8 text-white/40 text-xs italic">
                            No hay investigaciones previas. ¡Empieza a sintetizar!
                        </div>
                    ) : (
                        history.map((item: any, i: number) => (
                            <GlassCard
                                key={item.id || i}
                                rounded="3xl"
                                padding="md"
                                className="mb-3"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="text-lg font-bold text-zinc-900 line-clamp-1">
                                            {item.orchestratorData?.titulo || "Investigación sin título"}
                                        </h4>
                                        <p className="text-xs text-zinc-500 line-clamp-2">
                                            {item.storytelling}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex-shrink-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-pink-600 fill-1">history</span>
                                    </div>
                                </div>

                                {item.orchestratorData?.decisiones_clave && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {item.orchestratorData.decisiones_clave.slice(0, 2).map((tag: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-pink-50 text-pink-600 rounded-full text-[9px] font-bold uppercase tracking-wide truncate max-w-[150px]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => showAlert(item.orchestratorData?.titulo || "Detalles", item.mejora, "ai")}
                                        className="flex-[0.3] py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                    >
                                        Detalles
                                    </button>
                                    <PremiumButton
                                        customColor="#FF00CC"
                                        variant="secondary"
                                        size="md"
                                        className="flex-1"
                                        onClick={() => showAlert("Cargar Base", `Cargando ${item.orchestratorData?.titulo} como base...`, "info")}
                                    >
                                        Usar como Base
                                    </PremiumButton>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </main>

            {/* Power Modal */}
            <Modal
                isOpen={isPowerModalOpen}
                onClose={() => setIsPowerModalOpen(false)}
                title={powerModalState.title}
            >
                <div className="p-2">
                    {powerModalState.loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Analizando...</p>
                        </div>
                    ) : powerOutput ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <p className="text-sm text-zinc-700 leading-relaxed font-medium italic bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                {powerOutput.summary}
                            </p>

                            <div className="space-y-4">
                                {powerOutput.sections?.map((section: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest">{section.heading}</h4>
                                        <p className="text-xs text-zinc-600 leading-relaxed">{section.content}</p>
                                    </div>
                                ))}
                            </div>

                            <PremiumButton
                                customColor="#FF00CC"
                                variant="secondary"
                                size="md"
                                fullWidth
                                onClick={() => setIsPowerModalOpen(false)}
                            >
                                CERRAR RESULTADO
                            </PremiumButton>
                        </div>
                    ) : (
                        <p className="text-center py-10 text-zinc-400 text-sm">{powerModalState.content}</p>
                    )}
                </div>
            </Modal>

            {/* Premium Response Modal */}
            {alertConfig && (
                <CerebrityResponseModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />
            )}
        </div>
    );
};

export default CerebritySynthesis;

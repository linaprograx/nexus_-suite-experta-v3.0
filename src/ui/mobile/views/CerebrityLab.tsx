import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { useIngredients } from '../../../hooks/useIngredients';
import { useRecipes } from '../../../hooks/useRecipes';
import { useApp } from '../../../context/AppContext';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { safeParseJson } from '../../../utils/json';
import { CerebrityResponseModal } from '../components/CerebrityResponseModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityLab: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();
    const { state, actions } = useCerebrityOrchestrator();

    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [labResult, setLabResult] = useState<any | null>(null);
    const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
    const [powerModalState, setPowerModalState] = useState<{ title: string; content?: React.ReactNode; loading?: boolean }>({ title: '' });
    const [powerOutput, setPowerOutput] = useState<any>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'success' | 'error' | 'info' | 'ai' } | null>(null);
    const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

    // Fetch real history
    const { data: history = [], refetch } = useQuery({
        queryKey: ['the-lab-history', userId],
        queryFn: async () => {
            if (!db || !userId) return [];
            const { getDocs } = await import('firebase/firestore');
            const q = query(
                collection(db, `users/${userId}/the-lab-history`),
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

    const toggleItem = (item: any) => {
        setSelectedItems(prev => prev.find(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]);
    };

    const handleIngredientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const item = ingredients.find(i => i.id === e.target.value);
        if (item) toggleItem(item);
        setSelectedIngredientId('');
    };

    const handleRecipeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const item = recipes.find(r => r.id === e.target.value);
        if (item) toggleItem(item);
        setSelectedRecipeId('');
    };

    const handlePowerClick = async (powerName: string) => {
        const contextText = selectedItems.map(i => i.nombre).join(', ');
        if (!contextText.trim()) {
            setAlertConfig({
                isOpen: true,
                title: 'Laboratorio Vacío',
                message: 'Añade ingredientes o recetas al laboratorio para poder aplicar las herramientas de análisis molecular.',
                type: 'info'
            });
            return;
        }

        setIsPowerModalOpen(true);
        setPowerModalState({ title: powerName, loading: true });
        setPowerOutput(null);

        try {
            const systemPrompt = "Eres un experto en mixología molecular y análisis de sabores.";
            const response = await callGeminiApi(
                `Analiza ${powerName} para la combinación: ${contextText}. Devuelve JSON con 'summary' y 'sections' (array de {heading, content}).`,
                systemPrompt,
                { responseMimeType: "application/json" }
            );

            const data = safeParseJson(response.text);
            if (data) {
                setPowerOutput(data);
                setPowerModalState({ title: powerName, loading: false });
            } else {
                throw new Error("Respuesta inválida");
            }
        } catch (e) {
            console.error("Power Error:", e);
            setPowerModalState({ title: "Error", content: "No se pudo procesar la solicitud.", loading: false });
        }
    };

    const handleStartExperiment = async () => {
        if (selectedItems.length === 0) {
            setAlertConfig({
                isOpen: true,
                title: 'Falta Composición',
                message: 'Debes seleccionar al menos un componente para iniciar el experimento.',
                type: 'info'
            });
            return;
        }

        const promptData = selectedItems.map(item => item.nombre).join(', ');
        const systemPrompt = "Eres un científico de alimentos experto en Flavor Pairing...";

        setIsGeneratingLocally(true);
        try {
            const response = await callGeminiApi(
                `Analiza la combinación: ${promptData}. Devuelve un JSON con: 'perfil', 'clasicos' (array), 'moleculares' (array), 'tecnica' (string), y 'perfilSabor' (objeto con dulce, acido, amargo, salado, umami, herbal, especiado).`,
                systemPrompt,
                {
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
                                    dulce: { type: Type.NUMBER },
                                    acido: { type: Type.NUMBER },
                                    amargo: { type: Type.NUMBER },
                                    salado: { type: Type.NUMBER },
                                    umami: { type: Type.NUMBER },
                                    herbal: { type: Type.NUMBER },
                                    especiado: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            );

            const result = safeParseJson(response.text);
            if (result) {
                setLabResult(result);

                if (db && userId) {
                    await addDoc(collection(db, `users/${userId}/the-lab-history`), {
                        combination: promptData,
                        result,
                        createdAt: serverTimestamp()
                    });
                    refetch();
                }
            } else {
                throw new Error("Error en el formato de análisis.");
            }
        } catch (e) {
            console.error("Lab Error:", e);
            setAlertConfig({
                isOpen: true,
                title: 'Error de Análisis',
                message: 'No se pudo completar el experimento molecular. Intenta cambiar la combinación de elementos.',
                type: 'error'
            });
        } finally {
            setIsGeneratingLocally(false);
        }
    };

    // 🧠 Hard Logic: Lab Analysis Bias
    const analysisBias = actions.getLabAnalysisBias();

    // Mock compositions
    const activeComps = [
        { name: 'Botanical Fusion', ingredients: 5, status: 'In Progress', progress: 65 },
        { name: 'Tropical Blend', ingredients: 4, status: 'Testing', progress: 85 },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header Removed (Hoisted to Layout) */}



            {/* 🧠 Hard Logic: Analysis Bias Card */}
            <div className="px-5 mb-3">
                <div className="p-3 rounded-2xl bg-indigo-900/40 backdrop-blur-xl border border-white/10 flex items-center gap-3 shadow-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <span className="material-symbols-outlined text-indigo-400 text-sm fill-1">biotech</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] text-white/90 font-medium leading-tight line-clamp-1">{analysisBias}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* New Experiment Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-fuchsia-50 to-transparent dark:!bg-white/5 dark:from-fuchsia-900/10 dark:to-transparent dark:!border-white/10">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-xl action-glow-pink">
                            <span className="material-symbols-outlined text-3xl fill-1">science</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Nuevo Experimento</h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{selectedItems.length} elementos seleccionados</p>
                        </div>
                    </div>

                    {/* Desktop Parity Selectors */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <select
                                value={selectedIngredientId}
                                onChange={handleIngredientSelect}
                                className="w-full bg-white/50 dark:!bg-white/5 border border-zinc-200 dark:!border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-zinc-900 dark:text-white outline-none appearance-none"
                            >
                                <option value="">+ Ingrediente</option>
                                {ingredients.slice(0, 20).map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <select
                                value={selectedRecipeId}
                                onChange={handleRecipeSelect}
                                className="w-full bg-white/50 dark:!bg-white/5 border border-zinc-200 dark:!border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-zinc-900 dark:text-white outline-none appearance-none"
                            >
                                <option value="">+ Receta</option>
                                {recipes.slice(0, 15).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {selectedItems.length === 0 && <p className="text-[10px] text-zinc-400 italic py-2 px-1">Selecciona elementos para analizar...</p>}
                        {selectedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white dark:bg-fuchsia-900/40 border border-fuchsia-200 dark:border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-tight shadow-sm animate-in zoom-in-50 duration-200">
                                <span>{item.nombre}</span>
                                <button onClick={() => toggleItem(item)} className="material-symbols-outlined text-[14px] hover:text-fuchsia-900 dark:hover:text-fuchsia-100 transition-colors">close</button>
                            </div>
                        ))}
                    </div>

                    <PremiumButton
                        customColor="#F000FF"
                        customGradient="linear-gradient(135deg, #F000FF 0%, #6200EE 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        onClick={handleStartExperiment}
                        loading={isGeneratingLocally || state.isGenerating}
                        disabled={selectedItems.length === 0 || isGeneratingLocally}
                        icon={<span className="material-symbols-outlined !text-base">biotech</span>}
                        iconPosition="right"
                    >
                        {isGeneratingLocally || state.isGenerating ? 'ANALIZANDO...' : 'EVALUAR COMPOSICIÓN'}
                    </PremiumButton>
                </GlassCard>

                {/* AI Powers Grid (Lab Edition) */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Herramientas de Análisis</h3>
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
                                <span className="text-[6px] font-black text-white leading-tight uppercase tracking-tight opacity-80">{power.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lab Result Display */}
                {labResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Perfil Molecular</h3>
                        <GlassCard rounded="3xl" padding="md" className="mb-6 bg-white dark:!bg-white/5 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                            <div className="p-5 mb-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-inner">
                                <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">science</span>
                                    Diagnóstico Molecular
                                </h4>
                                <p className="text-sm font-bold text-zinc-900 leading-relaxed italic">"{labResult.perfil}"</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {Object.entries(labResult.perfilSabor).map(([flavor, val]: [string, any]) => (
                                    <div key={flavor} className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <div className="flex justify-between items-center px-0.5">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">{flavor}</span>
                                            <span className="text-[10px] font-black text-zinc-900">{val}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-zinc-900 rounded-full transition-all duration-1000"
                                                style={{ width: `${val}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4">
                                <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider mb-2">Técnica Sugerida</h4>
                                <p className="text-xs text-indigo-900 leading-relaxed">{labResult.tecnica}</p>
                            </div>

                            <p className="text-xs text-zinc-600 line-clamp-3 italic opacity-80">{labResult.perfil}</p>
                        </GlassCard>
                    </div>
                )}

                {/* Lab History */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Experimentos Recientes</h3>
                    {history.length === 0 ? (
                        <div className="text-center p-8 text-white/40 text-xs italic">
                            Sin experimentos previos.
                        </div>
                    ) : (
                        history.map((item: any, i: number) => (
                            <GlassCard
                                key={item.id || i}
                                rounded="3xl"
                                padding="md"
                                className="mb-3 bg-white/40 dark:!bg-white/5 border-white/20 dark:!border-white/10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{item.combination}</h4>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{item.result?.tecnica}</p>
                                    </div>
                                    <button
                                        onClick={() => setLabResult(item.result)}
                                        className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600"
                                    >
                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                    </button>
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
                            <div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Procesando Poder...</p>
                        </div>
                    ) : powerOutput ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <p className="text-xs text-zinc-700 leading-relaxed font-medium italic bg-fuchsia-50/50 p-4 rounded-2xl border border-fuchsia-100">
                                {powerOutput.summary}
                            </p>

                            <div className="space-y-4">
                                {powerOutput.sections?.map((section: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="text-[10px] font-black text-fuchsia-600 uppercase tracking-widest">{section.heading}</h4>
                                        <p className="text-[11px] text-zinc-600 leading-relaxed">{section.content}</p>
                                    </div>
                                ))}
                            </div>

                            <PremiumButton
                                variant="secondary"
                                customColor="#F000FF"
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

export default CerebrityLab;

import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { useApp } from '../../../context/AppContext';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { safeParseJson } from '../../../utils/json';
import { CerebrityResponseModal } from '../components/CerebrityResponseModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityTrend: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId } = useApp();
    const { state, actions } = useCerebrityOrchestrator();
    const [searchTerm, setSearchTerm] = useState('');
    const [sessionTrends, setSessionTrends] = useState<any[]>([]);
    const [selectedInspiration, setSelectedInspiration] = useState('Global/Sustentabilidad');
    const [selectedFocus, setSelectedFocus] = useState('Ingredientes/Botánicos');
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'success' | 'error' | 'info' | 'ai' } | null>(null);
    const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

    const inspirations = ['Global/Sustentabilidad', 'Arte/Estética', 'Pasado/Retromixología', 'Futuro/Tecnología', 'Ciencia/Molecular'];
    const focusOptions = ['Ingredientes/Botánicos', 'Técnicas/Texturas', 'Cultura/Identidad', 'Experiencia/Ritual'];

    // Fetch real history
    const { data: history = [], refetch } = useQuery({
        queryKey: ['trend-history', userId],
        queryFn: async () => {
            if (!db || !userId) return [];
            const { getDocs } = await import('firebase/firestore');
            const q = query(
                collection(db, `users/${userId}/trend-history`),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!db && !!userId
    });

    const handleTrendSearch = async () => {
        const queryText = searchTerm.trim() || `Tendencias en ${selectedInspiration} enfocado en ${selectedFocus}`;

        setIsGeneratingLocally(true);
        try {
            const systemPrompt = `Eres un analista de tendencias de mercado avanzado. 
        FOCO: ${selectedFocus}. 
        INSPIRACIÓN: ${selectedInspiration}. 
        Busca tendencias emergentes que se alineen con estos filtros.`;

            const response = await callGeminiApi(
                `Busca tendencias para: ${queryText}. Filtros: ${selectedFocus}, ${selectedInspiration}.`,
                systemPrompt,
                {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                growth: { type: Type.STRING },
                                category: { type: Type.STRING },
                                hot: { type: Type.BOOLEAN },
                                avatarAlignment: { type: Type.NUMBER }, // 0 to 100
                                costImpact: { type: Type.STRING }
                            }
                        }
                    }
                }
            );

            const newTrends = safeParseJson(response.text);
            if (newTrends && Array.isArray(newTrends)) {
                setSessionTrends(newTrends);

                if (db && userId) {
                    for (const trend of newTrends.slice(0, 3)) {
                        await addDoc(collection(db, `users/${userId}/trend-history`), {
                            ...trend,
                            query: queryText,
                            createdAt: serverTimestamp()
                        });
                    }
                    refetch();
                }
            } else {
                setAlertConfig({
                    isOpen: true,
                    title: 'Búsqueda Incompleta',
                    message: 'No logramos identificar tendencias claras para esta búsqueda. Intenta refinar los filtros o el término de búsqueda.',
                    type: 'info'
                });
            }
        } catch (e) {
            console.error("Trend Error:", e);
            setAlertConfig({
                isOpen: true,
                title: 'Error de Red',
                message: 'Hubo un problema al conectar con el localizador de tendencias. Por favor, intenta de nuevo.',
                type: 'error'
            });
        } finally {
            setIsGeneratingLocally(false);
        }
    };

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">




            <div className="px-5 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="material-symbols-outlined text-[10px] text-amber-400">filter_alt</span>
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                        Filtrado por Cognición de Avatar
                    </span>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">
                <GlassCard rounded="3xl" padding="md" className="bg-gradient-to-r from-amber-50 to-transparent dark:!bg-white/5 dark:from-amber-500/10 dark:to-transparent dark:!border-white/10">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-xl action-glow-gold">
                            <span className="material-symbols-outlined text-2xl fill-1">trending_up</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Descubrir Tendencias</h3>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400">Análisis de mercado global</p>
                        </div>
                    </div>

                    <div className="mb-3 space-y-2">
                        <div className="bg-white/50 border border-white/60 rounded-[1.25rem] overflow-hidden">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar tendencias..."
                                className="w-full bg-transparent py-3 px-4 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none"
                            />
                        </div>
                        {/* Quick Filters */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 px-1">Eje de Inspiración</p>
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                                    {inspirations.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSelectedInspiration(opt)}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all ${selectedInspiration === opt ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:!bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:!border-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 px-1">Foco de Análisis</p>
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                                    {focusOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSelectedFocus(opt)}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all ${selectedFocus === opt ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:!bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:!border-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <PremiumButton
                            customColor="#FFD43B"
                            variant="gradient"
                            size="lg"
                            fullWidth
                            onClick={handleTrendSearch}
                            loading={isGeneratingLocally}
                            disabled={isGeneratingLocally}
                            icon={<span className="material-symbols-outlined !text-base">search</span>}
                            iconPosition="right"
                        >
                            {isGeneratingLocally ? 'BUSCANDO...' : 'BUSCAR TENDENCIAS'}
                        </PremiumButton>
                    </div>
                </GlassCard>

                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Tendencias Identificadas</h3>

                    {sessionTrends.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {sessionTrends.map((trend, i) => (
                                <GlassCard key={`session-${i}`} rounded="3xl" padding="md" className="border-amber-200 dark:border-white/10 bg-white/10 dark:!bg-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{trend.name}</h4>
                                                {trend.hot && <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full">HOT</span>}
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{trend.category}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            <span className="material-symbols-outlined">trending_up</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}

                    {history.length === 0 && sessionTrends.length === 0 ? (
                        <div className="text-center p-8 text-white/40 text-xs italic">
                            No hay tendencias en el historial. ¡Empieza a buscar!
                        </div>
                    ) : (
                        history.map((trend: any, i: number) => (
                            <GlassCard
                                key={trend.id || i}
                                rounded="3xl"
                                padding="md"
                                className="mb-3 bg-white/40 dark:!bg-white/5 border-white/20 dark:!border-white/10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white line-clamp-1">{trend.name}</h4>
                                            {trend.hot && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-wide flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-xs fill-1">local_fire_department</span>
                                                    HOT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{trend.category}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{trend.growth}</span>
                                            <div className="h-3 w-px bg-zinc-200 dark:bg-white/10"></div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-black text-zinc-400 uppercase">Alineación</span>
                                                <span className={`text-[10px] font-black ${trend.avatarAlignment > 80 ? 'text-amber-600' : 'text-zinc-500'}`}>
                                                    {trend.avatarAlignment}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-600 fill-1">arrow_upward</span>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </main>

            {
                alertConfig && (
                    <CerebrityResponseModal
                        isOpen={alertConfig.isOpen}
                        onClose={() => setAlertConfig(null)}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                    />
                )
            }
        </div >
    );
};

export default CerebrityTrend;

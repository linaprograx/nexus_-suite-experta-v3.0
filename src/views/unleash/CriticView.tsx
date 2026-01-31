import React, { useState, useEffect } from 'react';
// import { Type } from "@google/genai"; // REMOVED
// import { callGeminiApi } from '../../utils/gemini'; // REMOVED
import { blobToBase64 } from '../../utils/blobToBase64';
import CriticControls from '../../components/make-menu/CriticControls';
import CriticDashboard, { CriticResultType } from '../../components/make-menu/CriticDashboard';
import { useCerebrityOrchestrator } from '../../hooks/useCerebrityOrchestrator';
import { useApp } from '../../context/AppContext';
import { AvatarMembershipService } from '../../services/avatarMembershipService';
import { AscensionInvite } from '../../components/membership/AscensionInvite';

const CriticView: React.FC = () => {
    const { actions } = useCerebrityOrchestrator();
    const { userPlan } = useApp();

    // Check membership access
    const canAccessFullCritic = AvatarMembershipService.canAccess('critic_full', userPlan);

    // --- Critic State ---
    const [criticMenuText, setCriticMenuText] = useState('');
    const [criticMenuImage, setCriticMenuImage] = useState<File | null>(null);
    const [loadingCritic, setLoadingCritic] = useState(false);
    const [errorCritic, setErrorCritic] = useState<string | null>(null);
    const [criticResult, setCriticResult] = useState<CriticResultType | null>(null);

    // Configuration State - Auto-selected from Avatar
    const [criticPersona, setCriticPersona] = useState('Inspector Michelin');
    const [criticFocus, setCriticFocus] = useState<string[]>(['Coherencia']);

    // Auto-select persona from Avatar on mount and when Avatar changes
    useEffect(() => {
        const avatarPersona = actions.getCriticPersona();
        setCriticPersona(avatarPersona);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actions.getCriticPersona]);

    // --- Critic Handlers ---
    const handleInvokeCritic = async () => {
        if (!criticMenuText.trim() && !criticMenuImage) return;
        setLoadingCritic(true);
        setErrorCritic(null);
        setCriticResult(null);

        const focusText = criticFocus.length > 0 ? ` Enfócate especialmente en: ${criticFocus.join(', ')}.` : '';
        const systemPrompt = `Actúa como un ${criticPersona}. Analiza el menú. ${focusText} Sé DIRECTO y BREVE. JSON estricto: puntosFuertes, debilidades, oportunidades (max 3 items cada uno), feedback (1 frase).`;

        const parts = [];
        // Text Context
        if (criticMenuText.trim()) {
            parts.push({ text: `Analiza este TEXTO de menú:\n\n${criticMenuText}` });
        } else {
            parts.push({ text: "Analiza la IMAGEN proporcionada." });
        }

        // Image Context
        if (criticMenuImage) {
            const base64Data = await blobToBase64(criticMenuImage);
            parts.push({
                inlineData: {
                    mimeType: criticMenuImage.type,
                    data: base64Data
                }
            });
        }

        try {
            // Dynamic Import
            const { generateMultimodal } = await import('../../services/ai/textService');

            // We pass systemPrompt as the second argument to generateMultimodal
            const response = await generateMultimodal(parts, systemPrompt);

            if (!response.text) throw new Error("La IA no devolvió una crítica válida.");

            // Clean Markdown
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleanText);

            setCriticResult(parsedResult);
        } catch (e: any) {
            console.error("Critic Error:", e);
            setErrorCritic(e.message || "Error al invocar al crítico");
        } finally {
            setLoadingCritic(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[220px,minmax(0,1fr),220px] gap-6">
            {/* Left Sidebar - Configuration */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <div className="h-full rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="font-bold text-slate-800 dark:text-white tracking-wide text-sm uppercase">Configuración</h3>
                    </div>

                    <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Persona Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Perfil del Crítico</label>
                            <select
                                className="w-full bg-white/60 border border-amber-200 rounded-lg p-2 text-sm text-amber-900 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                value={criticPersona}
                                onChange={(e) => setCriticPersona(e.target.value)}
                            >
                                <option value="Inspector Michelin">Inspector Michelin ⭐️</option>
                                <option value="Influencer Trendy">Influencer Trendy 📸</option>
                                <option value="Auditor Financiero">Auditor Financiero 💰</option>
                                <option value="Experto en Sostenibilidad">Experto Sostenibilidad 🌱</option>
                                <option value="Cliente Furioso">Cliente Furioso 😡</option>
                            </select>
                            <p className="text-[10px] text-amber-700/60 leading-tight">
                                Define la personalidad y severidad del análisis.
                            </p>
                        </div>

                        {/* Focus Toggles */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Foco Principal</label>
                            <div className="space-y-2">
                                {['Rentabilidad', 'Originalidad', 'Coherencia', 'Tendencias'].map(focus => (
                                    <label key={focus} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="accent-amber-600 w-4 h-4 rounded border-amber-300"
                                            checked={criticFocus.includes(focus)}
                                            onChange={(e) => {
                                                if (e.target.checked) setCriticFocus([...criticFocus, focus]);
                                                else setCriticFocus(criticFocus.filter(f => f !== focus));
                                            }}
                                        />
                                        <span className="text-sm text-slate-600 group-hover:text-amber-700 transition-colors">{focus}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* History Placeholder (Visual Only) */}
                        <div className="mt-8 pt-4 border-t border-amber-100">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 block">Historial Reciente</label>
                            <div className="space-y-2 opacity-60">
                                <div className="text-xs text-slate-500 p-2 bg-white/40 rounded border border-transparent hover:border-amber-200 cursor-pointer">
                                    Análisis: Menú Verano
                                </div>
                                <div className="text-xs text-slate-500 p-2 bg-white/40 rounded border border-transparent hover:border-amber-200 cursor-pointer">
                                    Auditoría: Precios 2025
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Dashboard */}
            <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                {!canAccessFullCritic && criticResult ? (
                    // Preview mode for FREE users
                    <div className="relative h-full">
                        {/* Blurred preview */}
                        <div className="absolute inset-0 blur-md opacity-40 pointer-events-none">
                            <CriticDashboard
                                result={criticResult}
                                loading={false}
                                error={null}
                            />
                        </div>
                        {/* Ascension invite overlay */}
                        <AscensionInvite
                            {...AvatarMembershipService.getAscensionNarrative('critic_full', userPlan)}
                        />
                    </div>
                ) : (
                    // Full access for PRO+
                    <CriticDashboard
                        result={criticResult}
                        loading={loadingCritic}
                        error={errorCritic}
                    />
                )}
            </div>

            {/* Right Sidebar - Controls */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <CriticControls
                    criticMenuText={criticMenuText}
                    loading={loadingCritic}
                    onTextChange={setCriticMenuText}
                    onImageChange={setCriticMenuImage}
                    onInvoke={handleInvokeCritic}
                />
            </div>
        </div>
    );
};

export default CriticView;

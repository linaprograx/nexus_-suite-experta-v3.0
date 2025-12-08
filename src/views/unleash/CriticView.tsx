import React, { useState } from 'react';
import { Type } from "@google/genai";
import { callGeminiApi } from '../../utils/gemini';
import { blobToBase64 } from '../../utils/blobToBase64';
import CriticControls from '../../components/make-menu/CriticControls';
import CriticDashboard, { CriticResultType } from '../../components/make-menu/CriticDashboard';

const CriticView: React.FC = () => {
    // --- Critic State ---
    const [criticMenuText, setCriticMenuText] = useState('');
    const [criticMenuImage, setCriticMenuImage] = useState<File | null>(null);
    const [loadingCritic, setLoadingCritic] = useState(false);
    const [errorCritic, setErrorCritic] = useState<string | null>(null);
    const [criticResult, setCriticResult] = useState<CriticResultType | null>(null);

    // --- Critic Handlers ---
    const handleInvokeCritic = async () => {
        if (!criticMenuText.trim() && !criticMenuImage) return;
        setLoadingCritic(true);
        setErrorCritic(null);
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
            if (!response.text) throw new Error("La IA no devolvió una crítica válida.");

            // Allow for markdown code block wrapping
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
            {/* Left Sidebar - Placeholder or Instructions */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <div className="h-full rounded-2xl border border-amber-200/50 overflow-hidden bg-white/40 backdrop-blur-md shadow-sm p-4">
                    <h3 className="font-bold text-amber-900 tracking-wide text-sm uppercase border-b border-amber-100 pb-2 mb-4">Instrucciones</h3>
                    <p className="text-sm text-amber-900/80 mb-2">Sube una foto de tu menú o pega el texto.</p>
                    <p className="text-xs text-amber-800/60">El Crítico analizará fortalezas y debilidades de tu oferta.</p>
                </div>
            </div>

            {/* Main Content - Dashboard */}
            <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                <CriticDashboard
                    result={criticResult}
                    loading={loadingCritic}
                    error={errorCritic}
                />
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

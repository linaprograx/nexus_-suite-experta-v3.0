import React, { useState, useMemo } from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Type } from "@google/genai";
import { Recipe, PizarronTask, MenuLayout } from '../../types';
import { callGeminiApi } from '../utils/gemini';
import { blobToBase64 } from '../utils/blobToBase64';
import { PremiumLayout } from '../components/layout/PremiumLayout';

// Sub-components
import MakeMenuSidebar from '../components/make-menu/MakeMenuSidebar';
import DesignerControls from '../components/make-menu/DesignerControls';
import CriticControls from '../components/make-menu/CriticControls';
import DesignerResults from '../components/make-menu/DesignerResults';
import CriticDashboard, { CriticResultType } from '../components/make-menu/CriticDashboard';

interface MakeMenuViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

const MakeMenuView: React.FC<MakeMenuViewProps> = ({ db, userId, appId, allRecipes, allPizarronTasks }) => {
    // Mode State
    const [activeMode, setActiveMode] = useState<'designer' | 'critic'>('designer');

    // --- Designer State ---
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [loadingDesigner, setLoadingDesigner] = useState(false);
    const [errorDesigner, setErrorDesigner] = useState<string | null>(null);
    const [menuResults, setMenuResults] = useState<MenuLayout[]>([]);

    // --- Critic State ---
    const [criticMenuText, setCriticMenuText] = useState('');
    const [criticMenuImage, setCriticMenuImage] = useState<File | null>(null);
    const [loadingCritic, setLoadingCritic] = useState(false);
    const [errorCritic, setErrorCritic] = useState<string | null>(null);
    const [criticResult, setCriticResult] = useState<CriticResultType | null>(null);

    // --- Designer Handlers ---
    const handleDesignerSelection = (id: string, type: 'recipe' | 'task') => {
        const updater = type === 'recipe' ? setSelectedRecipeIds : setSelectedTaskIds;
        updater(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGenerateMenus = async () => {
        setLoadingDesigner(true);
        setErrorDesigner(null);
        setMenuResults([]);

        const selectedRecipes = allRecipes.filter(r => selectedRecipeIds.includes(r.id)).map(r => r.nombre);
        const pizarronAprobado = allPizarronTasks.filter(task => task.status === 'aprobado');
        const selectedTasks = pizarronAprobado.filter(t => selectedTaskIds.includes(t.id)).map(t => t.texto);

        const promptData = `Recetas: ${selectedRecipes.join(', ')}. Ideas Aprobadas: ${selectedTasks.join('. ')}`;
        const systemPrompt = "Eres un diseñador gráfico de élite y director de arte para bares de lujo. Tu trabajo es generar 3 opciones *completamente distintas* en concepto, tipografía y estructura. Tu respuesta debe ser estrictamente un array JSON válido, sin ningún texto adicional o markdown.";
        const userQuery = `Usando estas recetas e ideas: ${promptData}. Genera 3 maquetas de menú únicas...`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        themeName: { type: Type.STRING },
                        description: { type: Type.STRING },
                        suggestedTypography: { type: Type.STRING },
                        htmlContent: { type: Type.STRING }
                    }
                }
            }
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            const results: MenuLayout[] = JSON.parse(response.text);
            setMenuResults(results);
        } catch (e: any) {
            setErrorDesigner(e.message);
        } finally {
            setLoadingDesigner(false);
        }
    };

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
            const parsedResult = JSON.parse(response.text);
            setCriticResult(parsedResult);
            // Optional: Save history logic moved to component or kept here?
            // Keeping it simple for now, can add history later if needed.
        } catch (e: any) {
            setErrorCritic(e.message);
        } finally {
            setLoadingCritic(false);
        }
    };

    return (
        <PremiumLayout
            gradientTheme="rose"
            leftSidebar={
                <MakeMenuSidebar
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                />
            }
            rightSidebar={
                activeMode === 'designer' ? (
                    <DesignerControls
                        allRecipes={allRecipes}
                        allPizarronTasks={allPizarronTasks}
                        selectedRecipeIds={selectedRecipeIds}
                        selectedTaskIds={selectedTaskIds}
                        loading={loadingDesigner}
                        onSelectionChange={handleDesignerSelection}
                        onGenerate={handleGenerateMenus}
                    />
                ) : (
                    <CriticControls
                        criticMenuText={criticMenuText}
                        loading={loadingCritic}
                        onTextChange={setCriticMenuText}
                        onImageChange={setCriticMenuImage}
                        onInvoke={handleInvokeCritic}
                    />
                )
            }
            mainContent={
                activeMode === 'designer' ? (
                    <DesignerResults
                        results={menuResults}
                        loading={loadingDesigner}
                        error={errorDesigner}
                        db={db}
                        userId={userId}
                        appId={appId}
                    />
                ) : (
                    <CriticDashboard
                        result={criticResult}
                        loading={loadingCritic}
                        error={errorCritic}
                    />
                )
            }
        />
    );
};

export default MakeMenuView;

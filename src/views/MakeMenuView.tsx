import React, { useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { Type } from "@google/genai";
import { Recipe, PizarronTask, MenuLayout } from '../../types';
import { callGeminiApi } from '../utils/gemini';
// import { PremiumLayout } from '../components/layout/PremiumLayout';

// Sub-components
import MakeMenuSidebar from '../components/make-menu/MakeMenuSidebar';
import DesignerControls from '../components/make-menu/DesignerControls';
import DesignerResults from '../components/make-menu/DesignerResults';

interface MakeMenuViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

const MakeMenuView: React.FC<MakeMenuViewProps> = ({ db, userId, appId, allRecipes, allPizarronTasks }) => {
    // --- Designer State ---
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [loadingDesigner, setLoadingDesigner] = useState(false);
    const [errorDesigner, setErrorDesigner] = useState<string | null>(null);
    const [menuResults, setMenuResults] = useState<MenuLayout[]>([]);

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
            if (!response.text) throw new Error("La IA no devolvió texto válido.");

            // Allow for markdown code block wrapping
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const results: MenuLayout[] = JSON.parse(cleanText);

            setMenuResults(results);
        } catch (e: any) {
            console.error("Designer Error:", e);
            setErrorDesigner(e.message || "Error al generar menús");
        } finally {
            setLoadingDesigner(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[220px,minmax(0,1fr),220px] gap-6">
            {/* Left Sidebar */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <MakeMenuSidebar
                    activeMode={'designer'}
                    onModeChange={() => { }}
                />
            </div>

            {/* Main Content */}
            <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                <DesignerResults
                    results={menuResults}
                    loading={loadingDesigner}
                    error={errorDesigner}
                    db={db}
                    userId={userId}
                    appId={appId}
                />
            </div>

            {/* Right Sidebar */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <DesignerControls
                    allRecipes={allRecipes}
                    allPizarronTasks={allPizarronTasks}
                    selectedRecipeIds={selectedRecipeIds}
                    selectedTaskIds={selectedTaskIds}
                    loading={loadingDesigner}
                    onSelectionChange={handleDesignerSelection}
                    onGenerate={handleGenerateMenus}
                />
            </div>
        </div>
    );
};

export default MakeMenuView;



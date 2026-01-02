import React, { useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { Ingredient, Recipe, ZeroWasteResult } from '../../types';
import { Type } from "@google/genai";
import { callGeminiApi } from '../utils/gemini';
import ZeroWasteResultCard from '../components/zero-waste/ZeroWasteResultCard';
import ZeroWasteControls from '../components/zero-waste/ZeroWasteControls';
import ZeroWasteHistorySidebar from '../components/zero-waste/ZeroWasteHistorySidebar';
import { PremiumLayout } from '../components/layout/PremiumLayout'; // Assuming standard import path
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { ICONS } from '../components/ui/icons';
import { Icon } from '../components/ui/Icon';

interface ZeroWasteViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe>) => void;
}

const ZeroWasteView: React.FC<ZeroWasteViewProps> = ({ db, userId, appId, allIngredients }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [rawIngredients, setRawIngredients] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recipeResults, setRecipeResults] = useState<ZeroWasteResult[]>([]);
    const [history, setHistory] = useState<ZeroWasteResult[]>([]);

    const handleIngredientToggle = (ingredientName: string) => {
        setSelectedIngredients(prev =>
            prev.includes(ingredientName)
                ? prev.filter(name => name !== ingredientName)
                : [...prev, ingredientName]
        );
    };

    const handleGenerateRecipes = async () => {
        setLoading(true);
        setError(null);
        setRecipeResults([]);

        const promptIngredients = [...selectedIngredients, rawIngredients].filter(Boolean).join(', ');
        if (!promptIngredients) {
            setError("Por favor, seleccione o introduzca al menos un ingrediente.");
            setLoading(false);
            return;
        }

        const systemPrompt = "Eres un chef de I+D 'zero waste' de élite. NO eres un bartender. Tu foco es crear *elaboraciones complejas* (cordiales, siropes, polvos, aceites, shrubs) a partir de desperdicios, para que *luego* un bartender las use. NO generes un cóctel completo. Tu respuesta debe ser estrictamente un array JSON.";
        const userQuery = `Usando estos ingredientes: ${promptIngredients}. Genera de 3 a 5 elaboraciones 'zero waste'. Devuelve un array JSON. Cada objeto debe tener: 'nombre' (string), 'ingredientes' (string con markdown para una lista de viñetas), 'preparacion' (string con markdown para una lista numerada).`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nombre: { type: Type.STRING },
                        ingredientes: { type: Type.STRING },
                        preparacion: { type: Type.STRING },
                    },
                },
            },
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            const results = JSON.parse(response.text) as ZeroWasteResult[];
            setRecipeResults(results);
            setHistory(prev => [...results, ...prev]);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle viewing a history item (sets it as the current result)
    const handleHistorySelect = (result: ZeroWasteResult) => {
        setRecipeResults([result]);
    };

    return (
        <PremiumLayout
            gradientTheme="cyan"
            leftSidebar={
                <ZeroWasteHistorySidebar
                    history={history}
                    onSelect={handleHistorySelect}
                />
            }
            rightSidebar={
                <ZeroWasteControls
                    allIngredients={allIngredients}
                    selectedIngredients={selectedIngredients}
                    rawIngredients={rawIngredients}
                    loading={loading}
                    onToggleIngredient={handleIngredientToggle}
                    onRawIngredientsChange={setRawIngredients}
                    onGenerate={handleGenerateRecipes}
                />
            }
            mainContent={
                <div className="premium-panel p-4 md:p-6 gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2 px-1">
                        <h1 className="premium-heading text-3xl">
                            <span className="p-2 bg-white/50 rounded-xl shadow-sm border border-white/20"><Icon svg={ICONS.recycle} className="w-6 h-6 text-cyan-600" /></span>
                            The Lab: Zero Waste
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
                            Transforma sobras en ingredientes premium.
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {loading && (
                            <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                                <Spinner className="w-12 h-12 text-cyan-500 mb-4" />
                                <p className="text-slate-500 font-medium">Diseñando elaboraciones...</p>
                            </div>
                        )}

                        {error && <Alert variant="destructive" title="Error de Generación" description={error} className="mb-4" />}

                        {!loading && recipeResults.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/20 dark:bg-slate-900/10">
                                <Icon svg={ICONS.flask} className="w-12 h-12 mb-3 opacity-40" />
                                <p className="text-lg font-light">Selecciona ingredientes y genera nuevas ideas</p>
                            </div>
                        )}

                        {recipeResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-6 pb-6">
                                {recipeResults.map((recipe, index) => (
                                    <ZeroWasteResultCard
                                        key={index}
                                        recipe={recipe}
                                        db={db}
                                        userId={userId}
                                        appId={appId}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    );
};

export default ZeroWasteView;


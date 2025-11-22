import React, { useState } from 'react';
import { Firestore } from 'firebase/firestore';
import { Ingredient, Recipe, ZeroWasteResult } from '../../types';
import { Type } from "@google/genai";
import { callGeminiApi } from '../utils/gemini';
import ZeroWasteResultCard from '../components/zero-waste/ZeroWasteResultCard';
import { Card, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Checkbox } from '../components/ui/Checkbox';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';

interface ZeroWasteViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe>) => void;
}

const ZeroWasteView: React.FC<ZeroWasteViewProps> = ({ db, userId, appId, allIngredients, onOpenRecipeModal }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [rawIngredients, setRawIngredients] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recipeResults, setRecipeResults] = useState<ZeroWasteResult[]>([]);

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
            setRecipeResults(JSON.parse(response.text));
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Ingredientes del Grimorium</Label>
                            <div className="border rounded-md p-2 h-32 overflow-y-auto space-y-1 text-sm">
                                {allIngredients.map(ing => (
                                    <div key={ing.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`zw-${ing.id}`}
                                            checked={selectedIngredients.includes(ing.nombre)}
                                            onChange={() => handleIngredientToggle(ing.nombre)}
                                        />
                                        <Label htmlFor={`zw-${ing.id}`} className="font-normal">{ing.nombre}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="raw-ingredients">Otros Ingredientes (sobras, etc.)</Label>
                            <Textarea
                                id="raw-ingredients"
                                value={rawIngredients}
                                onChange={e => setRawIngredients(e.target.value)}
                                placeholder="Ej: Pieles de cítricos, restos de sirope, pulpa de fruta..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <Button onClick={handleGenerateRecipes} disabled={loading} className="mt-4 w-full">
                         {loading ? <Spinner className="w-4 h-4 mr-2"/> : <Icon svg={ICONS.recycle} className="w-4 h-4 mr-2"/>}
                        Generar Elaboraciones
                    </Button>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Generación" description={error} />}
                {recipeResults && recipeResults.length > 0 && (
                    <div className="space-y-4">
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
    );
};

export default ZeroWasteView;

import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Recipe, Ingredient, CerebrityResult } from '../../types';
import { CreativityTab } from '../components/cerebrity/CreativityTab';
import TheLabTab from './LabView';
import { callGeminiApi, generateImage } from '../utils/gemini';
import { Type } from "@google/genai";

interface CerebrityViewProps {
    db: Firestore;
    userId: string;
    storage: FirebaseStorage;
    appId: string;
    allRecipes: Recipe[];
    allIngredients: Ingredient[];
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
    initialText: string | null;
    onAnalysisDone: () => void;
}

const CerebrityView: React.FC<CerebrityViewProps> = ({ db, userId, storage, appId, allRecipes, allIngredients, onOpenRecipeModal, initialText, onAnalysisDone }) => {
    const [activeTab, setActiveTab] = React.useState<'creativity' | 'lab'>('creativity');

    // --- Cerebrity State ---
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [rawInput, setRawInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CerebrityResult | null>(null);
    const [showHistory, setShowHistory] = React.useState(false);
    
    React.useEffect(() => {
        if (initialText) {
          setRawInput(initialText); // Pone el texto en el textarea
          setActiveTab('creativity'); // Asegura que la pestaña correcta esté activa
          onAnalysisDone(); // Limpia el trigger
        }
    }, [initialText, onAnalysisDone]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        if (!selectedRecipe && !rawInput.trim()) {
            setError("Por favor, seleccione una receta o introduzca ingredientes.");
            setLoading(false);
            return;
        }
        
        const promptBase = selectedRecipe
            ? `Receta: ${selectedRecipe.nombre}. Ingredientes: ${selectedRecipe.ingredientes?.map(i => i.nombre).join(', ')}`
            : `Ingredientes crudos: ${rawInput}`;
        
        let textResult: Omit<CerebrityResult, 'imageUrl' | 'createdAt'>;

        try {
            const response = await callGeminiApi(`Analiza la siguiente base y genera las mejoras: ${promptBase}`, "Eres un director creativo de mixología, nivel 3 estrellas Michelin. Tu objetivo es la innovación extrema. Responde únicamente con el objeto JSON solicitado.", {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mejora: { type: Type.STRING, description: "Una Técnica de alta cocina o elaboración compleja para el líquido." },
                        garnishComplejo: { type: Type.STRING, description: "Un garnish compuesto por 2 o más sub-garnishes, descrito en detalle." },
                        storytelling: { type: Type.STRING, description: "Breve storytelling con gancho emocional sobre el cóctel." },
                        promptImagen: { type: Type.STRING, description: "Un prompt detallado en inglés para un generador de imágenes hiperrealista basado en el garnish complejo." },
                    }
                }
            });
            
            const responseText = response.text;
            const cleanJsonString = responseText.replace(/^```json\s*/, '').replace(/```$/, '');
            const parsedResult = JSON.parse(cleanJsonString);
            textResult = {
                mejora: parsedResult.mejora,
                garnishComplejo: parsedResult.garnishComplejo,
                storytelling: parsedResult.storytelling,
                promptImagen: parsedResult.promptImagen,
            };
            setResult({ ...textResult, imageUrl: null });
        } catch (textError: any) {
            console.error("Error en API de Texto:", textError);
            setError("Error al generar texto. Revisa la API Key de Gemini y la entrada.");
            setLoading(false);
            return;
        }

        let downloadURL: string | null = null;
        try {
            setImageLoading(true);
            const imageResponse = await generateImage(textResult.promptImagen);
            const base64Data = imageResponse.predictions[0].bytesBase64Encoded;
            const storageRef = ref(storage, `users/${userId}/recipe-images/${Date.now()}.jpg`);
            await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
            downloadURL = await getDownloadURL(storageRef);
            setResult(prev => prev ? ({ ...prev, imageUrl: downloadURL }) : null);
        } catch (imageError: any) {
            console.error("Error en API de Imagen:", imageError);
            setError("Texto generado con éxito, pero la imagen falló. " + imageError.message);
        } finally {
            setImageLoading(false);
        }
        
        try {
            const historyItem = { ...textResult, imageUrl: downloadURL, createdAt: serverTimestamp() };
            await addDoc(collection(db, `users/${userId}/cerebrity-history`), historyItem);
        } catch (historyError) {
            console.error("Error guardando en historial:", historyError);
        }

        setLoading(false);
    };
    
    return (
        <div className="p-6 lg:p-8 h-full overflow-y-auto">
             <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('creativity')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'creativity' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                    CerebrIty (Creativo)
                </button>
                 <button onClick={() => setActiveTab('lab')} className={`py-2 px-6 text-sm font-medium ${activeTab === 'lab' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                    The Lab (Científico)
                </button>
            </div>
            {activeTab === 'creativity' ? (
                <CreativityTab
                    db={db}
                    userId={userId}
                    appId={appId}
                    allRecipes={allRecipes}
                    selectedRecipe={selectedRecipe}
                    setSelectedRecipe={setSelectedRecipe}
                    rawInput={rawInput}
                    setRawInput={setRawInput}
                    handleGenerate={handleGenerate}
                    loading={loading}
                    imageLoading={imageLoading}
                    error={error}
                    result={result}
                    setResult={setResult}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    onOpenRecipeModal={onOpenRecipeModal}
                />
            ) : (
                <TheLabTab
                    db={db}
                    userId={userId}
                    appId={appId}
                    allIngredients={allIngredients}
                    allRecipes={allRecipes}
                />
            )}
        </div>
    );
};

export default CerebrityView;

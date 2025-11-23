import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Recipe, Ingredient, CerebrityResult } from '../../types';
import { CreativityTab } from '../components/cerebrity/CreativityTab';
import { CerebrityHistorySidebar } from '../components/cerebrity/CerebrityHistorySidebar';
import { TheLabHistorySidebar } from '../components/cerebrity/TheLabHistorySidebar';
import { PowerTreePanel } from '../components/cerebrity/PowerTreePanel';
import LabView from './LabView';
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
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [rawInput, setRawInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CerebrityResult | null>(null);
    const [labResult, setLabResult] = React.useState<any | null>(null);
    const [labInputs, setLabInputs] = React.useState<(Recipe | Ingredient)[]>([]);

    React.useEffect(() => {
        if (initialText) {
          setRawInput(initialText);
          setActiveTab('creativity');
          onAnalysisDone();
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
        const promptBase = selectedRecipe ? `Receta: ${selectedRecipe.nombre}. Ingredientes: ${selectedRecipe.ingredientes?.map(i => i.nombre).join(', ')}` : `Ingredientes crudos: ${rawInput}`;
        try {
            const response = await callGeminiApi(`Analiza la siguiente base y genera las mejoras: ${promptBase}`, "Eres un director creativo de mixología...", {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { mejora: { type: Type.STRING }, garnishComplejo: { type: Type.STRING }, storytelling: { type: Type.STRING }, promptImagen: { type: Type.STRING } } }
            });
            const textResult = JSON.parse(response.text.replace(/^```json\s*/, '').replace(/```$/, ''));
            setResult({ ...textResult, imageUrl: null });

            setImageLoading(true);
            const imageResponse = await generateImage(textResult.promptImagen);
            const base64Data = imageResponse.predictions[0].bytesBase64Encoded;
            const storageRef = ref(storage, `users/${userId}/recipe-images/${Date.now()}.jpg`);
            await uploadString(storageRef, base64Data, 'base64', { contentType: 'image/jpeg' });
            const downloadURL = await getDownloadURL(storageRef);
            setResult(prev => prev ? ({ ...prev, imageUrl: downloadURL }) : null);
            await addDoc(collection(db, `users/${userId}/cerebrity-history`), { ...textResult, imageUrl: downloadURL, createdAt: serverTimestamp() });
        } catch (e: any) {
            setError("Error en la generación. " + e.message);
        } finally {
            setLoading(false);
            setImageLoading(false);
        }
    };
    
    const handleSaveLabResultToPizarron = async (title: string, content: string) => {
        if (!labResult) return;
        const combination = labInputs.map(i => i.nombre).join(', ');
        const taskContent = `[The Lab: ${combination}] ${title} - ${content}`.substring(0, 500);
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                content: taskContent, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
            });
            alert("Idea guardada en el Pizarrón.");
        } catch (e) {
            console.error("Error guardando en Pizarrón: ", e);
        }
    };

    const backgroundClass = activeTab === 'creativity'
        ? "from-[#EDE9FE] to-white dark:from-[#1E1B2A] dark:to-slate-950"
        : "from-[#CCFBF1] to-white dark:from-[#1A2A29] dark:to-slate-950";

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">
             <div className="flex-shrink-0 mb-4">
                <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-full w-fit">
                    <button onClick={() => setActiveTab('creativity')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'creativity' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>CerebrIty</button>
                    <button onClick={() => setActiveTab('lab')} className={`py-2 px-5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'lab' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>The Lab</button>
                </div>
            </div>
            <div className={`flex-1 grid grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px] gap-6 overflow-hidden rounded-3xl bg-gradient-to-b ${backgroundClass} p-6`}>
               <div className="h-full min-h-0 overflow-y-auto">
                   {activeTab === 'creativity' ? (
                       <CerebrityHistorySidebar db={db} userId={userId} onLoadHistory={(item) => setResult(item)} />
                   ) : (
                       <TheLabHistorySidebar db={db} historyPath={`users/${userId}/the-lab-history`} onLoadHistory={(item) => setLabResult(item.result)} />
                   )}
               </div>
                <div className="h-full min-h-0 overflow-y-auto">
                    {activeTab === 'creativity' ? (
                        <CreativityTab db={db} userId={userId} appId={appId} allRecipes={allRecipes} selectedRecipe={selectedRecipe} setSelectedRecipe={setSelectedRecipe} rawInput={rawInput} setRawInput={setRawInput} handleGenerate={handleGenerate} loading={loading} imageLoading={imageLoading} error={error} result={result} setResult={setResult} onOpenRecipeModal={onOpenRecipeModal} />
                    ) : (
                        <LabView db={db} userId={userId} appId={appId} allIngredients={allIngredients} allRecipes={allRecipes} labResult={labResult} setLabResult={setLabResult} labInputs={labInputs} setLabInputs={setLabInputs} />
                    )}
                </div>
               <div className="h-full min-h-0 overflow-y-auto">
                   <PowerTreePanel 
                        color={activeTab === 'creativity' ? 'violet' : 'cyan'} 
                        result={activeTab === 'creativity' ? result : labResult} 
                        onOpenRecipeModal={onOpenRecipeModal}
                        onSendToPizarron={handleSaveLabResultToPizarron}
                    />
               </div>
            </div>
        </div>
    );
};

export default CerebrityView;

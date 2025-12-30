import React from 'react';
import { Firestore, updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Recipe, CerebrityResult } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';

interface CreativityTabProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    selectedRecipe: Recipe | null;
    setSelectedRecipe: (recipe: Recipe | null) => void;
    rawInput: string;
    setRawInput: (input: string) => void;
    handleGenerate: () => void;
    loading: boolean;
    imageLoading: boolean;
    error: string | null;
    result: CerebrityResult | null;
    setResult: (result: CerebrityResult | null) => void;
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
}

export const CreativityTab: React.FC<CreativityTabProps> = ({ db, userId, appId, allRecipes, selectedRecipe, setSelectedRecipe, rawInput, setRawInput, handleGenerate, loading, imageLoading, error, result, onOpenRecipeModal }) => (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
        <Card className="flex-shrink-0 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-violet-800 dark:text-violet-200">Generador Creativo</CardTitle>
                <p className="text-sm text-slate-500">Inicia con una receta o ingredientes crudos para desatar la innovación.</p>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
                <div>
                    <Label htmlFor="recipe-select">Elegir Receta Existente</Label>
                    <Select id="recipe-select" value={selectedRecipe?.id || ''} onChange={e => setSelectedRecipe(allRecipes.find(r => r.id === e.target.value) || null)}>
                        <option value="">Seleccionar una receta...</option>
                        {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="raw-input">O introduce ingredientes crudos</Label>
                    <Textarea id="raw-input" placeholder="Ej: Ginebra, tónica, piel de limón, romero" value={rawInput} onChange={e => setRawInput(e.target.value)} />
                </div>
                <Button className="mt-3 w-full rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold py-2.5 shadow-md transition-all" onClick={handleGenerate} disabled={loading || imageLoading}>
                    {(loading || imageLoading) && <Spinner className="mr-2" />}
                    {loading ? 'Generando...' : 'Generar'}
                </Button>
            </CardContent>
            {error && <div className="px-6 pb-6"><Alert variant="destructive" title="Error" description={error} /></div>}
        </Card>

        {loading && !result && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12 text-violet-500" /></div>}

        {result && (
            <div className="space-y-6">
                {result.imageUrl && (
                    <Card className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20">
                        <div className="h-full w-full flex items-center justify-center">
                            {imageLoading ? <Spinner className="w-10 h-10" /> :
                                <img src={result.imageUrl} alt="Receta generada" className="w-full h-full object-cover" />}
                        </div>
                    </Card>
                )}

                <Card className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                    <CardHeader><CardTitle>Mejora Táctica</CardTitle></CardHeader>
                    <CardContent className="px-7 pb-7"><p className="text-base leading-relaxed">{result.mejora}</p></CardContent>
                </Card>
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                    <CardHeader><CardTitle>Garnish de Alto Nivel</CardTitle></CardHeader>
                    <CardContent className="px-7 pb-7"><p className="text-base leading-relaxed">{result.garnishComplejo}</p></CardContent>
                </Card>
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                    <CardHeader><CardTitle>Storytelling</CardTitle></CardHeader>
                    <CardContent className="px-7 pb-7"><p className="text-base leading-relaxed">{result.storytelling}</p></CardContent>
                </Card>

                <div className="flex gap-4 pt-2">
                    <Button className="w-full" onClick={async () => {
                        if (!result) return;
                        try {
                            const dataToSave: Partial<Recipe> = { preparacion: result.mejora || '', garnish: result.garnishComplejo || '', storytelling: result.storytelling || '', ...(result.imageUrl && { imageUrl: result.imageUrl }) };
                            if (selectedRecipe) {
                                const recipeDoc = doc(db, `users/${userId}/grimorio`, selectedRecipe.id);
                                await updateDoc(recipeDoc, dataToSave);
                            } else {
                                onOpenRecipeModal({ nombre: 'Nueva Receta (Editar)', ...dataToSave });
                            }
                        } catch (e) { console.error("Error guardando en Receta: ", e); }
                    }}>Guardar en Recetas</Button>
                    <Button className="w-full" variant="outline" onClick={async () => {
                        if (!result) return;
                        try {
                            const taskText = `[CerebrIty] ${result.storytelling || result.mejora}`.substring(0, 500);
                            await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), { content: taskText, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general' });
                        } catch (e) { console.error("Error guardando en Pizarrón: ", e); }
                    }}>Guardar en Pizarrón</Button>
                </div>
            </div>
        )}
    </div>
);

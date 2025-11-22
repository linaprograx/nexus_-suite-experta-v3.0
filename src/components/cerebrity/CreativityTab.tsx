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
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { CerebrityHistorySidebar } from './CerebrityHistorySidebar';

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
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    onOpenRecipeModal: (recipe: Partial<Recipe> | null) => void;
}

export const CreativityTab: React.FC<CreativityTabProps> = ({ db, userId, appId, allRecipes, selectedRecipe, setSelectedRecipe, rawInput, setRawInput, handleGenerate, loading, imageLoading, error, result, setResult, showHistory, setShowHistory, onOpenRecipeModal }) => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Generador Creativo</CardTitle>
                    <Button variant="outline" onClick={() => setShowHistory(true)}>Ver Historial</Button>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Button className="w-full" onClick={handleGenerate} disabled={loading || imageLoading}>
                        {(loading || imageLoading) && <Spinner className="mr-2"/>}
                        {loading ? 'Generando Texto...' : imageLoading ? 'Generando Imagen...' : 'Generar'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
            {loading && !result && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12"/></div>}
            {error && <Alert variant="destructive" title="Error" description={error} />}
            {result && (
                <>
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-2">
                                <div className="h-64 bg-secondary rounded-md flex items-center justify-center">
                                    {imageLoading ? <Spinner className="w-10 h-10"/> :
                                     result.imageUrl ? <img src={result.imageUrl} alt="Receta generada" className="w-full h-full object-cover rounded-md"/> :
                                     <Icon svg={ICONS.galeria} className="w-16 h-16 text-muted-foreground"/>}
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Mejora Táctica</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.mejora}</p>}</CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Garnish de Alto Nivel</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.garnishComplejo}</p>}</CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Storytelling</CardTitle></CardHeader>
                            <CardContent>{result && <p className="text-sm">{result.storytelling}</p>}</CardContent>
                        </Card>
                    </div>
                    <div className="flex gap-4">
                        <Button className="w-full" onClick={async () => {
                          if (!result) return;
                          try {
                            const dataToSave: Partial<Recipe> = {
                              preparacion: result.mejora || '',
                              garnish: result.garnishComplejo || '',
                              storytelling: result.storytelling || '',
                              ...(result.imageUrl && { imageUrl: result.imageUrl })
                            };
                        
                            if (selectedRecipe) {
                              const recipeDoc = doc(db, `users/${userId}/grimorio`, selectedRecipe.id);
                              await updateDoc(recipeDoc, dataToSave);
                              alert("Receta actualizada con éxito.");
                            } else {
                              onOpenRecipeModal({
                                nombre: 'Nueva Receta (Editar)',
                                ...dataToSave
                              });
                            }
                          } catch (e) {
                            console.error("Error guardando en Receta: ", e);
                            alert("Error al guardar en la receta.");
                          }
                        }}>Guardar en Recetas</Button>
                        <Button className="w-full" variant="outline" onClick={async () => {
                            if (!result) return;
                            try {
                              const taskText = `[CerebrIty] ${result.storytelling || result.mejora}`.substring(0, 500);
                              await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
                                content: taskText,
                                status: 'Ideas',
                                category: 'Ideas',
                                createdAt: serverTimestamp(),
                                boardId: 'general'
                              });
                              alert("Idea guardada en el Pizarrón.");
                            } catch (e) {
                              console.error("Error guardando en Pizarrón: ", e);
                              alert("Error al guardar en el Pizarrón.");
                            }
                          }}>Guardar en Pizarrón</Button>
                    </div>
                </>
            )}
        </div>
        {showHistory && (
            <CerebrityHistorySidebar
                db={db}
                userId={userId}
                onLoadHistory={(item) => {
                    setResult(item);
                    setShowHistory(false);
                }}
                onClose={() => setShowHistory(false)}
            />
        )}
    </div>
);

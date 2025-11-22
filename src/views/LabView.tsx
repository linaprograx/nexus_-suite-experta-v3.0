import React from 'react';
import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Recipe, Ingredient } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';
import { Combobox } from '../components/ui/Combobox';
import { TheLabHistorySidebar } from '../components/cerebrity/TheLabHistorySidebar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { callGeminiApi } from '../utils/gemini';
import { Type } from "@google/genai";

interface LabViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
}

const LabView: React.FC<LabViewProps> = ({ db, userId, appId, allIngredients, allRecipes }) => {
    const [labInputs, setLabInputs] = React.useState<(Recipe | Ingredient)[]>([]);
    const [labLoading, setLabLoading] = React.useState(false);
    const [labError, setLabError] = React.useState<string | null>(null);
    const [labResult, setLabResult] = React.useState<{ perfil: string; clasicos: string[]; moleculares: string[]; tecnica: string; perfilSabor: Record<string, number> } | null>(null);
    const [showLabHistory, setShowLabHistory] = React.useState(false);
    const theLabHistoryPath = `users/${userId}/the-lab-history`;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];
    const flavorProfileData = labResult?.perfilSabor ? Object.entries(labResult.perfilSabor).map(([name, value]) => ({ name, value: Number(value) || 0 })) : [];

    const handleAnalyzeLab = async () => {
        if (labInputs.length === 0) {
            setLabError('Por favor, añada ingredientes o recetas para analizar.');
            return;
        }
        setLabLoading(true);
        setLabError(null);
        setLabResult(null);

        const promptData = labInputs.map(item => item.nombre).join(', ');
        const systemPrompt = "Eres un científico de alimentos experto en Flavor Pairing. Analiza la sinergia molecular y el perfil de sabor de la siguiente combinación. Tu respuesta debe ser estrictamente un objeto JSON válido.";
        const userQuery = `Analiza la combinación: ${promptData}. Devuelve un JSON con: 'perfil', 'clasicos' (array), 'moleculares' (array), 'tecnica' (string), y 'perfilSabor' (un objeto JSON con claves 'dulce', 'acido', 'amargo', 'salado', 'umami', 'herbal', 'especiado' y valores numéricos de 0 a 10).`;
        
        try {
            const response = await callGeminiApi(userQuery, systemPrompt, {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        perfil: { type: Type.STRING },
                        clasicos: { type: Type.ARRAY, items: { type: Type.STRING } },
                        moleculares: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tecnica: { type: Type.STRING },
                        perfilSabor: {
                            type: Type.OBJECT,
                            properties: {
                                dulce: { type: Type.NUMBER }, acido: { type: Type.NUMBER }, amargo: { type: Type.NUMBER },
                                salado: { type: Type.NUMBER }, umami: { type: Type.NUMBER }, herbal: { type: Type.NUMBER },
                                especiado: { type: Type.NUMBER },
                            }
                        },
                    },
                }
            });
            const parsedResult = JSON.parse(response.text);
            setLabResult(parsedResult);
            await addDoc(collection(db, theLabHistoryPath), { combination: promptData, result: parsedResult, createdAt: serverTimestamp() });
        } catch (e: any) {
            setLabError('Error al analizar. Por favor, intente de nuevo. ' + (e.message || String(e)));
        } finally {
            setLabLoading(false);
        }
    };
    
    const handleSaveLabResultToPizarron = async (title: string, content: string) => {
        const combination = labInputs.map(i => i.nombre).join(', ');
        const taskContent = `[The Lab: ${combination}] ${title} - ${content}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskContent, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Idea guardada en el Pizarrón.");
    };

    return (
        <div className="space-y-6 p-6 lg:p-8 h-full overflow-y-auto">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>The Lab: Análisis Molecular</CardTitle>
                        <CardDescription>Construya un "pool" de análisis con recetas e ingredientes.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setShowLabHistory(true)}>Ver Historial</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Combobox items={allIngredients} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir ingrediente..." />
                        <Combobox items={allRecipes} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir receta..." />
                    </div>
                    <div className="p-2 border rounded-md min-h-[60px] flex flex-wrap gap-2">
                        {labInputs.length === 0 ? <p className="text-sm text-muted-foreground p-2">Seleccione ingredientes y/o recetas a analizar.</p> :
                            labInputs.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                                    <span>{item.nombre}</span>
                                    <button onClick={() => setLabInputs(labInputs.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-foreground">
                                        <Icon svg={ICONS.x} className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                    <Button onClick={handleAnalyzeLab} disabled={labLoading} className="w-full">
                        {labLoading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.flask} className="mr-2 h-5 w-5" />}
                        Analizar Combinación
                    </Button>
                </CardContent>
            </Card>

            {labLoading && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12"/></div>}
            {labError && <Alert variant="destructive" title="Error de Análisis" description={labError} />}
            
            {labResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-3">
                        <CardHeader><CardTitle>Perfil de Sabor Molecular</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={flavorProfileData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label={p => `${p.name} (${p.value})`}>
                                        {flavorProfileData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-3">
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Perfil Aromático Combinado</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Perfil Aromático', labResult.perfil)}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <p>{labResult.perfil}</p>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Emparejamientos Clásicos</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Clásicos', labResult.clasicos.join(', '))}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <ul className="list-disc list-inside space-y-1">{labResult.clasicos.map((item, index) => <li key={index}>{item}</li>)}</ul>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Emparejamientos Moleculares</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Moleculares', labResult.moleculares.join(', '))}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <ul className="list-disc list-inside space-y-1">{labResult.moleculares.map((item, index) => <li key={index}>{item}</li>)}</ul>}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center"><CardTitle>Técnica Sugerida</CardTitle><Button size="sm" variant="outline" onClick={() => handleSaveLabResultToPizarron('Técnica Sugerida', labResult.tecnica)}>Guardar</Button></CardHeader>
                        <CardContent>{labResult && <p>{labResult.tecnica}</p>}</CardContent>
                    </Card>
                </div>
            )}
            {showLabHistory && <TheLabHistorySidebar db={db} historyPath={theLabHistoryPath} onClose={() => setShowLabHistory(false)} />}
        </div>
    );
}

export default LabView;

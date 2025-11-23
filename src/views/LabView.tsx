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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { callGeminiApi } from '../utils/gemini';
import { Type } from "@google/genai";

interface LabViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    labResult: any;
    setLabResult: (result: any) => void;
    labInputs: (Recipe | Ingredient)[];
    setLabInputs: (inputs: (Recipe | Ingredient)[]) => void;
    onLoadHistory?: (item: any) => void;
}

const LabView: React.FC<LabViewProps> = ({ db, userId, appId, allIngredients, allRecipes, labResult, setLabResult, labInputs, setLabInputs }) => {
    const [labLoading, setLabLoading] = React.useState(false);
    const [labError, setLabError] = React.useState<string | null>(null);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];
    const flavorProfileData = (labResult && labResult.perfilSabor && typeof labResult.perfilSabor === 'object')
        ? Object.entries(labResult.perfilSabor).map(([name, value]) => ({ name, value: Number(value) || 0 }))
        : [];

    const handleAnalyzeLab = async () => {
        if (labInputs.length === 0) {
            setLabError('Por favor, añada ingredientes o recetas para analizar.');
            return;
        }
        setLabLoading(true);
        setLabError(null);
        setLabResult(null);

        const promptData = labInputs.map(item => item.nombre).join(', ');
        const systemPrompt = "Eres un científico de alimentos experto en Flavor Pairing...";
        const userQuery = `Analiza la combinación: ${promptData}. Devuelve un JSON con: 'perfil', 'clasicos' (array), 'moleculares' (array), 'tecnica' (string), y 'perfilSabor' (objeto).`;
        
        try {
            const response = await callGeminiApi(userQuery, systemPrompt, {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { perfil: { type: Type.STRING }, clasicos: { type: Type.ARRAY, items: { type: Type.STRING } }, moleculares: { type: Type.ARRAY, items: { type: Type.STRING } }, tecnica: { type: Type.STRING }, perfilSabor: { type: Type.OBJECT, properties: { dulce: { type: Type.NUMBER }, acido: { type: Type.NUMBER }, amargo: { type: Type.NUMBER }, salado: { type: Type.NUMBER }, umami: { type: Type.NUMBER }, herbal: { type: Type.NUMBER }, especiado: { type: Type.NUMBER } } } } }
            });
            
            let parsedResult;
            try {
                parsedResult = JSON.parse(response.text);
            } catch (parseError) {
                throw new Error("Error al interpretar la respuesta de la IA.");
            }

            setLabResult(parsedResult);
            await addDoc(collection(db, `users/${userId}/the-lab-history`), { combination: promptData, result: parsedResult, createdAt: serverTimestamp() });
        } catch (e: any) {
            setLabError('Error al analizar: ' + (e.message || String(e)));
            setLabResult(null);
        } finally {
            setLabLoading(false);
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
            // Consider a more subtle notification system in the future
            alert("Idea guardada en el Pizarrón.");
        } catch (e) {
            console.error("Error guardando en Pizarrón: ", e);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <Card className="flex-shrink-0 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-cyan-800 dark:text-cyan-200">The Lab: Análisis Molecular</CardTitle>
                    <CardDescription>Construya un "pool" de análisis con recetas e ingredientes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Combobox items={allIngredients} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir ingrediente..." />
                        <Combobox items={allRecipes} onSelect={item => setLabInputs([...labInputs, item])} placeholder="Añadir receta..." />
                    </div>
                    <div className="p-2 border rounded-md min-h-[60px] flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-800/50">
                        {labInputs.length === 0 ? <p className="text-sm text-muted-foreground p-2">Seleccione para analizar.</p> :
                            labInputs.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-1 bg-cyan-100 text-cyan-800 rounded-full px-3 py-1 text-sm dark:bg-cyan-900 dark:text-cyan-100">
                                    <span>{item.nombre}</span>
                                    <button onClick={() => setLabInputs(labInputs.filter((_, i) => i !== index))} className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-100">
                                        <Icon svg={ICONS.x} className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                    <Button onClick={handleAnalyzeLab} disabled={labLoading} className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 shadow-md transition-all">
                        {labLoading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.flask} className="mr-2 h-5 w-5" />}
                        Analizar Combinación
                    </Button>
                </CardContent>
                {labError && <div className="px-6 pb-6"><Alert variant="destructive" title="Error de Análisis" description={labError} /></div>}
            </Card>

            {labLoading && <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12 text-cyan-500"/></div>}
            
            {!labLoading && !labResult && (
                <div className="text-center p-10">
                    <p className="text-slate-500">Analiza una combinación para ver los resultados del laboratorio.</p>
                </div>
            )}

            {labResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
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
                    <Card className="md:col-span-2 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Perfil Aromático</CardTitle></CardHeader>
                        <CardContent className="px-7 pb-7"><p className="leading-relaxed">{labResult.perfil || 'N/A'}</p></CardContent>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Clásicos</CardTitle></CardHeader>
                        <CardContent><ul className="list-disc list-inside space-y-1">{Array.isArray(labResult.clasicos) ? labResult.clasicos.map((item, index) => <li key={index}>{item}</li>) : <li>N/A</li>}</ul></CardContent>
                    </Card>
                    <Card className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Moleculares</CardTitle></CardHeader>
                        <CardContent><ul className="list-disc list-inside space-y-1">{Array.isArray(labResult.moleculares) ? labResult.moleculares.map((item, index) => <li key={index}>{item}</li>) : <li>N/A</li>}</ul></CardContent>
                    </Card>
                    <Card className="md:col-span-2 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl">
                        <CardHeader><CardTitle>Técnica Sugerida</CardTitle></CardHeader>
                        <CardContent className="px-7 pb-7"><p className="leading-relaxed">{labResult.tecnica || 'N/A'}</p></CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default LabView;

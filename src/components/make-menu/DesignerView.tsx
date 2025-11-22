import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Type } from "@google/genai";
import { Recipe, PizarronTask, MenuLayout } from '../../../types';
import { MenuResultCard } from './MenuResultCard';
import { callGeminiApi } from '../../utils/gemini';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Alert } from '../ui/Alert';

interface DesignerViewProps {
    db: Firestore;
    userId: string;
    appId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
}

export const DesignerView: React.FC<DesignerViewProps> = ({ db, userId, appId, allRecipes, allPizarronTasks }) => {
    const [selectedRecipeIds, setSelectedRecipeIds] = React.useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [menuResults, setMenuResults] = React.useState<MenuLayout[]>([]);
    const [activeDesignerTab, setActiveDesignerTab] = React.useState(0);

    const pizarronAprobado = React.useMemo(() => allPizarronTasks.filter(task => task.status === 'aprobado'), [allPizarronTasks]);

    const handleSelection = (id: string, type: 'recipe' | 'task') => {
        const updater = type === 'recipe' ? setSelectedRecipeIds : setSelectedTaskIds;
        updater(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGenerateMenus = async () => {
        setLoading(true);
        setError(null);
        setMenuResults([]);

        const selectedRecipes = allRecipes.filter(r => selectedRecipeIds.includes(r.id)).map(r => r.nombre);
        const selectedTasks = pizarronAprobado.filter(t => selectedTaskIds.includes(t.id)).map(t => t.texto);
        const promptData = `Recetas: ${selectedRecipes.join(', ')}. Ideas Aprobadas: ${selectedTasks.join('. ')}`;

        const systemPrompt = "Eres un diseñador gráfico de élite y director de arte para bares de lujo. Tu trabajo es generar 3 opciones *completamente distintas* en concepto, tipografía y estructura. Tu respuesta debe ser estrictamente un array JSON válido, sin ningún texto adicional o markdown.";
        const userQuery = `Usando estas recetas e ideas: ${promptData}. Genera 3 maquetas de menú únicas...`;

        const generationConfig = { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { themeName: { type: Type.STRING }, description: { type: Type.STRING }, suggestedTypography: { type: Type.STRING }, htmlContent: { type: Type.STRING } } } } };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            const results: MenuLayout[] = JSON.parse(response.text);
            setMenuResults(results);
            setActiveDesignerTab(0);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    return (
         <div className={`grid grid-cols-1 ${menuResults.length > 0 ? 'lg:grid-cols-2' : ''} gap-4`}>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Seleccionar Recetas</Label>
                            <div className="border rounded-md p-2 h-24 overflow-y-auto space-y-1 text-sm">{allRecipes.map(r => (<div key={r.id} className="flex items-center gap-2"><Checkbox id={`menu-r-${r.id}`} checked={selectedRecipeIds.includes(r.id)} onChange={() => handleSelection(r.id, 'recipe')} /><Label htmlFor={`menu-r-${r.id}`} className="font-normal">{r.nombre}</Label></div>))}</div>
                        </div>
                        <div className="space-y-2">
                            <Label>Seleccionar Ideas Aprobadas</Label>
                             <div className="border rounded-md p-2 h-24 overflow-y-auto space-y-1 text-sm">{pizarronAprobado.map(t => (<div key={t.id} className="flex items-center gap-2"><Checkbox id={`menu-t-${t.id}`} checked={selectedTaskIds.includes(t.id)} onChange={() => handleSelection(t.id, 'task')} /><Label htmlFor={`menu-t-${t.id}`} className="font-normal truncate">{t.texto}</Label></div>))}</div>
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleGenerateMenus} disabled={loading || (selectedRecipeIds.length + selectedTaskIds.length < 4)}>
                        {loading ? <Spinner className="mr-2"/> : <Icon svg={ICONS.menu} className="mr-2 w-4 h-4" />} Generar 3 Menús
                    </Button>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Generación" description={error} />}
                {menuResults && menuResults.length > 0 && (
                    <div className="flex flex-col h-full">
                        <div className="flex border-b">{menuResults.map((_, index) => (<button key={index} onClick={() => setActiveDesignerTab(index)} className={`py-2 px-4 text-sm font-medium ${activeDesignerTab === index ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Opción {index + 1}</button>))}</div>
                        <div className="flex-1 pt-4"><MenuResultCard item={menuResults[activeDesignerTab]} db={db} userId={userId} appId={appId} /></div>
                    </div>
                )}
            </div>
        </div>
    );
};

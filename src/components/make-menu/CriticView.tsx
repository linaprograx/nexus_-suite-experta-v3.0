import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Type } from "@google/genai";
import { CriticResult, CriticHistorySidebar } from './CriticHistorySidebar';
import { callGeminiApi } from '../../utils/gemini';
import { blobToBase64 } from '../../utils/blobToBase64';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Alert } from '../ui/Alert';

interface CriticViewProps {
    db: Firestore;
    userId: string;
}

export const CriticView: React.FC<CriticViewProps> = ({ db, userId }) => {
    const [criticMenuText, setCriticMenuText] = React.useState('');
    const [criticMenuImage, setCriticMenuImage] = React.useState<File | null>(null);
    const [criticLoading, setCriticLoading] = React.useState(false);
    const [criticError, setCriticError] = React.useState<string | null>(null);
    const [criticResult, setCriticResult] = React.useState<CriticResult | null>(null);
    const [showCriticHistory, setShowCriticHistory] = React.useState(false);
    const criticHistoryPath = `users/${userId}/critic-history`;

    React.useEffect(() => {
        const textFromStorage = localStorage.getItem('criticText');
        if (textFromStorage) {
            setCriticMenuText(prev => prev ? `${prev}\n\n${textFromStorage}` : textFromStorage);
            localStorage.removeItem('criticText');
        }
    }, []);

    const handleInvokeCritic = async () => {
        if (!criticMenuText.trim() && !criticMenuImage) return;
        setCriticLoading(true);
        setCriticError(null);
        setCriticResult(null);

        const systemPrompt = "Eres un crítico de cócteles y consultor de marcas. Analiza el menú proporcionado. Devuelve un objeto JSON con un análisis DAFO: 'puntosFuertes', 'debilidades', 'oportunidades', y un 'feedback' estratégico.";
        
        const parts = [];
        if (criticMenuImage) {
            const base64Data = await blobToBase64(criticMenuImage);
            parts.push({ text: "Analiza la IMAGEN de este menú de cócteles. Si hay texto, analízalo. Si no, analiza el diseño, estilo y concepto." });
            parts.push({ inlineData: { mimeType: criticMenuImage.type, data: base64Data } });
        }
        if (criticMenuText.trim()) {
            parts.push({ text: `Analiza también (o en su lugar) este TEXTO de menú:\n\n${criticMenuText}` });
        }

        const userQueryPayload = { parts };
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    puntosFuertes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    debilidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    oportunidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    feedback: { type: Type.STRING },
                },
            }
        };

        try {
            const response = await callGeminiApi(userQueryPayload, systemPrompt, generationConfig);
            const parsedResult = JSON.parse(response.text);
            setCriticResult(parsedResult);
            await addDoc(collection(db, criticHistoryPath), { ...parsedResult, createdAt: serverTimestamp() });
        } catch(e: any) {
            setCriticError(e.message);
        } finally {
            setCriticLoading(false);
        }
    };

    return (
        <div className={`grid grid-cols-1 ${criticResult ? 'lg:grid-cols-2' : ''} gap-4`}>
            <div>
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center"><CardTitle>El Crítico</CardTitle><Button variant="outline" onClick={() => setShowCriticHistory(true)}>Historial</Button></CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="Pega el contenido de tu menú aquí..." rows={10} value={criticMenuText} onChange={(e) => setCriticMenuText(e.target.value)} />
                        <div><Label>O sube una imagen del menú</Label><Input type="file" accept=".txt,.jpg,.png,.jpeg" onChange={(e) => setCriticMenuImage(e.target.files?.[0] || null)} /></div>
                        <Button className="w-full" onClick={handleInvokeCritic} disabled={criticLoading}>
                            {criticLoading ? <Spinner className="mr-2" /> : <Icon svg={ICONS.critic} className="mr-2 h-4 w-4" />} Invocar al Crítico
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div>
                 {criticLoading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                 {criticError && <Alert variant="destructive" title="Error de Análisis" description={criticError} />}
                 {criticResult && (
                    <div className="space-y-4">
                        <Card className="border-l-4 border-green-500"><CardHeader><CardTitle>Puntos Fuertes</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.puntosFuertes.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                        <Card className="border-l-4 border-red-500"><CardHeader><CardTitle>Debilidades</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.debilidades.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                        <Card className="border-l-4 border-yellow-500"><CardHeader><CardTitle>Oportunidades</CardTitle></CardHeader><CardContent>{criticResult && <ul className="list-disc list-inside space-y-1 text-sm">{criticResult.oportunidades.map((item, i) => <li key={i}>{item}</li>)}</ul>}</CardContent></Card>
                        <Card className="border-l-4 border-blue-500"><CardHeader><CardTitle>Feedback Estratégico</CardTitle></CardHeader><CardContent>{criticResult && <p className="text-sm">{criticResult.feedback}</p>}</CardContent></Card>
                    </div>
                 )}
                 {showCriticHistory && <CriticHistorySidebar db={db} historyPath={criticHistoryPath} onClose={() => setShowCriticHistory(false)} />}
            </div>
        </div>
    );
};

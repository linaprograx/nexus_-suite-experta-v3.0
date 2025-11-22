import React from 'react';
import { Firestore } from 'firebase/firestore';
import { TrendResult } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';
import { callGeminiApiWithSearch } from '../utils/gemini';
import { TrendResultCard } from '../components/trend-locator/TrendResultCard';
import { TrendHistorySidebar } from '../components/trend-locator/TrendHistorySidebar';

interface TrendLocatorViewProps {
    db: Firestore;
    userId: string;
    appId: string;
}

const TREND_SOURCES = ["Coctelería General", "Inspirado en 50 Best Bars", "Revistas (Diffords/Punch)", "Competiciones (World Class)"];
const TREND_TOPICS = ["Garnish Game", "Tecnicas de Alta Cocina", "Infusiones y Maceraciones", "Elaboraciones Complejas", "Ingredientes"];

const TrendLocatorView: React.FC<TrendLocatorViewProps> = ({ db, userId, appId }) => {
    const [sourceFilter, setSourceFilter] = React.useState("Inspirado en 50 Best Bars");
    const [topicFilter, setTopicFilter] = React.useState("Tecnicas de Alta Cocina");
    const [keyword, setKeyword] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [trendResults, setTrendResults] = React.useState<TrendResult[]>([]);
    const [trendSources, setTrendSources] = React.useState<any[]>([]);
    const [showHistory, setShowHistory] = React.useState(false);

    const trendHistoryPath = `users/${userId}/trend-locator-history`;

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setTrendResults([]);
        setTrendSources([]);
        
        const systemPrompt = "Eres un analista de tendencias de coctelería de élite. Tu respuesta debe ser únicamente un array JSON válido, sin texto adicional, markdown o explicaciones.";
        const userQuery = `Busca tendencias sobre ${topicFilter} y ${keyword} inspiradas en ${sourceFilter}. Devuelve un array JSON de 3 a 5 tendencias clave. Cada objeto debe tener 'titulo', 'resumen' (un snippet de 2-3 líneas) y 'fuente' (el título del sitio web). Devuelve NADA MÁS que el array JSON. No incluyas '\`\`\`json' o cualquier otro texto introductorio.`;
        
        try {
            const response = await callGeminiApiWithSearch(userQuery, systemPrompt);
            setTrendSources(response.sources);
            
            let jsonText = '';
            const jsonMatch = response.text.match(/\[\s*\{[\s\S]*\}\s*\]/);

            if (jsonMatch && jsonMatch[0]) {
              jsonText = jsonMatch[0];
            } else {
              const objectMatch = response.text.match(/\{\s*"titulo"[\s\S]*\}/);
              if (objectMatch && objectMatch[0]) {
                jsonText = `[${objectMatch[0]}]`;
              } else {
                throw new Error("La respuesta de la API no contenía un JSON de tendencias válido.");
              }
            }
            
            const results = JSON.parse(jsonText);
            setTrendResults(results);
        } catch (e: any) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError(String(e));
            }
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full p-4 lg:p-8 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="source-filter">Fuente</Label>
                            <Select id="source-filter" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                {TREND_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                         <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="topic-filter">Tema</Label>
                            <Select id="topic-filter" value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
                                {TREND_TOPICS.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1 md:col-span-1">
                            <Label htmlFor="keyword">Palabra Clave</Label>
                            <Input id="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Ej: Fermentación"/>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleSearch} disabled={loading} className="w-full">
                                {loading ? <Spinner className="w-4 h-4 mr-2"/> : <Icon svg={ICONS.search} className="w-4 h-4 mr-2"/>}
                                Buscar Trend
                             </Button>
                             <Button variant="outline" onClick={() => setShowHistory(true)}>Historial</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4">
                {loading && <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div>}
                {error && <Alert variant="destructive" title="Error de Búsqueda" description={error} />}
                {trendResults && trendResults.length > 0 && (
                    <div className="space-y-4">
                        {trendResults.map((item, index) => <TrendResultCard key={index} item={item} db={db} userId={userId} appId={appId} trendHistoryPath={trendHistoryPath} />)}
                        {trendSources && trendSources.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle>Fuentes de Información</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {trendSources.map((source, index) => (
                                            <li key={index}>
                                                <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    {source.web?.title || source.web?.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
                 {!loading && trendResults.length === 0 && (
                    <Card className="flex items-center justify-center min-h-[200px]"><p>Los resultados de la búsqueda aparecerán aquí.</p></Card>
                )}
            </div>
             {showHistory && <TrendHistorySidebar db={db} trendHistoryPath={trendHistoryPath} onClose={() => setShowHistory(false)}/>}
        </div>
    );
};

export default TrendLocatorView;

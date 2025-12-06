import React from 'react';
import { Firestore } from 'firebase/firestore';
import { TrendResult } from '../../types';
import { PremiumLayout } from '../components/layout/PremiumLayout';
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
        <PremiumLayout
            gradientTheme="amber"
            leftSidebar={
                <TrendHistorySidebar db={db} trendHistoryPath={trendHistoryPath} />
            }
            mainContent={
                <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/5 p-4 lg:p-6 overflow-hidden relative">
                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 rounded-2xl">
                                <Spinner className="w-10 h-10 text-amber-500 mb-4" />
                                <p className="text-amber-700 dark:text-amber-300 font-medium animate-pulse">Analizando tendencias...</p>
                            </div>
                        )}

                        {error && <Alert variant="destructive" title="Error de Búsqueda" description={error} className="mb-4" />}

                        {!loading && trendResults.length === 0 && !error ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center opacity-60">
                                <Icon svg={ICONS.search} className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                                <p className="text-lg">Configura los filtros a la derecha y busca inspiración.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                {trendResults.map((item, index) => (
                                    <div key={index} className="h-full">
                                        <TrendResultCard item={item} db={db} userId={userId} appId={appId} trendHistoryPath={trendHistoryPath} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sources Footer within content */}
                        {trendSources && trendSources.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fuentes de Información</h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {trendSources.map((source, index) => (
                                        <li key={index} className="truncate">
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                <Icon svg={ICONS.link} className="w-3 h-3" />
                                                {source.web?.title || source.web?.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            }
            rightSidebar={
                <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 p-4 overflow-y-auto">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Icon svg={ICONS.filter} className="w-4 h-4" />
                        Filtros de Búsqueda
                    </h3>

                    <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                            <Label htmlFor="source-filter" className="text-xs">Fuente de Inspiración</Label>
                            <Select id="source-filter" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-white/60 dark:bg-slate-800/60">
                                {TREND_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="topic-filter" className="text-xs">Tema / Foco</Label>
                            <Select id="topic-filter" value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="bg-white/60 dark:bg-slate-800/60">
                                {TREND_TOPICS.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="keyword" className="text-xs">Palabra Clave (Opcional)</Label>
                            <Input id="keyword" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Ej: Fermentación, Tiki..." className="bg-white/60 dark:bg-slate-800/60" />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                        <Button onClick={handleSearch} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/20">
                            {loading ? <Spinner className="w-4 h-4 mr-2" /> : <Icon svg={ICONS.search} className="w-4 h-4 mr-2" />}
                            Buscar Tendencias
                        </Button>
                    </div>
                </div>
            }
        />
    );
};

export default TrendLocatorView;

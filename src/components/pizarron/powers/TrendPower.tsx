import React from 'react';
import { Firestore, collection, serverTimestamp, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { TrendResult } from '../../../types';
import { TrendResultCard } from '../../trend-locator/TrendResultCard';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";

interface TrendPowerProps {
    db: Firestore;
    appId: string;
    userId: string;
}

export const TrendPower: React.FC<TrendPowerProps> = ({ db, appId, userId }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [region, setRegion] = React.useState('Global');
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<TrendResult[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);

        const fullPrompt = `Analiza tendencias actuales de coctelería sobre "${searchTerm}" en la región "${region}".
        Genera 3 conceptos de cócteles innovadores basados en estas tendencias.
        Devuelve SOLO un array JSON válido.`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        conceptName: { type: Type.STRING },
                        trendScore: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        ingredientsKey: { type: Type.ARRAY, items: { type: Type.STRING } },
                        popularityRegion: { type: Type.STRING },
                        visualStyle: { type: Type.STRING }
                    }
                }
            }
        };

        try {
            const response = await callGeminiApi(fullPrompt, "Eres un experto mixólogo y cazador de tendencias.", generationConfig);
            const data: TrendResult[] = JSON.parse(response.text);

            // Save history (simplified)
            try {
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/trend-history`), {
                    term: searchTerm,
                    region,
                    results: data,
                    timestamp: serverTimestamp()
                });
            } catch (e) { console.warn("Failed to save history", e) }

            setResults(data);
        } catch (e: any) {
            setError(e.message || "Error al buscar tendencias");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-1">
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/20">
                <div className="flex gap-2 mb-2">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ej: Gin, Sabores cítricos, Barcelona..."
                        className="flex-1 bg-white dark:bg-slate-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {loading ? <Spinner className="w-4 h-4" /> : <Icon svg={ICONS.search} className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-slate-400">Powered by Gemini AI</span>
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="text-xs bg-transparent border-none text-purple-600 font-bold focus:ring-0 cursor-pointer"
                    >
                        <option value="Global">Global</option>
                        <option value="Europe">Europa</option>
                        <option value="USA">USA</option>
                        <option value="Asia">Asia</option>
                        <option value="Latam">Latam</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {!loading && results.length === 0 && !error && (
                    <div className="text-center text-slate-400 py-10 opacity-60">
                        <Icon svg={ICONS.trending} className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p>Busca una tendencia para inspirarte</p>
                    </div>
                )}

                {results.map((res, idx) => (
                    <TrendResultCard
                        key={idx}
                        item={res}
                        db={db}
                        userId={userId}
                        appId={appId}
                        trendHistoryPath={`artifacts/${appId}/users/${userId}/trend-history`}
                    />
                ))}
            </div>
        </div>
    );
};

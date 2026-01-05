import React from 'react';
import { Firestore } from 'firebase/firestore';
import { TrendResult } from '../../types';
import { TrendResultCard } from './TrendResultCard';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface TrendLocatorTabProps {
    loading: boolean;
    error: string | null;
    trendResults: TrendResult[];
    trendSources: any[];
    db: Firestore;
    userId: string;
    appId: string;
    trendHistoryPath: string;
    onCreateRecipe?: (trend: TrendResult) => void;
}

export const TrendLocatorTab: React.FC<TrendLocatorTabProps> = ({
    loading,
    error,
    trendResults,
    trendSources,
    db,
    userId,
    appId,
    trendHistoryPath,
    onCreateRecipe
}) => {
    return (
        <div className="h-full flex flex-col rounded-2xl p-4 lg:p-6 overflow-hidden relative">
            {/* Results Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 rounded-2xl">
                        <Spinner className="w-10 h-10 text-amber-500 mb-4" />
                        <p className="text-amber-700 dark:text-amber-300 font-medium animate-pulse">Explorando patrones emergentes...</p>
                    </div>
                )}

                {error && <Alert variant="destructive" title="Error de Búsqueda" description={error} className="mb-4" />}

                {!loading && trendResults.length === 0 && !error ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center opacity-60">
                        <Icon svg={ICONS.search} className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-lg">Espacio de exploración vacío</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-4">
                        {trendResults.map((item, index) => (
                            <div key={index} className="w-full">
                                <TrendResultCard
                                    item={item}
                                    db={db}
                                    userId={userId}
                                    appId={appId}
                                    trendHistoryPath={trendHistoryPath}
                                    onCreateRecipe={onCreateRecipe}
                                />
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
    );
};

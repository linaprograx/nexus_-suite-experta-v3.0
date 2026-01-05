import React from 'react';
import { Firestore } from 'firebase/firestore';
import { MenuLayout } from '../../../types';
import { MenuResultCard } from './MenuResultCard';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface DesignerResultsProps {
    results: MenuLayout[];
    loading: boolean;
    error: string | null;
    db: Firestore;
    userId: string;
    appId: string;
}

const DesignerResults: React.FC<DesignerResultsProps> = ({ results, loading, error, db, userId, appId }) => {
    const [activeTab, setActiveTab] = React.useState(0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-pulse">
                <Spinner className="w-12 h-12 text-rose-500 mb-4" />
                <p className="text-slate-500 font-medium">Diseñando conceptos visuales...</p>
                <p className="text-xs text-slate-400">Esto puede tomar unos segundos.</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="destructive" title="Error de Diseño" description={error} />;
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-full mb-4">
                    <Icon svg={ICONS.menu} className="w-12 h-12 text-rose-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Lienzo en Blanco</h3>
                <p className="text-sm text-center max-w-xs mt-2">
                    Selecciona recetas y conceptos en el panel derecho para generar propuestas de diseño de menú únicas.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
                {results.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`py-2 px-4 text-sm font-medium rounded-lg transition-all ${activeTab === index
                            ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Opción {index + 1}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-1">
                <MenuResultCard item={results[activeTab]} db={db} userId={userId} appId={appId} />
            </div>
        </div>
    );
};

export default DesignerResults;

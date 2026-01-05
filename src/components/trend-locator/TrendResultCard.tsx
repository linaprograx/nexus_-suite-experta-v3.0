import React from 'react';
import { Firestore, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { TrendResult } from '../../../types';
import { Button } from '../ui/Button';

interface TrendResultCardProps {
    item: TrendResult;
    db: Firestore;
    userId: string;
    appId: string;
    trendHistoryPath: string;
}

export const TrendResultCard: React.FC<TrendResultCardProps> = ({ item, db, userId, appId, trendHistoryPath }) => {

    const handleSaveToPizarron = async () => {
        if (!db || !userId) return;
        const taskText = `[Trend] ${item.titulo}: ${item.resumen}`.substring(0, 500);
        await addDoc(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), {
            content: taskText, status: 'Ideas', category: 'Ideas', createdAt: serverTimestamp(), boardId: 'general'
        });
        alert("Idea guardada en el Pizarrón.");
    };

    const handleSaveToHistory = async () => {
        if (!db || !userId) return;
        await addDoc(collection(db, trendHistoryPath), { ...item, createdAt: serverTimestamp() });
        alert("Tendencia guardada en el historial.");
    };

    return (
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl p-5 hover:shadow-xl transition-all flex flex-col h-full">
            <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">
                    {(item as any).conceptName || item.titulo || "Sin título"}
                </h3>
                {((item as any).visualStyle || item.fuente) && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {(item as any).visualStyle || item.fuente}
                    </span>
                )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-grow leading-relaxed">
                {(item as any).description || item.resumen || "Sin descripción disponible."}
            </p>

            <div className="flex gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 mt-auto">
                <Button size="sm" onClick={handleSaveToPizarron} className="flex-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
                    Pizarrón
                </Button>
                <Button size="sm" variant="outline" onClick={handleSaveToHistory} className="flex-1 border-slate-200 dark:border-slate-700">
                    Historial
                </Button>
            </div>
        </div>
    );
};


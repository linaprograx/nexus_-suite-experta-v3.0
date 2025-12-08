import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { TrendResult } from '../../../types';
import { Card } from '../ui/Card';

interface TrendHistorySidebarProps {
    db: Firestore;
    trendHistoryPath: string;
    onClose?: () => void;
    onLoadHistory: (item: TrendResult) => void;
}

export const TrendHistorySidebar: React.FC<TrendHistorySidebarProps> = ({ db, trendHistoryPath, onLoadHistory }) => {
    const [history, setHistory] = React.useState<TrendResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, trendHistoryPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrendResult)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching trend history:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, trendHistoryPath]);

    return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Historial</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 p-2 custom-scrollbar">
                {loading && <p className="p-4 text-center text-sm text-muted-foreground">Cargando...</p>}
                {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No hay historial.</p>}
                {history.map(item => (
                    <div key={item.id} onClick={() => onLoadHistory(item)} className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 p-3 rounded-xl border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">{item.titulo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.fuente}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


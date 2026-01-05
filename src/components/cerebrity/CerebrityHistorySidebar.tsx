import * as React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { CerebrityResult } from '../../../types';

interface CerebrityHistorySidebarProps {
    db: Firestore;
    userId: string;
    onLoadHistory: (item: CerebrityResult) => void;
}

export const CerebrityHistorySidebar: React.FC<CerebrityHistorySidebarProps> = ({ db, userId, onLoadHistory }) => {
    const [history, setHistory] = React.useState<(CerebrityResult & { id: string })[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db || !userId) return;
        setLoading(true);
        const historyCol = collection(db, `users/${userId}/cerebrity-history`);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(20));

        const unsubscribe = onSnapshot(q, snapshot => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CerebrityResult & { id: string }));
            setHistory(historyData);
            setLoading(false);
        }, err => {
            console.error("Error fetching history:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId]);

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex-shrink-0 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Historial Creativo</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading && <div className="p-4 text-center text-sm text-slate-500">Cargando...</div>}
                {!loading && history.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No hay historial.</div>}
                {history.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onLoadHistory(item)}
                        className="flex gap-3 rounded-lg p-2 bg-white/60 dark:bg-slate-800/60 border border-white/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                    >
                        {item.imageUrl && (
                            <img
                                src={item.imageUrl}
                                className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                                alt="Generated recipe"
                            />
                        )}
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.storytelling || item.mejora}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.garnishComplejo}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

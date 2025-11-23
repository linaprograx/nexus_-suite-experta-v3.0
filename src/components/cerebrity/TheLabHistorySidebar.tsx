import * as React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface TheLabHistorySidebarProps {
    db: Firestore;
    historyPath: string;
    onLoadHistory: (item: any) => void;
}

export const TheLabHistorySidebar: React.FC<TheLabHistorySidebarProps> = ({ db, historyPath, onLoadHistory }) => {
    const [history, setHistory] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, historyPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, err => {
            console.error("Error fetching lab history:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, historyPath]);

    return (
        <div className="h-full flex flex-col backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-xl p-4">
            <div className="flex-shrink-0 mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Historial del Laboratorio</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading && <div className="p-4 text-center text-sm text-slate-500">Cargando...</div>}
                {!loading && history.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No hay historial.</div>}
                {history.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => onLoadHistory(item)}
                        className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                    >
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">Análisis de: {item.combination}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{item.result?.perfil}</p>
                         <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

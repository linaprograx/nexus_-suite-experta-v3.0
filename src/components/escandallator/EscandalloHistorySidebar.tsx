import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Escandallo } from '../../../types';
import { Card } from '../ui/Card';

const EscandalloHistoryCard: React.FC<{
    item: Escandallo;
    onLoadHistory: (item: Escandallo) => void;
}> = ({ item, onLoadHistory }) => {
    return (
        <div
            onClick={() => onLoadHistory(item)}
            className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-3 rounded-xl border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
        >
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.recipeName}</p>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Costo: €{(item.costo || 0).toFixed(2)}</span>
                <span>PVP: €{(item.precioVenta || 0).toFixed(2)}</span>
            </div>
            <div className="text-xs mt-1">
                <span className="text-slate-500">Rentab: <span className="font-medium text-emerald-600 dark:text-emerald-400">{item.rentabilidad.toFixed(1)}%</span></span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 text-right">
                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
            </div>
        </div>
    );
};

interface EscandalloHistorySidebarProps {
    db: Firestore;
    escandallosColPath: string;
    onLoadHistory: (item: Escandallo) => void;
}

const EscandalloHistorySidebar: React.FC<EscandalloHistorySidebarProps> = ({ db, escandallosColPath, onLoadHistory }) => {
    const [history, setHistory] = React.useState<Escandallo[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        const historyCol = collection(db, escandallosColPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, snapshot => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Escandallo));
            setHistory(historyData);
            setLoading(false);
        }, err => {
            console.error("Error fetching escandallo history:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, escandallosColPath]);

    return (
        <div className="h-full flex flex-col bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Historial</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {loading && <p className="p-4 text-center text-sm text-slate-500">Cargando...</p>}
                {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No hay historial.</p>}
                {history.map(item => (
                    <EscandalloHistoryCard key={item.id} item={item} onLoadHistory={onLoadHistory} />
                ))}
            </div>
        </div>
    );
};

export default EscandalloHistorySidebar;


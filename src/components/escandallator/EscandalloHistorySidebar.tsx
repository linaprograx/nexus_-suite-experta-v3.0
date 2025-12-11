import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Escandallo } from '../../types';
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
    onNewEscandallo: () => void;
}

const EscandalloHistorySidebar: React.FC<EscandalloHistorySidebarProps> = ({ db, escandallosColPath, onLoadHistory, onNewEscandallo }) => {
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
        <div className="h-full flex flex-col bg-transparent border-0 shadow-none">
            <div className="p-4 bg-transparent mb-2 w-full mx-auto">
                <div className="px-4 py-2 bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 w-[96%] mx-auto">Historial</div>
                <button
                    onClick={onNewEscandallo}
                    className="w-full px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-premium transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <Icon svg={ICONS.plus} className="w-5 h-5" /> Nuevo Escandallo
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 w-[96%] mx-auto">
                {loading && <p className="p-4 text-center text-sm text-slate-500">Cargando...</p>}
                {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No hay historial.</p>}
                {history.map(item => (
                    <div
                        key={item.id}
                        onClick={() => onLoadHistory(item)}
                        className="cursor-pointer bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl p-4 rounded-2xl border border-white/10 dark:border-white/5 shadow-sm hover:bg-rose-50/50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative z-10">
                            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">{item.recipeName}</p>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-500 dark:text-slate-400">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}</span>
                                <div className="text-right">
                                    <span className="block text-xs text-rose-500/80 font-semibold uppercase tracking-wider">Rentabilidad</span>
                                    <span className="text-lg font-black text-rose-600 dark:text-rose-400 leading-none">{item.rentabilidad.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscandalloHistorySidebar;


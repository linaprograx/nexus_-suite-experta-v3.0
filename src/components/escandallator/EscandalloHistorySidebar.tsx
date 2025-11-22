import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Escandallo } from '../../../types';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const EscandalloHistoryCard: React.FC<{
    item: Escandallo;
    onLoadHistory: (item: Escandallo) => void;
}> = ({ item, onLoadHistory }) => {
    return (
        <Card onClick={() => onLoadHistory(item)} className="cursor-pointer hover:bg-accent p-2">
            <p className="font-semibold text-sm">{item.recipeName}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Costo: €{(item.costo || 0).toFixed(2)}</span>
                <span>PVP: €{(item.precioVenta || 0).toFixed(2)}</span>
            </div>
            <div className="text-xs">
                <span className="text-muted-foreground">Rentab: <span className="font-medium text-primary">{item.rentabilidad.toFixed(1)}%</span></span>
            </div>
        </Card>
    );
};

interface EscandalloHistorySidebarProps {
    db: Firestore;
    escandallosColPath: string;
    onLoadHistory: (item: Escandallo) => void;
    onClose: () => void;
}

const EscandalloHistorySidebar: React.FC<EscandalloHistorySidebarProps> = ({ db, escandallosColPath, onLoadHistory, onClose }) => {
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
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Historial de Escandallos</h3>
              <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading && <p className="p-4 text-center text-sm text-muted-foreground">Cargando...</p>}
                {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No hay historial.</p>}
                {history.map(item => (
                    <EscandalloHistoryCard key={item.id} item={item} onLoadHistory={onLoadHistory} />
                ))}
            </div>
          </div>
        </>
    );
};

export default EscandalloHistorySidebar;

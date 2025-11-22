import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { TrendResult } from '../../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface TrendHistorySidebarProps {
    db: Firestore;
    trendHistoryPath: string;
    onClose: () => void;
}

export const TrendHistorySidebar: React.FC<TrendHistorySidebarProps> = ({ db, trendHistoryPath, onClose }) => {
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
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-96 bg-card p-4 z-50 flex flex-col border-l">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Historial de Tendencias</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && <p className="p-4 text-center text-sm text-muted-foreground">Cargando historial...</p>}
                    {!loading && history.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No hay historial.</p>}
                    {history.map(item => (
                        <Card key={item.id}>
                           <CardContent className="p-3">
                                <p className="font-semibold text-sm">{item.titulo}</p>
                                <p className="text-xs text-muted-foreground">{item.fuente}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
};

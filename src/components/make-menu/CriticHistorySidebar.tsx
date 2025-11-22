import React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Card, CardContent } from '../ui/Card';

export type CriticResult = {
    puntosFuertes: string[],
    debilidades: string[],
    oportunidades: string[],
    feedback: string,
    createdAt?: any,
    id?: string,
};

interface CriticHistorySidebarProps {
    db: Firestore;
    historyPath: string;
    onClose: () => void;
}

export const CriticHistorySidebar: React.FC<CriticHistorySidebarProps> = ({ db, historyPath, onClose }) => {
    const [history, setHistory] = React.useState<CriticResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const historyCol = collection(db, historyPath);
        const q = query(historyCol, orderBy('createdAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, snapshot => {
            setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CriticResult)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, historyPath]);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-96 bg-card p-4 z-50 flex flex-col border-l">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Historial de Críticas</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><Icon svg={ICONS.x} /></Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && <p>Cargando historial...</p>}
                    {!loading && history.length === 0 && <p>No hay historial.</p>}
                    {history.map(item => (
                        <Card key={item.id}>
                           <CardContent className="p-3">
                                <p className="font-semibold text-sm">Análisis del {item.createdAt?.toDate().toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.feedback}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
};

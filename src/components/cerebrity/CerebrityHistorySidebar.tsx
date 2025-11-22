import * as React from 'react';
import { Firestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { CerebrityResult } from '../../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface CerebrityHistorySidebarProps {
    db: Firestore;
    userId: string;
    onLoadHistory: (item: CerebrityResult) => void;
    onClose: () => void;
}

export const CerebrityHistorySidebar: React.FC<CerebrityHistorySidebarProps> = ({ db, userId, onLoadHistory, onClose }) => {
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
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={onClose}
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-semibold">Historial Creativo</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon svg={ICONS.x} className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                {loading && <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>}
                {!loading && history.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No hay historial.</div>}
                {history.map(item => (
                    <button key={item.id} onClick={() => onLoadHistory(item)} className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors flex items-start gap-3">
                        {item.imageUrl && <img src={item.imageUrl} className="w-12 h-12 rounded object-cover flex-shrink-0" alt="Generated recipe" />}
                        <div className="flex-1">
                            <p className="text-xs font-semibold line-clamp-2">{item.storytelling || item.mejora}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
          </div>
        </>
    );
};

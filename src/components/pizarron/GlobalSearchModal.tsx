import React from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PizarronTask, PizarronBoard } from '../../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { KanbanColumn } from './KanbanColumn';
import { PizarronCard } from './PizarronCard';
import { safeNormalizeTask } from '../../utils/taskHelpers';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    db: any; // Firestore
    appId: string;
    onOpenTask: (task: PizarronTask) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, db, appId, onOpenTask }) => {
    const [query, setQuery] = React.useState('');
    const [allTasks, setAllTasks] = React.useState<PizarronTask[]>([]);
    const [boards, setBoards] = React.useState<PizarronBoard[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    // Fetch ALL tasks and boards on open
    React.useEffect(() => {
        if (!isOpen) return;

        const tasksUnsub = onSnapshot(collection(db, `artifacts/${appId}/public/data/pizarron-tasks`), (snap) => {
            const tasks = snap.docs.map(doc => safeNormalizeTask({ id: doc.id, ...doc.data() }));
            setAllTasks(tasks);
            setIsLoading(false);
        });

        const boardsUnsub = onSnapshot(collection(db, `artifacts/${appId}/public/data/pizarron-boards`), (snap) => {
            const b = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PizarronBoard));
            setBoards(b);
        });

        return () => {
            tasksUnsub();
            boardsUnsub();
        };
    }, [isOpen, db, appId]);

    const filteredResults = React.useMemo(() => {
        if (!query) return [];
        const lowerQ = query.toLowerCase();
        return allTasks.filter(t =>
            t.texto.toLowerCase().includes(lowerQ) ||
            t.labels?.some(l => l.toLowerCase().includes(lowerQ)) ||
            t.category.toLowerCase().includes(lowerQ)
        );
    }, [query, allTasks]);

    // Group results by board
    const groupedResults = React.useMemo(() => {
        const groups: Record<string, PizarronTask[]> = {};
        filteredResults.forEach(task => {
            const boardName = boards.find(b => b.id === task.boardId)?.name || 'General';
            if (!groups[boardName]) groups[boardName] = [];
            groups[boardName].push(task);
        });
        return groups;
    }, [filteredResults, boards]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Icon svg={ICONS.search} className="w-5 h-5 text-slate-400" />
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        placeholder="Buscar en todos los tableros..."
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <Button size="icon" variant="ghost" className="rounded-full" onClick={onClose}>
                        <Icon svg={ICONS.close || '<path d="M18 6L6 18M6 6l12 12" />'} className="w-5 h-5" />
                    </Button>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {query === '' ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                            <Icon svg={ICONS.search} className="w-12 h-12 opacity-20 mb-2" />
                            <p className="text-sm">Escribe para buscar tareas, etiquetas o categorías.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 p-2">
                            {filteredResults.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No se encontraron resultados para "{query}"</div>
                            ) : (
                                Object.entries(groupedResults).map(([boardName, tasks]) => (
                                    <div key={boardName}>
                                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 ml-1 flex items-center gap-2">
                                            <Icon svg={ICONS.layout} className="w-3 h-3" />
                                            {boardName}
                                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 rounded-full text-[10px]">{tasks.length}</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {tasks.map(task => (
                                                <div key={task.id} onClick={() => { onOpenTask(task); onClose(); }}>
                                                    <PizarronCard task={task} onDragStart={() => { }} onOpenDetail={() => { onOpenTask(task); onClose(); }} borderColor="#cbd5e1" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex justify-between px-4">
                    <span>{filteredResults.length} resultados encontrados</span>
                    <span className="flex gap-2">
                        <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700">ESC</kbd> para cerrar
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
};

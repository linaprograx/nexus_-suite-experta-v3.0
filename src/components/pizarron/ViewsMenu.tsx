import React from 'react';
import { Firestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronSavedView } from '../../types';
import { usePizarraStore } from '../../../store/pizarraStore';

interface ViewsMenuProps {
    currentView: 'kanban' | 'list' | 'timeline' | 'document';
    onViewChange: (view: 'kanban' | 'list' | 'timeline' | 'document') => void;
    db: Firestore;
    userId: string;
    filters: any;
    setFilters: (filters: any) => void;
}

export const ViewsMenu: React.FC<ViewsMenuProps> = ({ currentView, onViewChange, db, userId, filters, setFilters }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [savedViews, setSavedViews] = React.useState<PizarronSavedView[]>([]);
    const [newViewName, setNewViewName] = React.useState('');
    const [showSaveView, setShowSaveView] = React.useState(false);

    const viewsColPath = `users/${userId}/pizarronViews`;

    React.useEffect(() => {
        const unsub = onSnapshot(collection(db, viewsColPath), (snap) => {
            setSavedViews(snap.docs.map(d => ({ ...d.data(), id: d.id } as PizarronSavedView)));
        });
        return () => unsub();
    }, [db, viewsColPath]);

    const handleSaveView = async () => {
        if (!newViewName.trim()) return;
        await addDoc(collection(db, viewsColPath), {
            name: newViewName,
            filters, // Verify if we should save currentView type too? Usually yes.
            viewType: currentView,
            createdAt: serverTimestamp(),
            userId
        });
        setNewViewName('');
        setShowSaveView(false);
    };

    const loadView = (view: PizarronSavedView) => {
        if (view.filters) setFilters(view.filters);
        if (view.viewType) onViewChange(view.viewType as any);
        setIsOpen(false);
    };

    const handleDeleteView = async (e: React.MouseEvent, viewId: string) => {
        e.stopPropagation();
        await deleteDoc(doc(db, viewsColPath, viewId));
    };

    const getViewIcon = (view: string) => {
        switch (view) {
            case 'kanban': return ICONS.layoutGrid;
            case 'list': return ICONS.list;
            case 'timeline': return ICONS.chart;
            case 'document': return ICONS.book;
            default: return ICONS.layout;
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-xl transition-all ${isOpen ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-white/50 hover:text-orange-500'}`}
            >
                <Icon svg={getViewIcon(currentView)} className="h-4 w-4" />
                <span className="font-medium">Vistas</span>
                <Icon svg={ICONS.chevronDown} className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-40 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">

                        {/* View Types Grid */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diseño del Tablero</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'kanban', label: 'Canvas', icon: ICONS.layoutGrid },
                                    { id: 'list', label: 'Lista', icon: ICONS.list },
                                    { id: 'timeline', label: 'Cronograma', icon: ICONS.chart },
                                    { id: 'document', label: 'Documento', icon: ICONS.book },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => { onViewChange(type.id as any); setIsOpen(false); }}
                                        className={`flex items-center gap-3 p-2 rounded-xl text-sm font-medium transition-all ${currentView === type.id ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <Icon svg={type.icon} className="h-4 w-4" />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />

                        {/* Saved Views */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vistas Guardadas</h4>
                                {!showSaveView && (
                                    <button onClick={() => setShowSaveView(true)} className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                                        <Icon svg={ICONS.plus} className="h-3 w-3" /> Nueva
                                    </button>
                                )}
                            </div>

                            {showSaveView && (
                                <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                    <input
                                        value={newViewName}
                                        onChange={(e) => setNewViewName(e.target.value)}
                                        placeholder="Nombre de la vista..."
                                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 mb-2 focus:ring-2 focus:ring-orange-500/20 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowSaveView(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Cancelar</button>
                                        <button onClick={handleSaveView} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg shadow-sm hover:bg-orange-600">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {savedViews.length === 0 && !showSaveView && (
                                    <div className="text-center py-4 text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        No hay vistas guardadas
                                    </div>
                                )}
                                {savedViews.map(view => (
                                    <div key={view.id} className="group flex justify-between items-center hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-lg px-2 py-1.5 cursor-pointer transition-colors" onClick={() => loadView(view)}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Icon svg={getViewIcon(view.viewType || 'kanban')} className="h-3 w-3 text-slate-400" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{view.name}</span>
                                        </div>
                                        <button onClick={(e) => handleDeleteView(e, view.id!)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <Icon svg={ICONS.trash} className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

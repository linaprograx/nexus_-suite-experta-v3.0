import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Input } from '../../../components/ui/Input';
import { ICONS } from '../../../components/ui/icons';
import { ViewsMenu } from '../../../components/pizarron/ViewsMenu';
import { FiltersBar } from '../../../components/pizarron/FiltersBar';
import { Firestore } from 'firebase/firestore';
import { Tag, PizarronTask, PizarronBoard, UserProfile } from '../../../../types';
import { usePizarraStore } from '../../../store/pizarraStore';

interface BoardTopbarProps {
    isLeftPanelOpen: boolean;
    onToggleLeftPanel: () => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filters: any;
    setFilters: (filters: any) => void;
    db: Firestore;
    userId: string;
    tags: Tag[];
    compactMode: boolean;
    onToggleCompactMode: () => void;
    currentView: 'kanban' | 'list' | 'timeline' | 'document';
    onViewChange: (view: 'kanban' | 'list' | 'timeline' | 'document') => void;
    tasks?: PizarronTask[];
    board?: PizarronBoard;
    appId: string;
    users?: UserProfile[];
    onAddTask: () => void;
}

export const BoardTopbar: React.FC<BoardTopbarProps> = ({
    isLeftPanelOpen,
    onToggleLeftPanel,
    searchQuery,
    onSearchChange,
    filters,
    setFilters,
    db,
    userId,
    tags,
    compactMode,
    onToggleCompactMode,
    currentView,
    onViewChange,
    tasks,
    board,
    appId,
    users,
    onAddTask
}) => {
    const { focusMode, toggleFocusMode, automationsEnabled, toggleAutomationsEnabled } = usePizarraStore();

    const handleExportCSV = () => {
        if (!tasks || tasks.length === 0) {
            alert("No hay tareas para exportar.");
            return;
        }

        const headers = ['ID', 'Tarea', 'Estado', 'Categoría', 'Prioridad', 'Etiquetas', 'Asignados', 'Fecha Creación'];
        const csvContent = [
            headers.join(','),
            ...tasks.map(t => {
                const row = [
                    t.id,
                    `"${t.texto.replace(/"/g, '""')}"`,
                    t.status,
                    t.category,
                    t.priority,
                    `"${(t.labels || []).join(';')}"`,
                    `"${(t.assignees || []).join(';')}"`,
                    t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toISOString() : ''
                ];
                return row.join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${board?.name || 'tablero'}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-16 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/60 sticky top-0 z-20">

            {/* LEFT: Board Name Only */}
            <div className="flex items-center gap-4 flex-1">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                        {board?.name || 'Tablero'}
                    </h1>
                    {board?.description && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize truncate max-w-[300px]">{board.description}</p>
                    )}
                </div>
            </div>

            {/* RIGHT: Tools (Views, Filters, Export) */}
            <div className="flex items-center gap-2">

                {/* View Switcher & Filters */}
                <ViewsMenu
                    currentView={currentView}
                    onViewChange={onViewChange}
                    db={db}
                    userId={userId}
                    appId={appId}
                    filters={filters}
                    setFilters={setFilters}
                />

                <FiltersBar
                    filters={filters}
                    setFilters={setFilters}
                    tags={tags}
                    users={users}
                    onClear={() => setFilters({})}
                />

                {/* Export CSV */}
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title="Exportar a CSV"
                >
                    <Icon svg={ICONS.download} className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                </button>

            </div>
        </div>
    );
};

import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Input } from '../../../components/ui/Input';
import { ICONS } from '../../../components/ui/icons';
import { FiltersBar } from '../../../components/pizarron/FiltersBar';
import { Firestore } from 'firebase/firestore';
import { Tag } from '../../../../types';
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
    boardName: string;
    boardDescription?: string;
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
    boardName,
    boardDescription
}) => {
    const { focusMode, toggleFocusMode, automationsEnabled, toggleAutomationsEnabled } = usePizarraStore();

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4 lg:px-6 py-2 gap-4 border-b border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4 w-full md:w-auto">
                {!isLeftPanelOpen && <Button size="icon" variant="ghost" onClick={onToggleLeftPanel}><Icon svg={ICONS.chevronRight} /></Button>}
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent leading-tight">
                        {boardName}
                    </h1>
                    {boardDescription && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                            {boardDescription}
                        </p>
                    )}
                </div>
            </div>

            {/* View Switcher & Actions Unified */}
            <div className="flex items-center gap-1 md:gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-xl transition-all duration-200 ${currentView === 'kanban' ? 'text-orange-600 bg-orange-50/80 dark:bg-orange-900/20' : 'text-slate-500 hover:text-orange-500 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                    onClick={() => onViewChange('kanban')}
                    title="Canvas"
                >
                    <Icon svg={ICONS.layoutGrid} className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-xl transition-all duration-200 ${currentView === 'list' ? 'text-orange-600 bg-orange-50/80 dark:bg-orange-900/20' : 'text-slate-500 hover:text-orange-500 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                    onClick={() => onViewChange('list')}
                    title="Lista"
                >
                    <Icon svg={ICONS.list} className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-xl transition-all duration-200 ${currentView === 'timeline' ? 'text-orange-600 bg-orange-50/80 dark:bg-orange-900/20' : 'text-slate-500 hover:text-orange-500 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                    onClick={() => onViewChange('timeline')}
                    title="Timeline"
                >
                    <Icon svg={ICONS.chart} className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-xl transition-all duration-200 ${currentView === 'document' ? 'text-orange-600 bg-orange-50/80 dark:bg-orange-900/20' : 'text-slate-500 hover:text-orange-500 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                    onClick={() => onViewChange('document')}
                    title="Documento"
                >
                    <Icon svg={ICONS.book} className="h-5 w-5" />
                </Button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                <FiltersBar filters={filters} setFilters={setFilters} db={db} userId={userId} tags={tags} />
            </div>

            {/* Search removed as it is in the right sidebar now */}
            <div className="flex-1" />



        </div>
    );
};


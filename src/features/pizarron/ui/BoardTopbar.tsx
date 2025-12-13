import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Input } from '../../../components/ui/Input';
import { ICONS } from '../../../components/ui/icons';
import { ViewsMenu } from '../../../components/pizarron/ViewsMenu';
import { Firestore } from 'firebase/firestore';
import { Tag, PizarronTask, PizarronBoard, UserProfile } from '../../../types';
import { usePizarraStore } from '../../../store/pizarraStore';

// Update imports if needed
// import { PizarronBoard, UserProfile } from '../../../../types'; // Already imported above

interface BoardTopbarProps {
    isLeftPanelOpen?: boolean; // deprecated?
    onToggleLeftPanel?: () => void; // deprecated?
    searchQuery: string;
    onSearchChange: (q: string) => void;
    filters: any;
    setFilters: (f: any) => void;
    db: any;
    userId: string;
    appId: string;
    tags: any[];
    compactMode?: boolean;
    onToggleCompactMode?: () => void;
    currentView: string;
    onViewChange: (v: string) => void;
    tasks: any[];
    board?: PizarronBoard;
    users?: any[];
    onAddTask: () => void;
    onCreateIdea?: () => void; // New
    zoom?: number;
    setZoom?: (z: number) => void;
    onResetView?: () => void;

    // Board Switcher Props
    boards?: PizarronBoard[];
    setActiveBoardId?: (id: string) => void;
    onAddBoard?: () => void;
    userProfile?: Partial<UserProfile>;

    // Tools Control
    activeTool?: string;
    setActiveTool?: (tool: string) => void;

    // Right Sidebar Tools Handlers
    onShowStats?: () => void;
    onShowTopIdeas?: () => void;
    onShowSmartView?: () => void;
    onGlobalSearch?: () => void;
}

export const BoardTopbar: React.FC<BoardTopbarProps> = ({
    searchQuery,
    onSearchChange,
    filters,
    setFilters,
    db,
    userId,
    appId,
    tags,
    currentView,
    onViewChange,
    tasks,
    board,
    onAddTask,
    onCreateIdea,
    zoom,
    setZoom,
    onResetView,
    boards,
    setActiveBoardId,
    onAddBoard,
    userProfile,
    activeTool = 'pointer',
    setActiveTool,
    onShowStats,
    onShowTopIdeas,
    onShowSmartView,
    onGlobalSearch
}) => {

    const handleCreateTask = () => onAddTask();
    const handleCreateIdea = () => onCreateIdea && onCreateIdea();

    // Board Switcher Logic
    const [showBoardMenu, setShowBoardMenu] = React.useState(false);

    return (
        <div className="absolute top-0 left-0 w-full h-20 flex items-center justify-between px-6 z-50 pointer-events-auto bg-orange-500/10 backdrop-blur-md border-b border-orange-500/20 shadow-sm transition-all duration-300 hover:bg-orange-500/20 hover:shadow-md">

            {/* LEFT: Board Switcher */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowBoardMenu(!showBoardMenu)}
                    className="flex items-center gap-3 px-3 py-2 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-white/40 shadow-sm hover:bg-orange-500 hover:text-white hover:border-orange-400 transition-all duration-300 group/btn"
                >
                    <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center shadow-inner group-hover/btn:bg-white/20 text-orange-600 group-hover/btn:text-white transition-colors">
                        <Icon svg={ICONS.layout} className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover/btn:text-white">
                            {board?.name || 'Tablero General'}
                        </h1>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover/btn:text-orange-100">
                            {boards?.length || 0} Tableros
                        </p>
                    </div>
                    <Icon svg={ICONS.chevronDown} className="w-4 h-4 text-slate-400 group-hover/btn:text-white/70" />
                </button>

                {/* Dropdown Menu (Keep existing style or update?) Keep simple for now */}
                {showBoardMenu && (
                    <div className="absolute top-full left-6 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                        {/* ... existing dropdown content ... */}
                        <div className="px-3 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mis Tableros</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {boards?.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => { setActiveBoardId && setActiveBoardId(b.id); setShowBoardMenu(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${board?.id === b.id ? 'text-orange-600 font-semibold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${board?.id === b.id ? 'bg-orange-500' : 'bg-slate-300'}`} />
                                    {b.name}
                                </button>
                            ))}
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 px-2">
                            <button
                                onClick={() => { onAddBoard && onAddBoard(); setShowBoardMenu(false); }}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-colors"
                            >
                                <Icon svg={ICONS.plus} className="w-3.5 h-3.5" />
                                Nuevo Tablero
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CENTER: Creation Tools (Floating Glass Squares) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleCreateIdea}
                    className="group relative w-12 h-12 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:border-orange-400 hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1"
                    title="Nueva Idea"
                >
                    <Icon svg={ICONS.book} className="w-6 h-6 text-slate-700 dark:text-slate-200 group-hover:text-white transition-colors" />
                </button>

                <button
                    onClick={handleCreateTask}
                    className="group relative w-12 h-12 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:border-orange-400 hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1"
                    title="Nueva Tarea"
                >
                    <Icon svg={ICONS.fileText} className="w-6 h-6 text-slate-700 dark:text-slate-200 group-hover:text-white transition-colors" />
                </button>

                <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-2" />

                {/* Tools: Selector, Shapes, Text, Lines, Eraser */}
                <button
                    onClick={() => setActiveTool && setActiveTool('pointer')}
                    className={`group relative w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-lg border shadow-sm transition-all duration-200 ${activeTool === 'pointer' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/30 dark:bg-slate-900/30 border-white/20 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-white'}`}
                    title="Seleccionar"
                >
                    <Icon svg={ICONS.mousePointer || ICONS.maximize} className="w-4 h-4" />
                </button>

                <button
                    onClick={() => setActiveTool && setActiveTool('shape')}
                    className={`group relative w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-lg border shadow-sm transition-all duration-200 ${activeTool === 'shape' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/30 dark:bg-slate-900/30 border-white/20 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-white'}`}
                    title="Formas"
                >
                    <div className={`w-4 h-4 border-2 rounded-sm transition-colors ${activeTool === 'shape' ? 'border-white' : 'border-slate-700 dark:border-slate-200 group-hover:border-white'}`} />
                </button>

                <button
                    onClick={() => setActiveTool && setActiveTool('text')}
                    className={`group relative w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-lg border shadow-sm transition-all duration-200 ${activeTool === 'text' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/30 dark:bg-slate-900/30 border-white/20 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-white'}`}
                    title="Texto"
                >
                    <span className="font-serif font-bold text-lg leading-none transition-colors">T</span>
                </button>

                <button
                    onClick={() => setActiveTool && setActiveTool('line')}
                    className={`group relative w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-lg border shadow-sm transition-all duration-200 ${activeTool === 'line' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/30 dark:bg-slate-900/30 border-white/20 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:border-orange-400 hover:text-white'}`}
                    title="Líneas"
                >
                    <Icon svg={ICONS.activity} className="w-5 h-5 transition-colors" />
                </button>

                <button
                    onClick={() => setActiveTool && setActiveTool('eraser')}
                    className={`group relative w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-lg border shadow-sm transition-all duration-200 ${activeTool === 'eraser' ? 'bg-red-500 border-red-400 text-white' : 'bg-white/30 dark:bg-slate-900/30 border-white/20 text-slate-700 dark:text-slate-200 hover:bg-red-500 hover:border-red-400 hover:text-white'}`}
                    title="Borrador"
                >
                    <Icon svg={ICONS.trash} className="w-5 h-5 transition-colors" />
                </button>
            </div>

            {/* RIGHT: Tools & Actions (Automations, Search, etc.) */}
            <div className="flex items-center gap-3">

                {/* Search */}
                <div className={`flex items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 transition-all duration-300 ${searchQuery ? 'w-64 px-3' : 'w-10 h-10 justify-center hover:w-64 hover:px-3'} h-10 overflow-hidden`}>
                    <button onClick={onGlobalSearch}>
                        <Icon svg={ICONS.search} className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                    </button>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar..."
                        className={`bg-transparent border-none outline-none text-sm font-medium text-slate-800 dark:text-white ml-2 w-full ${searchQuery ? 'block' : 'hidden md:block'}`}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchChange('')}>
                            <Icon svg={ICONS.x} className="w-3 h-3 text-slate-500 hover:text-red-500" />
                        </button>
                    )}
                </div>

                {/* Right Sidebar Tools RESTORED */}
                <button className="w-10 h-10 flex items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:text-white transition-all" title="Plantillas">
                    <Icon svg={ICONS.layout || ICONS.grid} className="w-5 h-5" />
                </button>

                <button className="w-10 h-10 flex items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:text-white transition-all" title="Historial">
                    <Icon svg={ICONS.clock || ICONS.refresh} className="w-5 h-5" />
                </button>

                <button className="w-10 h-10 flex items-center justify-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:text-white transition-all" title="Automatizaciones">
                    <Icon svg={ICONS.zap} className="w-5 h-5" />
                </button>

                <button className="w-10 h-10 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:text-white transition-all" title="Compartir">
                    <Icon svg={ICONS.share} className="w-5 h-5" />
                </button>

                <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1" />

                {/* Zoom */}
                <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 p-1">
                    <button onClick={() => setZoom && setZoom(Math.max((zoom || 1) - 0.1, 0.5))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-orange-600 transition-colors">
                        <Icon svg={ICONS.minus} className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold w-12 text-center text-slate-700 dark:text-slate-200">{Math.round((zoom || 1) * 100)}%</span>
                    <button onClick={() => setZoom && setZoom(Math.min((zoom || 1) + 0.1, 2))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-orange-600 transition-colors">
                        <Icon svg={ICONS.plus} className="w-4 h-4" />
                    </button>
                </div>

                <button onClick={onResetView} className="w-10 h-10 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/30 shadow-sm hover:bg-orange-500 hover:text-white transition-all" title="Centrar">
                    <Icon svg={ICONS.maximize} className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

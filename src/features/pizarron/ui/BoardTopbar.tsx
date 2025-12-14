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
    onShowTopIdeas?: () => void;
    onShowSmartView?: () => void;
    onGlobalSearch?: () => void;
    onAddCanvasItem?: (item: Partial<PizarronTask>) => void; // New Prop
}

import { createPortal } from 'react-dom';

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
    onAddCanvasItem, // Destructure
    zoom,
    setZoom,
    onResetView,
    boards,
    setActiveBoardId,
    onAddBoard,
    userProfile,
    activeTool = 'pointer',
    setActiveTool,
    onShowTopIdeas,
    onShowSmartView,
    onGlobalSearch
}) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreateTask = () => onAddTask();
    const handleCreateIdea = () => onCreateIdea && onCreateIdea();

    // Board Switcher Logic
    const [showBoardMenu, setShowBoardMenu] = React.useState(false);

    if (!mounted) return null;

    // Helper handlers for new buttons
    const handleCreateImage = () => {
        if (onAddCanvasItem) {
            onAddCanvasItem({
                type: 'image',
                title: 'Imagen Referencia',
                // Placeholder visuals
                style: { backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                width: 300,
                height: 200,
                path: 'placeholder-image' // Signal to render a placeholder
            });
        }
    };

    const handleCreateSticker = () => {
        if (onAddCanvasItem) {
            onAddCanvasItem({
                type: 'sticker',
                title: 'Sticker',
                // Emoji as content for now
                texto: '✨',
                style: { fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' },
                width: 100,
                height: 100
            });
        }
    };

    const handleAIAction = () => {
        // Mock AI action
        alert("Nexus AI: Optimizando distribución del tablero...");
    };

    return createPortal(
        <div className="fixed top-0 right-0 left-[70px] h-16 flex items-center justify-between px-4 z-[99999] pointer-events-auto bg-orange-500/10 dark:bg-orange-900/20 hover:bg-orange-500/20 dark:hover:bg-orange-900/30 backdrop-blur-xl border-b border-orange-500/10 shadow-sm transition-all duration-300 font-sans">
            {/* 1. CONTEXT (Left) */}
            <div className="flex items-center gap-4 min-w-[200px]">
                <button
                    onClick={() => setShowBoardMenu(!showBoardMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-lg border border-orange-500/20 shadow-sm transition-all duration-200 group hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md"
                >
                    <Icon svg={ICONS.layout} className="w-4 h-4 text-orange-700 dark:text-orange-200 group-hover:text-white" />
                    <span className="text-sm font-bold truncate max-w-[120px] text-orange-900 dark:text-orange-100 group-hover:text-white">{board?.name || 'Tablero General'}</span>
                    <Icon svg={ICONS.chevronDown} className="w-3 h-3 opacity-50 group-hover:text-white" />
                </button>
                {/* Board Menu Dropdown (Simplified for brevity, similar logic as before) */}
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

            {/* CENTER TOOLS GROUP */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 h-10 px-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-xl border border-orange-500/20 shadow-md transition-all duration-300 hover:bg-white/60 dark:hover:bg-black/40">
                {/* 2. CREATION (Dropdown/Quick Actions) */}
                <div className="flex items-center gap-1 pr-2 border-r border-orange-500/10 relative">
                    <button
                        onClick={() => {
                            if (onAddCanvasItem) {
                                onAddCanvasItem({
                                    type: 'frame',
                                    title: 'Nuevo Tablero',
                                    width: 800,
                                    height: 600,
                                    style: { backgroundColor: 'transparent' }
                                });
                            }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110"
                        title="Añadir Tablero (Marco)"
                    >
                        <Icon svg={ICONS.layout} className="w-5 h-5" />
                    </button>
                    {/* Shortcuts for common items */}
                    <button
                        onClick={handleCreateTask}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110"
                        title="Tarea Rápida"
                    >
                        <Icon svg={ICONS.fileText} className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCreateIdea}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110"
                        title="Idea Rápida"
                    >
                        <Icon svg={ICONS.book} className="w-4 h-4" />
                    </button>
                </div>

                {/* 3. DRAWING & TOOLS */}
                <div className="flex items-center gap-1 pr-2 border-r border-orange-500/10">
                    <button
                        onClick={() => setActiveTool && setActiveTool('pointer')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'pointer' ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Seleccionar (V)"
                    >
                        <Icon svg={ICONS.mousePointer || ICONS.maximize} className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setActiveTool && setActiveTool('hand')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'hand' ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Mover (H)"
                    >
                        <Icon svg={ICONS.hand} className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setActiveTool && setActiveTool('shape')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'shape' ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Formas (R)"
                    >
                        <div className={`w-3 h-3 border-2 rounded-sm ${activeTool === 'shape' ? 'border-white' : 'border-current'}`} />
                    </button>
                    <button
                        onClick={() => setActiveTool && setActiveTool('text')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'text' ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Texto (T)"
                    >
                        <span className="font-serif font-bold text-sm">T</span>
                    </button>
                    <button
                        onClick={() => setActiveTool && setActiveTool('line')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'line' ? 'bg-orange-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Conectores (L)"
                    >
                        <Icon svg={ICONS.activity} className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setActiveTool && setActiveTool('eraser')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${activeTool === 'eraser' ? 'bg-red-500 text-white shadow-md scale-110' : 'text-orange-800 dark:text-orange-100 hover:bg-red-500 hover:text-white hover:shadow-md hover:scale-110'}`}
                        title="Borrador (E)"
                    >
                        <Icon svg={ICONS.trash} className="w-4 h-4" />
                    </button>
                </div>

                {/* 4. RESOURCES (Simplified) */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCreateImage}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110"
                        title="Imagen"
                    >
                        <Icon svg={ICONS.image || ICONS.layout} className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCreateSticker}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110"
                        title="Stickers"
                    >
                        <Icon svg={ICONS.star || ICONS.zap} className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 5, 6, 7. RIGHT ACTIONS */}
            <div className="flex items-center gap-3">
                {/* 5. INTELLIGENCE */}
                <div className="hidden md:flex items-center gap-1 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-lg p-0.5 border border-orange-500/20">
                    <button
                        onClick={handleAIAction}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110 group"
                        title="Nexus AI"
                    >
                        <Icon svg={ICONS.zap} className="w-4 h-4 group-hover:text-white" />
                    </button>
                </div>

                {/* 6. CANVAS CONTROLS */}
                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-lg px-2 py-1 border border-orange-500/20">
                    <button onClick={() => setZoom && setZoom(Math.max((zoom || 1) - 0.1, 0.5))} className="hover:text-orange-600 transition-colors text-orange-800 dark:text-orange-100 hover:scale-110">
                        <Icon svg={ICONS.minus} className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold w-8 text-center text-orange-900 dark:text-orange-100">{Math.round((zoom || 1) * 100)}%</span>
                    <button onClick={() => setZoom && setZoom(Math.min((zoom || 1) + 0.1, 2))} className="hover:text-orange-600 transition-colors text-orange-800 dark:text-orange-100 hover:scale-110">
                        <Icon svg={ICONS.plus} className="w-3 h-3" />
                    </button>
                </div>

                {/* 7. MENU */}
                <button className="w-9 h-9 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-lg border border-orange-500/20 shadow-sm transition-all duration-200 text-orange-700 dark:text-orange-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:scale-110">
                    <Icon svg={ICONS.menu} className="w-5 h-5" />
                </button>
            </div>
        </div>,
        document.body
    );
};

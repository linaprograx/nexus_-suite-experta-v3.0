import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { PizarronBoard } from '../../types';

interface PizarronSidebarProps {
    boards: PizarronBoard[];
    activeBoardId: string | null;
    setActiveBoardId: (id: string) => void;
    onAddBoard: () => void;
    onSelectTemplate: () => void;
    onEditBoard?: (board: PizarronBoard) => void;
    onDeleteBoard?: (boardId: string) => void;
}

export const PizarronSidebar: React.FC<PizarronSidebarProps> = ({
    boards,
    activeBoardId,
    setActiveBoardId,
    onAddBoard,
    onSelectTemplate,
    onEditBoard,
    onDeleteBoard
}) => {
    const [hoveredBoard, setHoveredBoard] = React.useState<{ name: string; top: number } | null>(null);

    return (
        <div className="h-full flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/5 p-2 items-center shadow-sm relative overflow-visible group/sidebar">
            {/* Gradient Border Overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-transparent" style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}></div>

            <div className="mb-6 pt-2 z-10">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Icon svg={ICONS.layout} className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1 w-full space-y-3 flex flex-col items-center overflow-y-auto overflow-x-hidden custom-scrollbar px-1 py-1 z-10 pb-20">
                {boards.map(board => {
                    const isActive = activeBoardId === board.id;
                    return (
                        <div
                            key={board.id}
                            className="relative group/item w-full flex justify-center perspective-1000"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredBoard({ name: board.name, top: rect.top + (rect.height / 2) });
                            }}
                            onMouseLeave={() => setHoveredBoard(null)}
                        >
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={`w-12 h-12 p-0 rounded-xl transition-all duration-300 relative ${isActive ? 'bg-white dark:bg-slate-800 text-orange-600 shadow-md ring-2 ring-orange-500/20 scale-105 z-20' : 'text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:scale-105 hover:text-orange-500'}`}
                                onClick={() => setActiveBoardId(board.id)}
                            >
                                {board.icon && (ICONS as any)[board.icon] ? (
                                    <Icon svg={(ICONS as any)[board.icon]} className="w-8 h-8" />
                                ) : (
                                    <span className="text-sm font-bold uppercase">{board.name.substring(0, 2)}</span>
                                )}
                            </Button>

                            {/* Hover Edit/Delete Buttons - Better Positioning and Visibility */}
                            <div className="absolute -bottom-3 -right-3 opacity-0 group-hover/item:opacity-100 transition-opacity z-50 flex gap-1">
                                {onEditBoard && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditBoard(board); }}
                                        className="bg-white dark:bg-slate-700 hover:bg-orange-500 hover:text-white text-slate-500 p-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                                        title="Editar"
                                    >
                                        <Icon svg={ICONS.edit} className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {onDeleteBoard && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteBoard(board.id); }}
                                        className="bg-white dark:bg-slate-700 hover:bg-red-500 hover:text-white text-slate-500 p-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 hover:scale-110 transition-transform"
                                        title="Eliminar"
                                    >
                                        <Icon svg={ICONS.trash} className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center space-y-3 z-20 bg-gradient-to-t from-white/80 via-white/50 to-transparent dark:from-slate-900/80 dark:via-slate-900/50 pt-6 pb-2 rounded-b-2xl">
                <div className="group relative">
                    <Button
                        size="icon"
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-slate-800"
                        onClick={onAddBoard}
                    >
                        <Icon svg={ICONS.plus} className="h-6 w-6" />
                    </Button>
                </div>

                <div className="group relative">
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30" onClick={onSelectTemplate}>
                        <Icon svg={ICONS.grid} className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Fixed Tooltip Portal */}
            {hoveredBoard && (
                <div
                    className="fixed left-[90px] z-[100] pointer-events-none transform -translate-y-1/2"
                    style={{ top: hoveredBoard.top }}
                >
                    <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200 border border-white/10">
                        {hoveredBoard.name}
                        <div className="w-px h-3 bg-white/20 mx-1"></div>
                        <span className="text-[10px] opacity-70">Clic para ver</span>
                    </div>
                </div>
            )}
        </div>
    );
};


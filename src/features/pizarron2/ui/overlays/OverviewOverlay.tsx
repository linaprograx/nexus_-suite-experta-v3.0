import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { LuLayoutTemplate, LuPlus, LuX, LuLayoutDashboard } from 'react-icons/lu';
import { firestoreAdapter } from '../../sync/firestoreAdapter';

export const OverviewOverlay: React.FC = () => {
    // Local state to avoid flicker? No, rely on store.
    const activePizarra = pizarronStore.useSelector(s => s.activePizarra);
    const showOverview = pizarronStore.useSelector(s => s.uiFlags.showOverview);
    const boards = activePizarra?.boards || [];

    if (!showOverview) return null;

    const handleClose = () => {
        pizarronStore.setState(s => { s.uiFlags.showOverview = false; });
    };

    const handleSwitch = (boardId: string) => {
        pizarronStore.switchBoard(boardId);
        handleClose();
    };

    const handleAddBoard = () => {
        // Trigger the standard "Add Board" flow
        // We can reuse PizarraManager for this, or just trigger a "New Board" action directly?
        // Let's trigger PizarraManager with a specific state if possible, 
        // OR just open PizarraManager (which usually defaults to 'create' if empty, but here we already have a pizarra).

        // Better: Open PizarraManager and set flag?
        // Actually, let's keep it simple: Open PizarraManager.
        handleClose();
        pizarronStore.setState(s => { s.uiFlags.showProjectManager = true; });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose}>
            <div className="w-[90%] max-w-5xl h-[80%] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <LuLayoutDashboard className="w-8 h-8 text-indigo-500" />
                            Vista General de Tableros
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {activePizarra?.title || 'Notebook'} • {boards.length} tableros activos
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <LuX className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {boards.map((board, index) => (
                            <button
                                key={board.id}
                                onClick={() => handleSwitch(board.id)}
                                className="group relative aspect-video bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left flex flex-col overflow-hidden"
                            >
                                {/* Preview / Thumbnail Placeholder */}
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                                    {/* Simple Visualization of "Content" */}
                                    {board.thumbnail ? (
                                        <img src={board.thumbnail} alt={board.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-3/4 h-3/4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center text-slate-300">
                                            <LuLayoutTemplate className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}

                                    {/* Index Badge */}
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 transition-colors">
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                        {board.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${board.type === 'kanban' ? 'bg-orange-100 text-orange-700' :
                                            board.type === 'calendar' ? 'bg-green-100 text-green-700' :
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {board.type === 'board' ? 'Pizarra Libre' : board.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Active Indicator */}
                                {index === 0 && (
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                        ACTIVO
                                    </div>
                                )}
                            </button>
                        ))}

                        {/* Add New Card */}
                        <button
                            onClick={handleAddBoard}
                            className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center gap-3 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <LuPlus className="w-6 h-6" />
                            </div>
                            <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-500">
                                Nueva Pizarra
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { LuLayoutGrid } from 'react-icons/lu';

export const TopBar: React.FC = () => {
    const [zoom, setZoom] = useState(1);
    const [hasSelection, setHasSelection] = useState(false);

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setZoom(state.viewport.zoom);
            setHasSelection(state.selection.size > 0);
            setZoom(state.viewport.zoom);
            setHasSelection(state.selection.size > 0);
        });
        return unsub;
    }, []);

    const activePizarra = pizarronStore.useSelector(s => s.activePizarra);
    const boards = activePizarra?.boards || [];
    const activeBoard = boards[0]; // The first one is active by definition of our rotation logic

    const handleSwitchBoard = (boardId: string) => {
        pizarronStore.switchBoard(boardId);
        // PizarronRoot will detect change and re-init adapter
    };

    const handleZoomIn = () => {
        pizarronStore.updateViewport({ zoom: Math.min(zoom + 0.1, 5) });
    };

    const handleZoomOut = () => {
        pizarronStore.updateViewport({ zoom: Math.max(zoom - 0.1, 0.1) });
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-bold">-</button>
                <span className="text-xs font-mono w-12 text-center text-slate-900 dark:text-slate-200">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-bold">+</button>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-slate-300 mx-2"></div>

            {/* Board Switcher (Notebook Mode) */}
            {activePizarra && boards.length > 0 && (
                <div className="flex items-center gap-2">
                    {/* Overview Toggle */}
                    <button
                        onClick={() => {
                            // Capture current board thumbnail before showing overlay
                            pizarronStore.setThumbnailRequest(true);
                            // Brief delay to allow capture to happen before overlay DOM insertion (optional but safer)
                            const frameId = requestAnimationFrame(() => {
                                pizarronStore.setState(s => { s.uiFlags.showOverview = !s.uiFlags.showOverview });
                            });
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-full transition-colors"
                        title="Ver todos los tableros"
                    >
                        <LuLayoutGrid className="w-4 h-4" />
                    </button>

                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                        {boards.map((b, i) => (
                            <button
                                key={b.id}
                                onClick={() => handleSwitchBoard(b.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${i === 0
                                    ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {b.title || `Board ${i + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {hasSelection && (
                <>
                    <div className="w-px h-4 bg-slate-300 mx-2"></div>

                    {/* Position Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1 hover:bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 transition-colors">
                            Posición
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white border border-slate-200 shadow-xl rounded-lg p-1 min-w-[160px] z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="absolute -top-3 left-0 w-full h-3 bg-transparent"></div>

                            <button onClick={() => pizarronStore.bringToFront()} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded flex items-center justify-between group/item">
                                <span>Traer al frente</span>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <div className="w-3 h-0.5 bg-slate-400"></div>
                                    <div className="w-3 h-0.5 bg-slate-200"></div>
                                </div>
                            </button>
                            <button onClick={() => pizarronStore.bringForward()} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded flex items-center justify-between group/item">
                                <span>Adelantar</span>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <div className="w-3 h-0.5 bg-slate-400"></div>
                                    <div className="w-3 h-0.5 bg-indigo-400"></div>
                                </div>
                            </button>
                            <button onClick={() => pizarronStore.sendBackward()} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded flex items-center justify-between group/item">
                                <span>Enviar atrás</span>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <div className="w-3 h-0.5 bg-indigo-400"></div>
                                    <div className="w-3 h-0.5 bg-slate-400"></div>
                                </div>
                            </button>
                            <button onClick={() => pizarronStore.sendToBack()} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded flex items-center justify-between group/item">
                                <span>Enviar al fondo</span>
                                <div className="flex flex-col gap-0.5 items-end">
                                    <div className="w-3 h-0.5 bg-slate-200"></div>
                                    <div className="w-3 h-0.5 bg-slate-400"></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

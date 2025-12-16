import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';

export const TopBar: React.FC = () => {
    const [zoom, setZoom] = useState(1);
    const [hasSelection, setHasSelection] = useState(false);

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setZoom(state.viewport.zoom);
            setHasSelection(state.selection.size > 0);
        });
        return unsub;
    }, []);

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

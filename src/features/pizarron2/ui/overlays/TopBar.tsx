import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { useNavigate } from 'react-router-dom';
import { LuLayoutGrid, LuSend, LuMenu } from 'react-icons/lu';

export const TopBar: React.FC = () => {
    const navigate = useNavigate();
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

    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const handleExportDraft = async () => {
        console.log("[TopBar] Starting Export...");
        setIsExporting(true);
        try {
            const draft = await pizarronStore.exportMenuToMakeMenu();
            console.log("[TopBar] Export Success:", draft);
            setExportSuccess(true);

            // Phase 6.2.B: Active Trigger
            // Brief delay to show success state before navigation
            setTimeout(() => {
                navigate('/make-menu?trigger=pizarron');
            }, 800);

            setTimeout(() => setExportSuccess(false), 3000);
        } catch (e) {
            console.error("[TopBar] Export failed", e);
        } finally {
            setIsExporting(false);
        }
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
                            pizarronStore.setThumbnailRequest(true);
                            requestAnimationFrame(() => {
                                pizarronStore.setState(s => { s.uiFlags.showOverview = !s.uiFlags.showOverview });
                            });
                        }}
                        className="w-8 h-8 shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-full transition-colors"
                        title="Ver todos los tableros"
                    >
                        <LuLayoutGrid className="w-4 h-4" />
                    </button>

                    {/* Scrollable Board List - Max Width ~4 items */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1 overflow-x-auto max-w-[320px] scrollbar-hide">
                        {[...boards].sort((a, b) => (a.id === activeBoard?.id ? -1 : 1)).map((b, i) => (
                            <button
                                key={b.id}
                                onClick={() => handleSwitchBoard(b.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${b.id === activeBoard?.id
                                    ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white sticky left-0 z-10'
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

            {/* Alignment Tools */}
            {hasSelection && (
                <>
                    <div className="w-px h-4 bg-slate-300 mx-2"></div>

                    <div className="relative group">
                        <button className="flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                            Alinear
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-1 min-w-[180px] z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="absolute -top-3 left-0 w-full h-3 bg-transparent"></div>

                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Horizontal</div>
                            <button onClick={() => pizarronStore.alignSelected('left')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" /><line x1="3" y1="12" x2="15" y2="12" strokeWidth="2" /><line x1="3" y1="18" x2="18" y2="18" strokeWidth="2" /></svg>
                                <span>Izquierda</span>
                            </button>
                            <button onClick={() => pizarronStore.alignSelected('center')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22" strokeWidth="2" strokeDasharray="2 2" /><line x1="6" y1="6" x2="18" y2="6" strokeWidth="2" /><line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" /></svg>
                                <span>Centro H</span>
                            </button>
                            <button onClick={() => pizarronStore.alignSelected('right')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" /><line x1="9" y1="12" x2="21" y2="12" strokeWidth="2" /><line x1="6" y1="18" x2="21" y2="18" strokeWidth="2" /></svg>
                                <span>Derecha</span>
                            </button>

                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Vertical</div>
                            <button onClick={() => pizarronStore.alignSelected('top')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="21" strokeWidth="2" /><line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" /><line x1="18" y1="3" x2="18" y2="18" strokeWidth="2" /></svg>
                                <span>Arriba</span>
                            </button>
                            <button onClick={() => pizarronStore.alignSelected('middle')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" strokeDasharray="2 2" /><line x1="6" y1="6" x2="6" y2="18" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="16" strokeWidth="2" /></svg>
                                <span>Centro V</span>
                            </button>
                            <button onClick={() => pizarronStore.alignSelected('bottom')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="21" strokeWidth="2" /><line x1="12" y1="9" x2="12" y2="21" strokeWidth="2" /><line x1="18" y1="6" x2="18" y2="21" strokeWidth="2" /></svg>
                                <span>Abajo</span>
                            </button>

                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Distribuir</div>
                            <button onClick={() => pizarronStore.distributeSelected('horizontal')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="9" width="4" height="6" strokeWidth="2" /><rect x="10" y="9" width="4" height="6" strokeWidth="2" /><rect x="16" y="9" width="4" height="6" strokeWidth="2" /></svg>
                                <span>Horizontal</span>
                            </button>
                            <button onClick={() => pizarronStore.distributeSelected('vertical')} className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="4" strokeWidth="2" /><rect x="9" y="10" width="6" height="4" strokeWidth="2" /><rect x="9" y="16" width="6" height="4" strokeWidth="2" /></svg>
                                <span>Vertical</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {activePizarra && (
                <>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    <button
                        onClick={() => pizarronStore.setUIFlag('showMenuGenerator', true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95 group"
                    >
                        <LuMenu className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span>Diseñar con IA</span>
                    </button>
                </>
            )}
        </div>
    );
};

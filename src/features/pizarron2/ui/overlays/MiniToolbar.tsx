import React, { useEffect, useState, useMemo } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';

export const MiniToolbar: React.FC = () => {
    const [selection, setSelection] = useState<Set<string>>(new Set());
    const [nodes, setNodes] = useState<Record<string, BoardNode>>({});
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    useEffect(() => {
        return pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setSelection(state.selection);
            setNodes(state.nodes);
            setZoom(state.viewport.zoom);
            setPan({ x: state.viewport.x, y: state.viewport.y });
        });
    }, []);

    const selectedNodes = useMemo(() => {
        return Array.from(selection).map(id => nodes[id]).filter(Boolean);
    }, [selection, nodes]);

    if (selectedNodes.length === 0) return null;

    // Calculate Bounds for positioning
    let minX = Infinity, maxX = -Infinity, minY = Infinity;
    selectedNodes.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x + n.w);
        minY = Math.min(minY, n.y);
    });

    const screenX = minX * zoom + pan.x;
    const screenY = minY * zoom + pan.y;

    const top = screenY - 50;
    const left = screenX;

    const isMulti = selectedNodes.length > 1;
    const firstNode = selectedNodes[0];

    // Helpers for Text
    const toggleBold = () => {
        const current = firstNode.content.fontWeight === 'bold';
        pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontWeight: current ? 'normal' : 'bold' } });
    };
    const toggleItalic = () => {
        const current = firstNode.content.fontStyle === 'italic';
        pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontStyle: current ? 'normal' : 'italic' } });
    };
    const toggleUnderline = () => {
        const current = firstNode.content.textDecoration === 'underline';
        pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, textDecoration: current ? 'none' : 'underline' } });
    };
    const changeColor = (color: string) => {
        selectedNodes.forEach(n => {
            pizarronStore.updateNode(n.id, { content: { ...n.content, color } });
        });
    };

    // Common Colors
    const colors = ['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const fillColors = ['#cbd5e1', '#fecaca', '#fde68a', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#ffffff'];

    return (
        <div
            className="fixed z-50 flex items-center gap-1 p-1 bg-white border border-slate-200 shadow-xl rounded-lg pointer-events-auto transform transition-all duration-200"
            style={{
                top: Math.max(60, top), // Don't go under top bar
                left: Math.max(10, left),
            }}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* --- Drag Handle (Visual Only) --- */}
            <div className="cursor-grab text-slate-300 px-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h8M8 12h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>

            {/* --- Multi Selection Tools --- */}
            {isMulti && (
                <>
                    {/* Align Dropdown */}
                    <div className="relative group">
                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Align">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 shadow-xl rounded-lg p-1 gap-1 min-w-max z-50">
                            <button onClick={() => pizarronStore.alignSelected('left')} className="p-1 hover:bg-slate-100 rounded" title="Left">⇤</button>
                            <button onClick={() => pizarronStore.alignSelected('center')} className="p-1 hover:bg-slate-100 rounded" title="Center">⇹</button>
                            <button onClick={() => pizarronStore.alignSelected('right')} className="p-1 hover:bg-slate-100 rounded" title="Right">⇥</button>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <button onClick={() => pizarronStore.alignSelected('top')} className="p-1 hover:bg-slate-100 rounded" title="Top">⤒</button>
                            <button onClick={() => pizarronStore.alignSelected('middle')} className="p-1 hover:bg-slate-100 rounded" title="Middle">⇕</button>
                            <button onClick={() => pizarronStore.alignSelected('bottom')} className="p-1 hover:bg-slate-100 rounded" title="Bottom">⤓</button>
                        </div>
                    </div>

                    {/* Distribute */}
                    <div className="relative group">
                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Distribute">
                            <span className="font-mono text-[10px] font-bold tracking-tight">|||</span>
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 shadow-xl rounded-lg p-1 gap-1 min-w-max z-50">
                            <button onClick={() => pizarronStore.distributeSelected('horizontal')} className="p-1 hover:bg-slate-100 rounded text-xs" title="Horizontal">↔</button>
                            <button onClick={() => pizarronStore.distributeSelected('vertical')} className="p-1 hover:bg-slate-100 rounded text-xs" title="Vertical">↕</button>
                        </div>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Placeholder Group */}
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 cursor-not-allowed" title="Group (Coming Soon)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </button>
                </>
            )}

            {/* --- Text Tools --- */}
            {!isMulti && firstNode.type === 'text' && (
                <>
                    <button onClick={toggleBold} className={`p-1.5 rounded ${firstNode.content.fontWeight === 'bold' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Bold">
                        <span className="font-bold">B</span>
                    </button>
                    <button onClick={toggleItalic} className={`p-1.5 rounded ${firstNode.content.fontStyle === 'italic' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Italic">
                        <span className="italic font-serif">I</span>
                    </button>
                    <button onClick={toggleUnderline} className={`p-1.5 rounded ${firstNode.content.textDecoration === 'underline' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Underline">
                        <span className="underline">U</span>
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Text Color Picker */}
                    <div className="relative group">
                        <div className="p-1.5 cursor-pointer hover:bg-slate-100 rounded">
                            <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: firstNode.content.color || '#000' }}></div>
                        </div>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 shadow-xl rounded-lg p-1 gap-1 min-w-max z-50">
                            {/* Hover Bridge */}
                            <div className="absolute -top-3 left-0 w-full h-3 bg-transparent"></div>

                            {colors.map(c => (
                                <button key={c} onClick={() => changeColor(c)} className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* --- Shape / Board Tools --- */}
            {!isMulti && (firstNode.type === 'shape' || firstNode.type === 'board') && (
                <>
                    {/* Fill Color Picker */}
                    <div className="relative group">
                        <div className="p-1.5 cursor-pointer hover:bg-slate-100 rounded flex items-center gap-1">
                            <div className="w-4 h-4 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: firstNode.content.color || '#cbd5e1' }}></div>
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-lg p-2 gap-2 min-w-max z-50">
                            {/* Hover Bridge */}
                            <div className="absolute -top-3 left-0 w-full h-3 bg-transparent"></div>

                            <div className="flex gap-1">
                                {fillColors.map(c => (
                                    <button key={c} onClick={() => changeColor(c)} className="w-6 h-6 rounded border border-slate-100 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <div className="border-t border-slate-100"></div>
                            <div className="grid grid-cols-4 gap-1">
                                {[
                                    { s: '#fca5a5', e: '#ef4444' },
                                    { s: '#86efac', e: '#3b82f6' },
                                    { s: '#c084fc', e: '#fca5a5' },
                                    { s: '#fde68a', e: '#f59e0b' },
                                    { s: '#a5f3fc', e: '#3b82f6' },
                                    { s: '#e879f9', e: '#c084fc' },
                                    { s: '#cbd5e1', e: '#64748b' }
                                ].map((g, i) => (
                                    <button key={i}
                                        onClick={() => selectedNodes.forEach(n => pizarronStore.updateNode(n.id, { content: { ...n.content, gradient: { type: 'linear', start: g.s, end: g.e } } }))}
                                        className="w-6 h-6 rounded border border-slate-100 hover:scale-110 transition-transform"
                                        style={{ background: `linear-gradient(to bottom, ${g.s}, ${g.e})` }}
                                    />
                                ))}
                                <button onClick={() => selectedNodes.forEach(n => pizarronStore.updateNode(n.id, { content: { ...n.content, gradient: undefined } }))} className="w-6 h-6 rounded border border-slate-100 flex items-center justify-center text-[8px] text-slate-400">∅</button>
                            </div>
                        </div>
                    </div>
                    {/* Border Toggle (Simple) */}
                    <button
                        onClick={() => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, borderWidth: (firstNode.content.borderWidth || 0) > 0 ? 0 : 2 } })}
                        className={`p-1.5 rounded border border-transparent ${(firstNode.content.borderWidth || 0) > 0 ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`}
                        title="Toggle Border"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /></svg>
                    </button>
                </>
            )}

            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

            {/* --- Common Actions (Pos, Rot, Dup, Del) --- */}

            {/* Lock/Unlock */}
            <button
                onClick={() => pizarronStore.updateNode(firstNode.id, { locked: !firstNode.locked })}
                className={`p-1.5 rounded ${firstNode.locked ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-600'}`}
                title={firstNode.locked ? "Unlock" : "Lock"}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={firstNode.locked ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} /></svg>
            </button>

            {/* Rotate */}
            <button onClick={() => pizarronStore.rotateSelected(90)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Rotate 90°">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>

            {/* Position / Layering */}
            <div className="relative group">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </button>
                <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-slate-200 shadow-xl rounded-lg p-1 min-w-[120px] z-50">
                    <button onClick={() => pizarronStore.bringToFront()} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2">
                        <span>Bring to Front</span>
                    </button>
                    <button onClick={() => pizarronStore.bringForward()} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded">Bring Forward</button>
                    <button onClick={() => pizarronStore.sendBackward()} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded">Send Backward</button>
                    <button onClick={() => pizarronStore.sendToBack()} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded">Send to Back</button>
                </div>
            </div>

            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

            <button onClick={() => { pizarronStore.copySelection(); pizarronStore.paste(); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Duplicate">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={() => pizarronStore.deleteNodes(selection.size > 0 ? Array.from(selection) : [])} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

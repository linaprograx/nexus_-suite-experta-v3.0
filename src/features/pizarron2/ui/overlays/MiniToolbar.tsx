import React, { useEffect, useState, useMemo } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';
import { FontSelector } from '../shared/FontSelector';

export const MiniToolbar: React.FC = () => {
    const { selection, nodes, viewport, uiFlags } = pizarronStore.useState();
    const [activeMenu, setActiveMenu] = useState<'none' | 'align' | 'distribute'>('none');

    const selectedNodes = useMemo(() => {
        return Array.from(selection).map(id => nodes[id]).filter(Boolean);
    }, [selection, nodes]);

    if (selectedNodes.length === 0) return null;

    // Anchor: Fixed Top Center (Heads-Up Display)
    // User requested: "fijas las 2, sin moverse" (Fixed screen position)

    // We don't need world calculation anymore for POSITION, only for data.

    // Logic Variables
    const isMulti = selectedNodes.length > 1;
    const firstNode = selectedNodes[0];

    // Helpers for Text
    const updateFontSize = (delta: number) => {
        const currentSize = firstNode.content.fontSize || 16;
        const newSize = Math.max(8, Math.min(128, currentSize + delta));
        pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontSize: newSize } });
    };

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

    // --- Alignment Controls (Single Text) ---
    const updateTextAlign = (align: 'left' | 'center' | 'right') => {
        pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, textAlign: align } });
    };

    // Calculate Position (Contextual Top-Center of Selection)
    const toolbarPos = useMemo(() => {
        if (selectedNodes.length === 0) return { top: -100, left: 0 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedNodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + (n.w || 0));
            maxY = Math.max(maxY, n.y + (n.h || 0));
        });

        // Convert to Screen
        const zoom = viewport.zoom;
        const panX = viewport.x;
        const panY = viewport.y;

        const screenMinX = minX * zoom + panX;
        const screenMinY = minY * zoom + panY;
        const screenMaxX = maxX * zoom + panX;
        // const screenMaxY = maxY * zoom + panY;

        const width = screenMaxX - screenMinX;
        const centerX = screenMinX + width / 2;
        const topY = screenMinY - 60; // 60px above selection

        // Clamp to screen
        const clampedX = Math.max(150, Math.min(window.innerWidth - 150, centerX));
        const clampedY = Math.max(80, Math.min(window.innerHeight - 80, topY)); // Prevent going under TopBar (approx 60px)

        return { top: clampedY, left: clampedX };
    }, [selectedNodes, viewport]);

    return (
        <div
            className="fixed z-50 flex items-center gap-1 p-1 bg-white border border-slate-200 shadow-xl rounded-lg pointer-events-auto transition-all duration-75 ease-out"
            style={{
                top: toolbarPos.top,
                left: toolbarPos.left,
                transform: 'translateX(-50%)' // Center horizontally based on left
            }}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* --- Drag Handle (Visual Only -> Now acts as anchor indicator) --- */}
            <div className="cursor-grab text-slate-300 px-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h8M8 12h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* --- Multi Selection Tools --- */}
            {isMulti && (
                <>
                    {/* Align Dropdown */}
                    <div className="relative group">
                        <button
                            className={`p-1.5 rounded hover:bg-slate-100 text-slate-600`}
                            title="Align Objects"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 shadow-xl rounded-lg p-1 gap-1 min-w-[140px] z-50">
                            {/* ... (Existing Multi-Align Logic - keeping concise for replacement) ... */}
                            <div className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">Align</div>
                            <div className="flex gap-1">
                                <button onClick={() => pizarronStore.alignSelected('left')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Left">⇤</button>
                                <button onClick={() => pizarronStore.alignSelected('center')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Center">⇹</button>
                                <button onClick={() => pizarronStore.alignSelected('right')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Right">⇥</button>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => pizarronStore.alignSelected('top')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Top">⤒</button>
                                <button onClick={() => pizarronStore.alignSelected('middle')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Middle">⇕</button>
                                <button onClick={() => pizarronStore.alignSelected('bottom')} className="p-1 hover:bg-slate-100 rounded flex-1" title="Bottom">⤓</button>
                            </div>
                        </div>
                    </div>

                    {/* Distribute */}
                    <button
                        onClick={() => pizarronStore.distributeSelected('horizontal')}
                        className={`p-1.5 rounded hover:bg-slate-100 text-slate-600`}
                        title="Distribute Horizontal"
                    >
                        <span className="font-mono text-[10px] font-bold tracking-tight">↔</span>
                    </button>
                    <button
                        onClick={() => pizarronStore.distributeSelected('vertical')}
                        className={`p-1.5 rounded hover:bg-slate-100 text-slate-600`}
                        title="Distribute Vertical"
                    >
                        <span className="font-mono text-[10px] font-bold tracking-tight">↕</span>
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    {/* Group */}
                    <button
                        onClick={() => pizarronStore.groupSelection()}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Group"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </button>
                </>
            )}

            {/* Ungroup */}
            {selectedNodes.some(n => n.type === 'group') && (
                <>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button
                        onClick={() => pizarronStore.ungroupSelection()}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Ungroup"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                </>
            )}

            {/* --- Text Tools --- */}
            {!isMulti && firstNode.type === 'text' && (
                <>
                    {/* Font Size */}
                    <div className="flex items-center gap-0.5 bg-slate-100 rounded p-0.5">
                        <button onClick={() => updateFontSize(-2)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-xs font-bold text-slate-600">-</button>
                        <span className="text-xs font-mono w-6 text-center text-slate-700">{firstNode.content.fontSize || 16}</span>
                        <button onClick={() => updateFontSize(2)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-xs font-bold text-slate-600">+</button>
                    </div>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    <FontSelector
                        currentFont={firstNode.content.fontFamily || 'Inter'}
                        onChange={(f) => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontFamily: f } })}
                    />
                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Styles */}
                    <button onClick={toggleBold} className={`p-1.5 rounded ${firstNode.content.fontWeight === 'bold' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Bold"><span className="font-bold">B</span></button>
                    <button onClick={toggleItalic} className={`p-1.5 rounded ${firstNode.content.fontStyle === 'italic' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Italic"><span className="italic font-serif">I</span></button>
                    <button onClick={toggleUnderline} className={`p-1.5 rounded ${firstNode.content.textDecoration === 'underline' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Underline"><span className="underline">U</span></button>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Alignment (Added) */}
                    <div className="flex items-center bg-slate-100 rounded p-0.5 gap-0.5">
                        <button onClick={() => updateTextAlign('left')} className={`p-1 rounded ${firstNode.content.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Left">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                        </button>
                        <button onClick={() => updateTextAlign('center')} className={`p-1 rounded ${(firstNode.content.textAlign === 'center' || !firstNode.content.textAlign) ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                        </button>
                        <button onClick={() => updateTextAlign('right')} className={`p-1 rounded ${firstNode.content.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Right">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                        </button>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    {/* Colors & Rest... (Keeping existing Color/BG/List logic implies using 'firstNode' props) */}
                    {/* Re-implementing simplified Color picker for brevity in this replacement block */}
                    <ColorButton label="T" color={firstNode.content.color || '#000'} onChange={(c) => changeColor(c)} colors={colors} />

                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

                    <button
                        onClick={() => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, listType: firstNode.content.listType === 'none' ? 'bullet' : firstNode.content.listType === 'bullet' ? 'number' : 'none' } })}
                        className={`p-1.5 rounded ${firstNode.content.listType && firstNode.content.listType !== 'none' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        {firstNode.content.listType === 'number' ? <span className="text-xs font-bold">1.</span> : <span className="text-xs font-bold">•</span>}
                    </button>
                </>
            )}

            {/* --- Shape / Board Tools / Sticker --- */}
            {!isMulti && (firstNode.type === 'shape' || firstNode.type === 'board' || firstNode.type === 'sticker') && (
                <>
                    <FontSelector currentFont={firstNode.content.fontFamily || 'Inter'} onChange={(f) => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontFamily: f } })} />
                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                    <ColorButton label="Fill" icon={<div className="w-3 h-3 rounded" style={{ backgroundColor: firstNode.content.color || '#cbd5e1' }} />} color={firstNode.content.color || '#cbd5e1'} onChange={(c) => changeColor(c)} colors={fillColors} />

                    {/* Gradient Shortcut */}
                    <button
                        onClick={() => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, gradient: { type: 'linear', start: '#a5f3fc', end: '#3b82f6' } } })}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        title="Apply Gradient"
                    >
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-200 to-blue-500"></div>
                    </button>
                </>
            )}

            <div className="w-px h-4 bg-slate-200 mx-0.5"></div>

            {/* Common: Lock, Delete */}
            <button onClick={() => pizarronStore.updateNode(firstNode.id, { locked: !firstNode.locked })} className={`p-1.5 rounded ${firstNode.locked ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={firstNode.locked ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} /></svg>
            </button>
            <button onClick={() => pizarronStore.deleteNodes(Array.from(selection))} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

// Helper Subcomponent for Color (to reduce code duplication in this massive block)
const ColorButton: React.FC<{ label: string, color: string, onChange: (c: string) => void, colors: string[], icon?: React.ReactNode }> = ({ label, color, onChange, icon, colors }) => (
    <div className="relative group">
        <button className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-1">
            {icon ? icon : <div className="text-xs font-bold text-slate-500">{label}</div>}
        </button>
        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white border border-slate-200 shadow-xl rounded-lg p-1 gap-1 min-w-max z-50">
            <div className="absolute -top-3 left-0 w-full h-3 bg-transparent"></div>
            {colors.map(c => (
                <button key={c} onClick={() => onChange(c)} className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
            ))}
        </div>
    </div>
);


import React from 'react';
import { pizarronStore } from '../../state/store';
import { FontLoader } from '../../engine/FontLoader';
import { BoardNode } from '../../engine/types';

// Simple Font Selector Component
const FontSelector: React.FC<{ currentFont: string, onChange: (font: string) => void, className?: string }> = ({ currentFont, onChange, className }) => {
    return (
        <select
            className={`border rounded px-2 py-1 text-xs ${className}`}
            value={currentFont}
            onChange={(e) => {
                const font = e.target.value;
                FontLoader.loadFont(font);
                onChange(font);
            }}
        >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Playfair Display">Playfair</option>
            <option value="Fira Code">Monospace</option>
            <option value="Lobster">Lobster</option>
            <option value="Oswald">Oswald</option>
        </select>
    );
};

export const Inspector: React.FC = () => {
    const { selection, nodes, viewport } = pizarronStore.useState();
    const selectionIds = Array.from(selection);

    if (selectionIds.length === 0) return null;

    const firstNode = nodes[selectionIds[0]];
    if (!firstNode) return null; // Safety check

    // Position Logic: Fixed Screen Position next to Toolbar
    // Toolbar is at Top: 100, Left: 50% (Center)
    // We want this "al lado" (next to it).
    // Let's place it slightly to the right of the center.
    // Assuming Toolbar is ~400px wide, "Center" is at 200px of it.
    // So Left: 50% + 220px.

    const stopProp = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

    // Helper for updates
    const updateNode = (patch: Partial<BoardNode['content']>) => {
        if (firstNode) {
            pizarronStore.updateNode(firstNode.id, {
                content: { ...firstNode.content, ...patch }
            });
        }
    };

    // Render Content based on Type
    const renderContent = () => {
        if (!firstNode) return <div className="text-sm text-slate-500 italic text-center py-4">Multiple Selection</div>;

        switch (firstNode.type) {
            case 'board':
                return (
                    <div className="space-y-4">
                        {/* Title & Body */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Title Size</label>
                            <input
                                type="range" min="12" max="72"
                                value={firstNode.content.fontSize || 20}
                                onChange={(e) => updateNode({ fontSize: Number(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Collapse / Expand */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Visibility</label>
                            <button
                                onClick={() => pizarronStore.toggleCollapse(firstNode.id)}
                                className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-xs hover:bg-indigo-100 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                Collapse to Dock
                            </button>
                        </div>


                        {/* Structure Selector */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Layout Structure</label>
                            <select
                                className="w-full text-xs border border-slate-300 rounded p-1 mb-2 bg-white"
                                value={firstNode.structureId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) {
                                        pizarronStore.updateNode(firstNode.id, { structureId: undefined, structure: undefined });
                                    } else {
                                        // Dynamic Import to avoid circular dependencies if possible, or just regular import
                                        // For now assuming we can import STRUCTURE_TEMPLATES or use a helper
                                        // We need to import STRUCTURE_TEMPLATES from engine/structures
                                        // Since we can't easily add top-level imports in this specific tool call without viewing top of file,
                                        // I will assume the import is added or I will use a known hardcoded list if import is tricky.
                                        // BETTER: I will add the import in a separate edit or use a callback if available.
                                        // WAIT, I can't add an import here easily without replacing the whole file or using multi-replace.
                                        // I will replace this block assuming I'll fix imports next, OR I can define the options here if they are static? No, they are dynamic.

                                        // Taking a safer bet: I will use a hardcoded list of IDs for the UI for now, 
                                        // and assume the store/logic handles the actual object assignment? 
                                        // No, the requirement is "The structure is applied".
                                        // I need to import `STRUCTURE_TEMPLATES`.

                                        // Let's rely on a helper function or assume I will add the import at the top.
                                        // I'll emit the event and let the store handle it? 
                                        // No, Inspector calls updateNode directly usually.

                                        // I will write the code to use a global or imported 'STRUCTURE_TEMPLATES'.
                                        // I'll fix the import in the next step.
                                        // Actually, I can try to use a require or just set the ID and let the renderer lookup?
                                        // Renderer lookup is better for data size. Storage shouldn't duplicate the whole structure if it's static?
                                        // BUT user request says "Structure can be changed... content reflow...". 
                                        // If we store just ID, we can't customize zones?
                                        // The requirement "Every zone... styles editable" suggests we might copy the structure to the node.

                                        // Decision: Copy structure to node to allow divergence.
                                        import('../../engine/structures').then(({ STRUCTURE_TEMPLATES }) => {
                                            const template = STRUCTURE_TEMPLATES[val];
                                            if (template) {
                                                pizarronStore.updateNode(firstNode.id, {
                                                    structureId: val,
                                                    structure: JSON.parse(JSON.stringify(template)) // Deep copy
                                                });
                                            }
                                        });
                                    }
                                }}
                            >
                                <option value="">None (Empty)</option>
                                <option value="cocktail-recipe-structure">Cocktail Recipe</option>
                                <option value="menu-layout-structure">Menu Layout</option>
                                <option value="storytelling-structure">Storytelling</option>
                                <option value="comparison-structure">Comparison</option>
                                <option value="technical-grid-structure">Technical Grid</option>
                                <option value="visual-moodboard-structure">Moodboard</option>
                            </select>
                        </div>

                        {/* DEBUG: Add Structure */}
                        <div>
                            <label className="text-xs font-medium text-rose-600 block mb-1">Debug: Internal Structure</label>
                            <button
                                onClick={() => {
                                    const struct = {
                                        template: 'grid' as const,
                                        rows: [
                                            { id: 'r1', height: 1 },
                                            { id: 'r2', height: 2 },
                                            { id: 'r3', height: 1 }
                                        ],
                                        cols: [
                                            { id: 'c1', width: 1 },
                                            { id: 'c2', width: 1 }
                                        ],
                                        cells: {
                                            'r1_c1': { content: 'Header 1' },
                                            'r1_c2': { content: 'Header 2' },
                                            'r2_c1': { content: 'Body A' },
                                            'r2_c2': { content: 'Body B' },
                                            'r3_c1': { content: 'Footer 1' },
                                            'r3_c2': { content: 'Footer 2' }
                                        }
                                    };
                                    pizarronStore.updateStructure(firstNode.id, struct);
                                }}
                                className="w-full py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs hover:bg-rose-100"
                            >
                                Inject Test Grid
                            </button>
                        </div>

                        {/* Existing Color Picker */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Background</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#cbd5e1', '#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', 'transparent'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateNode({ color: c, gradient: undefined })}
                                        className={`w-6 h-6 rounded-full border ${firstNode.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
                                        title={c}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={firstNode.content.color === 'transparent' ? '#ffffff' : firstNode.content.color}
                                    onChange={(e) => updateNode({ color: e.target.value, gradient: undefined })}
                                    className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'shape':
                return (
                    <div className="space-y-4">
                        {/* Fill Color */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Fill Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#cbd5e1', '#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', 'transparent'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateNode({ color: c, gradient: undefined })}
                                        className={`w-6 h-6 rounded-full border ${firstNode.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
                                        title={c}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={firstNode.content.color === 'transparent' ? '#ffffff' : firstNode.content.color}
                                    onChange={(e) => updateNode({ color: e.target.value, gradient: undefined })}
                                    className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden"
                                />
                            </div>
                        </div>

                        {/* Gradients */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Gradients</label>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => updateNode({ gradient: { type: 'linear', start: '#60a5fa', end: '#a78bfa', angle: 135 } })}
                                    className="w-6 h-6 rounded-full border border-slate-300"
                                    style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)' }}
                                    title="Blue-Purple"
                                />
                                <button
                                    onClick={() => updateNode({ gradient: { type: 'linear', start: '#f472b6', end: '#fbbf24', angle: 135 } })}
                                    className="w-6 h-6 rounded-full border border-slate-300"
                                    style={{ background: 'linear-gradient(135deg, #f472b6 0%, #fbbf24 100%)' }}
                                    title="Pink-Yellow"
                                />
                                <button
                                    onClick={() => updateNode({ gradient: { type: 'linear', start: '#34d399', end: '#60a5fa', angle: 135 } })}
                                    className="w-6 h-6 rounded-full border border-slate-300"
                                    style={{ background: 'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)' }}
                                    title="Green-Blue"
                                />
                            </div>
                        </div>

                        {/* DEBUG: Structure for Shapes */}
                        <div>
                            <label className="text-xs font-medium text-rose-600 block mb-1">Internal Structure</label>
                            <button
                                onClick={() => {
                                    const struct = {
                                        template: 'grid' as const,
                                        rows: [
                                            { id: 'r1', height: 1 },
                                            { id: 'r2', height: 1 }
                                        ],
                                        cols: [
                                            { id: 'c1', width: 1 },
                                            { id: 'c2', width: 1 }
                                        ],
                                        cells: {
                                            'r1_c1': { content: 'A' },
                                            'r1_c2': { content: 'B' },
                                            'r2_c1': { content: 'C' },
                                            'r2_c2': { content: 'D' }
                                        }
                                    };
                                    pizarronStore.updateStructure(firstNode.id, struct);
                                }}
                                className="w-full py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs hover:bg-rose-100"
                            >
                                Inject 2x2 Grid
                            </button>
                        </div>

                        {/* Border */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 flex justify-between">
                                <span>Border</span>
                                <span>{firstNode.content.borderWidth || 0}px</span>
                            </label>
                            <input
                                type="range" min="0" max="10"
                                value={firstNode.content.borderWidth || 0}
                                onChange={(e) => updateNode({ borderWidth: Number(e.target.value) })}
                                className="w-full mt-1 accent-indigo-500"
                            />
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {['#1e293b', '#64748b', '#ef4444', '#3b82f6'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateNode({ borderColor: c, borderWidth: (firstNode.content.borderWidth || 0) === 0 ? 2 : firstNode.content.borderWidth })}
                                        className={`w-5 h-5 rounded border ${firstNode.content.borderColor === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                    </div >
                );

            case 'text':
                return (
                    <div className="space-y-4">
                        {/* Content Edit */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Content</label>
                            <textarea
                                className="w-full p-2 border rounded text-sm text-slate-700 font-sans"
                                rows={3}
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>
                        {/* Typography */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Typography</label>
                            <div className="flex gap-2 mb-2">
                                <FontSelector
                                    className="flex-1"
                                    currentFont={firstNode.content.fontFamily || 'Inter'}
                                    onChange={(f) => updateNode({ fontFamily: f })}
                                />
                                <input
                                    type="number"
                                    className="w-16 border rounded px-1 text-xs py-1"
                                    value={firstNode.content.fontSize || 16}
                                    onChange={(e) => updateNode({ fontSize: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex gap-1 border rounded p-1 bg-slate-50">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        className={`flex-1 py-1 text-[10px] rounded ${firstNode.content.textAlign === align ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                        onClick={() => updateNode({ textAlign: align as any })}
                                    >
                                        {align.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Color */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateNode({ color: c })}
                                        className={`w-6 h-6 rounded-full border ${firstNode.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'line':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Stroke Style</label>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => updateNode({ strokeStyle: 'solid' })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.strokeStyle === 'solid' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>Solid</button>
                                <button onClick={() => updateNode({ strokeStyle: 'dashed' })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.strokeStyle === 'dashed' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>Dashed</button>
                            </div>
                            <input
                                type="range" min="1" max="20"
                                value={firstNode.content.strokeWidth || 4}
                                onChange={(e) => updateNode({ strokeWidth: Number(e.target.value) })}
                                className="w-full accent-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Arrows</label>
                            <div className="flex gap-2">
                                <button onClick={() => updateNode({ startArrow: !firstNode.content.startArrow })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.startArrow ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>Start</button>
                                <button onClick={() => updateNode({ endArrow: !firstNode.content.endArrow })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.endArrow ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>End</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#64748b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateNode({ color: c })}
                                        className={`w-6 h-6 rounded-full border ${firstNode.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                // Generic/Shared fallback
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                            <input className="w-full border rounded text-sm px-2 py-1" value={firstNode.content.title || ''} onChange={(e) => updateNode({ title: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs text-slate-500">X</label><div className="bg-slate-50 px-2 py-1 rounded text-sm">{Math.round(firstNode.x)}</div></div>
                            <div><label className="text-xs text-slate-500">Y</label><div className="bg-slate-50 px-2 py-1 rounded text-sm">{Math.round(firstNode.y)}</div></div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div
            className="fixed w-72 pointer-events-auto z-40 transition-all duration-500 ease-out-expo"
            style={{
                top: 100,
                left: '50%',
                marginLeft: '220px' // Offset from center to right
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent canvas drag
        >
            <div className="bg-white/95 backdrop-blur shadow-2xl border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{firstNode?.type.toUpperCase() || 'SELECTION'} STYLE</span>
                    <div className="flex gap-1">
                        <button onClick={() => { pizarronStore.copySelection(); pizarronStore.paste(); }} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Duplicate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => { const sel = pizarronStore.getState().selection; pizarronStore.deleteNodes(Array.from(sel)); }} className="p-1 hover:bg-red-50 rounded text-red-500" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {renderContent()}

            </div>
        </div>
    );
};

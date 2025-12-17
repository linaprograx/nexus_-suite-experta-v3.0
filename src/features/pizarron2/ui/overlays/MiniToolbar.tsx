import React, { useMemo, useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';
import { AVAILABLE_FONTS } from '../panels/AssetLibrary';
import { FontLoader } from '../../engine/FontLoader';
import {
    LuType, LuScaling, LuPalette, LuBold, LuItalic, LuUnderline, LuStrikethrough,
    LuDroplet, LuLayers, LuCopy, LuTrash2,
    LuLock, LuLockOpen, LuAlignLeft, LuAlignCenter, LuAlignRight,
    LuArrowUp, LuArrowDown, LuMoveVertical, LuWand, LuGroup, LuUngroup,
    LuCaseSensitive, LuUndo, LuRedo
} from 'react-icons/lu';

type PopoverType = 'none' | 'text' | 'size' | 'color' | 'style' | 'spacing' | 'effects' | 'position' | 'casing' | 'more';

export const MiniToolbar: React.FC = () => {
    const { selection, nodes, viewport } = pizarronStore.useState();
    const [activePopover, setActivePopover] = useState<PopoverType>('none');
    const [fontSearch, setFontSearch] = useState('');

    // Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    pizarronStore.redo();
                } else {
                    pizarronStore.undo();
                }
            }
            // Support Ctrl+Y for Redo on Windows
            if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                pizarronStore.redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const selectedNodes = useMemo(() => {
        return Array.from(selection).map(id => nodes[id]).filter(Boolean);
    }, [selection, nodes]);

    // Position Logic
    const toolbarPos = useMemo(() => {
        if (selectedNodes.length === 0) return { top: -100, left: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity;
        selectedNodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + (n.w || 0));
        });

        const zoom = viewport.zoom;
        const panX = viewport.x;
        const panY = viewport.y;

        const screenMinX = minX * zoom + panX;
        const screenMinY = minY * zoom + panY;
        const screenMaxX = maxX * zoom + panX;

        const width = screenMaxX - screenMinX;
        const centerX = screenMinX + width / 2;
        const topY = screenMinY - 60;

        // Clamp for Toolbar Width approx 560px => 280px half width
        // Ensure it never goes off screen
        const halfWidth = 280;
        const clampedX = Math.max(halfWidth + 20, Math.min(window.innerWidth - halfWidth - 20, centerX));
        const clampedY = Math.max(80, Math.min(window.innerHeight - 80, topY));

        return { top: clampedY, left: clampedX };
    }, [selectedNodes, viewport]);

    if (selectedNodes.length === 0) return null;

    const firstNode = selectedNodes[0];
    // Show text tools for almost everything except pure images/lines/groups that definitely don't have text
    // 'shape', 'card', 'note', 'text', 'sticky' etc all support text
    const isText = !['line', 'group'].includes(firstNode.type); // Even images might have captions later, but for now exclude. Sticker usually image.
    // Actually, 'sticker' is often SVG, might not have text. 
    // Let's stick to exclusion list:
    // const isText = !['image', 'line', 'group', 'pen'].includes(firstNode.type);
    const isMulti = selectedNodes.length > 1;

    // Helpers
    const togglePopover = (type: PopoverType) => setActivePopover(prev => prev === type ? 'none' : type);

    // Pass saveHistory = true for user interactions
    const updateNode = (patch: Partial<BoardNode['content']>) => {
        selectedNodes.forEach(n => pizarronStore.updateNode(n.id, { content: { ...n.content, ...patch } }, true));
    };

    const updateStyle = (key: keyof React.CSSProperties, value: any) => {
        selectedNodes.forEach(n => pizarronStore.updateNode(n.id, { content: { ...n.content, [key]: value } }, true));
    };

    const btnClass = (isActive: boolean) => `p-1.5 rounded transition-colors ${isActive
        ? 'bg-orange-100 text-orange-600 border border-orange-200'
        : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50'}`;

    return (
        <div
            className="fixed z-[110] flex items-center gap-1 p-1 bg-white border border-slate-200 shadow-xl rounded-lg pointer-events-auto transition-all duration-75 ease-out"
            style={{ top: toolbarPos.top, left: toolbarPos.left, transform: 'translateX(-50%)' }}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* Drag Handle */}
            <div className="cursor-grab text-slate-300 px-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h8M8 12h8M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>

            {/* --- 1. Typography (Leftmost - Selector Style) --- */}
            {isText ? (
                <div className="relative mr-1">
                    <button
                        onClick={() => togglePopover('text')}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors border ${activePopover === 'text'
                            ? 'bg-orange-50 border-orange-200 text-orange-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600'}`}
                        title="Font Family"
                    >
                        <LuType size={14} className="opacity-70" />
                        <span className="text-[11px] font-medium max-w-[80px] truncate">{firstNode.content.fontFamily || 'Inter'}</span>
                        <LuArrowDown size={10} className="opacity-50 ml-1" />
                    </button>
                    {activePopover === 'text' && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-3 min-w-[240px] z-[120] flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Search fonts..."
                                value={fontSearch}
                                onChange={e => setFontSearch(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                                autoFocus
                            />
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                {AVAILABLE_FONTS.filter(f => f.family.toLowerCase().includes(fontSearch.toLowerCase())).map(font => (
                                    <button
                                        key={font.family}
                                        onClick={() => {
                                            updateNode({ fontFamily: font.family });
                                            FontLoader.loadFont(font);
                                            setActivePopover('none');
                                        }}
                                        className={`w-full text-left px-2 py-1.5 text-sm hover:bg-orange-50 rounded flex items-center justify-between group ${firstNode.content.fontFamily === font.family ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                                        title={font.family}
                                        onMouseEnter={() => FontLoader.loadFont(font)}
                                    >
                                        <span style={{ fontFamily: font.family }}>{font.family}</span>
                                        {firstNode.content.fontFamily === font.family && <span className="text-orange-500 text-xs">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* --- 2. Size --- */}
            <div className="relative">
                <button onClick={() => togglePopover('size')} className={btnClass(activePopover === 'size')} title="Size">
                    <LuScaling size={18} />
                </button>
                {activePopover === 'size' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-3 min-w-[150px] z-[120] flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Size</span>
                            <span>{firstNode.content.fontSize || 16}px</span>
                        </div>
                        <input
                            type="range" min="8" max="128"
                            value={firstNode.content.fontSize || 16}
                            onChange={(e) => updateNode({ fontSize: parseInt(e.target.value) })}
                            className="w-full accent-orange-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                        />
                    </div>
                )}
            </div>

            {/* --- 3. Color --- */}
            <div className="relative">
                <button onClick={() => togglePopover('color')} className={btnClass(activePopover === 'color')} title="Color">
                    <LuPalette size={18} />
                </button>
                {activePopover === 'color' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-2 min-w-[220px] z-[120]">
                        <div className="grid grid-cols-6 gap-1.5">
                            {/* Transparent Option (First) */}
                            <button
                                onClick={() => updateNode({ color: 'transparent' })}
                                className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform flex items-center justify-center bg-white relative overflow-hidden"
                                title="Transparent"
                            >
                                <div className="absolute inset-0 bg-red-500 w-[1px] h-[30px] rotate-45 top-[-3px] left-[11px]"></div>
                            </button>
                            {/* Colors */}
                            {['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b', '#94a3b8'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => updateNode({ color: c })}
                                    className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- 4. Style (Bold, Italic, Underline, Strikethrough) --- */}
            {isText && (
                <div className="relative">
                    <button onClick={() => togglePopover('style')} className={btnClass(activePopover === 'style')} title="Style">
                        <LuBold size={18} />
                    </button>
                    {activePopover === 'style' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-[120] flex gap-1">
                            <button onClick={() => updateStyle('fontWeight', firstNode.content.fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-2 rounded hover:bg-orange-50 ${firstNode.content.fontWeight === 'bold' ? 'bg-orange-100 text-orange-600' : 'text-slate-600'}`}><LuBold size={16} /></button>
                            <button onClick={() => updateStyle('fontStyle', firstNode.content.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded hover:bg-orange-50 ${firstNode.content.fontStyle === 'italic' ? 'bg-orange-100 text-orange-600' : 'text-slate-600'}`}><LuItalic size={16} /></button>
                            <button onClick={() => updateStyle('textDecoration', firstNode.content.textDecoration === 'underline' ? 'none' : 'underline')} className={`p-2 rounded hover:bg-orange-50 ${firstNode.content.textDecoration === 'underline' ? 'bg-orange-100 text-orange-600' : 'text-slate-600'}`}><LuUnderline size={16} /></button>
                            <button onClick={() => updateStyle('textDecoration', firstNode.content.textDecoration === 'line-through' ? 'none' : 'line-through')} className={`p-2 rounded hover:bg-orange-50 ${firstNode.content.textDecoration === 'line-through' ? 'bg-orange-100 text-orange-600' : 'text-slate-600'}`}><LuStrikethrough size={16} /></button>
                        </div>
                    )}
                </div>
            )}

            {/* --- 5. Spacing (Line Height / Interlineado) --- */}
            {isText && (
                <div className="relative">
                    <button onClick={() => togglePopover('spacing')} className={btnClass(activePopover === 'spacing')} title="Spacing">
                        <LuMoveVertical size={18} />
                    </button>
                    {activePopover === 'spacing' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-3 min-w-[200px] z-[120] flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">LINE HEIGHT</div>
                                <input
                                    type="range" min="0.8" max="2.5" step="0.1"
                                    value={firstNode.content.lineHeight || 1.2}
                                    onChange={(e) => updateNode({ lineHeight: parseFloat(e.target.value) })}
                                    className="w-full accent-orange-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">LETTER SPACING</div>
                                <input
                                    type="range" min="-2" max="10" step="0.5"
                                    value={parseInt(firstNode.content.letterSpacing as string || '0')}
                                    onChange={(e) => updateNode({ letterSpacing: `${e.target.value}px` })}
                                    className="w-full accent-orange-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- 6. Effects (Blur, Shadow, Drops) --- */}
            <div className="relative">
                <button onClick={() => togglePopover('effects')} className={btnClass(activePopover === 'effects')} title="Effects">
                    <LuWand size={18} />
                </button>
                {activePopover === 'effects' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-3 min-w-[200px] z-[120] space-y-3">
                        {/* Opacity */}
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">OPACITY</div>
                            <input
                                type="range" min="0" max="100"
                                value={(firstNode.content.opacity ?? 1) * 100}
                                onChange={(e) => updateNode({ opacity: parseInt(e.target.value) / 100 })}
                                className="w-full accent-orange-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                            />
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Shadows / Blur toggles (Simplified for now) */}
                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-orange-600">
                                <input
                                    type="checkbox"
                                    className="rounded text-orange-500 focus:ring-orange-500"
                                    checked={!!firstNode.content.filters?.shadow}
                                    onChange={(e) => updateNode({ filters: { ...firstNode.content.filters, shadow: e.target.checked ? { color: 'rgba(0,0,0,0.2)', blur: 10, offsetX: 0, offsetY: 4 } : undefined } })}
                                />
                                Drop Shadow
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:text-orange-600">
                                <input
                                    type="checkbox"
                                    className="rounded text-orange-500 focus:ring-orange-500"
                                    checked={!!firstNode.content.filters?.blur}
                                    onChange={(e) => updateNode({ filters: { ...firstNode.content.filters, blur: e.target.checked ? 4 : undefined } })}
                                />
                                Blur
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* --- Position --- */}
            <div className="relative">
                <button onClick={() => togglePopover('position')} className={btnClass(activePopover === 'position')} title="Position">
                    <LuLayers size={18} />
                </button>
                {activePopover === 'position' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-[120] flex flex-col gap-1 min-w-[140px]">
                        <button onClick={() => pizarronStore.bringToFront()} className="text-xs flex items-center justify-between px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-600"><span className="flex items-center gap-2"><LuArrowUp /> Al frente</span></button>
                        <button onClick={() => pizarronStore.bringForward()} className="text-xs flex items-center justify-between px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-600"><span className="flex items-center gap-2 text-slate-400"><LuArrowUp size={14} /> Delante</span></button>
                        <button onClick={() => pizarronStore.sendBackward()} className="text-xs flex items-center justify-between px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-600"><span className="flex items-center gap-2 text-slate-400"><LuArrowDown size={14} /> Atras</span></button>
                        <button onClick={() => pizarronStore.sendToBack()} className="text-xs flex items-center justify-between px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-600"><span className="flex items-center gap-2"><LuArrowDown /> A fondo</span></button>
                    </div>
                )}
            </div>

            {/* --- Casing (Moved here or keep inside Style? Request didn't specify, generally useful) --- */}
            {isText && (
                <div className="relative">
                    <button onClick={() => togglePopover('casing')} className={btnClass(activePopover === 'casing')} title="Casing">
                        <LuCaseSensitive size={18} />
                    </button>
                    {activePopover === 'casing' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-[120] flex flex-col gap-1 min-w-[120px]">
                            <button onClick={() => updateStyle('textTransform', 'uppercase')} className="text-xs text-left px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded">UPPERCASE</button>
                            <button onClick={() => updateStyle('textTransform', 'lowercase')} className="text-xs text-left px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded">lowercase</button>
                            <button onClick={() => updateStyle('textTransform', 'capitalize')} className="text-xs text-left px-2 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded">Capitalize</button>
                        </div>
                    )}
                </div>
            )}

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* --- Copy --- */}
            <button
                onClick={() => { pizarronStore.copySelection(); pizarronStore.paste(); }}
                className={btnClass(false)} title="Duplicate"
            >
                <LuCopy size={18} />
            </button>

            {/* --- Lock / Group / Delete --- */}

            <button onClick={() => pizarronStore.updateNode(firstNode.id, { locked: !firstNode.locked })} className={`p-1.5 rounded transition-colors ${firstNode.locked ? 'bg-red-50 text-red-500' : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50'}`}>
                {firstNode.locked ? <LuLock size={18} /> : <LuLockOpen size={18} />}
            </button>

            {/* Group Button (Placement: Next to lock) */}
            {isMulti ? (
                <button onClick={() => pizarronStore.groupSelection()} className={btnClass(false)} title="Group">
                    <LuGroup size={18} />
                </button>
            ) : (firstNode.type === 'group') ? (
                <button onClick={() => pizarronStore.ungroupSelection()} className={btnClass(false)} title="Ungroup">
                    <LuUngroup size={18} />
                </button>
            ) : null}

            <button onClick={() => pizarronStore.deleteNodes(selectedNodes.map(n => n.id))} className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete">
                <LuTrash2 size={18} />
            </button>

            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* Undo/Redo (Moved to end) */}
            <div className="flex items-center gap-0.5">
                <button onClick={() => pizarronStore.undo()} className="p-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-500" title="Undo (Ctrl+Z)">
                    <LuUndo size={16} />
                </button>
                <button onClick={() => pizarronStore.redo()} className="p-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-slate-500" title="Redo (Ctrl+Shift+Z)">
                    <LuRedo size={16} />
                </button>
            </div>

        </div>
    );
};


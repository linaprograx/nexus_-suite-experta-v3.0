import React from 'react';
import { pizarronStore } from '../../state/store';
import { FontLoader } from '../../engine/FontLoader';
import { BoardNode } from '../../engine/types';
import { ColorPicker, FontSelector } from '../shared/UnifiedSelectors';
import { TextStyleController } from '../components/TextStyleController';
import { VisualEffectsController } from '../components/VisualEffectsController';

export const Inspector: React.FC = () => {
    const { selection, nodes, viewport, boardResources, interactionState } = pizarronStore.useState();
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
        const targets = getTargets();
        targets.forEach(node => {
            pizarronStore.updateNode(node.id, {
                content: { ...node.content, ...patch }
            });
        });
    };

    // Helper: Determine Targets (Single, Group Children, or Multi-Selection)
    const getTargets = (): BoardNode[] => {
        if (!firstNode) return [];
        if (firstNode.type === 'group' && firstNode.childrenIds) {
            const children = firstNode.childrenIds.map(id => nodes[id]).filter(Boolean) as BoardNode[];
            // Recursive? For now, flat.
            return children;
        }
        return [firstNode];
    };

    // Determine Effective Type
    const getEffectiveType = () => {
        if (!firstNode) return null;
        if (firstNode.type === 'group') {
            const targets = getTargets();
            if (targets.length > 0 && targets.every(n => n.type === 'board')) return 'board';
            if (targets.length > 0 && targets.every(n => n.type === 'shape')) return 'shape';
            return 'group';
        }
        return firstNode.type;
    };

    const effectiveType = getEffectiveType();
    const primaryTarget = getTargets()[0] || firstNode;

    // Render Content based on Type
    const renderContent = () => {
        if (!firstNode) return <div className="text-sm text-slate-500 italic text-center py-4">Multiple Selection</div>;

        switch (effectiveType) {
            case 'board':
                // Check for Active Zone Editing (Only valid if single board selected, not group)
                // If group, we probably disable detailed zone editing?
                const activeZoneId = interactionState?.activeZoneId;
                const activeZoneSection = interactionState?.activeZoneSection || 'content'; // Default to content
                const activeZone = (activeZoneId && firstNode.type === 'board') ? firstNode.structure?.zones?.find(z => z.id === activeZoneId) : undefined;

                if (activeZone) {
                    // ... Zone Editor (keep existing logic uses 'firstNode' directly, which is correct for activeZoneId context)
                    // We need to ensure the Zone Editor uses 'updateNode' or 'pizarronStore.updateNode(firstNode.id...)'
                    // The existing code uses specific update logic. We can leave it as it accesses 'firstNode' directly.
                    return (
                        <div className="space-y-4">
                            {/* ... Zone Editor Header ... */}
                            {/* Start of Zone Editor Block */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 bg-indigo-50 -mx-3 -mt-3 px-3 py-2 rounded-t gap-2">
                                <div className="flex-1 flex items-center gap-1 min-w-0">
                                    <svg className="w-3 h-3 text-indigo-800 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                    <input
                                        type="text"
                                        className="bg-transparent text-xs font-bold text-indigo-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 w-full"
                                        value={activeZone.label || ''}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                            const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                            if (z) {
                                                z.label = val;
                                                pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => pizarronStore.updateInteractionState({ activeZoneId: undefined })}
                                    className="text-[10px] text-indigo-500 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 flex-shrink-0"
                                >
                                    Done
                                </button>
                            </div>

                            {/* ... Content ... */}
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">
                                    {activeZoneSection === 'title' ? 'Title Label' :
                                        activeZoneSection === 'content' ? 'Content' : 'Section Content'}
                                </label>
                                <textarea
                                    className="w-full text-xs border border-slate-300 rounded p-2 min-h-[100px] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder={activeZoneSection === 'title' ? "Enter zone title..." : "Type content..."}
                                    value={(() => {
                                        if (activeZoneSection === 'title') return activeZone.label || '';
                                        if (activeZoneSection === 'content') return activeZone.content?.text || '';
                                        const sec = activeZone.sections?.find((s: any) => s.id === activeZoneSection);
                                        return sec?.content?.text || '';
                                    })()}
                                    disabled={false}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);

                                        if (activeZoneSection === 'title') {
                                            z.label = val;
                                        } else if (activeZoneSection === 'content') {
                                            if (!z.content) z.content = {};
                                            z.content.text = val;
                                        } else {
                                            const sec = z.sections?.find((s: any) => s.id === activeZoneSection);
                                            if (sec) {
                                                if (!sec.content) sec.content = {};
                                                sec.content.text = val;
                                            }
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />
                            </div>

                            {/* Zone Title Visibility (Issue 2) */}
                            {activeZoneSection === 'title' && (
                                <div className="flex items-center gap-2 mt-2">
                                    <label className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                            checked={activeZone.style?.showLabel !== false} // Default true
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                                const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                                if (!z.style) z.style = {};
                                                z.style.showLabel = checked;
                                                pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                            }}
                                        />
                                        Show Title Label
                                    </label>
                                </div>
                            )}

                            {/* Rich Text Styles */}
                            {/* Dynamic Section Header & Manager */}
                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <span className={activeZoneSection === 'title' ? 'text-indigo-600' : 'cursor-pointer hover:text-slate-600'} onClick={() => pizarronStore.updateInteractionState({ activeZoneSection: 'title' })}>TITLE</span>
                                        <span className="text-slate-300">/</span>
                                        <span className={activeZoneSection === 'content' ? 'text-indigo-600' : 'cursor-pointer hover:text-slate-600'} onClick={() => pizarronStore.updateInteractionState({ activeZoneSection: 'content' })}>CONTENT</span>
                                        {activeZone.sections?.length > 0 && (
                                            <>
                                                <span className="text-slate-300">/</span>
                                                <span className={(!['title', 'content'].includes(activeZoneSection)) ? 'text-indigo-600' : 'text-slate-400'}>
                                                    SECTIONS ({activeZone.sections.length})
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-100"
                                        onClick={() => {
                                            const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                            const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                            if (!z.sections) z.sections = [];
                                            const newId = crypto.randomUUID();
                                            z.sections.push({
                                                id: newId,
                                                content: { text: "New Section", style: { fontSize: 14 } },
                                                style: { backgroundColor: 'transparent' }
                                            });
                                            pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                            // Auto-select new section
                                            pizarronStore.updateInteractionState({ activeZoneSection: newId });
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>
                                {(!['title', 'content'].includes(activeZoneSection)) && (
                                    <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded flex justify-between items-center">
                                        <span>Editing Section</span>
                                        <button
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => {
                                                const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                                const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                                z.sections = z.sections.filter((s: any) => s.id !== activeZoneSection);
                                                pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                                pizarronStore.updateInteractionState({ activeZoneSection: 'content' });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Unified Text Style Controller */}
                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <TextStyleController
                                    fontSize={(() => {
                                        if (activeZoneSection === 'title') return activeZone.style?.titleFontSize || 14;
                                        if (activeZoneSection === 'content') return activeZone.content?.style?.fontSize || 14;
                                        return activeZone.sections?.find((s: any) => s.id === activeZoneSection)?.content?.style?.fontSize || 14;
                                    })()}
                                    lineHeight={(() => {
                                        if (activeZoneSection === 'title') return 1.2;
                                        if (activeZoneSection === 'content') return activeZone.content?.style?.lineHeight || 1.2;
                                        return activeZone.sections?.find((s: any) => s.id === activeZoneSection)?.content?.style?.lineHeight || 1.2;
                                    })()}
                                    textAlign={(() => {
                                        if (activeZoneSection === 'title') return activeZone.style?.titleAlign || 'left';
                                        if (activeZoneSection === 'content') return activeZone.content?.style?.align || 'left';
                                        return activeZone.sections?.find((s: any) => s.id === activeZoneSection)?.content?.style?.align || 'left';
                                    })()}
                                    onChange={(styles) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);

                                        // Helper to apply styles based on section
                                        if (activeZoneSection === 'title') {
                                            if (!z.style) z.style = {};
                                            if (styles.fontSize) z.style.titleFontSize = styles.fontSize;
                                            if (styles.textAlign) z.style.titleAlign = styles.textAlign;
                                        } else {
                                            let targetContent = (activeZoneSection === 'content')
                                                ? z.content
                                                : z.sections?.find((s: any) => s.id === activeZoneSection)?.content;

                                            if (!targetContent) {
                                                if (activeZoneSection === 'content') { z.content = {}; targetContent = z.content; }
                                            }

                                            if (targetContent) {
                                                if (!targetContent.style) targetContent.style = {};
                                                if (styles.fontSize) targetContent.style.fontSize = styles.fontSize;
                                                if (styles.lineHeight) targetContent.style.lineHeight = styles.lineHeight;
                                                if (styles.textAlign) targetContent.style.align = styles.textAlign;
                                            }
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />
                            </div>

                            {/* --- Zone Styling (Unified) --- */}
                            <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">

                                {/* Text Color */}
                                <ColorPicker
                                    label="Text Color"
                                    color={(() => {
                                        if (activeZoneSection === 'title') return activeZone.style?.titleColor || '#000000';
                                        if (activeZoneSection === 'content') return activeZone.content?.style?.color || '#000000';
                                        return activeZone.sections?.find((s: any) => s.id === activeZoneSection)?.content?.style?.color || '#000000';
                                    })()}
                                    onChange={(c) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                        const color = typeof c === 'string' ? c : c.start; // Force string for text color

                                        if (activeZoneSection === 'title') {
                                            if (!z.style) z.style = {};
                                            z.style.titleColor = color;
                                        } else {
                                            let targetContent = (activeZoneSection === 'content')
                                                ? z.content
                                                : z.sections?.find((s: any) => s.id === activeZoneSection)?.content;

                                            if (!targetContent && activeZoneSection === 'content') { z.content = {}; targetContent = z.content; }

                                            if (targetContent) {
                                                if (!targetContent.style) targetContent.style = {};
                                                targetContent.style.color = color;
                                            }
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />

                                {/* Fill Color (Relleno) */}
                                <ColorPicker
                                    label="Fill Color (Relleno)"
                                    showTransparent={true}
                                    color={(() => {
                                        if (activeZoneSection === 'title') return activeZone.style?.titleBackgroundColor || 'transparent';
                                        if (activeZoneSection === 'content') return activeZone.content?.style?.backgroundColor || 'transparent';
                                        return activeZone.sections?.find((s: any) => s.id === activeZoneSection)?.style?.backgroundColor || 'transparent';
                                    })()}
                                    onChange={(c) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                        const color = typeof c === 'string' ? c : c.start;

                                        if (activeZoneSection === 'title') {
                                            if (!z.style) z.style = {};
                                            z.style.titleBackgroundColor = color;
                                        } else if (activeZoneSection === 'content') {
                                            if (!z.content) z.content = {};
                                            if (!z.content.style) z.content.style = {};
                                            z.content.style.backgroundColor = color;
                                        } else {
                                            const sec = z.sections?.find((s: any) => s.id === activeZoneSection);
                                            if (sec) {
                                                if (!sec.style) sec.style = {};
                                                sec.style.backgroundColor = color;
                                            }
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />

                                {/* Divider */}
                                <div className="border-t border-slate-100 my-2"></div>
                                <label className="text-xs font-bold text-slate-800 block mb-3">Zone Container Appearance</label>

                                {/* Background & Gradient (Zone Container) */}
                                <ColorPicker
                                    label="Container Background"
                                    allowGradient={true}
                                    color={activeZone.style?.gradient || activeZone.style?.backgroundColor || '#ffffff'}
                                    onChange={(val) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                        if (!z.style) z.style = {};

                                        if (typeof val === 'string') {
                                            z.style.backgroundColor = val;
                                            delete z.style.gradient;
                                        } else {
                                            z.style.gradient = val;
                                            // Keep opacity/shading logic if needed, but gradient usually overrides
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />

                                {/* Border Color */}
                                <ColorPicker
                                    label="Border Color"
                                    color={activeZone.style?.borderColor || '#cbd5e1'}
                                    onChange={(c) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                        if (!z.style) z.style = {};
                                        z.style.borderColor = typeof c === 'string' ? c : c.start;
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />

                                {/* Visual Effects (Radius, Border Width, Shadow) */}
                                <VisualEffectsController
                                    borderRadius={activeZone.style?.borderRadius ?? 0}
                                    borderWidth={activeZone.style?.borderWidth ?? 0}
                                    shadow={activeZone.style?.shadow}
                                    opacity={1} // Zone opacity not currently tracked in model, default 1
                                    onChange={(effects) => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                        if (!z.style) z.style = {};

                                        if (effects.borderRadius !== undefined) z.style.borderRadius = effects.borderRadius;
                                        if (effects.borderWidth !== undefined) z.style.borderWidth = effects.borderWidth;
                                        if (effects.shadow !== undefined) {
                                            if (effects.shadow === null) delete z.style.shadow;
                                            else z.style.shadow = effects.shadow;
                                        }
                                        pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                    }}
                                />

                                {/* Title Gap specific control */}
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">Title Spacing</label>
                                    <input type="number" min="0" max="50" className="w-full text-xs border rounded p-1"
                                        value={activeZone.style?.titleGap ?? 2}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                            const z = newStructure.zones.find((z: any) => z.id === activeZoneId);
                                            if (!z.style) z.style = {};
                                            z.style.titleGap = val;
                                            pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Mass Actions */}
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <button
                                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded flex items-center justify-center gap-2 transition-colors"
                                    onClick={() => {
                                        const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                        const sourceZone = newStructure.zones.find((z: any) => z.id === activeZoneId);

                                        if (sourceZone) {
                                            // Apply to all
                                            newStructure.zones.forEach((z: any) => {
                                                if (z.id === activeZoneId) return; // Skip self

                                                // Copy Appearance
                                                z.style = JSON.parse(JSON.stringify(sourceZone.style || {}));

                                                // Copy Text Content Style (Font, Align, Color) BUT NOT TEXT
                                                if (!z.content) z.content = {};
                                                if (!z.content.style) z.content.style = {};
                                                if (sourceZone.content?.style) {
                                                    z.content.style = { ...z.content.style, ...sourceZone.content.style };
                                                }
                                            });
                                            pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                        }
                                    }}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Apply Style to All Zones
                                </button>
                            </div>
                        </div>
                    );
                }

                // --- BOARD INSPECTOR (Multi-Edit Capable) ---
                return (
                    <div className="space-y-4">
                        {/* Board Title Editor */}
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Board Title</label>
                                <input
                                    type="text"
                                    className="w-full text-xs border border-slate-300 rounded p-1 font-bold text-slate-700"
                                    value={primaryTarget.content.title || 'BOARD'}
                                    onChange={(e) => updateNode({ title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <ColorPicker
                                    label="Title Color"
                                    color={primaryTarget.content.titleColor || '#94a3b8'}
                                    onChange={(c) => updateNode({ titleColor: typeof c === 'string' ? c : c.start })}
                                />
                                <TextStyleController
                                    fontSize={primaryTarget.content.fontSize || 14}
                                    onChange={(s) => {
                                        if (s.fontSize) updateNode({ fontSize: s.fontSize });
                                    }}
                                    showAlign={false}
                                />
                            </div>
                        </div>

                        {/* Title & Body - Using 'primaryTarget' instead of 'firstNode' where likely to read */}
                        <div>
                            <input
                                type="range" min="12" max="72"
                                value={primaryTarget.content.fontSize || 20}
                                onChange={(e) => updateNode({ fontSize: Number(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Collapse / Expand (Only valid for explicit board nodes, groups might not collapse same way) */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Visibility</label>
                            <button
                                onClick={() => {
                                    const targets = getTargets();
                                    targets.forEach(t => pizarronStore.toggleCollapse(t.id));
                                }}
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
                                        // 1. Try Standard Templates
                                        import('../../engine/structures').then(({ STRUCTURE_TEMPLATES }) => {
                                            let template = STRUCTURE_TEMPLATES[val];

                                            // 2. Try Saved Templates
                                            if (!template) {
                                                const saved = pizarronStore.getState().savedTemplates?.find(t => t.id === val);
                                                if (saved) template = saved;
                                            }

                                            if (template) {
                                                // If it's a saved template, it might have an ID we want to preserve or regenerate? 
                                                // Usually structure.id isn't critical, but structureId on node is.
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
                                {pizarronStore.getState().savedTemplates?.map(t => (
                                    <option key={t.id} value={t.id}>{t.template || 'Custom Template'}</option>
                                ))}
                            </select>

                            {/* Template Management */}
                            {firstNode.structure && (
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Template Name:");
                                            if (name) {
                                                const newTemplate = {
                                                    ...firstNode.structure!,
                                                    id: crypto.randomUUID(),
                                                    template: name
                                                };
                                                pizarronStore.saveTemplate(newTemplate);
                                                // Persist to Cloud
                                                import('../../sync/firestoreAdapter').then(({ firestoreAdapter }) => {
                                                    firestoreAdapter.persistTemplate(newTemplate);
                                                });
                                            }
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        + Save as Template
                                    </button>
                                </div>
                            )}

                            {/* Gap Control */}
                            {firstNode.structure && (
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-medium text-slate-600">Spacing (Gap)</label>
                                        <span className="text-[10px] text-slate-400">{firstNode.structure.gap || 0}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="40" step="4"
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        value={firstNode.structure.gap || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            pizarronStore.updateNode(firstNode.id, {
                                                structure: { ...firstNode.structure, gap: val }
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            {/* Zone Editor */}
                            {firstNode.structure && firstNode.structure.zones && (
                                <div className="mt-4 border-t border-slate-200 pt-2">
                                    <label className="text-xs font-bold text-slate-700 block mb-2">Zone Styles</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {firstNode.structure.zones.map((zone, idx) => (
                                            <div key={zone.id} className="flex flex-col gap-1 p-2 bg-slate-50 rounded border border-slate-200">
                                                <span className="text-xs font-medium text-slate-700 truncate">{zone.label}</span>
                                                <div className="flex items-center justify-between">
                                                    {/* Shading */}
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500">Bg:</span>
                                                        <input
                                                            type="color"
                                                            className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                                                            value={zone.style?.shading || '#ffffff'}
                                                            onChange={(e) => {
                                                                const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                                                if (newStructure.zones[idx]) {
                                                                    const currentStyle = newStructure.zones[idx].style || {};
                                                                    newStructure.zones[idx].style = { ...currentStyle, shading: e.target.value };
                                                                    pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Dashed */}
                                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="w-3 h-3 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                                            checked={!!zone.style?.dashed}
                                                            onChange={(e) => {
                                                                const newStructure = JSON.parse(JSON.stringify(firstNode.structure));
                                                                if (newStructure.zones[idx]) {
                                                                    const currentStyle = newStructure.zones[idx].style || {};
                                                                    newStructure.zones[idx].style = { ...currentStyle, dashed: e.target.checked };
                                                                    pizarronStore.updateNode(firstNode.id, { structure: newStructure });
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-[10px] text-slate-500">Dashed</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* Existing Color Picker */}
                        {/* Existing Color Picker -> Unified */}
                        <ColorPicker
                            label="Board Background"
                            allowGradient={true}
                            showTransparent={true}
                            color={firstNode.content.gradient || firstNode.content.color || '#ffffff'} // Board color logic might need check if gradient exists? Existing logic was simple color.
                            onChange={(c) => {
                                if (typeof c === 'string') {
                                    updateNode({ color: c, gradient: undefined });
                                } else {
                                    updateNode({ gradient: c });
                                }
                            }}
                        />

                        {/* --- Board Resources (Prefabs) --- */}
                        <div className="mt-4 border-t border-slate-200 pt-2">
                            <label className="text-xs font-bold text-slate-700 block mb-2">Saved Prefabs</label>

                            <div className="space-y-1 mb-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {boardResources?.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 group">
                                        <div className="flex flex-col gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); pizarronStore.moveBoardResource(r.id, 'up'); }} className="text-slate-400 hover:text-indigo-600 leading-none text-[8px]">▲</button>
                                            <button onClick={(e) => { e.stopPropagation(); pizarronStore.moveBoardResource(r.id, 'down'); }} className="text-slate-400 hover:text-indigo-600 leading-none text-[8px]">▼</button>
                                        </div>
                                        <span className="text-xs text-slate-700 truncate flex-1" title={r.name}>{r.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                title="Delete Resource"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this prefab?")) {
                                                        pizarronStore.deleteBoardResource(r.id);
                                                        import('../../sync/firestoreAdapter').then(({ firestoreAdapter }) => firestoreAdapter.removeBoardResource(r.id));
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 px-1 font-bold"
                                            >
                                                ×
                                            </button>
                                            <button
                                                title="Apply to Board (Replace Content)"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Replace current board content with this prefab?")) {
                                                        pizarronStore.applyResourceToBoard(firstNode.id, r.id);
                                                    }
                                                }}
                                                className="text-blue-500 hover:text-blue-700 px-1 font-bold text-[10px]"
                                            >
                                                APPLY
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!boardResources || boardResources.length === 0) && (
                                    <div className="text-[10px] text-slate-400 italic text-center">No saved prefabs</div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    const name = prompt("Prefab Name (saves current board + content):");
                                    if (name) {
                                        const id = crypto.randomUUID();
                                        pizarronStore.saveBoardAsResource(firstNode.id, name, id);
                                        // Persist
                                        import('../../sync/firestoreAdapter').then(({ firestoreAdapter }) => {
                                            // Ideally we pass the full resource object, but here we can only reconstruct it or fetch from state?
                                            // The state update is synchronous.
                                            const res = pizarronStore.getState().boardResources?.find(r => r.id === id);
                                            if (res) firestoreAdapter.persistBoardResource(res);
                                        });
                                    }
                                }}
                                className="w-full py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-50 flex items-center justify-center gap-1 shadow-sm font-medium"
                            >
                                <span className="text-lg leading-none">+</span> Save Board as Prefab
                            </button>
                        </div>
                    </div >
                );

            case 'shape':
                return (
                    <div className="space-y-4">
                        {/* Fill & Gradient Unified */}
                        <ColorPicker
                            label="Fill / Gradient"
                            allowGradient={true}
                            showTransparent={true}
                            color={firstNode.content.gradient || firstNode.content.color || 'transparent'}
                            onChange={(c) => {
                                if (typeof c === 'string') {
                                    updateNode({ color: c, gradient: undefined });
                                } else {
                                    updateNode({ gradient: c });
                                }
                            }}
                        />

                        {/* Border Color */}
                        <ColorPicker
                            label="Border Color"
                            color={firstNode.content.borderColor || '#cbd5e1'}
                            onChange={(c) => updateNode({ borderColor: typeof c === 'string' ? c : c.start })}
                        />

                        {/* Visual Effects */}
                        <VisualEffectsController
                            borderWidth={firstNode.content.borderWidth || 0}
                            borderRadius={0} // shapes usually sharp? or maybe allow rounding? existing code only had border width
                            opacity={1}
                            shadow={null} // Shapes didn't have shadow in Inspector?
                            onChange={(eff) => {
                                if (eff.borderWidth !== undefined) updateNode({ borderWidth: eff.borderWidth });
                            }}
                        />

                        {/* DEBUG: Structure for Shapes (Preserved) */}
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
                    </div >
                );

            case 'group':
                return (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                            <span className="text-xs font-medium text-slate-500">
                                {getTargets().length} items selected
                            </span>
                        </div>

                        {/* Bulk Color - Affects all children that have 'color' or 'borderColor' */}
                        <ColorPicker
                            label="Color Modification"
                            color={'#000000'} // Mixed state? Just show black or transparent
                            onChange={(c) => {
                                const color = typeof c === 'string' ? c : c.start;
                                const targets = getTargets();
                                targets.forEach(n => {
                                    const patch: any = {};
                                    // Intelligent patching based on type
                                    if (n.type === 'text' || n.type === 'shape' || n.type === 'line') {
                                        patch.color = color;
                                    }
                                    if (n.type === 'shape' || n.type === 'board') {
                                        patch.borderColor = color;
                                    }
                                    if (Object.keys(patch).length > 0) {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, ...patch } });
                                    }
                                });
                            }}
                        />

                        {/* Bulk Fill - For Shapes/Boards */}
                        <ColorPicker
                            label="Fill Color"
                            color={'transparent'}
                            onChange={(c) => {
                                const color = typeof c === 'string' ? c : c.start;
                                const targets = getTargets();
                                targets.forEach(n => {
                                    if (n.type === 'shape' || n.type === 'board') {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, color: color } });
                                    }
                                });
                            }}
                        />

                        {/* Visual Effects - Opacity & Border */}
                        <VisualEffectsController
                            opacity={1}
                            borderWidth={0}
                            borderRadius={0}
                            onChange={(eff) => {
                                const targets = getTargets();
                                targets.forEach(n => {
                                    const patch: any = {};
                                    if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                                    if (eff.borderWidth !== undefined) patch.borderWidth = eff.borderWidth;
                                    if (Object.keys(patch).length > 0) {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, ...patch } });
                                    }
                                });
                            }}
                        />
                    </div>
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
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <FontSelector
                                currentFont={firstNode.content.fontFamily || 'Inter'}
                                onChange={(f) => updateNode({ fontFamily: f })}
                            />
                            <div className="mt-2 text-xs">
                                <TextStyleController
                                    fontSize={firstNode.content.fontSize || 16}
                                    textAlign={firstNode.content.textAlign || 'left'}
                                    lineHeight={firstNode.content.lineHeight || 1.5}
                                    onChange={(s) => {
                                        const patch: any = {};
                                        if (s.fontSize) patch.fontSize = s.fontSize;
                                        if (s.textAlign) patch.textAlign = s.textAlign;
                                        if (s.lineHeight) patch.lineHeight = s.lineHeight;
                                        updateNode(patch);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Color */}
                        <ColorPicker
                            label="Text Color"
                            value={firstNode.content.color || '#000000'}
                            onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                        />
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
                            <ColorPicker
                                label="Line Color"
                                value={firstNode.content.color || '#64748b'}
                                onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                            />
                        </div>
                    </div>
                );

            case 'icon':
                return (
                    <div className="space-y-4">
                        {/* Icon Color */}
                        <ColorPicker
                            label="Color del Icono"
                            value={firstNode.content.color || '#000000'}
                            onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                        />

                        {/* Visual Effects */}
                        <VisualEffectsController
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={!!firstNode.content.filters?.shadow}
                            borderRadius={0}
                            borderWidth={0}
                            onChange={(eff) => {
                                const patch: any = {};
                                if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                                if (eff.shadow !== undefined) {
                                    patch.filters = {
                                        ...firstNode.content.filters,
                                        shadow: eff.shadow ? { color: 'rgba(0,0,0,0.2)', blur: 10, offsetX: 0, offsetY: 4 } : undefined
                                    };
                                }
                                updateNode(patch);
                            }}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-4">
                        {/* Preview & Source */}
                        <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative group">
                            {firstNode.content.src ? (
                                <img src={firstNode.content.src} alt="Preview" className="max-w-full max-h-full object-contain"
                                    style={{ opacity: firstNode.content.opacity ?? 1, borderRadius: firstNode.content.borderRadius }} />
                            ) : (
                                <span className="text-slate-400 text-sm">No Image</span>
                            )}
                            {/* Overlay Button */}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white font-bold text-xs bg-black/50 px-2 py-1 rounded border border-white/50">Change Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            updateNode({ src: ev.target?.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </label>
                        </div>

                        {/* URL Input */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Source URL</label>
                            <input
                                className="w-full border rounded text-xs px-2 py-1 bg-slate-50 text-slate-600 truncate"
                                value={firstNode.content.src || ''}
                                onChange={(e) => updateNode({ src: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Caption */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Caption</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1"
                                value={firstNode.content.caption || ''}
                                onChange={(e) => updateNode({ caption: e.target.value })}
                                placeholder="Image caption..."
                            />
                        </div>

                        {/* Visual Effects */}
                        <VisualEffectsController
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={!!firstNode.content.filters?.shadow}
                            borderRadius={firstNode.content.borderRadius || 0}
                            borderWidth={firstNode.content.borderWidth || 0}
                            onChange={(eff) => {
                                const patch: any = {};
                                if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                                if (eff.borderRadius !== undefined) patch.borderRadius = eff.borderRadius;
                                if (eff.borderWidth !== undefined) patch.borderWidth = eff.borderWidth;
                                if (eff.shadow !== undefined) {
                                    patch.filters = {
                                        ...firstNode.content.filters,
                                        shadow: eff.shadow ? { color: 'rgba(0,0,0,0.2)', blur: 10, offsetX: 0, offsetY: 4 } : undefined
                                    };
                                }
                                updateNode(patch);
                            }}
                        />
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
            className="fixed w-72 pointer-events-auto z-[100] transition-all duration-500 ease-out-expo"
            style={{
                top: 100,
                left: '50%',
                marginLeft: '220px' // Offset from center to right
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent canvas drag
        >
            <div className="bg-white/95 backdrop-blur shadow-2xl border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-shrink-0">
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

                <div className="overflow-y-auto max-h-[calc(80vh-100px)] pr-1 custom-scrollbar">
                    {renderContent()}
                </div>

            </div>
        </div>
    );
};

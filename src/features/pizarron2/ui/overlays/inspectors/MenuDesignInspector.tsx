import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const MenuDesignInspector = ({ 
    firstNode, 
    primaryTarget, 
    interactionState, 
    boardResources, 
    updateNode, 
    getTargets,
    externalData,
    recipes,
    ingredients,
    passiveSignals
}: any) => {
    // Phase 6.5: Menu Design Inspector (Modern)
    return (
        <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-100 rounded p-2 mb-2">
                <div className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                    <Icon svg={ICONS.menu} className="w-3 h-3" />
                    Menu Proposal
                </div>
                <div className="text-xs text-rose-700 mt-1">
                    AI Generated Layout. Content is managed via the adapter.
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Proposal Title</label>
                <input
                    className="w-full border rounded text-sm px-2 py-1 font-bold"
                    value={firstNode.content.title || ''}
                    onChange={(e) => updateNode({ title: e.target.value })}
                />
            </div>

            {/* Style Hints (Read Only) */}
            <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Theme / Style</label>
                <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                    {firstNode.content.styleHints || 'No style hints'}
                </div>
            </div>

            {/* Background Color & Gradient */}
            <ColorPicker
                label="Background"
                allowGradient={true}
                showTransparent={true}
                color={firstNode.content.gradient || firstNode.content.backgroundColor || '#ffffff'}
                onChange={(c) => {
                    if (typeof c === 'string') {
                        updateNode({ backgroundColor: c, gradient: undefined });
                    } else {
                        updateNode({ gradient: c });
                    }
                }}
            />

            {/* Visual Effects */}
            <VisualEffectsController
                borderRadius={firstNode.content.borderRadius || 16}
                borderWidth={firstNode.content.borderWidth || 1}
                opacity={firstNode.content.opacity ?? 1}
                shadow={firstNode.content.filters?.shadow}
                onChange={(eff) => {
                    const patch: any = {};
                    if (eff.borderRadius !== undefined) patch.borderRadius = eff.borderRadius;
                    if (eff.borderWidth !== undefined) patch.borderWidth = eff.borderWidth;
                    if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                    if (eff.shadow !== undefined) {
                        patch.filters = {
                            ...firstNode.content.filters,
                            shadow: eff.shadow || undefined
                        };
                    }
                    updateNode(patch);
                }}
            />

            {/* Action: Save to Make Menu */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <button
                    className="w-full py-2 bg-slate-900 dark:bg-slate-700 text-white rounded shadow text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    onClick={() => {
                        // This logic duplicates the MiniToolbar action but is good for accessibility
                        import('../../../../../services/makeMenuService').then(({ makeMenuService }) => {
                            const db = pizarronStore.getState().db;
                            const appId = pizarronStore.getState().appId;
                            if (db && appId) {
                                makeMenuService.saveProposal(db, appId, {
                                    themeName: firstNode.content.title,
                                    description: firstNode.content.styleHints,
                                    items: firstNode.content.items?.map((i: any) => i.id) || []
                                }).then(() => alert("Saved to Make Menu History!"));
                            }
                        });
                    }}
                >
                    <Icon svg={ICONS.check} className="w-4 h-4" />
                    Save to Make Menu
                </button>
            </div>
        </div>
    );
};

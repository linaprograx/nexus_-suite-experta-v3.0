import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const GroupInspector = ({ 
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
                
                return (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-center">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
                                targets.forEach((n: any) => {
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
                                targets.forEach((n: any) => {
                                    if (n.type === 'shape' || n.type === 'board') {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, color: color } });
                                    }
                                });
                            }}
                        />

                        {/* Visual Effects - Opacity & Border */}
                        <VisualEffectsController
                            targets={getTargets()}
                            onApply={(id, patch) => {
                                const n = pizarronStore.getState().nodes[id];
                                if (n) pizarronStore.updateNode(id, { content: { ...n.content, ...patch } });
                            }}
                        />
                    </div>
                );

};

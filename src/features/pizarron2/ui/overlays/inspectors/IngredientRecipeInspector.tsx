import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const IngredientRecipeInspector = ({ 
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
    // Grimorio Nodes - Full modern inspector with all styling options
    return (
                    <div className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1"
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
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

                        {/* Border Color */}
                        <ColorPicker
                            label="Border Color"
                            color={firstNode.content.borderColor || '#e2e8f0'}
                            onChange={(c) => updateNode({ borderColor: typeof c === 'string' ? c : c.start })}
                        />

                        {/* Visual Effects */}
                        <VisualEffectsController
                            borderRadius={firstNode.content.borderRadius || 12}
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

                        {/* Node Info (Read-only) */}
                        <div className="pt-3 border-t border-slate-200">
                            <div className="text-xs font-medium text-slate-400 mb-2">NODE INFO</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-500">Type:</span>
                                    <div className="bg-slate-50 px-2 py-1 rounded mt-1">
                                        {firstNode.type === 'ingredient' ? '🥬 Ingredient' : '🍽️ Recipe'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-500">ID:</span>
                                    <div className="bg-slate-50 px-2 py-1 rounded mt-1 truncate" title={firstNode.ingredientId || firstNode.recipeId}>
                                        {(firstNode.ingredientId || firstNode.recipeId || 'N/A').slice(-8)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

};

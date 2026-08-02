import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const ShapeInspector = ({ 
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
                            borderRadius={firstNode.content.borderRadius || 0}
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={null}
                            onChange={(eff) => {
                                const patch: any = {};
                                if (eff.borderWidth !== undefined) patch.borderWidth = eff.borderWidth;
                                if (eff.borderRadius !== undefined) patch.borderRadius = eff.borderRadius;
                                if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                                updateNode(patch);
                            }}
                        />

                    </div >
                );

};

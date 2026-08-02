import React from 'react';
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
                            targets={[firstNode]}
                            onApply={(_id, patch) => updateNode(patch)}
                        />

                    </div >
                );

};

import React from 'react';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const IconInspector = ({ 
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
                        {/* Icon Color */}
                        <ColorPicker
                            label="Color del Icono"
                            color={firstNode.content.color || '#000000'}
                            onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                        />

                        {/* Visual Effects */}
                        <VisualEffectsController
                            targets={[firstNode]}
                            onApply={(_id, patch) => updateNode(patch)}
                        />
                    </div>
                );

};

import React from 'react';
import { pizarronStore } from '../../../state/store';
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
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={firstNode.content.filters?.shadow ?? null}
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

};

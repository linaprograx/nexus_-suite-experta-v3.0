import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const TextInspector = ({ 
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

};

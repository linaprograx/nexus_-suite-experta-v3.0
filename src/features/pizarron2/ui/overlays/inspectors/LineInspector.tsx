import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const LineInspector = ({ 
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

};

import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const ImageInspector = ({ 
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
                        {/* Preview & Source */}
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
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
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Source URL</label>
                            <input
                                className="w-full border border-slate-300 dark:border-slate-600 rounded text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate"
                                value={firstNode.content.src || ''}
                                onChange={(e) => updateNode({ src: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Caption */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Caption</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1"
                                value={firstNode.content.body || ''}
                                onChange={(e) => updateNode({ body: e.target.value })}
                                placeholder="Image caption..."
                            />
                        </div>

                        {/* Visual Effects */}
                        <VisualEffectsController
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={firstNode.content.filters?.shadow ?? null}
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

};

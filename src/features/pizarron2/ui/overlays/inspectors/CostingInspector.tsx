import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const CostingInspector = ({ 
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
                
                // Escandallator Costing Node - READ-ONLY Inspector
                return (
                    <div className="space-y-4">
                        {/* READ-ONLY Warning */}
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 flex items-start gap-2">
                            <div className="text-amber-600 text-xl">🔒</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-amber-800 mb-1">READ-ONLY</div>
                                <div className="text-xs text-amber-700">
                                    Cost data calculated by Escandallator engine. Cannot be edited here.
                                </div>
                            </div>
                        </div>

                        {/* Recipe Selection */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Recipe</label>
                            <select
                                className="w-full border rounded text-sm px-2 py-1.5 bg-white"
                                value={firstNode.content.recipeIdForCosting || ''}
                                onChange={(e) => {
                                    const recipeId = e.target.value;
                                    updateNode({ recipeIdForCosting: recipeId });

                                    // CRITICAL: Update externalDataMap immediately
                                    if (recipeId && recipes && ingredients) {
                                        const costingData = resolveCostingData(
                                            recipeId,
                                            firstNode.content.salePriceOverride || 0,
                                            recipes,
                                            ingredients
                                        );
                                        if (costingData) {
                                            externalDataMap.set(firstNode.id, costingData);
                                            logger.debug('[Inspector] ✅ Updated externalDataMap:', firstNode.id, costingData.recipeName);

                                            // FORCE immediate canvas redraw
                                            forceCanvasRender();
                                            logger.debug('[Inspector] 🎨 Forced canvas render');

                                            // FORCE canvas re-render by nudging viewport
                                            const currentVP = pizarronStore.getState().viewport;
                                            pizarronStore.setState(state => ({
                                                viewport: { ...currentVP, x: currentVP.x + 0.001 }
                                            }));
                                        }
                                    } else {
                                        externalDataMap.delete(firstNode.id);
                                    }
                                }}
                            >
                                <option value="">Select a recipe...</option>
                                {recipes?.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Override (Optional) */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">
                                Sale Price Override (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Use recipe's default price"
                                className="w-full border rounded text-sm px-2 py-1.5"
                                value={firstNode.content.salePriceOverride || ''}
                                onChange={(e) => updateNode({ salePriceOverride: e.target.value ? Number(e.target.value) : undefined })}
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave empty to use recipe's sale price</p>
                        </div>

                        {/* Title Override */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Card Title</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1"
                                placeholder="Auto: Recipe name"
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>

                        {/* Calculated Data Display (READ-ONLY) */}
                        {externalData && 'profitability' in externalData && (
                            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                                    Calculated Costing
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-xs text-slate-500">Total Cost</div>
                                        <div className="font-semibold text-slate-800">${externalData.totalCost?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Price</div>
                                        <div className="font-semibold text-slate-800">${externalData.recommendedPrice?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Margin</div>
                                        <div className="font-semibold text-slate-800">${externalData.margin?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Profitability</div>
                                        <div className={`font-bold ${externalData.profitability < 20 ? 'text-red-600' : externalData.profitability < 40 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {externalData.profitability?.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                {externalData.alerts && externalData.alerts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="text-xs text-slate-600 mb-1">Alerts:</div>
                                        {externalData.alerts.map((alert: string, i: number) => (
                                            <div key={i} className="text-xs text-amber-600">• {alert}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

};

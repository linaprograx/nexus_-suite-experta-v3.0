import React from 'react';
import { pizarronStore } from '../../../state/store';
import { ColorPicker, FontSelector } from '../../shared/UnifiedSelectors';
import { TextStyleController } from '../../components/TextStyleController';
import { VisualEffectsController } from '../../components/VisualEffectsController';
import { Icon } from '../../../../../components/ui/Icon';
import { ICONS } from '../../../../../components/ui/icons';
import { FontLoader } from '../../../engine/FontLoader';
export const CostingScenarioInspector = ({ 
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
                
                // Scenario Comparison Node - READ-ONLY Inspector
                return (
                    <div className="space-y-4">
                        {/* READ-ONLY Warning */}
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3 flex items-start gap-2">
                            <div className="text-emerald-600 text-xl">🔒</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-emerald-800 mb-1">READ-ONLY</div>
                                <div className="text-xs text-emerald-700">
                                    Scenario data aggregated from Escandallator. Cannot be edited here.
                                </div>
                            </div>
                        </div>

                        {/* Scenario Name */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Scenario Name</label>
                            <input
                                className="w-full border border-slate-300 dark:border-slate-600 rounded text-sm px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                placeholder="Scenario title"
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>

                        {/* Recipe Selection (Multi-select simulation) */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">
                                Recipes in Scenario ({(firstNode.content.recipeIdsInScenario || []).length})
                            </label>
                            <select
                                multiple
                                className="w-full border border-slate-300 dark:border-slate-600 rounded text-sm px-2 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-32"
                                value={firstNode.content.recipeIdsInScenario || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    updateNode({ recipeIdsInScenario: selected });
                                }}
                            >
                                {recipes?.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple recipes</p>
                        </div>

                        {/* Aggregated Data Display (READ-ONLY) */}
                        {externalData && 'recipeCount' in externalData && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 space-y-2">
                                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2">
                                    Scenario Metrics
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Recipe Count:</span>
                                        <span className="font-semibold">{externalData.recipeCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Total Cost:</span>
                                        <span className="font-semibold">${externalData.totalCost?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Total Revenue:</span>
                                        <span className="font-semibold text-green-600">${externalData.totalRevenue?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                                        <span className="text-slate-600">Avg Margin:</span>
                                        <span className={`font-bold ${externalData.averageMargin < 20 ? 'text-red-600' : externalData.averageMargin < 40 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {externalData.averageMargin?.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                {externalData.warnings && externalData.warnings.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200">
                                        <div className="text-xs text-emerald-700 mb-1">Warnings:</div>
                                        {externalData.warnings.map((warn: string, i: number) => (
                                            <div key={i} className="text-xs text-amber-600">⚠️ {warn}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

};

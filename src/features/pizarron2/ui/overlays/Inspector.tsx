import { logger } from "../../../../utils/logger";

import React, { useMemo } from 'react'; // Added useMemo
import { pizarronStore } from '../../state/store';
import { FontLoader } from '../../engine/FontLoader';
import { BoardNode } from '../../engine/types';
import { ColorPicker, FontSelector } from '../shared/UnifiedSelectors';
import { TextStyleController } from '../components/TextStyleController';
import { VisualEffectsController } from '../components/VisualEffectsController';
// Phase 5.2: Passive Signals
import { evaluateMarketSignals } from '../../../../core/signals/signal.engine';
import { useApp } from '../../../../context/AppContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';
import { externalDataMap, forceCanvasRender } from '../CanvasStage';
import { resolveCostingData, resolveScenarioData } from '../../services/costingResolver';
import { useIngredients } from '../../../../hooks/useIngredients';
import { useRecipes } from '../../../../hooks/useRecipes';

import { useInspectorLogic } from './useInspectorLogic';
import { BoardInspector } from './inspectors/BoardInspector';
import { ShapeInspector } from './inspectors/ShapeInspector';
import { GroupInspector } from './inspectors/GroupInspector';
import { TextInspector } from './inspectors/TextInspector';
import { LineInspector } from './inspectors/LineInspector';
import { IconInspector } from './inspectors/IconInspector';
import { ImageInspector } from './inspectors/ImageInspector';
import { CostingInspector } from './inspectors/CostingInspector';
import { CostingScenarioInspector } from './inspectors/CostingScenarioInspector';
import { IngredientRecipeInspector } from './inspectors/IngredientRecipeInspector';
import { MenuDesignInspector } from './inspectors/MenuDesignInspector';
interface InspectorProps {
    /**
     * Renderiza solo el contenido, sin el contenedor flotante ni el fondo.
     * Lo usa el panel contextual del móvil para reutilizar tal cual todos los
     * paneles por tipo de nodo —forma, imagen, menu-design, flecha…— en vez de
     * reimplementarlos y arriesgarse a que las dos versiones diverjan.
     */
    embedded?: boolean;
}

export const Inspector: React.FC<InspectorProps> = ({ embedded = false }) => {
    const {
        firstNode,
        effectiveType,
        primaryTarget,
        interactionState,
        boardResources,
        passiveSignals,
        externalData,
        updateNodePatch: updateNode,
        getTargets,
        recipes,
        ingredients
    } = useInspectorLogic();

    // NOW we can return if no selection

    // Render Content based on Type
    const renderContent = () => {
        if (!firstNode) return <div className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">Multiple Selection</div>;

        switch (effectiveType) {
            case 'board':
                return <BoardInspector
                    firstNode={firstNode}
                    primaryTarget={primaryTarget}
                    interactionState={interactionState}
                    boardResources={boardResources}
                    updateNode={updateNode}
                    getTargets={getTargets}
                    externalData={externalData}
                    recipes={recipes}
                    ingredients={ingredients}
                    passiveSignals={passiveSignals}
                />;

            case 'shape':
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
                                    updateNode({ gradient: typeof c === 'string' ? undefined : { type: 'linear', ...c } });
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
                            borderRadius={0} // shapes usually sharp? or maybe allow rounding? existing code only had border width
                            opacity={1}
                            shadow={null} // Shapes didn't have shadow in Inspector?
                            onChange={(eff) => {
                                if (eff.borderWidth !== undefined) updateNode({ borderWidth: eff.borderWidth });
                            }}
                        />

                        {/* DEBUG: Structure for Shapes (Preserved) */}
                        <div>
                            <label className="text-xs font-medium text-rose-600 block mb-1">Internal Structure</label>
                            <button
                                onClick={() => {
                                    const struct = {
                                        template: 'grid' as const,
                                        rows: [
                                            { id: 'r1', height: 1 },
                                            { id: 'r2', height: 1 }
                                        ],
                                        cols: [
                                            { id: 'c1', width: 1 },
                                            { id: 'c2', width: 1 }
                                        ],
                                        id: 'grid-2x2',
                                        zones: [],
                                        cells: {
                                            'r1_c1': { content: 'A' },
                                            'r1_c2': { content: 'B' },
                                            'r2_c1': { content: 'C' },
                                            'r2_c2': { content: 'D' }
                                        }
                                    };
                                    pizarronStore.updateStructure(firstNode.id, struct);
                                }}
                                className="w-full py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs hover:bg-rose-100"
                            >
                                Inject 2x2 Grid
                            </button>
                        </div>
                    </div >
                );

            case 'group':
                return (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-center">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {getTargets().length} items selected
                            </span>
                        </div>

                        {/* Bulk Color - Affects all children that have 'color' or 'borderColor' */}
                        <ColorPicker
                            label="Color Modification"
                            color={'#000000'} // Mixed state? Just show black or transparent
                            onChange={(c) => {
                                const color = typeof c === 'string' ? c : c.start;
                                const targets = getTargets();
                                targets.forEach(n => {
                                    const patch: any = {};
                                    // Intelligent patching based on type
                                    if (n.type === 'text' || n.type === 'shape' || n.type === 'line') {
                                        patch.color = color;
                                    }
                                    if (n.type === 'shape' || n.type === 'board') {
                                        patch.borderColor = color;
                                    }
                                    if (Object.keys(patch).length > 0) {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, ...patch } });
                                    }
                                });
                            }}
                        />

                        {/* Bulk Fill - For Shapes/Boards */}
                        <ColorPicker
                            label="Fill Color"
                            color={'transparent'}
                            onChange={(c) => {
                                const color = typeof c === 'string' ? c : c.start;
                                const targets = getTargets();
                                targets.forEach(n => {
                                    if (n.type === 'shape' || n.type === 'board') {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, color: color } });
                                    }
                                });
                            }}
                        />

                        {/* Visual Effects - Opacity & Border */}
                        <VisualEffectsController
                            opacity={1}
                            borderWidth={0}
                            borderRadius={0}
                            onChange={(eff) => {
                                const targets = getTargets();
                                targets.forEach(n => {
                                    const patch: any = {};
                                    if (eff.opacity !== undefined) patch.opacity = eff.opacity;
                                    if (eff.borderWidth !== undefined) patch.borderWidth = eff.borderWidth;
                                    if (Object.keys(patch).length > 0) {
                                        pizarronStore.updateNode(n.id, { content: { ...n.content, ...patch } });
                                    }
                                });
                            }}
                        />
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-4">
                        {/* Content Edit */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Content</label>
                            <textarea
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 font-sans"
                                rows={3}
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>
                        {/* Typography */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700">
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
                            color={firstNode.content.color || '#000000'}
                            onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                        />
                    </div>
                );

            case 'line':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Stroke Style</label>
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
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Arrows</label>
                            <div className="flex gap-2">
                                <button onClick={() => updateNode({ startArrow: !firstNode.content.startArrow })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.startArrow ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>Start</button>
                                <button onClick={() => updateNode({ endArrow: !firstNode.content.endArrow })} className={`flex-1 text-xs py-1 border rounded ${firstNode.content.endArrow ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : ''}`}>End</button>
                            </div>
                        </div>
                        <div>
                            <ColorPicker
                                label="Line Color"
                                color={firstNode.content.color || '#64748b'}
                                onChange={(c) => updateNode({ color: typeof c === 'string' ? c : c.start })}
                            />
                        </div>
                    </div>
                );

            case 'icon':
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
                            shadow={firstNode.content.filters?.shadow}
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

            case 'image':
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
                                value={firstNode.content.caption || ''}
                                onChange={(e) => updateNode({ caption: e.target.value })}
                                placeholder="Image caption..."
                            />
                        </div>

                        {/* Visual Effects */}
                        <VisualEffectsController
                            opacity={firstNode.content.opacity ?? 1}
                            shadow={firstNode.content.filters?.shadow}
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

            case 'costing':
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
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Recipe</label>
                            <select
                                className="w-full border border-slate-300 dark:border-slate-600 rounded text-sm px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
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
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
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
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave empty to use recipe's sale price</p>
                        </div>

                        {/* Title Override */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Card Title</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1"
                                placeholder="Auto: Recipe name"
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>

                        {/* Calculated Data Display (READ-ONLY) */}
                        {externalData && 'profitability' in externalData && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-3 space-y-2">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                                    Calculated Costing
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Total Cost</div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">${externalData.totalCost?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Price</div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">${externalData.recommendedPrice?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Margin</div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">${externalData.margin?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Profitability</div>
                                        <div className={`font-bold ${externalData.profitability < 20 ? 'text-red-600' : externalData.profitability < 40 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {externalData.profitability?.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                {externalData.alerts && externalData.alerts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Alerts:</div>
                                        {externalData.alerts.map((alert: string, i: number) => (
                                            <div key={i} className="text-xs text-amber-600">• {alert}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'costing-scenario':
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
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Scenario Name</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1.5"
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
                                className="w-full border rounded text-sm px-2 py-2 bg-white h-32"
                                value={firstNode.content.recipeIdsInScenario || []}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    updateNode({ recipeIdsInScenario: selected });
                                }}
                            >
                                {recipes?.map(r => (
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

            case 'ingredient':
            case 'recipe':
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
                                    updateNode({ gradient: typeof c === 'string' ? undefined : { type: 'linear', ...c } });
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
                                    <div className="bg-slate-50 px-2 py-1 rounded mt-1 truncate" title={firstNode.content.ingredientId || firstNode.content.recipeId}>
                                        {(firstNode.content.ingredientId || firstNode.content.recipeId || 'N/A').slice(-8)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'menu-design':
                // Phase 6.5: Menu Design Inspector (Modern)
                return (
                    <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-100 rounded p-2 mb-2">
                            <div className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                                <Icon svg={ICONS.menu} className="w-3 h-3" />
                                Menu Proposal
                            </div>
                            <div className="text-xs text-rose-700 mt-1">
                                AI Generated Layout. Content is managed via the adapter.
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Proposal Title</label>
                            <input
                                className="w-full border rounded text-sm px-2 py-1 font-bold"
                                value={firstNode.content.title || ''}
                                onChange={(e) => updateNode({ title: e.target.value })}
                            />
                        </div>

                        {/* Style Hints (Read Only) */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Theme / Style</label>
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                {firstNode.content.styleHints || 'No style hints'}
                            </div>
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
                                    updateNode({ gradient: typeof c === 'string' ? undefined : { type: 'linear', ...c } });
                                }
                            }}
                        />

                        {/* Visual Effects */}
                        <VisualEffectsController
                            borderRadius={firstNode.content.borderRadius || 16}
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

                        {/* Action: Save to Make Menu */}
                        <div className="pt-3 border-t border-slate-200 mt-2">
                            <button
                                className="w-full py-2 bg-slate-900 text-white rounded shadow text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                onClick={() => {
                                    // This logic duplicates the MiniToolbar action but is good for accessibility
                                    import('../../../../services/makeMenuService').then(({ makeMenuService }) => {
                                        const db = pizarronStore.getState().db;
                                        const appId = pizarronStore.getState().appId;
                                        if (db && appId) {
                                            makeMenuService.saveProposal(db, appId, {
                                                themeName: firstNode.content.title,
                                                description: firstNode.content.styleHints,
                                                items: firstNode.content.items?.map((i: any) => i.id) || []
                                            }).then(() => alert("Saved to Make Menu History!"));
                                        }
                                    });
                                }}
                            >
                                <Icon svg={ICONS.check} className="w-4 h-4" />
                                Save to Make Menu
                            </button>
                        </div>
                    </div>
                );
                // Generic/Shared fallback
                if (!firstNode) return null;
                // Capturado en local. El `!` se apoya en la guarda de la línea
                // anterior; el análisis de flujo de TS no llega hasta este bloque.
                const node = firstNode!;
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Title</label>
                            <input className="w-full border border-slate-300 dark:border-slate-600 rounded text-sm px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200" value={node.content.title || ''} onChange={(e) => updateNode({ title: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs text-slate-500 dark:text-slate-400">X</label><div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-sm text-slate-700 dark:text-slate-300">{Math.round(node.x)}</div></div>
                            <div><label className="text-xs text-slate-500 dark:text-slate-400">Y</label><div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-sm text-slate-700 dark:text-slate-300">{Math.round(node.y)}</div></div>
                        </div>
                    </div>
                );
        }
    };

    // Embebido: sin contenedor flotante. Quien lo aloja (el panel contextual del
    // móvil) ya aporta posición, scroll y fondo.
    if (embedded) {
        return (
            <div className="flex flex-col gap-4" onPointerDown={(e) => e.stopPropagation()}>
                {renderContent()}
            </div>
        );
    }

    return (
        <div
            className="fixed w-72 pointer-events-auto z-[100] transition-all duration-500 ease-out-expo
                       top-[100px] left-1/2 ml-[220px]"
            onPointerDown={(e) => e.stopPropagation()} // Prevent canvas drag
        >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-2">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{firstNode?.type.toUpperCase() || 'SELECTION'} STYLE</span>
                    <div className="flex gap-1">
                        <button onClick={() => { pizarronStore.copySelection(); pizarronStore.paste(); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400" title="Duplicate">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => { const sel = pizarronStore.getState().selection; pizarronStore.deleteNodes(Array.from(sel)); }} className="p-1 hover:bg-red-50 rounded text-red-500" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Phase 5.2: Passive Intelligence Banner (Read-Only) */}
                {passiveSignals.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-3 space-y-2 flex-shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Icon svg={ICONS.brain} className="w-3 h-3" /> INTELIGENCIA PASIVA
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {passiveSignals.map(sig => (
                                <div key={sig.id} className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1.5 cursor-help ${sig.severity === 'critical' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900' :
                                    sig.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900' :
                                        'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900'
                                    }`} title={sig.explanation}>
                                    <Icon svg={sig.severity === 'info' ? ICONS.info : ICONS.alertCircle} className="w-3 h-3" />
                                    {sig.message}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto max-h-[calc(80vh-100px)] pr-1 custom-scrollbar">
                    {renderContent()}
                </div>

            </div>
        </div>
    );
};

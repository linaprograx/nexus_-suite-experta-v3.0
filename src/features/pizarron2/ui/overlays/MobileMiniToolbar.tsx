import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pizarronStore } from '../../state/store';
import {
    LuPalette, LuTrash2, LuCopy, LuLock, LuLockOpen,
    LuAlignLeft, LuAlignCenter, LuAlignRight, LuArrowUpToLine,
    LuArrowDownToLine, LuBold, LuItalic, LuWand, LuRectangleHorizontal,
    LuCircleDot, LuChevronUp, LuChevronDown,
    LuSparkles, LuEraser, LuZap, LuLayers,
    LuType, LuDroplet, LuGroup, LuUngroup, LuArrowUp, LuArrowDown
} from 'react-icons/lu';
import { ColorPickerModal } from './ColorPickerModal';
import { MobileLayersManager } from './MobileLayersManager';
import { MobileTypographyPanel } from './MobileTypographyPanel';

/**
 * MobileMiniToolbar - NEXUS Edition
 * Premium editing center with advanced effects
 */
export const MobileMiniToolbar: React.FC = () => {
    const { selection, nodes, viewport } = pizarronStore.useState();
    const selectedNodes = Array.from(selection).map(id => nodes[id]).filter(Boolean);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showLayersManager, setShowLayersManager] = useState(false);
    const [showTypographyPanel, setShowTypographyPanel] = useState(false);
    const [activePanel, setActivePanel] = useState<'main' | 'text' | 'style' | 'position' | 'effects' | 'borders'>('main');

    if (selectedNodes.length === 0) return null;

    const firstNode = selectedNodes[0];
    const isLocked = firstNode?.locked;
    const isGroup = firstNode?.type === 'group';
    const isMultiple = selectedNodes.length > 1;
    const isText = firstNode?.type === 'text';

    // Calculate position
    const screenX = firstNode.x * viewport.zoom + viewport.x;
    const screenY = firstNode.y * viewport.zoom + viewport.y;
    const toolbarTop = Math.max(80, screenY - 70);
    const toolbarLeft = screenX + (firstNode.w * viewport.zoom) / 2;

    const updateContent = (patch: any) => {
        selectedNodes.forEach(n => {
            pizarronStore.updateNode(n.id, {
                content: { ...n.content, ...patch }
            });
        });
    };

    const handleDuplicate = () => {
        pizarronStore.copySelection();
        pizarronStore.paste();
    };

    const handleDelete = () => {
        if (window.confirm(`Delete ${selectedNodes.length} element(s)?`)) {
            pizarronStore.deleteNodes(Array.from(selection));
        }
    };

    const handleToggleLock = () => {
        selectedNodes.forEach(node => {
            pizarronStore.updateNode(node.id, { locked: !node.locked });
        });
    };

    const handleColorSelect = (color: string) => {
        updateContent({ color });
    };

    // Layer positioning
    const handleBringToFront = () => {
        selectedNodes.forEach(n => pizarronStore.bringToFront(n.id));
    };

    const handleBringForward = () => {
        selectedNodes.forEach(n => {
            const currentZ = n.zIndex || 0;
            pizarronStore.updateNode(n.id, { zIndex: currentZ + 1 });
        });
    };

    const handleSendBackward = () => {
        selectedNodes.forEach(n => {
            const currentZ = n.zIndex || 0;
            if (currentZ > 0) {
                pizarronStore.updateNode(n.id, { zIndex: currentZ - 1 });
            }
        });
    };

    const handleSendToBack = () => {
        selectedNodes.forEach(n => pizarronStore.sendToBack(n.id));
    };

    // Text formatting
    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        if (isText) updateContent({ align: alignment });
    };

    const handleToggleBold = () => {
        if (isText) {
            const currentWeight = firstNode.content.fontWeight || 'normal';
            updateContent({ fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' });
        }
    };

    const handleToggleItalic = () => {
        if (isText) {
            const currentStyle = firstNode.content.fontStyle || 'normal';
            updateContent({ fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' });
        }
    };

    const handleFontSizeChange = (delta: number) => {
        if (isText) {
            const currentSize = firstNode.content.fontSize || 16;
            const newSize = Math.max(8, Math.min(72, currentSize + delta));
            updateContent({ fontSize: newSize });
        }
    };

    // Style controls
    const handleOpacityChange = (delta: number) => {
        const currentOpacity = firstNode.content.opacity ?? 1;
        const newOpacity = Math.max(0, Math.min(1, currentOpacity + delta));
        updateContent({ opacity: newOpacity });
    };

    // Advanced Effects
    const handleBlurChange = (delta: number) => {
        const currentBlur = firstNode.content.filters?.blur || 0;
        const newBlur = Math.max(0, Math.min(20, currentBlur + delta));
        updateContent({
            filters: { ...firstNode.content.filters, blur: newBlur }
        });
    };

    const handleShadowIntensityChange = (delta: number) => {
        const currentShadow = firstNode.content.filters?.shadow;
        const currentBlur = currentShadow?.blur || 10;
        const newBlur = Math.max(0, Math.min(50, currentBlur + delta));
        updateContent({
            filters: {
                ...firstNode.content.filters,
                shadow: {
                    ...currentShadow,
                    color: currentShadow?.color || 'rgba(0,0,0,0.3)',
                    blur: newBlur,
                    offsetX: currentShadow?.offsetX || 0,
                    offsetY: currentShadow?.offsetY || 4
                }
            }
        });
    };

    const handleShadowAngleChange = (delta: number) => {
        const currentShadow = firstNode.content.filters?.shadow;
        if (!currentShadow) return;

        // Calculate current angle from offsets
        const currentAngle = Math.atan2(currentShadow.offsetY || 4, currentShadow.offsetX || 0) * (180 / Math.PI);
        const newAngle = (currentAngle + delta + 360) % 360;
        const distance = Math.sqrt((currentShadow.offsetX || 0) ** 2 + (currentShadow.offsetY || 4) ** 2) || 10;

        const newOffsetX = Math.cos(newAngle * Math.PI / 180) * distance;
        const newOffsetY = Math.sin(newAngle * Math.PI / 180) * distance;

        updateContent({
            filters: {
                ...firstNode.content.filters,
                shadow: {
                    ...currentShadow,
                    offsetX: newOffsetX,
                    offsetY: newOffsetY
                }
            }
        });
    };

    const handleToggleShadow = () => {
        const hasShadow = !!firstNode.content.filters?.shadow;
        if (hasShadow) {
            updateContent({
                filters: { ...firstNode.content.filters, shadow: undefined }
            });
        } else {
            updateContent({
                filters: {
                    ...firstNode.content.filters,
                    shadow: {
                        color: 'rgba(0,0,0,0.3)',
                        blur: 10,
                        offsetX: 0,
                        offsetY: 4
                    }
                }
            });
        }
    };

    const handleToggleGlassEffect = () => {
        const hasGlass = firstNode.content.glassEffect;
        if (hasGlass) {
            updateContent({ glassEffect: undefined });
        } else {
            updateContent({
                glassEffect: true,
                opacity: 0.8,
                filters: {
                    ...firstNode.content.filters,
                    blur: 8
                }
            });
        }
    };

    const handleRemoveBackground = () => {
        // Set background to transparent
        updateContent({
            backgroundColor: 'transparent',
            color: firstNode.content.color || '#000000'
        });
    };

    // Border controls
    const handleBorderRadiusChange = (delta: number) => {
        const currentRadius = firstNode.content.borderRadius || 0;
        const newRadius = Math.max(0, Math.min(50, currentRadius + delta));
        updateContent({ borderRadius: newRadius });
    };

    const handleBorderWidthChange = (delta: number) => {
        const currentWidth = firstNode.content.borderWidth || 0;
        const newWidth = Math.max(0, Math.min(20, currentWidth + delta));
        updateContent({ borderWidth: newWidth });
    };

    // Main panel buttons
    const mainButtons = [
        {
            icon: LuPalette,
            label: 'Color',
            action: () => setShowColorPicker(true),
            showColor: true,
            color: firstNode?.content?.color || '#6366f1'
        },
        {
            icon: LuCopy,
            label: 'Duplicate',
            action: handleDuplicate
        },
        {
            icon: isLocked ? LuLock : LuLockOpen,
            label: isLocked ? 'Unlock' : 'Lock',
            action: handleToggleLock,
            active: isLocked
        },
        isMultiple ? {
            icon: LuGroup,
            label: 'Group',
            action: () => pizarronStore.groupSelection()
        } : isGroup ? {
            icon: LuUngroup,
            label: 'Ungroup',
            action: () => pizarronStore.ungroupSelection()
        } : null,
        {
            icon: LuType,
            label: 'Text',
            action: () => setActivePanel('text'),
            disabled: !isText
        },
        {
            icon: LuDroplet,
            label: 'Style',
            action: () => setActivePanel('style')
        },
        {
            icon: LuWand,
            label: 'Effects ✨',
            action: () => setActivePanel('effects'),
            highlight: true
        },
        {
            icon: LuRectangleHorizontal,
            label: 'Borders',
            action: () => setActivePanel('borders')
        },
        {
            icon: LuLayers,
            label: 'Layers',
            action: () => setActivePanel('position')
        },
        {
            icon: LuTrash2,
            label: 'Delete',
            action: handleDelete,
            danger: true
        }
    ].filter(Boolean);

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed z-[60] -translate-x-1/2
                               bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl 
                               rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700
                               px-2 py-2"
                    style={{
                        top: `${toolbarTop}px`,
                        left: `${toolbarLeft}px`,
                        maxWidth: '95vw'
                    }}
                >
                    {/* Main Panel */}
                    {activePanel === 'main' && (
                        <div className="flex gap-1 items-center flex-wrap max-w-[360px]">
                            <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg mr-1">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    {selectedNodes.length}
                                </span>
                            </div>

                            {mainButtons.map((btn: any, i) => (
                                <button
                                    key={i}
                                    onClick={btn.action}
                                    disabled={btn.disabled}
                                    className={`p-2.5 rounded-lg active:scale-95 transition-all ${btn.disabled
                                        ? 'opacity-50 cursor-not-allowed text-slate-400'
                                        : btn.danger
                                            ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100'
                                            : btn.highlight
                                                ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
                                                : btn.active
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                    title={btn.label}
                                >
                                    {btn.showColor ? (
                                        <div className="w-5 h-5 rounded border-2 border-white dark:border-slate-700"
                                            style={{ backgroundColor: btn.color }} />
                                    ) : (
                                        <btn.icon size={20} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Text Panel */}
                    {activePanel === 'text' && isText && (
                        <div className="flex gap-2 items-center flex-wrap max-w-[360px]">
                            <button onClick={() => setActivePanel('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                ← Back
                            </button>

                            {/* Typography Button */}
                            <button
                                onClick={() => setShowTypographyPanel(true)}
                                className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors flex items-center gap-1"
                            >
                                <LuType size={16} />
                                Typography
                            </button>

                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                            <button
                                onClick={handleToggleBold}
                                className={`p-2 rounded-lg ${firstNode.content.fontWeight === 'bold' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <LuBold size={18} />
                            </button>
                            <button
                                onClick={handleToggleItalic}
                                className={`p-2 rounded-lg ${firstNode.content.fontStyle === 'italic' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <LuItalic size={18} />
                            </button>

                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                            <button onClick={() => handleAlign('left')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <LuAlignLeft size={18} />
                            </button>
                            <button onClick={() => handleAlign('center')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <LuAlignCenter size={18} />
                            </button>
                            <button onClick={() => handleAlign('right')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                <LuAlignRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Style Panel */}
                    {activePanel === 'style' && (
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setActivePanel('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                ← Back
                            </button>

                            <span className="text-xs text-slate-600 dark:text-slate-400">Opacity:</span>
                            <button onClick={() => handleOpacityChange(-0.1)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">−</button>
                            <span className="text-sm font-mono min-w-[40px] text-center">
                                {Math.round((firstNode.content.opacity ?? 1) * 100)}%
                            </span>
                            <button onClick={() => handleOpacityChange(0.1)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">+</button>
                        </div>
                    )}

                    {/* NEXUS Effects Panel - Premium Edition */}
                    {activePanel === 'effects' && (
                        <div className="flex flex-col gap-3 p-2 max-w-[360px]">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setActivePanel('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                    ← Back
                                </button>
                                <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                    <LuSparkles size={14} />
                                    <span className="font-semibold">NEXUS Effects</span>
                                </div>
                            </div>

                            {/* Glass Effect Toggle */}
                            <button
                                onClick={handleToggleGlassEffect}
                                className={`w-full p-3 rounded-xl transition-all ${firstNode.content.glassEffect
                                    ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border-2 border-cyan-300 dark:border-cyan-700'
                                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <LuZap size={20} className={firstNode.content.glassEffect ? 'text-cyan-600' : 'text-slate-600'} />
                                    <span className={`text-sm font-semibold ${firstNode.content.glassEffect ? 'text-cyan-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                        Glass Effect {firstNode.content.glassEffect ? '✓' : ''}
                                    </span>
                                </div>
                            </button>

                            {/* Blur Control */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">BLUR</span>
                                    <span className="text-sm font-mono">{firstNode.content.filters?.blur || 0}px</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBlurChange(-1)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">−</button>
                                    <button onClick={() => handleBlurChange(1)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">+</button>
                                </div>
                            </div>

                            {/* Advanced Shadow Controls */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">SHADOW</span>
                                    <button
                                        onClick={handleToggleShadow}
                                        className={`px-3 py-1 rounded-lg text-xs ${firstNode.content.filters?.shadow
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                                            : 'bg-white dark:bg-slate-700'
                                            }`}
                                    >
                                        {firstNode.content.filters?.shadow ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                {firstNode.content.filters?.shadow && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-slate-600 dark:text-slate-400">Intensity</span>
                                                <span className="text-sm font-mono">{firstNode.content.filters.shadow.blur || 10}px</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleShadowIntensityChange(-2)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">−</button>
                                                <button onClick={() => handleShadowIntensityChange(2)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">+</button>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-slate-600 dark:text-slate-400">Angle</span>
                                                <span className="text-sm font-mono">
                                                    {Math.round(Math.atan2(firstNode.content.filters.shadow.offsetY || 4, firstNode.content.filters.shadow.offsetX || 0) * (180 / Math.PI))}°
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleShadowAngleChange(-15)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">↺ −15°</button>
                                                <button onClick={() => handleShadowAngleChange(15)} className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm flex-1">↻ +15°</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Background Removal */}
                            <button
                                onClick={handleRemoveBackground}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <LuEraser size={18} className="text-red-500" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Remove Background
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Borders Panel */}
                    {activePanel === 'borders' && (
                        <div className="flex gap-2 items-center flex-wrap">
                            <button onClick={() => setActivePanel('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                ← Back
                            </button>

                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Round:</span>
                                <button onClick={() => handleBorderRadiusChange(-2)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">−</button>
                                <span className="text-sm font-mono min-w-[30px] text-center">
                                    {firstNode.content.borderRadius || 0}
                                </span>
                                <button onClick={() => handleBorderRadiusChange(2)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">+</button>
                            </div>

                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Width:</span>
                                <button onClick={() => handleBorderWidthChange(-1)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">−</button>
                                <span className="text-sm font-mono min-w-[30px] text-center">
                                    {firstNode.content.borderWidth || 0}
                                </span>
                                <button onClick={() => handleBorderWidthChange(1)} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">+</button>
                            </div>
                        </div>
                    )}

                    {/* Position/Layers Panel */}
                    {activePanel === 'position' && (
                        <div className="flex gap-2 items-center flex-wrap">
                            <button onClick={() => setActivePanel('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">
                                ← Back
                            </button>

                            <button onClick={handleBringToFront} className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">
                                <LuArrowUp size={16} />
                                <LuArrowUp size={16} className="-ml-3" />
                                <span className="text-xs">Front</span>
                            </button>
                            <button onClick={handleBringForward} className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">
                                <LuChevronUp size={16} />
                                <span className="text-xs">Forward</span>
                            </button>
                            <button onClick={handleSendBackward} className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">
                                <LuChevronDown size={16} />
                                <span className="text-xs">Back</span>
                            </button>
                            <button onClick={handleSendToBack} className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm">
                                <LuArrowDown size={16} />
                                <LuArrowDown size={16} className="-ml-3" />
                                <span className="text-xs">Bottom</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Layers Manager Modal */}
            {showLayersManager && (
                <MobileLayersManager onClose={() => setShowLayersManager(false)} />
            )}

            {/* Typography Panel */}
            {showTypographyPanel && (
                <MobileTypographyPanel onClose={() => setShowTypographyPanel(false)} />
            )}

            <ColorPickerModal
                isOpen={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                onSelect={handleColorSelect}
                currentColor={firstNode?.content?.color || '#6366f1'}
            />
        </>
    );
};

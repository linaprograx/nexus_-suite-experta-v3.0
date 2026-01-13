import React, { useState } from 'react';
import { pizarronStore } from '../../state/store';
import { LuType, LuX, LuPalette, LuCheck } from 'react-icons/lu';

/**
 * MobileTypographyPanel - Compact Mobile Version
 * Bottom sheet style with horizontal scrolling sections
 */

const FONT_FAMILIES = [
    // Sans-Serif
    { name: 'Inter', value: 'Inter, sans-serif', preview: 'Inter' },
    { name: 'Roboto', value: 'Roboto, sans-serif', preview: 'Roboto' },
    { name: 'Poppins', value: 'Poppins, sans-serif', preview: 'Poppins' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'Montserrat' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif', preview: 'Open Sans' },
    { name: 'Lato', value: 'Lato, sans-serif', preview: 'Lato' },
    { name: 'Raleway', value: 'Raleway, sans-serif', preview: 'Raleway' },
    { name: 'Nunito', value: 'Nunito, sans-serif', preview: 'Nunito' },
    { name: 'Work Sans', value: '"Work Sans", sans-serif', preview: 'Work Sans' },
    { name: 'DM Sans', value: '"DM Sans", sans-serif', preview: 'DM Sans' },

    // Serif
    { name: 'Playfair', value: '"Playfair Display", serif', preview: 'Playfair Display' },
    { name: 'Georgia', value: 'Georgia, serif', preview: 'Georgia' },
    { name: 'Merriweather', value: 'Merriweather, serif', preview: 'Merriweather' },
    { name: 'Lora', value: 'Lora, serif', preview: 'Lora' },
    { name: 'Crimson', value: '"Crimson Text", serif', preview: 'Crimson Text' },

    // Monospace
    { name: 'Fira Code', value: '"Fira Code", monospace', preview: 'Fira Code' },
    { name: 'JetBrains', value: '"JetBrains Mono", monospace', preview: 'JetBrains Mono' },
    { name: 'Courier', value: '"Courier New", monospace', preview: 'Courier New' },

    // Display
    { name: 'Bebas Neue', value: '"Bebas Neue", cursive', preview: 'Bebas Neue' },
    { name: 'Pacifico', value: 'Pacifico, cursive', preview: 'Pacifico' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

const FONT_WEIGHTS = [
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Semibold', value: '600' },
    { name: 'Bold', value: '700' },
    { name: 'Black', value: '900' },
];

const TEXT_COLORS = [
    '#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
];

export const MobileTypographyPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selection, nodes } = pizarronStore.useState();
    const [customColor, setCustomColor] = useState('');

    if (selection.size === 0) return null;

    const selectedId = Array.from(selection)[0];
    const node = nodes[selectedId];
    if (!node) return null;

    const currentFont = node.content?.fontFamily || 'Inter, sans-serif';
    const currentSize = node.content?.fontSize || 16;
    const currentWeight = node.content?.fontWeight || '400';
    const currentColor = node.content?.titleColor || '#ffffff';

    const setFont = (fontFamily: string) => {
        const updated = { ...node.content, fontFamily };
        pizarronStore.updateNode(selectedId, { content: updated });
    };

    const setSize = (fontSize: number) => {
        const updated = { ...node.content, fontSize };
        pizarronStore.updateNode(selectedId, { content: updated });
    };

    const setWeight = (fontWeight: string) => {
        const updated = { ...node.content, fontWeight };
        pizarronStore.updateNode(selectedId, { content: updated });
    };

    const setColor = (color: string) => {
        const updated = { ...node.content, titleColor: color };
        pizarronStore.updateNode(selectedId, { content: updated });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Bottom Sheet */}
            <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <LuType className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tipografía</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                    >
                        <LuX size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Font Family - Horizontal Scroll */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Familia de Fuente
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                            {FONT_FAMILIES.map(font => (
                                <button
                                    key={font.value}
                                    onClick={() => setFont(font.value)}
                                    className={`flex-shrink-0 snap-start px-6 py-4 rounded-xl border-2 transition-all min-w-[140px] ${currentFont === font.value
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                >
                                    <div
                                        className="text-2xl font-medium text-slate-800 dark:text-white mb-1"
                                        style={{ fontFamily: font.value }}
                                    >
                                        Aa
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{font.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size - Horizontal Scroll */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Tamaño
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {FONT_SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSize(size)}
                                    className={`flex-shrink-0 px-6 py-3 rounded-lg border-2 font-medium transition-all min-w-[70px] ${currentSize === size
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Weight - Grid */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            Peso
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {FONT_WEIGHTS.map(weight => (
                                <button
                                    key={weight.value}
                                    onClick={() => setWeight(weight.value)}
                                    className={`p-4 rounded-xl border-2 transition-all ${currentWeight === weight.value
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                >
                                    <div
                                        className="text-lg text-slate-800 dark:text-white text-center"
                                        style={{ fontWeight: weight.value }}
                                    >
                                        {weight.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <LuPalette size={16} />
                            Color de Texto
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {TEXT_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setColor(color)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 transition-all ${currentColor === color
                                            ? 'border-indigo-500 scale-110'
                                            : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                >
                                    {currentColor === color && (
                                        <LuCheck size={24} className="m-auto text-white drop-shadow" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <input
                                type="color"
                                value={customColor || currentColor}
                                onChange={(e) => {
                                    setCustomColor(e.target.value);
                                    setColor(e.target.value);
                                }}
                                className="w-16 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={customColor || currentColor}
                                onChange={(e) => {
                                    setCustomColor(e.target.value);
                                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                        setColor(e.target.value);
                                    }
                                }}
                                placeholder="#ffffff"
                                className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Vista Previa</div>
                        <div
                            style={{
                                fontFamily: currentFont,
                                fontSize: `${currentSize}px`,
                                fontWeight: currentWeight,
                                color: currentColor
                            }}
                        >
                            The quick brown fox jumps over the lazy dog
                        </div>
                    </div>
                </div>

                {/* Footer - Apply Button */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
                    >
                        Aplicar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

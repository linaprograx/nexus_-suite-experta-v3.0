import React, { useState, useEffect, useRef } from 'react';
import { AVAILABLE_FONTS } from '../panels/AssetLibrary';
import { useOnClickOutside } from '../../../../hooks/useOnClickOutside';
import { LuChevronDown, LuPalette, LuCheck } from 'react-icons/lu';

// --- COLOR PICKER ---

const PRESET_COLORS = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000', // Grays
    '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', // Reds
    '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', // Oranges
    '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', // Ambers
    '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#4d7c0f', // Limes
    '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', // Greens
    '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', // Teals
    '#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#023e8a', '#03045e', // Blues
    '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', // Purples
    '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', // Pinks
];

interface ColorPickerProps {
    color: string | { start: string; end: string };
    onChange: (color: string | { start: string; end: string }) => void;
    label?: string;
    showTransparent?: boolean;
    allowGradient?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label = "Color", showTransparent = true, allowGradient = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref, () => setIsOpen(false));

    const isGradient = typeof color === 'object' && color !== null && 'start' in color;
    const [mode, setMode] = useState<'solid' | 'gradient'>(isGradient ? 'gradient' : 'solid');

    const handleModeSwitch = (newMode: 'solid' | 'gradient') => {
        setMode(newMode);
        if (newMode === 'solid') {
            onChange(typeof color === 'string' ? color : '#ffffff');
        } else {
            onChange({ start: typeof color === 'string' && color !== 'transparent' ? color : '#ffffff', end: '#000000' });
        }
    };

    const currentColorStr = isGradient ? `Gradient` : color;
    const previewStyle = isGradient
        // @ts-ignore
        ? { backgroundImage: `linear-gradient(to right, ${color.start}, ${color.end})` }
        : {
            backgroundColor: color === 'transparent' ? 'white' : color as string,
            backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
            backgroundSize: color === 'transparent' ? '8px 8px' : undefined
        };

    return (
        <div className="relative" ref={ref}>
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                {allowGradient && isOpen && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                        <button
                            onClick={() => handleModeSwitch('solid')}
                            className={`px-1.5 py-0.5 text-[10px] rounded ${mode === 'solid' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                        >Solid</button>
                        <button
                            onClick={() => handleModeSwitch('gradient')}
                            className={`px-1.5 py-0.5 text-[10px] rounded ${mode === 'gradient' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                        >Grad</button>
                    </div>
                )}
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900"
            >
                <div
                    className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                    style={previewStyle}
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-mono uppercase truncate flex-1 text-left">
                    {currentColorStr}
                </span>
                <LuPalette className="text-slate-400" size={14} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">

                    {mode === 'solid' ? (
                        <>
                            <div className="grid grid-cols-8 gap-1 mb-3">
                                {showTransparent && (
                                    <button
                                        onClick={() => { onChange('transparent'); setIsOpen(false); }}
                                        className={`w-6 h-6 rounded-md border text-[0px] relative overflow-hidden ${color === 'transparent' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
                                        title="Transparent"
                                    >
                                        <div className="absolute inset-0 bg-white" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '6px 6px' }} />
                                        {color === 'transparent' && <LuCheck className="absolute inset-0 m-auto text-slate-800" size={12} />}
                                    </button>
                                )}
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { onChange(c); setIsOpen(false); }}
                                        className={`w-6 h-6 rounded-md border border-black/5 dark:border-white/5 ${color === c ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : 'hover:scale-110 transition-transform'}`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    >
                                        {color === c && <LuCheck size={12} className={`m-auto ${['#ffffff', '#f8fafc', '#f1f5f9', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'].includes(c) ? 'text-slate-900' : 'text-white'}`} />}
                                    </button>
                                ))}
                            </div>
                            {/* Hex Input */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400">Hex</span>
                                <input
                                    type="text"
                                    value={color as string}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase"
                                />
                                <input
                                    type="color"
                                    value={color === 'transparent' ? '#ffffff' : color as string}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="w-6 h-6 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-500 w-8">Start</label>
                                <input
                                    type="color"
                                    className="flex-1 h-8 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                                    // @ts-ignore
                                    value={color.start || '#ffffff'}
                                    // @ts-ignore
                                    onChange={(e) => onChange({ ...color, start: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-500 w-8">End</label>
                                <input
                                    type="color"
                                    className="flex-1 h-8 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                                    // @ts-ignore
                                    value={color.end || '#000000'}
                                    // @ts-ignore
                                    onChange={(e) => onChange({ ...color, end: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- FONT SELECTOR ---

interface FontSelectorProps {
    fontFamily: string;
    onChange: (font: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ fontFamily, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref, () => setIsOpen(false));

    const fonts = AVAILABLE_FONTS.filter(f =>
        f.family.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={ref}>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Typography</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
                style={{ fontFamily: fontFamily || 'Inter' }}
            >
                <span className="truncate">{fontFamily || 'Inter'}</span>
                <LuChevronDown className="text-slate-400 ml-2 shrink-0" size={14} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-80 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search font..."
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {fonts.map(font => (
                            <button
                                key={font.family}
                                onClick={() => { onChange(font.family); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${fontFamily === font.family ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                style={{ fontFamily: font.family }}
                            >
                                <span>{font.family}</span>
                                {fontFamily === font.family && <LuCheck size={14} />}
                            </button>
                        ))}
                        {fonts.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">No fonts found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

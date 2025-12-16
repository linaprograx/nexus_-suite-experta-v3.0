import React, { useState } from 'react';

interface ColorPickerProps {
    label?: string;
    value: string | { start: string; end: string }; // String (Hex/RGBA) or Gradient Object
    onChange: (val: string | { start: string; end: string }) => void;
    allowGradient?: boolean;
    allowTransparent?: boolean;
}

const PRESET_COLORS = [
    '#ffffff', '#f8fafc', '#1e293b', '#64748b',
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#d946ef', '#f43f5e'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
    label,
    value,
    onChange,
    allowGradient = false,
    allowTransparent = true
}) => {
    // Determine current mode based on value type
    const isGradient = typeof value === 'object' && value !== null && 'start' in value;
    const [mode, setMode] = useState<'solid' | 'gradient'>(isGradient ? 'gradient' : 'solid');

    // Helper to safely get color string for inputs
    const getColorStr = (val: any) => {
        if (typeof val === 'string') return val === 'transparent' ? '#ffffff' : val;
        return '#ffffff';
    };

    const handleSolidChange = (c: string) => {
        onChange(c);
    };

    const handleGradientChange = (key: 'start' | 'end', c: string) => {
        const current = isGradient ? value : { start: typeof value === 'string' && value !== 'transparent' ? value : '#ffffff', end: '#000000' };
        onChange({ ...current, [key]: c });
    };

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-600">{label}</label>
                    {allowGradient && (
                        <div className="flex bg-slate-100 rounded p-0.5">
                            <button
                                className={`px-2 py-0.5 text-[10px] rounded ${mode === 'solid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                onClick={() => { setMode('solid'); onChange('#ffffff'); }}
                            >
                                Solid
                            </button>
                            <button
                                className={`px-2 py-0.5 text-[10px] rounded ${mode === 'gradient' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                onClick={() => {
                                    setMode('gradient');
                                    onChange({ start: typeof value === 'string' && value !== 'transparent' ? value : '#ffffff', end: '#94a3b8' });
                                }}
                            >
                                Gradient
                            </button>
                        </div>
                    )}
                </div>
            )}

            {mode === 'solid' ? (
                <div className="space-y-2">
                    {/* Presets */}
                    <div className="flex gap-1.5 flex-wrap items-center">
                        {allowTransparent && (
                            <button
                                title="Transparent"
                                onClick={() => handleSolidChange('transparent')}
                                className={`w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center bg-slate-50 relative overflow-hidden group ${value === 'transparent' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                            >
                                <div className="absolute inset-0 border-t border-red-500 transform rotate-45 opacity-50"></div>
                            </button>
                        )}
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => handleSolidChange(c)}
                                className={`w-6 h-6 rounded-full border border-slate-200 transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                        {/* Native Picker */}
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-300 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                            <input
                                type="color"
                                className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 cursor-pointer"
                                value={getColorStr(value)}
                                onChange={(e) => handleSolidChange(e.target.value)}
                            />
                            {/* Icon overlay to indicate custom picker */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[8px] text-slate-500 font-bold">+</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-8">Start</label>
                        <input
                            type="color"
                            className="w-full h-6 rounded cursor-pointer border-0"
                            value={(value as any)?.start || '#ffffff'}
                            onChange={(e) => handleGradientChange('start', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 w-8">End</label>
                        <input
                            type="color"
                            className="w-full h-6 rounded cursor-pointer border-0"
                            value={(value as any)?.end || '#000000'}
                            onChange={(e) => handleGradientChange('end', e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

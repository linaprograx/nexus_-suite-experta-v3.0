import React from 'react';

interface VisualEffectsControllerProps {
    borderRadius?: number;
    borderWidth?: number;
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
    opacity?: number;
    onChange: (effects: { borderRadius?: number; borderWidth?: number; shadow?: any; opacity?: number }) => void;
}

export const VisualEffectsController: React.FC<VisualEffectsControllerProps> = ({
    borderRadius = 0,
    borderWidth = 0,
    shadow,
    opacity = 1,
    onChange
}) => {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">Visual Effects</h4>

            {/* Border Radius & Width */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Rounding</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="50"
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={borderRadius}
                            onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
                        />
                        <span className="text-[10px] text-slate-400 w-4">{borderRadius}</span>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Border Thickness</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="20"
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={borderWidth}
                            onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) })}
                        />
                        <span className="text-[10px] text-slate-400 w-4">{borderWidth}</span>
                    </div>
                </div>
            </div>

            {/* Opacity */}
            <div>
                <label className="text-[10px] text-slate-500 block mb-1">Opacity</label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        value={opacity}
                        onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
                    />
                    <span className="text-[10px] text-slate-400 w-6">{(opacity * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* Shadow Toggle */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">Drop Shadow</label>
                <button
                    onClick={() => {
                        if (shadow) {
                            onChange({ shadow: null });
                        } else {
                            onChange({ shadow: { color: 'rgba(0,0,0,0.1)', blur: 10, offsetX: 0, offsetY: 4 } });
                        }
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors ${shadow ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${shadow ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
    );
};

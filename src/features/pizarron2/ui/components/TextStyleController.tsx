import React from 'react';

interface TextStyleControllerProps {
    fontSize: number;
    fontWeight?: string | number;
    lineHeight?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    onChange: (style: { fontSize?: number; fontWeight?: string | number; lineHeight?: number; textAlign?: string }) => void;
    showAlign?: boolean;
}

export const TextStyleController: React.FC<TextStyleControllerProps> = ({
    fontSize,
    fontWeight,
    lineHeight,
    textAlign,
    onChange,
    showAlign = true
}) => {
    return (
        <div className="space-y-3">
            {/* Size & Line Height Row */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Size</label>
                    <input
                        type="number"
                        min="8"
                        max="200"
                        className="w-full text-xs border border-slate-300 rounded p-1"
                        value={fontSize}
                        onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 14 })}
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Line Height</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0.8"
                        max="3"
                        className="w-full text-xs border border-slate-300 rounded p-1"
                        value={lineHeight || 1.2}
                        onChange={(e) => onChange({ lineHeight: parseFloat(e.target.value) || 1.2 })}
                    />
                </div>
            </div>

            {/* Alignment Row */}
            {showAlign && (
                <div className="flex bg-slate-100 p-1 rounded justify-center gap-1">
                    {['left', 'center', 'right', 'justify'].map((align) => (
                        <button
                            key={align}
                            className={`p-1.5 rounded transition-all ${textAlign === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => onChange({ textAlign: align })}
                            title={align.charAt(0).toUpperCase() + align.slice(1)}
                        >
                            {align === 'left' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>}
                            {align === 'center' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>}
                            {align === 'right' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>}
                            {align === 'justify' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

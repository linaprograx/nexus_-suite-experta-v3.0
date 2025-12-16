import React from 'react';
import { FontLoader } from "../../engine/FontLoader";

interface FontSelectorProps {
    currentFont: string;
    onChange: (font: string) => void;
}

const FONT_OPTIONS = [
    { label: 'Sans Serif', options: ['Inter', 'Roboto', 'Oswald', 'Montserrat', 'Open Sans'] },
    { label: 'Serif', options: ['Playfair Display', 'Merriweather', 'Lora'] },
    { label: 'Display / Handwriting', options: ['Lobster', 'Pacifico', 'Dancing Script'] },
    { label: 'Monospace', options: ['Fira Code', 'Roboto Mono'] }
];

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onChange }) => {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Font Family</label>
            <select
                className="w-full text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                value={currentFont}
                onChange={(e) => {
                    const font = e.target.value;
                    FontLoader.loadFont(font);
                    onChange(font);
                }}
            >
                {FONT_OPTIONS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                        {group.options.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
            {/* Preview */}
            <div className="text-xs text-slate-500 truncate mt-1 p-1 bg-slate-50 border border-slate-100 rounded" style={{ fontFamily: currentFont }}>
                The quick brown fox jumps over the lazy dog
            </div>
        </div>
    );
};

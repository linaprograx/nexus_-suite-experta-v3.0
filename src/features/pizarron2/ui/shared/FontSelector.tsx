import React, { useState, useEffect } from 'react';
import { AVAILABLE_FONTS } from '../panels/AssetLibrary';
import { FontLoader } from '../../engine/FontLoader';

interface FontSelectorProps {
    currentFont: string;
    onChange: (fontFamily: string) => void;
    className?: string;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Group fonts by category
    const groupedFonts = AVAILABLE_FONTS.reduce((acc, font) => {
        if (!acc[font.category]) acc[font.category] = [];
        acc[font.category].push(font);
        return acc;
    }, {} as Record<string, typeof AVAILABLE_FONTS>);

    useEffect(() => {
        if (isOpen) {
            AVAILABLE_FONTS.forEach(f => FontLoader.loadFont(f));
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className || ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-32 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
                title="Font Family"
            >
                <span className="truncate mr-2" style={{ fontFamily: currentFont }}>{currentFont}</span>
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-lg z-50 py-1 custom-scrollbar">
                        {Object.entries(groupedFonts).map(([category, fonts]) => (
                            <div key={category}>
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                                    {category}
                                </div>
                                {fonts.map(font => (
                                    <button
                                        key={font.family}
                                        onClick={() => {
                                            onChange(font.family);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between ${currentFont === font.family ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                                        style={{ fontFamily: font.family }}
                                    >
                                        <span>{font.family}</span>
                                        {currentFont === font.family && <span>✓</span>}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

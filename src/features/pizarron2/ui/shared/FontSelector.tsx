import React, { useState, useEffect, useRef } from 'react';
import { AVAILABLE_FONTS } from '../panels/AssetLibrary';
import { FontLoader } from '../../engine/FontLoader';

interface FontSelectorProps {
    currentFont: string;
    onChange: (fontFamily: string) => void;
    className?: string;
}

const RECENT_FONTS_KEY = 'nexus_recent_fonts';

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onChange, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [recents, setRecents] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Load recents on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECENT_FONTS_KEY);
            if (saved) {
                setRecents(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load recent fonts', e);
        }
    }, []);

    // Load fonts when opening to ensure previews work
    useEffect(() => {
        if (isOpen) {
            AVAILABLE_FONTS.forEach(f => FontLoader.loadFont(f));
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (family: string) => {
        onChange(family);
        setIsOpen(false);

        // Update recents
        const newRecents = [family, ...recents.filter(f => f !== family)].slice(0, 6);
        setRecents(newRecents);
        localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(newRecents));
    };

    const filteredFonts = AVAILABLE_FONTS.filter(f =>
        f.family.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`relative ${className || ''}`} ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-40 px-3 py-1.5 text-xs bg-white/50 backdrop-blur border border-slate-200 rounded-lg hover:bg-white/80 transition-all text-slate-700 shadow-sm"
                title="Font Family"
            >
                <span className="truncate mr-2" style={{ fontFamily: currentFont }}>{currentFont}</span>
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 max-h-96 flex flex-col bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Component */}
                    <div className="p-3 border-b border-slate-100 bg-white/50">
                        <input
                            type="text"
                            placeholder="Search fonts..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-100 border-none rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {/* Recents Section */}
                        {!search && recents.length > 0 && (
                            <div className="mb-2">
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent</div>
                                {recents.map(family => (
                                    <button
                                        key={`rec-${family}`}
                                        onClick={() => handleSelect(family)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 rounded-lg flex items-center justify-between group ${currentFont === family ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                                        title={family}
                                    >
                                        <span style={{ fontFamily: family }}>{family}</span>
                                        {currentFont === family && <span className="text-orange-500">✓</span>}
                                    </button>
                                ))}
                                <div className="my-2 border-t border-slate-100 mx-3"></div>
                            </div>
                        )}

                        {/* All Fonts List */}
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Fonts</div>
                        {filteredFonts.map(font => (
                            <button
                                key={font.family}
                                onClick={() => handleSelect(font.family)}
                                className={`w-full text-left px-3 py-2 text-lg hover:bg-orange-50 rounded-lg flex items-center justify-between group ${currentFont === font.family ? 'bg-orange-50 text-orange-600' : 'text-slate-700'}`}
                                title={font.family}
                            >
                                <span style={{ fontFamily: font.family }}>{font.family}</span>
                            </button>
                        ))}

                        {filteredFonts.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">
                                No fonts found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

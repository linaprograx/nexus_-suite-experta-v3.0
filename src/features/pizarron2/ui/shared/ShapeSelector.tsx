import React, { useState, useRef, useEffect } from 'react';
import { SHAPE_LIBRARIES, COMPOSITE_SHAPES, AssetDefinition } from '../panels/AssetLibrary';

interface ShapeSelectorProps {
    currentShapeType: string;
    onSelect: (shapeDef: AssetDefinition) => void;
    className?: string;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({ currentShapeType, onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    const [search, setSearch] = useState('');

    const handleSelect = (item: AssetDefinition) => {
        onSelect(item);
        setIsOpen(false);
        setSearch(''); // Reset search
    };

    // Combine libraries for the selector (Basic + Flow + maybe Containers)
    const displayLibraries = [...SHAPE_LIBRARIES];

    return (
        <div className={`relative ${className || ''}`} ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isOpen ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-200' : 'hover:bg-slate-100 text-slate-600'}`}
                title="Select Shape"
            >
                {/* Dynamic Icon based on current shape? Or just a generic Shapes icon */}
                <span className="text-xl">🔷</span>
            </button>

            {isOpen && (
                <div className="absolute left-full top-0 ml-3 w-72 max-h-96 flex flex-col bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in slide-in-from-left-2 duration-200">
                    {/* Search */}
                    <div className="p-3 border-b border-slate-100 bg-white/50">
                        <input
                            type="text"
                            placeholder="Search shapes..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-100 border-none rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {displayLibraries.map(lib => {
                            const filteredItems = lib.items.filter(i =>
                                i.label.toLowerCase().includes(search.toLowerCase()) ||
                                (i.tags && i.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
                            );

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={lib.id} className="mb-4 last:mb-0">
                                    <h4 className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{lib.label}</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {filteredItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item)}
                                                className={`aspect-square flex flex-col items-center justify-center rounded-lg border border-transparent hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm transition-all group ${currentShapeType === item.data.shapeType ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}
                                                title={item.label}
                                            >
                                                <span className="text-xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{item.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Quick access to frameworks? Optional - Hide if searching */}
                        {!search && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <h4 className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Presets</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {COMPOSITE_SHAPES[0].items.slice(0, 4).map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="aspect-square flex flex-col items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 transition-all"
                                            title={item.label}
                                        >
                                            <span className="text-sm font-medium text-indigo-600">{item.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {displayLibraries.every(l => l.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())).length === 0) && search && (
                            <div className="p-4 text-center text-xs text-slate-400">
                                No shapes found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

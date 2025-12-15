import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { ICON_LIBRARIES, SHAPE_LIBRARIES, GRAPHIC_LIBRARIES, PALETTE_LIBRARIES, TEXT_PRESETS, AVAILABLE_FONTS, COMPOSITE_SHAPES } from './AssetLibrary';
import { BoardNode } from '../../engine/types';
import { FontLoader } from '../../engine/FontLoader';

type LibraryTab = 'templates' | 'text' | 'shapes' | 'icons' | 'graphics' | 'uploads' | 'frameworks';

const TABS: { id: LibraryTab, label: string, icon: string }[] = [
    { id: 'templates', label: 'Plantillas', icon: '⧉' },
    { id: 'frameworks', label: 'Estructuras', icon: '▦' },
    { id: 'text', label: 'Texto', icon: 'T' },
    { id: 'shapes', label: 'Formas', icon: '○' },
    { id: 'icons', label: 'Iconos', icon: '★' },
    { id: 'graphics', label: 'Gráficos', icon: '🎨' },
    { id: 'uploads', label: 'Subidos', icon: '☁️' },
];

export const LibrarySidePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<LibraryTab>('text');
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Preload fonts so previews look good
        AVAILABLE_FONTS.forEach(f => FontLoader.loadFont(f));
    }, []);

    const handleAdd = (item: any) => {
        const state = pizarronStore.getState();
        const vp = state.viewport;
        // Center relative to viewport
        const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
        const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

        if (item.type === 'template') {
            const templateNodes = item.data?.nodes || [];
            // Calculate center of template
            const minX = Math.min(...templateNodes.map((n: any) => n.x));
            const minY = Math.min(...templateNodes.map((n: any) => n.y));

            templateNodes.forEach((n: any) => {
                pizarronStore.addNode({
                    ...n,
                    id: crypto.randomUUID(),
                    x: cx + (n.x - minX) - 100,
                    y: cy + (n.y - minY) - 50,
                    zIndex: Object.keys(state.nodes).length + 10,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            });
            return;
        }

        // Base Node props
        const newNode: BoardNode = {
            id: crypto.randomUUID(),
            type: item.type === 'sticker' ? 'image' : item.type === 'icon' ? 'icon' : 'shape',
            x: cx - (item.data?.w || 100) / 2,
            y: cy - (item.data?.h || 100) / 2,
            w: item.data?.w || 100,
            h: item.data?.h || 100,
            zIndex: Object.keys(state.nodes).length + 10,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            content: {
                title: '',
                body: '',
                color: item.data?.content?.color || '#ffffff',
                ...item.data // Spread data (shapeType, path, etc)
            }
        };

        if (item.type === 'icon') {
            newNode.w = 60;
            newNode.h = 60;
            // Recenter with new size
            newNode.x = cx - 30;
            newNode.y = cy - 30;
        }

        pizarronStore.addNode(newNode);
    };

    const getActiveLibrary = () => {
        switch (activeTab) {
            case 'icons': return ICON_LIBRARIES;
            case 'shapes': return SHAPE_LIBRARIES;
            case 'graphics': return GRAPHIC_LIBRARIES;
            case 'text': return TEXT_PRESETS;
            case 'frameworks': return COMPOSITE_SHAPES;
            default: return [];
        }
    };

    const libraries = getActiveLibrary();

    return (
        <div className="absolute top-14 left-0 bottom-0 w-80 bg-white border-r border-slate-200 shadow-xl flex z-40 pointer-events-auto">
            {/* Tabs Rail */}
            <div className="w-20 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 gap-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md scale-105'
                            : 'text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        <span className="text-2xl">{tab.icon}</span>
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">

                {/* Search */}
                <div className="p-4 border-b border-slate-200 bg-white">
                    <input
                        type="text"
                        placeholder={`Buscar en ${activeTab}...`}
                        className="w-full px-4 py-2 rounded-lg bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {libraries.map(category => {
                        // Filter items
                        const filteredItems = category.items.filter(i =>
                            i.label.toLowerCase().includes(search.toLowerCase()) ||
                            (i.tags && i.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={category.id}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                                    {category.title || category.label}
                                </h3>
                                <div className={`${activeTab === 'text' ? 'flex flex-col gap-3' : 'grid grid-cols-3 gap-3'}`}>
                                    {filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleAdd(item)}
                                            className={`${activeTab === 'text'
                                                ? 'w-full h-auto p-3 flex flex-col items-start'
                                                : 'aspect-square flex-col items-center justify-center'
                                                } bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex group relative overflow-hidden`}
                                            title={item.label}
                                        >
                                            <div className={`${activeTab === 'text' ? '' : 'text-2xl group-hover:scale-110 mb-1'} transition-transform`}>
                                                {/* Render Preview */}
                                                {activeTab === 'text' ? (
                                                    <div style={{
                                                        fontFamily: item.data?.nodes?.[0]?.content?.fontFamily || 'Inter',
                                                        fontSize: '14px',
                                                        color: '#334155'
                                                    }}>
                                                        {item.label}
                                                        <span className="text-xs text-slate-400 ml-2 font-normal opacity-50">
                                                            {item.data?.nodes?.[0]?.content?.fontFamily}
                                                        </span>
                                                        {/* Preview of actual style */}
                                                        <div style={{
                                                            fontSize: '20px',
                                                            fontWeight: item.data?.nodes?.[0]?.content?.fontWeight,
                                                            fontStyle: item.data?.nodes?.[0]?.content?.fontStyle,
                                                            marginTop: '4px'
                                                        }}>
                                                            Agiliza tu mente
                                                        </div>
                                                    </div>
                                                ) : item.data?.path ? (
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-slate-700">
                                                        <path d={item.data.path} />
                                                    </svg>
                                                ) : item.data?.shapeType ? (
                                                    <div className="w-8 h-8 border-2 border-slate-700 rounded-sm"
                                                        style={{
                                                            borderRadius: item.data.shapeType === 'circle' ? '50%' : item.data.shapeType === 'pill' ? '99px' : '2px',
                                                            transform: item.data.shapeType === 'diamond' ? 'rotate(45deg) scale(0.8)' : 'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <span>{item.icon}</span>
                                                )}
                                            </div>
                                            {activeTab !== 'text' && (
                                                <span className="text-[9px] text-slate-500 truncate w-full px-1 text-center">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {libraries.length === 0 && activeTab !== 'templates' && activeTab !== 'uploads' && (
                        <div className="text-center text-slate-400 mt-10">
                            <p>No content available</p>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="text-center text-slate-400 mt-10">
                            <p>Plantillas disponibles en el menú principal (+)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

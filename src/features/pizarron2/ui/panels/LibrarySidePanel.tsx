import React, { useState, useEffect, useRef } from 'react';
import { pizarronStore } from '../../state/store';
import { ICON_LIBRARIES, SHAPE_LIBRARIES, GRAPHIC_LIBRARIES, PALETTE_LIBRARIES, TEXT_PRESETS, AVAILABLE_FONTS, COMPOSITE_SHAPES, TEMPLATE_LIBRARIES } from './AssetLibrary';
import { BoardNode } from '../../engine/types';
import { FontLoader } from '../../engine/FontLoader';
import { AssetDefinition } from './AssetLibrary';
import { useOnClickOutside } from '../../../../hooks/useOnClickOutside';

import { LuLayoutTemplate, LuShapes, LuType, LuLayoutGrid, LuSticker, LuCloudUpload, LuSettings, LuSearch, LuX, LuHistory } from 'react-icons/lu';

type LibraryTab = 'boards' | 'elements' | 'text' | 'assets' | 'uploads' | 'settings';

const TABS: { id: LibraryTab, label: string, icon: React.ReactNode }[] = [
    { id: 'boards', label: 'Estructuras', icon: <LuLayoutTemplate size={24} /> },
    { id: 'elements', label: 'Elementos', icon: <LuShapes size={24} /> },
    { id: 'text', label: 'Texto', icon: <LuType size={24} /> },
    { id: 'assets', label: 'Gráficos', icon: <LuSticker size={24} /> },
    { id: 'uploads', label: 'Recursos', icon: <LuCloudUpload size={24} /> },
];

export const LibrarySidePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<LibraryTab>('boards'); // Default to boards
    const [search, setSearch] = useState('');
    const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);

    // Dismissal Logic
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref, () => {
        // Only close if it's open (it is, since this component is rendered conditionally)
        pizarronStore.setUIFlag('showLibrary', false);
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') pizarronStore.setUIFlag('showLibrary', false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        // Preload fonts so previews look good
        AVAILABLE_FONTS.forEach(f => FontLoader.loadFont(f));

        // Load recents
        try {
            const saved = localStorage.getItem('pizarron_recent_templates');
            if (saved) setRecentTemplateIds(JSON.parse(saved));
        } catch (e) { console.error('Error loading recents', e); }
    }, []);

    const addToRecents = (id: string) => {
        const newRecents = [id, ...recentTemplateIds.filter(r => r !== id)].slice(0, 8);
        setRecentTemplateIds(newRecents);
        localStorage.setItem('pizarron_recent_templates', JSON.stringify(newRecents));
    };

    const handleAdd = (item: any) => {
        const state = pizarronStore.getState();
        const vp = state.viewport;
        // Center relative to viewport
        const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
        const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;

        if (item.type === 'template') {
            addToRecents(item.id);

            const templateNodes = item.data?.nodes || [];
            if (templateNodes.length === 0) return;

            // Calculate center of template
            const minX = Math.min(...templateNodes.map((n: any) => n.x));
            const minY = Math.min(...templateNodes.map((n: any) => n.y));
            const maxX = Math.max(...templateNodes.map((n: any) => n.x + (n.w || 0)));
            const maxY = Math.max(...templateNodes.map((n: any) => n.y + (n.h || 0)));

            const w = maxX - minX;
            const h = maxY - minY;

            templateNodes.forEach((n: any) => {
                pizarronStore.addNode({
                    ...n,
                    id: crypto.randomUUID(),
                    x: cx + (n.x - minX) - w / 2, // Center precisely
                    y: cy + (n.y - minY) - h / 2,
                    zIndex: Object.keys(state.nodes).length + 10,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            });
            // Auto close on add?
            // pizarronStore.setUIFlag('showLibrary', false); 
            // Keep open for multiple adds usually, but for templates maybe close?
            // Let's keep open for better UX unless requested otherwise.
            return;
        }

        // Destructure to avoid nesting 'content' inside 'content'
        const { content: extraContent, ...restData } = item.data || {};

        // Base Node props
        const newNode: BoardNode = {
            id: crypto.randomUUID(),
            type: (item.data?.type as any) || (item.type === 'sticker' ? 'image' : item.type),
            x: cx - (item.data?.w || 100) / 2,
            y: cy - (item.data?.h || 100) / 2,
            w: item.data?.w || 100,
            h: item.data?.h || 100,
            zIndex: Object.keys(state.nodes).length + 10,
            content: {
                title: '',
                body: '',
                color: extraContent?.color || '#ffffff',
                ...restData,      // shapeType, path
                ...(extraContent || {}) // strokeStyle, borderWidth, etc.
            }
        };

        if (newNode.type === 'icon') {
            newNode.w = 60;
            newNode.h = 60;
            newNode.x = cx - 30;
            newNode.y = cy - 30;
        } else if (newNode.type === 'text') {
            newNode.w = item.data?.w || 300;
            newNode.h = item.data?.h || 60;
            newNode.content.title = item.data?.content?.title || item.label || '';
        }

        pizarronStore.addNode(newNode);
    };

    const handleDragStart = (e: React.DragEvent, item: any) => {
        // Prepare data for drop
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: item.type,
            templateId: item.id,
            // Pass minimal data needed for drop handler
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const getActiveLibrary = () => {
        switch (activeTab) {
            case 'boards': return TEMPLATE_LIBRARIES;
            case 'elements': return SHAPE_LIBRARIES;
            case 'text': return TEXT_PRESETS;
            // case 'structures': return COMPOSITE_SHAPES;
            case 'assets': return [...ICON_LIBRARIES, ...GRAPHIC_LIBRARIES];
            default: return [];
        }
    };

    const libraries = getActiveLibrary();

    // Flatten all templates for Recents lookup
    const allTemplates = TEMPLATE_LIBRARIES.flatMap(cat => cat.items);
    const recentItems = recentTemplateIds
        .map(id => allTemplates.find(t => t.id === id))
        .filter(t => t !== undefined) as AssetDefinition[];

    return (
        <div
            ref={ref}
            className="absolute top-14 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex z-[60] pointer-events-auto animate-in slide-in-from-left duration-200"
        >
            {/* Tabs Rail */}
            <div className="w-20 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-2 h-full">
                {/* Main Tabs */}
                <div className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto custom-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full aspect-square rounded-xl shrink-0 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="text-2xl">{tab.icon}</span>
                            <span className="text-[9px] font-medium truncate w-full text-center px-0.5">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Bottom Tabs (Settings) */}
                <div className="w-full px-2 pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full aspect-square rounded-xl shrink-0 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'settings'
                            ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                    >
                        <LuSettings size={24} />
                        <span className="text-[9px] font-medium truncate w-full text-center">Ajustes</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">

                {/* Header & Search */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wide">
                            {activeTab === 'settings' ? 'Ajustes' : TABS.find(t => t.id === activeTab)?.label}
                        </h2>
                        <button
                            onClick={() => pizarronStore.setUIFlag('showLibrary', false)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LuX size={20} />
                        </button>
                    </div>
                    {activeTab !== 'settings' && (
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={`Buscar...`}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 dark:text-white border-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* Recents Section (Templates Only) */}
                    {activeTab === 'boards' && !search && recentItems.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                                <span className="text-orange-500">History</span> Recientes
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {recentItems.map(item => (
                                    <button
                                        key={`recent-${item.id}`}
                                        onClick={() => handleAdd(item)}
                                        className="h-20 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-orange-100 dark:border-orange-900 shadow-sm hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-md transition-all relative group"
                                        title={item.label}
                                    >
                                        <span className="text-2xl mb-1">{item.icon}</span>
                                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 w-full mt-6" />
                        </div>
                    )}

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
                                    {category.label}
                                </h3>
                                <div className={`${activeTab === 'text' ? 'flex flex-col gap-3' : 'grid grid-cols-3 gap-3'}`}>
                                    {filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onClick={() => handleAdd(item)}
                                            className={`${activeTab === 'text'
                                                ? 'w-full h-auto p-3 flex flex-col items-start'
                                                : activeTab === 'boards' ? 'aspect-video flex-col items-center justify-center' : 'aspect-square flex-col items-center justify-center'
                                                } bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all flex group relative overflow-hidden`}
                                            title={item.label}
                                        >
                                            <div className={`${activeTab === 'text' ? '' : 'text-2xl group-hover:scale-110 mb-1'} transition-transform`}>
                                                {/* Render Preview */}
                                                {activeTab === 'text' ? (
                                                    <div style={{
                                                        fontFamily: item.data?.nodes?.[0]?.content?.fontFamily || 'Inter',
                                                        fontSize: '14px',
                                                        // Color fix for dark module
                                                        color: 'currentColor'
                                                    }}
                                                        className="text-slate-700 dark:text-slate-200 w-full text-left"
                                                    >
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
                                                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-slate-700 dark:text-slate-300">
                                                        <path d={item.data.path} />
                                                    </svg>
                                                ) : item.data?.shapeType ? (
                                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 border-2 border-slate-600 dark:border-slate-400"
                                                        style={{
                                                            borderRadius: item.data.shapeType === 'circle' ? '50%' : item.data.shapeType === 'pill' ? '99px' : '2px',
                                                            transform: item.data.shapeType === 'diamond' ? 'rotate(45deg) scale(0.8)' : 'none',
                                                            clipPath: item.data.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                                                                item.data.shapeType === 'pentagon' ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' :
                                                                    item.data.shapeType === 'octagon' ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' :
                                                                        item.data.shapeType === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                                                                            item.data.shapeType === 'parallelogram' ? 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' :
                                                                                item.data.shapeType === 'trapezoid' ? 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' :
                                                                                    item.data.shapeType === 'cross' ? 'polygon(20% 0%, 80% 0%, 80% 20%, 100% 20%, 100% 80%, 80% 80%, 80% 100%, 20% 100%, 20% 80%, 0% 80%, 0% 20%, 20% 20%)' :
                                                                                        item.data.shapeType === 'arrow_right' ? 'polygon(0% 25%, 75% 25%, 75% 0%, 100% 50%, 75% 100%, 75% 75%, 0% 75%)' :
                                                                                            item.data.shapeType === 'arrow_left' ? 'polygon(25% 0%, 25% 25%, 100% 25%, 100% 75%, 25% 75%, 25% 100%, 0% 50%)' :
                                                                                                item.data.shapeType === 'arrow_up' ? 'polygon(25% 100%, 25% 25%, 0% 25%, 50% 0%, 100% 25%, 75% 25%, 75% 100%)' :
                                                                                                    item.data.shapeType === 'arrow_down' ? 'polygon(25% 0%, 75% 0%, 75% 75%, 100% 75%, 50% 100%, 0% 75%, 25% 75%)' :
                                                                                                        'none'
                                                        }}
                                                    />
                                                ) : item.type === 'line' ? (
                                                    <div className="w-8 h-0 border-t-2 border-slate-600 dark:border-slate-400"
                                                        style={{
                                                            borderStyle: item.data?.content?.strokeStyle || 'solid',
                                                            width: '32px',
                                                            transform: 'rotate(-45deg)'
                                                        }}
                                                    />
                                                ) : (
                                                    <span>{item.icon}</span>
                                                )}
                                            </div>
                                            {activeTab !== 'text' && (
                                                <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate w-full px-1 text-center">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Fallback Empty State */}
                    {libraries.every(cat => cat.items.filter(i =>
                        i.label.toLowerCase().includes(search.toLowerCase()) ||
                        (i.tags && i.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
                    ).length === 0) && (
                            <div className="text-center text-slate-400 mt-10">
                                <p>No results found</p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { pizarronStore } from '../../state/store';
import {
    LuMousePointer2, LuHand, LuLayoutGrid, LuShapes, LuImage,
    LuMonitorPlay, LuTrash2, LuApple, LuScrollText, LuType
} from 'react-icons/lu';

/**
 * MobileLeftSidebar
 * Complete sidebar matching desktop with ALL buttons visible
 */
export const MobileLeftSidebar: React.FC = () => {
    const { activeTool, grimorioPickerOpen, showLibrary, showProjectManager } = pizarronStore.useSelector(s => s.uiFlags);
    const selection = pizarronStore.useSelector(s => s.selection);

    // All tools from desktop sidebar
    const tools = [
        {
            id: 'pointer',
            icon: LuMousePointer2,
            label: 'Pointer',
            action: () => pizarronStore.setActiveTool('pointer')
        },
        {
            id: 'hand',
            icon: LuHand,
            label: 'Pan',
            action: () => pizarronStore.setActiveTool('hand')
        },
        {
            id: 'library',
            icon: LuShapes,
            label: 'Library',
            action: () => {
                const current = showLibrary;
                console.log('[MobileSidebar] Library clicked, current:', current);
                pizarronStore.setUIFlag('showLibrary', !current);
                console.log('[MobileSidebar] Library after setUIFlag:', pizarronStore.getState().uiFlags.showLibrary);
            }
        },
        {
            id: 'image',
            icon: LuImage,
            label: 'Image',
            action: () => {
                // Trigger file upload
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e: any) => {
                    const file = e.target?.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const viewport = pizarronStore.getState().viewport;
                            const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
                            const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

                            pizarronStore.addNode({
                                id: crypto.randomUUID(),
                                type: 'image',
                                x: centerX - 100,
                                y: centerY - 100,
                                w: 200,
                                h: 200,
                                content: { src: event.target?.result as string },
                                zIndex: pizarronStore.getState().order.length,
                                createdAt: Date.now(),
                                updatedAt: Date.now()
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            }
        },
        { type: 'separator' },
        {
            id: 'project',
            icon: LuLayoutGrid,
            label: 'Pizarras',
            action: () => {
                const current = showProjectManager;
                console.log('[MobileSidebar] Project clicked, current:', current);
                pizarronStore.setUIFlag('showProjectManager', !current);
                console.log('[MobileSidebar] Project after setUIFlag:', pizarronStore.getState().uiFlags.showProjectManager);
            }
        },
        {
            id: 'presentation',
            icon: LuMonitorPlay,
            label: 'Present',
            action: () => pizarronStore.setPresentationMode(true)
        },
        { type: 'separator' },
        {
            id: 'ingredient',
            icon: LuApple,
            label: 'Ingredient',
            action: () => {
                const current = grimorioPickerOpen;
                pizarronStore.setUIFlag('grimorioPickerOpen', current === 'ingredients' ? null : 'ingredients');
            }
        },
        {
            id: 'recipe',
            icon: LuScrollText,
            label: 'Recipe',
            action: () => {
                const current = grimorioPickerOpen;
                pizarronStore.setUIFlag('grimorioPickerOpen', current === 'recipes' ? null : 'recipes');
            }
        },
        { type: 'separator' },
        {
            id: 'text',
            icon: LuType,
            label: 'Text',
            action: () => {
                const viewport = pizarronStore.getState().viewport;
                const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
                const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

                pizarronStore.addNode({
                    id: crypto.randomUUID(),
                    type: 'text',
                    x: centerX - 50,
                    y: centerY - 25,
                    w: 100,
                    h: 50,
                    content: { title: 'New Text', color: '#1e293b', fontSize: 16 },
                    zIndex: pizarronStore.getState().order.length,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        },
        {
            id: 'delete',
            icon: LuTrash2,
            label: 'Delete',
            action: () => {
                if (selection.size > 0) {
                    if (window.confirm(`Delete ${selection.size} element(s)?`)) {
                        Array.from(selection).forEach(id => pizarronStore.deleteNode(id));
                        pizarronStore.setSelection([]);
                    }
                }
            },
            disabled: selection.size === 0
        }
    ];

    const isToolActive = (toolId: string) => {
        if (toolId === 'pointer' || toolId === 'hand') return activeTool === toolId;
        if (toolId === 'library') return showLibrary;
        if (toolId === 'project') return showProjectManager;
        if (toolId === 'ingredient') return grimorioPickerOpen === 'ingredients';
        if (toolId === 'recipe') return grimorioPickerOpen === 'recipes';
        return false;
    };

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] max-h-[90vh]">
            {/* Scrollable sidebar with ALL tools visible */}
            <div className="flex flex-col gap-2 p-2 rounded-2xl 
                            bg-gradient-to-b from-cyan-50 to-white
                            border-2 border-cyan-100 shadow-xl
                            overflow-y-auto max-h-[85vh]">

                {tools.map((tool: any, index) => {
                    if (tool.type === 'separator') {
                        return <div key={`sep-${index}`} className="h-px w-8 bg-cyan-200 mx-auto my-1 flex-shrink-0" />;
                    }

                    const isActive = isToolActive(tool.id);

                    return (
                        <button
                            key={tool.id}
                            onClick={tool.action}
                            disabled={tool.disabled}
                            className={`w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0
                                       transition-all active:scale-95 shadow-sm ${tool.disabled
                                    ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'
                                    : isActive
                                        ? 'bg-cyan-500 text-white scale-110 shadow-md'
                                        : 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 border-2 border-cyan-200'
                                }`}
                            title={tool.label}
                        >
                            <tool.icon size={24} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

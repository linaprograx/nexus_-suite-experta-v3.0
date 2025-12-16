import React, { useEffect } from 'react';
import { CanvasStage } from './CanvasStage';
import { pizarronStore } from '../state/store';
import { firestoreAdapter } from '../sync/firestoreAdapter';
import { BoardNode } from '../engine/types';
import { TopBar } from './overlays/TopBar';
import { LeftRail } from './overlays/LeftRail';
import { Inspector } from './overlays/Inspector';
import { TextEditor } from './overlays/TextEditor';
import { PresentationMode } from './presentation/PresentationMode';
import { ImageModal } from './overlays/ImageModal';
import { ConfigModalRouter } from './overlays/ConfigModalRouter';
import { MiniToolbar } from './overlays/MiniToolbar';
import { GuideOverlay } from './overlays/GuideOverlay';
import { Firestore } from 'firebase/firestore';
import { LibrarySidePanel } from './panels/LibrarySidePanel';
import { PizarraManager } from './overlays/PizarraManager';
import { MiniMap } from './overlays/MiniMap';
import { CollapsedDock } from './overlays/CollapsedDock';

interface PizarronRootProps {
    appId: string;
    boardId: string;
    userId: string;
    db: Firestore;
}

export const PizarronRoot: React.FC<PizarronRootProps> = ({ appId, boardId, userId, db }) => {
    const [isPresenting, setIsPresenting] = React.useState(false);
    const [editingImageId, setEditingImageId] = React.useState<string | undefined>(undefined);
    const [showLibrary, setShowLibrary] = React.useState(false);
    const [showProjectManager, setShowProjectManager] = React.useState(false);

    // Initialize Sync Adapter
    React.useEffect(() => {
        if (appId && boardId) {
            console.log("[PizarronRoot] Initializing Sync", { appId, boardId });
            firestoreAdapter.init(appId, boardId);
            return () => {
                firestoreAdapter.stop();
            };
        }
    }, [appId, boardId]);

    // Subscribe to Store
    React.useEffect(() => {
        return pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setIsPresenting(state.presentationState.isActive);
            setEditingImageId(state.interactionState.editingImageId);
            setShowLibrary(!!state.uiFlags.showLibrary);
            setShowProjectManager(!!state.uiFlags.showProjectManager);
        });
    }, []);

    // Global Keybinds
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;

            const isCmd = e.metaKey || e.ctrlKey;

            if (isCmd && e.key === 'c') {
                e.preventDefault();
                pizarronStore.copySelection();
            }
            if (isCmd && e.key === 'v') {
                e.preventDefault();
                pizarronStore.paste();
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const sel = pizarronStore.getState().selection;
                if (sel.size > 0) pizarronStore.deleteNodes(Array.from(sel));
            }
            if (isCmd && e.key === 'd') {
                e.preventDefault();
                pizarronStore.copySelection();
                pizarronStore.paste();
            }

            // Presentation Mode Toggle (Global)
            // Presentation Mode Toggle (Global)
            if (e.code === 'KeyP') {
                // Ensure we aren't editing text
                console.log("[PizarronRoot] 'P' Key detected. Toggling presentation...");
                e.preventDefault();
                e.stopImmediatePropagation(); // Strongest stop
                pizarronStore.setPresentationMode(!pizarronStore.getState().presentationState.isActive);
            }

            // Layer Shortcuts
            if (isCmd && e.key === 'ArrowUp') {
                e.preventDefault();
                if (e.shiftKey) pizarronStore.bringToFront();
                else pizarronStore.bringForward();
            }
            if (isCmd && e.key === 'ArrowDown') {
                e.preventDefault();
                if (e.shiftKey) pizarronStore.sendToBack();
                else pizarronStore.sendBackward();
            }

            // Undo/Redo Could go here too
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cinematic Entry
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`w-full h-full relative flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {/* Standard Overlays (Hidden during Presentation) */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${isPresenting ? 'opacity-0' : 'opacity-100'}`}>
                {/* Overlays */}
                {!isPresenting && (
                    <>
                        <TopBar />
                        {/* Overlays (Toolbars, etc) */}
                        <LeftRail />
                        <MiniToolbar />
                        <Inspector />
                        <GuideOverlay />
                        <MiniMap />
                        <CollapsedDock />

                        {showLibrary && <LibrarySidePanel />}
                        {showProjectManager && <PizarraManager onClose={() => pizarronStore.setUIFlag('showProjectManager', false)} />}
                        <TextEditor />
                        {editingImageId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
                            <ImageModal
                                nodeId={editingImageId}
                                onClose={() => pizarronStore.updateInteractionState({ editingImageId: undefined })}
                            />
                        </div>}
                    </>
                )}
                {/* Bottom Status */}
                <div className="absolute bottom-6 right-6 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-full px-3 py-1.5 pointer-events-auto text-xs font-mono text-slate-600">
                        Pizarrón 2.0 Beta
                    </div>
                </div>
            </div>

            {/* Presentation Overlay */}
            <PresentationMode />

            {/* Main Stage */}
            <div className="flex-1 relative z-0">
                <CanvasStage />
            </div>
        </div>
    );
};

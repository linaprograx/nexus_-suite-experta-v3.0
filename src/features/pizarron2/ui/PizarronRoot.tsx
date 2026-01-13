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
import { usePizarronIntelligence } from '../hooks/usePizarronIntelligence'; // Added import
import { KeyboardShortcutsManager } from '../engine/KeyboardShortcutsManager';

import { MiniToolbar } from './overlays/MiniToolbar';
import { GuideOverlay } from './overlays/GuideOverlay';
import { Firestore } from 'firebase/firestore';
import { LibrarySidePanel } from './panels/LibrarySidePanel';
import { PizarraManager } from './overlays/PizarraManager';
import { MiniMap } from './overlays/MiniMap';
import { CollapsedDock } from './overlays/CollapsedDock';
import { OverviewOverlay } from './overlays/OverviewOverlay';
import { GrimorioPicker } from './overlays/GrimorioPicker';
import { MenuGeneratorModal } from './overlays/MenuGeneratorModal';
import { MenuNodesOverlay } from './overlays/MenuNodesOverlay';

interface PizarronRootProps {
    appId: string;
    boardId: string;
    userId: string;
    db: Firestore;
}

export const PizarronRoot: React.FC<PizarronRootProps> = ({ appId, boardId, userId, db }) => {
    // Detect if running in mobile mode (via body class)
    const [isMobileMode, setIsMobileMode] = React.useState(false);

    React.useEffect(() => {
        const checkMobileMode = () => {
            setIsMobileMode(document.body.classList.contains('mobile-pizarron-mode'));
        };
        checkMobileMode();
        // Re-check on class changes
        const observer = new MutationObserver(checkMobileMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Phase 6.3: Reactivity for Intelligence
    // Fix: Use granular selector to avoid re-rendering on viewport changes
    const nodes = pizarronStore.useSelector(s => s.nodes);

    // Calculate Intelligence Hints (Read-Only)
    const planningHints = usePizarronIntelligence(nodes);

    // Sync Hints to Store (for Renderer)
    React.useEffect(() => {
        // Robustness: Use Deep Equality Check (JSON Stringify) to avoid infinite loops
        // if refs are unstable (e.g. from context hooks).
        const currentHints = pizarronStore.getState().interactionState.planningHints;

        // Only update if CONTENT has changed
        if (JSON.stringify(currentHints) !== JSON.stringify(planningHints)) {
            pizarronStore.updateInteractionState({ planningHints });
        }
    }, [planningHints]);

    // Initialize Sync Adapter (Reactive to Store)
    const activePizarra = pizarronStore.useSelector(s => s.activePizarra);

    // Phase 6: Session Restoration (Fix Refresh Data Loss)
    React.useEffect(() => {
        // If we have no active pizarra in store, try to restore from session
        if (!pizarronStore.getState().activePizarra) {
            const restored = pizarronStore.restoreLastSession();
            if (restored) {
                console.log("[PizarronRoot] Restored Session:", restored.id);
            }
        }
    }, [appId]);

    // Determine Effective Board ID:
    // Priority 1: Store's Active Pizarra (User switched context)
    // Priority 2: URL/Prop Board ID (Initial load)
    const effectiveBoardId = activePizarra?.boards?.[0]?.id || boardId;

    // Debug Board Switching
    React.useEffect(() => {
        console.log(`[PizarronRoot] Effective Board ID Changed: ${effectiveBoardId} (AppID: ${appId})`);
    }, [effectiveBoardId, appId]);

    React.useEffect(() => {
        if (appId && db) {
            pizarronStore.setGlobalContext(appId, db);
        }
    }, [appId, db]);

    React.useEffect(() => {
        if (appId && effectiveBoardId) {
            console.log("[PizarronRoot] Initializing Sync", { appId, boardId: effectiveBoardId });
            firestoreAdapter.init(appId, effectiveBoardId);
            return () => {
                console.log("[PizarronRoot] Stopping Sync for", effectiveBoardId);
                firestoreAdapter.stop();
                // Critical Fix: Clear board context to prevent overlap when switching
                pizarronStore.resetBoard();
            };
        }
    }, [appId, effectiveBoardId]);

    // Optimize: Subscribe ONLY to UI flags relevant for overlays
    const uiFlags = pizarronStore.useSelector(s => s.uiFlags);
    const interaction = pizarronStore.useSelector(s => s.interactionState);
    const presentation = pizarronStore.useSelector(s => s.presentationState);

    const isPresenting = presentation.isActive;
    const showLibrary = !!uiFlags.showLibrary;
    const showProjectManager = !!uiFlags.showProjectManager;
    // editingImageId is tracked in store, but seemingly not used forconditional rendering here.


    // Global Keyboard Shortcuts
    React.useEffect(() => {
        const shortcutsManager = new KeyboardShortcutsManager();
        shortcutsManager.attach();
        return () => shortcutsManager.detach();
    }, []);

    // Cinematic Entry
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`w-full h-full relative flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-all duration-700 ease-out-expo ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {/* Standard Overlays (Hidden during Presentation AND Mobile) */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${isPresenting ? 'opacity-0' : 'opacity-100'} ${isMobileMode ? 'hidden' : ''}`}>
                {/* Overlays */}
                {!isPresenting && !isMobileMode && (
                    <>
                        <TopBar />
                        {/* Desktop-Only Overlays */}
                        <LeftRail />
                        <Inspector />
                        <GuideOverlay />
                        <MiniMap />
                        <CollapsedDock />

                        {/* MiniToolbar - appears above selected elements */}
                        <MiniToolbar />

                        {/* Bottom Status */}
                        <div className="absolute bottom-6 right-6 pointer-events-none">
                            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-full px-3 py-1.5 pointer-events-auto text-xs font-mono text-slate-600">
                                Pizarrón 2.0 Beta
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Presentation Overlay */}
            <PresentationMode />

            {/* Modals - Available in BOTH desktop and mobile */}
            {showLibrary && <LibrarySidePanel />}
            {showProjectManager && (
                <PizarraManager
                    appId={appId}
                    onClose={() => pizarronStore.setUIFlag('showProjectManager', false)}
                />
            )}
            <TextEditor />

            {/* Main Stage */}
            <div className="flex-1 relative z-0">
                <CanvasStage>
                    {/* Phase 6.7/6.8: DOM Overlay for Menu Designs (Inside World Layer) */}
                    <MenuNodesOverlay />
                </CanvasStage>
            </div>

            {/* Global Modals (High Z-Index, Pointer Events Auto) - MOVED OUTSIDE HUD */}
            <OverviewOverlay />
            <GrimorioPicker />
            <MenuGeneratorModal />
        </div>
    );
};

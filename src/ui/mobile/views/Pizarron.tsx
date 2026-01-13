import React, { useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { usePizarronData } from '../../../hooks/usePizarronData';
import { PizarronRoot } from '../../../features/pizarron2/ui/PizarronRoot';
import { pizarronStore } from '../../../features/pizarron2/state/store';
import { MobileMiniToolbar } from '../../../features/pizarron2/ui/overlays/MobileMiniToolbar';
import { MobileTypographyPanel } from '../../../features/pizarron2/ui/overlays/MobileTypographyPanel';
import { MobileSelectionHUD } from '../../../features/pizarron2/ui/overlays/MobileSelectionHUD';
import { MobileLeftSidebar } from '../../../features/pizarron2/ui/overlays/MobileLeftSidebar';
import { MobileResizeHandles } from '../../../features/pizarron2/ui/overlays/MobileResizeHandles';
import AnimatedPage from '../components/AnimatedPage';
import '../../../features/pizarron2/ui/mobile-pizarron.css';

interface Props {
    onNavigate?: (page: any) => void;
    user?: any;
    notify?: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

/**
 * Mobile Pizarron View
 * Wrapper over desktop PizarronRoot with mobile-specific adaptations
 * 
 * This component:
 * - Renders the full desktop PizarronRoot (all logic intact)
 * - Adds mobile-specific UI overlays
 * - Applies mobile CSS class for conditional styling
 * - Relies on InteractionManager's touch handlers for gestures
 */
const Pizarron: React.FC<Props> = ({ notify }) => {
    const { db, appId, userId } = useApp();
    const { activeBoardId } = usePizarronData();

    // Apply mobile mode class on mount
    useEffect(() => {
        document.body.classList.add('mobile-pizarron-mode');

        return () => {
            document.body.classList.remove('mobile-pizarron-mode');
        };
    }, []);

    // Show loading state if missing required data
    if (!db || !appId || !userId) {
        return (
            <AnimatedPage className="flex items-center justify-center h-full bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading Pizarron...</p>
                </div>
            </AnimatedPage>
        );
    }

    return (
        <AnimatedPage className="h-full w-full relative overflow-hidden">
            {/* 
                Desktop PizarronRoot 
                Contains all the logic:
                - InteractionManager (with touch support)
                - pizarronStore
                - KeyboardShortcutsManager
                - SnapEngine
                - Renderer
                - etc.
            */}
            <div className="h-full w-full">
                <PizarronRoot
                    appId={appId}
                    boardId={activeBoardId || 'general'}
                    userId={userId}
                    db={db}
                />
            </div>

            {/* Mobile-Specific UI Overlays */}

            {/* Left sidebar with tools */}
            <MobileLeftSidebar />

            {/* Selection count indicator at top */}
            <MobileSelectionHUD />

            {/* Action toolbar at bottom (appears when items selected) */}
            <MobileMiniToolbar />

            {/* Resize & Rotate Handles */}
            <MobileResizeHandles />

            {/* Mobile Zoom Controls */}
            <MobileZoomControls />
        </AnimatedPage>
    );
};

/**
 * Mobile Zoom Controls
 * Simple +/- buttons at top-right
 */
const MobileZoomControls: React.FC = () => {
    const viewport = pizarronStore.useSelector(s => s.viewport);

    const handleZoomIn = () => {
        const currentZoom = viewport?.zoom || 1;
        const newZoom = Math.min(currentZoom + 0.2, 5);
        pizarronStore.updateViewport({ zoom: newZoom }, false, false); // silent=false to trigger update
    };

    const handleZoomOut = () => {
        const currentZoom = viewport?.zoom || 1;
        const newZoom = Math.max(currentZoom - 0.2, 0.1);
        pizarronStore.updateViewport({ zoom: newZoom }, false, false); // silent=false to trigger update
    };

    const handleFitView = () => {
        pizarronStore.fitContent();
    };

    const handleReset = () => {
        pizarronStore.updateViewport({ zoom: 1, x: 0, y: 0 }, false, false);
    };

    const zoomPercent = Math.round((viewport?.zoom || 1) * 100);

    return (
        <div className="fixed top-4 right-4 z-[60] flex gap-2 bg-white/95 dark:bg-slate-900/95 
                        backdrop-blur-md rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-slate-700">
            <button
                onClick={handleZoomOut}
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           text-slate-600 dark:text-slate-300 hover:bg-slate-100 
                           dark:hover:bg-slate-800 active:scale-95 transition-all
                           font-bold text-xl"
                title="Zoom Out"
            >
                −
            </button>

            <button
                onClick={handleReset}
                onDoubleClick={handleFitView}
                className="px-3 h-10 flex items-center justify-center rounded-xl
                           text-xs font-bold text-slate-600 dark:text-slate-300 
                           hover:bg-slate-100 dark:hover:bg-slate-800 
                           active:scale-95 transition-all min-w-[60px]"
                title="Reset Zoom (Double-click to Fit)"
            >
                {zoomPercent}%
            </button>

            <button
                onClick={handleZoomIn}
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           text-slate-600 dark:text-slate-300 hover:bg-slate-100 
                           dark:hover:bg-slate-800 active:scale-95 transition-all
                           font-bold text-xl"
                title="Zoom In"
            >
                +
            </button>
        </div>
    );
};

export default Pizarron;

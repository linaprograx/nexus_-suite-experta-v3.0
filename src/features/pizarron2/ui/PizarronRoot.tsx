import React, { useEffect } from 'react';
import { CanvasStage } from './CanvasStage';
import { pizarronStore } from '../state/store';
import { firestoreAdapter } from '../sync/firestoreAdapter';
import { BoardNode } from '../engine/types';
import { TopBar } from './overlays/TopBar';
import { LeftRail } from './overlays/LeftRail';
import { Inspector } from './overlays/Inspector';

interface PizarronRootProps {
    appId: string;
    boardId?: string;
    // userProfile? passed via context or props
}

export const PizarronRoot: React.FC<PizarronRootProps> = ({ appId, boardId = 'general' }) => {

    // Initialize Sync Adapter
    useEffect(() => {
        console.log("[PizarronRoot] Initializing Sync", { appId, boardId });
        firestoreAdapter.init(appId, boardId);

        return () => {
            firestoreAdapter.stop();
        };
    }, [appId, boardId]);

    return (
        <div className="w-full h-full relative flex flex-col bg-slate-50 overflow-hidden">
            {/* Overlays */}
            <TopBar />
            <LeftRail />
            <Inspector />

            {/* Main Stage */}
            <div className="flex-1 relative z-0">
                <CanvasStage />
            </div>

            {/* Bottom Status (can be a component later) */}
            <div className="absolute bottom-6 right-6 pointer-events-none z-10">
                <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-full px-3 py-1.5 pointer-events-auto text-xs font-mono text-slate-600">
                    Pizarrón 2.0 Beta
                </div>
            </div>
        </div>
    );
};

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
import { Firestore } from 'firebase/firestore'; // Assuming Firestore type is available or needs to be imported

interface PizarronRootProps {
    appId: string;
    boardId: string;
    userId: string;
    db: Firestore;
}

export const PizarronRoot: React.FC<PizarronRootProps> = ({ appId, boardId, userId, db }) => {
    const [isPresenting, setIsPresenting] = React.useState(false);
    const [editingImageId, setEditingImageId] = React.useState<string | undefined>(undefined);

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
        });
    }, []);

    return (
        <div className="w-full h-full relative flex flex-col bg-slate-50 overflow-hidden">
            {/* Standard Overlays (Hidden during Presentation) */}
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${isPresenting ? 'opacity-0' : 'opacity-100'}`}>
                {/* Overlays */}
                {!isPresenting && (
                    <>
                        <TopBar />
                        <LeftRail />
                        <Inspector />
                        <TextEditor />
                        <ConfigModalRouter />
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

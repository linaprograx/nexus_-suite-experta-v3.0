import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';

export const TopBar: React.FC = () => {
    const [zoom, setZoom] = useState(1);
    const [debug, setDebug] = useState(false);

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            setZoom(state.viewport.zoom);
            setDebug(state.uiFlags.debug);
        });
        return unsub;
    }, []);

    const handleZoomIn = () => {
        pizarronStore.updateViewport({ zoom: Math.min(zoom + 0.1, 5) });
    };

    const handleZoomOut = () => {
        pizarronStore.updateViewport({ zoom: Math.max(zoom - 0.1, 0.1) });
    };

    const toggleDebug = () => {
        pizarronStore.setState(s => { s.uiFlags.debug = !s.uiFlags.debug });
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-full px-4 py-2 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-600 font-bold">-</button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-600 font-bold">+</button>
            </div>
            <div className="w-px h-4 bg-slate-300 mx-2"></div>
            <button onClick={toggleDebug} className={`text-xs px-2 py-1 rounded ${debug ? 'bg-orange-100 text-orange-700' : 'hover:bg-slate-100 text-slate-500'}`}>
                Values
            </button>
        </div>
    );
};

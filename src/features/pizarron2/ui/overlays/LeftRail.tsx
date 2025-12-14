import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';

const TOOLS = [
    { id: 'pointer', icon: '👆', label: 'Pointer' },
    { id: 'hand', icon: '✋', label: 'Pan' },
    { id: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { id: 'text', icon: 'T', label: 'Text' },
] as const;

export const LeftRail: React.FC = () => {
    const [activeTool, setActiveTool] = useState('pointer');

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            setActiveTool(pizarronStore.getState().uiFlags.activeTool);
        });
        return unsub;
    }, []);

    const setTool = (id: any) => {
        pizarronStore.setActiveTool(id);
    };

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-2xl p-2 flex flex-col gap-2">
                {TOOLS.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${activeTool === tool.id
                                ? 'bg-orange-100 text-orange-600 border border-orange-200'
                                : 'hover:bg-slate-100 text-slate-600 border border-transparent'
                            }`}
                        title={tool.label}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

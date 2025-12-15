import React, { useEffect, useState } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';
import { FontSelector } from '../shared/FontSelector';

export const Inspector: React.FC = () => {
    const [selection, setSelection] = useState<string[]>([]);
    const [firstNode, setFirstNode] = useState<BoardNode | null>(null);

    useEffect(() => {
        const unsub = pizarronStore.subscribe(() => {
            const state = pizarronStore.getState();
            const sel = Array.from(state.selection);
            setSelection(sel);

            if (sel.length === 1) {
                setFirstNode(state.nodes[sel[0]] || null);
            } else {
                setFirstNode(null);
            }
        });
        return unsub;
    }, []);

    if (selection.length === 0) return null;

    return (
        <div className="absolute right-4 top-20 w-64 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Properties</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{selection.length} Selected</span>
                </div>

                {firstNode ? (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Title</label>
                            <input
                                disabled
                                value={firstNode.content.title || ''}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                            />
                        </div>
                        {firstNode.type === 'text' && (
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Typography</label>
                                <FontSelector 
                                    className="w-full"
                                    currentFont={firstNode.content.fontFamily || 'Inter'}
                                    onChange={(f) => pizarronStore.updateNode(firstNode.id, { content: { ...firstNode.content, fontFamily: f } })}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">X</label>
                                <div className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">{Math.round(firstNode.x)}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Y</label>
                                <div className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">{Math.round(firstNode.y)}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 italic py-4 text-center">
                        Multiple items selected
                    </div>
                )}
            </div>
        </div>
    );
};

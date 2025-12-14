import React, { useState, useEffect } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';

interface ImageModalProps {
    nodeId: string;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ nodeId, onClose }) => {
    const [node, setNode] = useState<BoardNode | null>(null);
    const [srcInput, setSrcInput] = useState('');

    useEffect(() => {
        const state = pizarronStore.getState();
        const n = state.nodes[nodeId];
        if (n) {
            setNode(n);
            setSrcInput(n.content.src || '');
        } else {
            onClose(); // Node gone
        }
    }, [nodeId, onClose]);

    const updateContent = (patch: any) => {
        pizarronStore.updateNode(nodeId, {
            content: { ...node?.content, ...patch }
        });
        setNode(prev => prev ? { ...prev, content: { ...prev.content, ...patch } } : null);
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                updateContent({ src: result });
                setSrcInput('Local File');
            };
            reader.readAsDataURL(file);
        }
    };

    if (!node) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Image Properties</h3>

                {/* Preview */}
                <div className="w-full h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-slate-200">
                    {node.content.src ? (
                        <img src={node.content.src} alt="Preview" className="max-w-full max-h-full object-contain"
                            style={{ opacity: node.content.opacity ?? 1, borderRadius: node.content.borderRadius }} />
                    ) : (
                        <span className="text-slate-400 text-sm">No Image</span>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {/* URL Input */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Image URL (or upload)</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="text"
                                value={srcInput}
                                onChange={(e) => {
                                    setSrcInput(e.target.value);
                                    updateContent({ src: e.target.value });
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"
                                placeholder="https://..."
                            />
                            <label className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 cursor-pointer text-sm flex items-center">
                                📂
                                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                            </label>
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Caption</label>
                        <input
                            type="text"
                            value={node.content.caption || ''}
                            onChange={(e) => updateContent({ caption: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm mt-1"
                        />
                    </div>

                    {/* Visuals */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Opacity</label>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={node.content.opacity ?? 1}
                                onChange={(e) => updateContent({ opacity: parseFloat(e.target.value) })}
                                className="w-full mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Radius</label>
                            <input
                                type="range" min="0" max="100"
                                value={node.content.borderRadius ?? 0}
                                onChange={(e) => updateContent({ borderRadius: parseInt(e.target.value) })}
                                className="w-full mt-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={() => {
                            // If no src and canceled, maybe delete? 
                            // Prompt says: "Si el usuario cancela: El nodo se elimina"
                            // We check if we consider this a 'cancel' or 'done'.
                            // Let's add explicit Cancel button.
                            pizarronStore.deleteNode(nodeId);
                            onClose();
                        }}
                        className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-bold shadow-md"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { BoardNode } from '../../../engine/types';
import { pizarronStore } from '../../../state/store';

// Helper Hook
const useNodeUpdate = (node: BoardNode) => {
    const update = (patch: Partial<any>) => {
        pizarronStore.updateNode(node.id, {
            content: { ...node.content, ...patch }
        });
    };
    return update;
};

// --- SHAPE MODAL ---
export const ShapeConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);

    // Prevent event propagation so clicking inside modal doesn't deselect
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Shape Style</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600">Color</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {['#cbd5e1', '#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc'].map(c => (
                            <button
                                key={c}
                                onClick={() => update({ color: c })}
                                className={`w-6 h-6 rounded-full border ${node.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => pizarronStore.duplicateNode(node.id)}
                        className="px-3 py-1 text-xs bg-slate-50 hover:bg-slate-100 border rounded text-slate-600"
                    >
                        Duplicate
                    </button>
                    <button
                        onClick={() => pizarronStore.deleteNodes([node.id])}
                        className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- LINE MODAL ---
export const LineConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Line Style</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600">Stroke Width ({node.content.strokeWidth || 4}px)</label>
                    <input
                        type="range" min="1" max="20"
                        value={node.content.strokeWidth || 4}
                        onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
                        className="w-full mt-1"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Color</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {['#334155', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                            <button
                                key={c}
                                onClick={() => update({ color: c })}
                                className={`w-6 h-6 rounded-full border ${node.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => pizarronStore.deleteNodes([node.id])}
                        className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600 col-span-2"
                    >
                        Delete Line
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- TEXT MODAL ---
export const TextConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Text Style</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600">Content</label>
                    <textarea
                        className="w-full mt-1 p-2 border rounded text-sm min-h-[80px]"
                        value={node.content.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                        placeholder="Type something..."
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Color</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(c => (
                            <button
                                key={c}
                                onClick={() => update({ color: c })}
                                className={`w-6 h-6 rounded-full border ${node.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => pizarronStore.deleteNodes([node.id])}
                    className="w-full px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                >
                    Delete Text
                </button>
            </div>
        </div>
    );
};

// --- BOARD MODAL ---
export const BoardConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Board Settings</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600">Title</label>
                    <input
                        className="w-full mt-1 p-2 border rounded text-sm"
                        value={node.content.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Theme</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {['#f8fafc', '#fdf2f8', '#fffbeb', '#f0fdf4'].map(c => (
                            <button
                                key={c}
                                onClick={() => update({ color: c })}
                                className={`w-8 h-8 rounded border ${node.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => pizarronStore.deleteNodes([node.id])}
                    className="w-full px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                >
                    Delete Board
                </button>
            </div>
        </div>
    );
};

// --- CARD MODAL (Task/Idea) ---
export const CardConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Card Details</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600">Title</label>
                    <input
                        className="w-full mt-1 p-2 border rounded text-sm font-bold"
                        value={node.content.title || ''}
                        onChange={(e) => update({ title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Body</label>
                    <textarea
                        className="w-full mt-1 p-2 border rounded text-sm min-h-[100px]"
                        value={node.content.body || ''}
                        onChange={(e) => update({ body: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-600">Color</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {['#ffffff', '#dcfce7', '#dbeafe', '#fef9c3', '#fee2e2'].map(c => (
                            <button
                                key={c}
                                onClick={() => update({ color: c })}
                                className={`w-6 h-6 rounded-full border ${node.content.color === c ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => pizarronStore.duplicateNode(node.id)}
                        className="px-3 py-1 text-xs bg-slate-50 hover:bg-slate-100 border rounded text-slate-600"
                    >
                        Duplicate
                    </button>
                    <button
                        onClick={() => pizarronStore.deleteNodes([node.id])}
                        className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- IMAGE MODAL ---
export const ImageConfigModal: React.FC<{ node: BoardNode }> = ({ node }) => {
    const update = useNodeUpdate(node);
    const stopProp = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            className="fixed top-24 right-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-50 animate-in fade-in slide-in-from-right-4"
            onPointerDown={stopProp}
            onClick={stopProp}
        >
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Image Style</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Upload / Replace</label>
                    <button
                        onClick={() => pizarronStore.updateInteractionState({ editingImageId: node.id })}
                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded text-xs font-medium hover:bg-indigo-100 transition-colors"
                    >
                        Choose Image
                    </button>
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-600">Caption</label>
                    <input
                        className="w-full mt-1 p-2 border rounded text-sm"
                        value={node.content.caption || ''}
                        onChange={(e) => update({ caption: e.target.value })}
                        placeholder="Add caption..."
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-600">Opacity ({Math.round((node.content.opacity ?? 1) * 100)}%)</label>
                    <input
                        type="range" min="0" max="1" step="0.1"
                        value={node.content.opacity ?? 1}
                        onChange={(e) => update({ opacity: Number(e.target.value) })}
                        className="w-full mt-1"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-600">Border Radius ({node.content.borderRadius || 0}px)</label>
                    <input
                        type="range" min="0" max="100" step="4"
                        value={node.content.borderRadius || 0}
                        onChange={(e) => update({ borderRadius: Number(e.target.value) })}
                        className="w-full mt-1"
                    />
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <button
                        onClick={() => pizarronStore.deleteNodes([node.id])}
                        className="w-full px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                    >
                        Delete Image
                    </button>
                </div>
            </div>
        </div>
    );
};

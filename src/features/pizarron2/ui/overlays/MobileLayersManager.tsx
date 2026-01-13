import React, { useState } from 'react';
import { pizarronStore } from '../../state/store';
import { LuEye, LuEyeOff, LuLock, LuLockOpen, LuX, LuGripVertical, LuMenu } from 'react-icons/lu';
import { BoardNode } from '../../engine/types';

/**
 * MobileLayersManager
 * Fullscreen modal showing all layers with drag-to-reorder, visibility, and lock controls
 * Inspired by Canva layers panel
 */

interface LayerItemProps {
    node: BoardNode;
    index: number;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ node, index, onReorder }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const toggleVisibility = () => {
        pizarronStore.updateNode(node.id, {
            content: { ...node.content, visible: !(node.content?.visible ?? true) }
        });
    };

    const toggleLock = () => {
        pizarronStore.updateNode(node.id, { locked: !node.locked });
    };

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (fromIndex !== index) {
            onReorder(fromIndex, index);
        }
    };

    const getLayerName = () => {
        if (node.content?.title) return node.content.title;
        return `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} ${index + 1}`;
    };

    const getLayerColor = () => {
        if (node.type === 'shape') return node.content?.color || '#64748b';
        if (node.type === 'text') return node.content?.color || '#1e293b';
        return '#64748b';
    };

    const isVisible = node.content?.visible ?? true;

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                ${isDragging ? 'opacity-50' : 'opacity-100'}
                ${dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}
                ${!isVisible ? 'opacity-60' : ''}
            `}
        >
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing text-slate-400">
                <LuGripVertical size={20} />
            </div>

            {/* Thumbnail */}
            <div
                className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: getLayerColor() }}
            >
                {node.type === 'text' && (
                    <span className="text-xs text-white font-bold">T</span>
                )}
                {node.type === 'shape' && (
                    <div className="w-6 h-6 rounded bg-white/30"></div>
                )}
                {node.type === 'image' && (
                    <span className="text-xs text-white">📷</span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 dark:text-white truncate text-sm">
                    {getLayerName()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {node.type}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleVisibility}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                    {isVisible ? (
                        <LuEye size={18} className="text-slate-600 dark:text-slate-300" />
                    ) : (
                        <LuEyeOff size={18} className="text-slate-400" />
                    )}
                </button>

                <button
                    onClick={toggleLock}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                    {node.locked ? (
                        <LuLock size={18} className="text-slate-600 dark:text-slate-300" />
                    ) : (
                        <LuLockOpen size={18} className="text-slate-400" />
                    )}
                </button>

                <button className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                    <LuMenu size={18} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export const MobileLayersManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { nodes, order } = pizarronStore.useSelector(s => ({ nodes: s.nodes, order: s.order }));
    const [activeTab, setActiveTab] = useState<'all' | 'overlays'>('all');

    // Get nodes in z-order (top to bottom)
    const sortedNodes = [...order]
        .reverse()
        .map(id => nodes[id])
        .filter(n => n && !n.collapsed);

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const newOrder = [...order].reverse();
        const [movedId] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, movedId);
        pizarronStore.reorderNodes(newOrder.reverse());
    };

    return (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Capas</h2>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                    <LuX size={24} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'all'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setActiveTab('overlays')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'overlays'
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                        : 'text-slate-500 dark:text-slate-400'
                        }`}
                >
                    Superpuestas
                </button>
            </div>

            {/* Layers List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sortedNodes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <LuGripVertical size={32} />
                        </div>
                        <p className="font-medium">No hay capas</p>
                        <p className="text-sm text-center mt-1">Crea elementos en el canvas</p>
                    </div>
                ) : (
                    sortedNodes.map((node, index) => (
                        <LayerItem
                            key={node.id}
                            node={node}
                            index={index}
                            onReorder={handleReorder}
                        />
                    ))
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Arrastra las capas para reordenar • {sortedNodes.length} capas totales
                </p>
            </div>
        </div>
    );
};

import { usePizarronStore, pizarronStore } from '../../state/store';

export const CollapsedDock: React.FC = () => {
    const nodes = usePizarronStore(state => state.nodes);
    const order = usePizarronStore(state => state.order);

    // Find collapsed nodes in order
    const collapsedNodes = order
        .map(id => nodes[id])
        .filter(n => n && n.collapsed);

    if (collapsedNodes.length === 0) return null;

    return (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xl z-50 overflow-x-auto max-w-[80vw] pointer-events-auto">
            {collapsedNodes.map(node => (
                <button
                    key={node.id}
                    onClick={() => pizarronStore.toggleCollapse(node.id)}
                    className="flex flex-col items-center justify-center w-24 h-16 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-all group relative"
                    title="Click to Expand"
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 rounded-lg transition-opacity">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    </div>

                    <div className="w-full px-2 text-xs font-semibold text-slate-700 truncate text-center">
                        {node.content.title || 'Untitled Board'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                        Board
                    </div>
                </button>
            ))}
        </div>
    );
};

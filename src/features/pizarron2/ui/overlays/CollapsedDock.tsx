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
            {collapsedNodes.map(node => {
                const bgColor = node.content.color || '#f8fafc';
                const bgStyle = node.content.gradient
                    ? { backgroundImage: `linear-gradient(135deg, ${node.content.gradient.start}, ${node.content.gradient.end})` }
                    : { backgroundColor: bgColor };

                return (
                    <button
                        key={node.id}
                        onClick={() => pizarronStore.toggleCollapse(node.id)}
                        className="flex flex-col items-center justify-center w-24 h-16 rounded-lg transition-all group relative border border-slate-200 shadow-sm hover:shadow-md hover:scale-105"
                        style={bgStyle}
                        title="Click to Expand"
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 rounded-lg transition-opacity">
                            <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </div>

                        <div className="w-full px-2 text-xs font-semibold text-slate-800 truncate text-center mix-blend-hard-light">
                            {node.content.title || 'Untitled'}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

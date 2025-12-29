import { usePizarronStore, pizarronStore } from '../../state/store';

export const CollapsedDock: React.FC = () => {
    const nodes = usePizarronStore(state => state.nodes);
    const order = usePizarronStore(state => state.order);

    // Find collapsed nodes in order
    const collapsedNodes = order
        .map(id => nodes[id])
        .filter(n => n && n.collapsed);

    // Zone Logic (Heuristic for Phase 5)
    // In the future, this will be explicit metadata: node.zoneId
    const getZone = (node: any) => {
        // Operational: Checklists, active Cards
        if (node.content.listType === 'bullet' || node.content.listType === 'number') return 'operational';
        if (node.type === 'card' && node.content.status !== 'done') return 'operational';

        // Strategic: Charts (images named *chart*?), specific colors
        if (node.content.title?.toLowerCase().includes('kpi')) return 'strategic';

        // Archive: Done cards
        if (node.content.status === 'done') return 'archive';

        // Default to Creative
        return 'creative';
    };

    const zones = {
        operational: collapsedNodes.filter(n => getZone(n) === 'operational'),
        strategic: collapsedNodes.filter(n => getZone(n) === 'strategic'),
        creative: collapsedNodes.filter(n => getZone(n) === 'creative'),
        archive: collapsedNodes.filter(n => getZone(n) === 'archive'),
    };

    if (collapsedNodes.length === 0) return null;

    const renderThumbnail = (node: any) => {
        const bgColor = node.content.color || '#f8fafc';
        const bgStyle = node.content.gradient
            ? { backgroundImage: `linear-gradient(135deg, ${node.content.gradient.start}, ${node.content.gradient.end})` }
            : { backgroundColor: bgColor };

        return (
            <button
                key={node.id}
                onClick={() => pizarronStore.toggleCollapse(node.id)}
                className="flex flex-col items-center justify-center w-full h-12 rounded-md transition-all group relative border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 my-1"
                style={bgStyle}
                title={`Expand ${node.content.title}`}
            >
                <div className="w-full px-1 text-[10px] font-bold text-slate-700 truncate text-center">
                    {node.content.title || 'Untitled'}
                </div>
                {/* Visual Cue for Zone */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black/10 rounded-b-md" />
            </button>
        );
    }

    return (
        <div className="absolute bottom-0 left-0 w-full h-24 px-4 pb-2 flex gap-4 items-end pointer-events-none z-50">
            {/* Zone 1: Operational (25%) */}
            <div className="flex-1 bg-slate-50/50 backdrop-blur-md border-t border-r border-slate-200 rounded-tr-2xl h-full p-2 overflow-y-auto pointer-events-auto flex flex-col-reverse relative group/zone">
                <div className="absolute top-0 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover/zone:opacity-100 transition-opacity">Operational</div>
                <div className="w-full flex flex-col-reverse">
                    {zones.operational.map(renderThumbnail)}
                </div>
            </div>

            {/* Zone 2: Strategic (25%) */}
            <div className="flex-1 bg-white/40 backdrop-blur-md border-t border-r border-slate-200 rounded-tr-2xl h-full p-2 overflow-y-auto pointer-events-auto flex flex-col-reverse relative group/zone">
                <div className="absolute top-0 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover/zone:opacity-100 transition-opacity">Strategic</div>
                <div className="w-full flex flex-col-reverse">
                    {zones.strategic.map(renderThumbnail)}
                </div>
            </div>

            {/* Zone 3: Creative (25%) */}
            <div className="flex-1 bg-white/40 backdrop-blur-md border-t border-r border-slate-200 rounded-tr-2xl h-full p-2 overflow-y-auto pointer-events-auto flex flex-col-reverse relative group/zone">
                <div className="absolute top-0 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover/zone:opacity-100 transition-opacity">Creative</div>
                <div className="w-full flex flex-col-reverse">
                    {zones.creative.map(renderThumbnail)}
                </div>
            </div>

            {/* Zone 4: Archive (25%) */}
            <div className="flex-1 bg-slate-100/80 backdrop-blur-md border-t border-slate-200 rounded-tr-2xl h-full p-2 overflow-y-auto pointer-events-auto flex flex-col-reverse relative group/zone grayscale opacity-80 hover:opacity-100 transition-all">
                <div className="absolute top-0 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover/zone:opacity-100 transition-opacity">Archive</div>
                <div className="w-full flex flex-col-reverse">
                    {zones.archive.map(renderThumbnail)}
                </div>
            </div>
        </div>
    );
};

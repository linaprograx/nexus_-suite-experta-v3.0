import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BarSceneState, BarArea, BarWorker } from './digitalBarTypes';
import { SCENE_STYLES, ISO_CONSTANTS } from './sceneStyles';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface DigitalBarIsometricCanvasProps {
    sceneState: BarSceneState;
    onSelectArea: (areaId: string | null) => void;
    onSetZoom: (zoom: number) => void;
    onSetPan: (x: number, y: number) => void;
}

// Helper to project grid x,y to screen x,y
const projectIso = (x: number, y: number) => {
    return {
        left: ISO_CONSTANTS.ORIGIN_X + (x - y) * (ISO_CONSTANTS.TILE_WIDTH / 2),
        top: ISO_CONSTANTS.ORIGIN_Y + (x + y) * (ISO_CONSTANTS.TILE_HEIGHT / 2)
    };
};

// Helper to get relative coordinates for different shapes
const getShapeTiles = (shape: string, size: { width: number; height: number }) => {
    const tiles: { x: number; y: number }[] = [];

    // Default fallback
    const w = Math.max(1, size?.width || 1);
    const h = Math.max(1, size?.height || 1);

    if (shape === 'L') {
        // Vertical leg
        for (let y = 0; y < h; y++) tiles.push({ x: 0, y });
        // Horizontal leg (bottom)
        for (let x = 1; x < w; x++) tiles.push({ x, y: h - 1 });
    } else if (shape === 'U') {
        // Left leg
        for (let y = 0; y < h; y++) tiles.push({ x: 0, y });
        // Bottom
        for (let x = 1; x < w - 1; x++) tiles.push({ x, y: h - 1 });
        // Right leg
        for (let y = 0; y < h; y++) tiles.push({ x: w - 1, y });
    } else {
        // Rect / Square (Fill all)
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
};

const AreaBlock = React.memo(({ area, isSelected, onClick, workers }: { area: BarArea, isSelected: boolean, onClick: () => void, workers: BarWorker[] }) => {
    const tiles = useMemo(() => getShapeTiles(area.shape, area.size), [area.shape, area.size]);
    const gradient = SCENE_STYLES.gradients[area.type as keyof typeof SCENE_STYLES.gradients] || SCENE_STYLES.gradients['main-bar'];

    // Calculate center of mass for workers/label
    const centerTile = tiles[Math.floor(tiles.length / 2)] || { x: 0, y: 0 };
    const { left: centerLeft, top: centerTop } = projectIso(area.position.x + centerTile.x, area.position.y + centerTile.y);

    // Smooth lift calculation
    const lift = isSelected ? -20 : 0;

    return (
        <div
            className="absolute z-10 pointer-events-none" // Container is pointer-events-none to let children handle clicks or bubble up
            style={{ width: 0, height: 0 }} // Virtual container
        >
            {/* Render Voxel Blocks */}
            {tiles.map((tile, i) => {
                const { left, top } = projectIso(area.position.x + tile.x, area.position.y + tile.y);
                // Depth sorting hack: z-index based on grid sum
                const zIndex = 10 + Math.floor(area.position.x + tile.x + area.position.y + tile.y);

                return (
                    <div
                        key={`${i}`}
                        className="absolute transition-all duration-500 ease-out will-change-transform group cursor-pointer pointer-events-auto"
                        style={{
                            left,
                            top,
                            width: ISO_CONSTANTS.TILE_WIDTH,
                            height: ISO_CONSTANTS.TILE_HEIGHT * ISO_CONSTANTS.DEPTH_SCALE,
                            zIndex: isSelected ? 50 + zIndex : zIndex,
                            transform: `translateY(${lift}px)`
                        }}
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                    >
                        {/* Shadow (Only for bottom-most tiles? Simplification: all have shadow for "floating" effect) */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[20%] bg-black/40 blur-xl rounded-full transition-all duration-500"
                            style={{
                                opacity: isSelected ? 0.6 : 0.3,
                                transform: `translate(-50%, ${isSelected ? '20px' : '0px'}) scale(${isSelected ? 1.2 : 1})`
                            }}
                        />

                        {/* Top Face */}
                        <div
                            className="absolute top-0 left-0 w-full h-[65%] rounded-2xl overflow-hidden backdrop-blur-md border-[0.5px] border-white/20 transition-all duration-300"
                            style={{
                                background: gradient,
                                boxShadow: isSelected ? SCENE_STYLES.shadows.selected : SCENE_STYLES.shadows.block,
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                            {/* Grid overlay only on top faces */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                        </div>

                        {/* Sides for pseudo 3D */}
                        <div className="absolute top-[32%] left-[2px] w-[50%] h-[40%] bg-black/20 transform skew-y-12 origin-top-right rounded-bl-xl pointer-events-none blur-[1px]" />
                        <div className="absolute top-[32%] right-[2px] w-[50%] h-[40%] bg-black/40 transform -skew-y-12 origin-top-left rounded-br-xl pointer-events-none blur-[1px]" />
                    </div>
                );
            })}

            {/* Label & Workers Overlay (Centered on the "Center of Mass") */}
            <div
                className="absolute pointer-events-none z-[100] transition-transform duration-500"
                style={{
                    left: centerLeft,
                    top: centerTop,
                    transform: `translateY(${lift - 40}px)` // Floating above
                }}
            >
                {/* Floating Label */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pb-4">
                    <div className={`
                        p-3 rounded-full mb-1 transition-all duration-500
                        ${isSelected ? 'bg-white text-cyan-600 scale-110 shadow-lg' : 'bg-white/10 text-white'}
                    `}>
                        <Icon svg={ICONS[area.icon as keyof typeof ICONS] || ICONS.activity} className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                        {area.name}
                    </span>

                    {/* Status Pip */}
                    {area.stats.activeTickets > 0 && (
                        <div className="absolute -top-1 -right-1">
                            <span className="flex items-center justify-center w-5 h-5 bg-rose-500 rounded-full text-[9px] font-bold text-white shadow-lg border border-white animate-bounce">
                                {area.stats.activeTickets}
                            </span>
                        </div>
                    )}
                </div>

                {/* Workers Layer (Relative to Center) */}
                <div className="absolute inset-0">
                    {workers.map((worker, idx) => (
                        <WorkerAvatar key={worker.id} worker={worker} index={idx} total={workers.length} />
                    ))}
                </div>
            </div>
        </div>
    );
});

const WorkerAvatar = React.memo(({ worker, index, total }: { worker: BarWorker, index: number, total: number }) => {
    // Distribute workers in a small circle around center
    const angle = (index / (total || 1)) * Math.PI * 2;
    const radius = 30;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * (radius * 0.5); // Flattened circle for perspective

    // Animation: bobbing + slight orbit
    const [floatOffset, setFloatOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFloatOffset(Math.sin(Date.now() / 500) * 3);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="absolute top-1/2 left-1/2 transition-all duration-1000 ease-in-out z-30"
            style={{
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY + floatOffset}px))`
            }}
        >
            <div className="relative group pointer-events-auto cursor-help">
                <div className={`
                    w-8 h-8 rounded-full border-2 border-white 
                    bg-gradient-to-br from-amber-400 to-orange-500
                    flex items-center justify-center
                    shadow-[0_4px_10px_rgba(0,0,0,0.3)]
                    overflow-hidden
                `}>
                    {/* Mini Avatar or Initials */}
                    <span className="text-[9px] font-black text-white">{worker.name.substring(0, 2).toUpperCase()}</span>
                </div>

                {/* Activity Indicator Ring */}
                {worker.activity !== 'idle' && (
                    <div className="absolute -inset-1 border-2 border-dashed border-white/50 rounded-full animate-[spin_8s_linear_infinite]" />
                )}

                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[8px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm pointer-events-none">
                    {worker.activity} | Stress: {worker.stressLevel}%
                </div>
            </div>
        </div>
    );
});

export const DigitalBarIsometricCanvas: React.FC<DigitalBarIsometricCanvasProps> = ({
    sceneState,
    onSelectArea,
    onSetZoom,
    onSetPan
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isExpanded, setIsExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'holographic' | 'operational'>('holographic');

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        onSetPan(sceneState.panOffset.x + dx, sceneState.panOffset.y + dy);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => { setIsDragging(false); };

    // Toggle Expanded Mode
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
        // Reset pan/zoom on toggle for safety
        onSetPan(0, 0);
        onSetZoom(isExpanded ? 1 : 1.5);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'holographic' ? 'operational' : 'holographic');
    };

    // Particles System (Simple CSS bubbles)
    const particles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 5 + 's',
        duration: 3 + Math.random() * 5 + 's'
    })), []);

    const canvasContent = (
        <div
            className={`
                w-full h-full overflow-hidden bg-slate-950 relative rounded-2xl border border-slate-800 shadow-2xl group cursor-move select-none
                ${isExpanded ? 'fixed inset-4 z-[200] rounded-[32px] border-slate-700 ring-4 ring-cyan-500/20 shadow-[0_0_100px_rgba(34,211,238,0.2)]' : ''}
            `}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
            style={{
                background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)',
                // Size override for expanded
                width: isExpanded ? 'calc(100vw - 2rem)' : '100%',
                height: isExpanded ? 'calc(100vh - 2rem)' : '100%'
            }}
        >
            {/* Ambient Background Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
                        style={{
                            left: p.left,
                            top: p.top,
                            animation: `float ${p.duration} ease-in-out infinite`,
                            animationDelay: p.delay
                        }}
                    />
                ))}
            </div>

            {/* Grid Overlay */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(60deg) scale(2) translateY(-100px)',
                    transformOrigin: 'top center'
                }}
            />

            {/* Title Overlay */}
            <div className="absolute top-6 left-6 pointer-events-none z-50">
                <h2 className="text-white/80 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 drop-shadow-md">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                    Nexus Operations View {isExpanded && '(EXPANDED)'}
                </h2>
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 right-6 pointer-events-auto z-50 flex gap-2">
                <button
                    onClick={toggleViewMode}
                    className={`p-3 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 active:scale-95 border shadow-lg ${viewMode === 'operational' ? 'bg-cyan-500 border-cyan-400' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                    title={viewMode === 'holographic' ? "Ver Métricas Operativas" : "Ver Escena Holográfica"}
                >
                    <Icon svg={viewMode === 'holographic' ? ICONS.grid : ICONS.box} className="w-5 h-5" />
                </button>
                <button
                    onClick={toggleExpanded}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 active:scale-95 border border-white/10 shadow-lg"
                    title={isExpanded ? "Contraer Vista" : "Expandir Vista"}
                >
                    <Icon svg={isExpanded ? ICONS.minimize : ICONS.maximize} className="w-5 h-5" />
                </button>
            </div>

            {/* CONTENT SWITCHER */}
            {viewMode === 'operational' ? (
                <div className="absolute inset-0 z-40 overflow-y-auto p-20 pt-24 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {sceneState.areas.map(area => {
                            const snapshot = area.stats.snapshot;
                            const efficiencyColor = (snapshot?.efficiency || 100) > 80 ? 'bg-emerald-500' : (snapshot?.efficiency || 100) > 50 ? 'bg-amber-500' : 'bg-rose-500';

                            return (
                                <div key={area.id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-[28px] p-6 flex flex-col gap-4 hover:border-cyan-500/30 transition-colors shadow-2xl relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${efficiencyColor} opacity-80`} />

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-wider">{area.name}</h3>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{area.type.replace('-', ' ')}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Icon svg={ICONS[area.icon as keyof typeof ICONS] || ICONS.activity} className="w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>

                                    {/* KPI Grid */}
                                    {snapshot ? (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                <span className="text-[9px] text-slate-400 block mb-1">TICKETS/H</span>
                                                <span className="text-xl font-mono text-cyan-400">{Math.round(snapshot.ticketsPerHour)}</span>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                <span className="text-[9px] text-slate-400 block mb-1">STRESS EQ.</span>
                                                <span className={`text-xl font-mono ${snapshot.teamStress > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{Math.round(snapshot.teamStress)}%</span>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-2 flex justify-between items-center">
                                                <span className="text-[9px] text-slate-400">EFICIENCIA GLOBAL</span>
                                                <span className={`text-xl font-mono ${efficiencyColor.replace('bg-', 'text-')}`}>{Math.round(snapshot.efficiency)}%</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 text-xs">Sin datos operativos</div>
                                    )}

                                    <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                                        {/* Workers Avatars Mock */}
                                        <div className="flex -space-x-3">
                                            {sceneState.workers.filter(w => w.areaId === area.id).map(w => (
                                                <div key={w.id} className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[9px] text-white font-bold" title={`${w.name}: ${w.activity}`}>
                                                    {w.name.substring(0, 2)}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="ml-auto flex items-center text-xs font-bold text-slate-500">
                                            {sceneState.workers.filter(w => w.areaId === area.id).length} Átomos
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Scene Container */
                <div
                    className="absolute w-full h-full transition-transform duration-75 ease-out origin-center preserve-3d"
                    style={{
                        transform: `translate(${sceneState.panOffset.x}px, ${sceneState.panOffset.y}px) scale(${sceneState.zoomLevel})`
                    }}
                >
                    {/* Render Areas sorted by Y position (simple depth sorting) */}
                    {[...sceneState.areas]
                        .sort((a, b) => (a.position.x + a.position.y) - (b.position.x + b.position.y))
                        .map(area => {
                            // Load Glow Calculation
                            const loadGlow = area.stats.load > 70
                                ? `0 0 ${area.stats.load * 0.5}px rgba(244, 63, 94, ${area.stats.load / 200})` // Rose glow
                                : 'none';

                            return (
                                <div key={area.id} style={{ filter: `drop-shadow(${loadGlow})` }} className="transition-all duration-1000">
                                    <AreaBlock
                                        area={area}
                                        isSelected={sceneState.selectedAreaId === area.id}
                                        onClick={() => onSelectArea(area.id)}
                                        workers={sceneState.workers.filter(w => w.areaId === area.id)}
                                    />
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-auto">
                <button
                    className="w-10 h-10 bg-slate-800/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetZoom(sceneState.zoomLevel + 0.2); }}
                >
                    <Icon svg={ICONS.plus} className="w-5 h-5" />
                </button>
                <button
                    className="w-10 h-10 bg-slate-800/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetZoom(sceneState.zoomLevel - 0.2); }}
                >
                    <Icon svg={ICONS.minus} className="w-5 h-5" />
                </button>
                <button
                    className="w-10 h-10 bg-slate-800/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetPan(0, 0); }}
                >
                    <Icon svg={ICONS.refreshCw} className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    // Backdrop for expanded view
    if (isExpanded) {
        return (
            <>
                <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={toggleExpanded} />
                {canvasContent}
            </>
        );
    }

    return canvasContent;
};

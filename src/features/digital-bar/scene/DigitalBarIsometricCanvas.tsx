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

const AreaBlock = React.memo(({ area, isSelected, onClick, workers }: { area: BarArea, isSelected: boolean, onClick: () => void, workers: BarWorker[] }) => {
    const { left, top } = projectIso(area.position.x, area.position.y);
    const gradient = SCENE_STYLES.gradients[area.type as keyof typeof SCENE_STYLES.gradients] || SCENE_STYLES.gradients['main-bar'];

    // Smooth lift calculation
    const lift = isSelected ? -20 : 0;

    return (
        <div
            className="absolute transition-all duration-500 ease-out z-10"
            style={{
                left,
                top,
                width: ISO_CONSTANTS.TILE_WIDTH,
                height: ISO_CONSTANTS.TILE_HEIGHT * ISO_CONSTANTS.DEPTH_SCALE,
                zIndex: isSelected ? 50 : 10 + Math.floor(top) // Z-index based on depth (y position)
            }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* Shadow */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[20%] bg-black/40 blur-xl rounded-full transition-all duration-500"
                style={{
                    opacity: isSelected ? 0.6 : 0.3,
                    transform: `translate(-50%, ${isSelected ? '20px' : '0px'}) scale(${isSelected ? 1.2 : 1})`
                }}
            />

            {/* Block Container with Lift */}
            <div
                className="relative w-full h-full transition-transform duration-500 will-change-transform group cursor-pointer"
                style={{ transform: `translateY(${lift}px)` }}
            >
                {/* Top Face (The Platform) */}
                <div
                    className="absolute top-0 left-0 w-full h-[65%] rounded-2xl overflow-hidden backdrop-blur-md border-[0.5px] border-white/20 transition-all duration-300"
                    style={{
                        background: gradient,
                        boxShadow: isSelected ? SCENE_STYLES.shadows.selected : SCENE_STYLES.shadows.block,
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' // Diamond shape clip for cleaner iso edges if needed, or rounded rect
                    }}
                >
                    {/* Glass Shine */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />

                    {/* Grid Pattern on Top */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                    {/* Content Centered on Top Face */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center transform -rotate-0 pb-4 scale-y-75 origin-center">
                        {/* Scale Y to counter foreshortening if strict iso, but here we keep it simple 2.5D */}
                        <div className={`
                            p-3 rounded-full mb-1 transition-all duration-500
                            ${isSelected ? 'bg-white text-cyan-600 scale-110 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}
                        `}>
                            <Icon svg={ICONS[area.icon as keyof typeof ICONS] || ICONS.activity} className="w-8 h-8" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {area.name}
                        </span>
                    </div>

                    {/* Status Pip */}
                    {area.stats.activeTickets > 0 && (
                        <div className="absolute top-[20%] right-[20%]">
                            <span className="flex items-center justify-center w-6 h-6 bg-rose-500 rounded-full text-[10px] font-bold text-white shadow-lg border-2 border-white/20 animate-bounce">
                                {area.stats.activeTickets}
                            </span>
                        </div>
                    )}
                </div>

                {/* Left/Right Side Faces for Pseudo 3D Depth (Optional visual trickery, simplified here with CSS layers) */}
                <div
                    className="absolute top-[32%] left-[2px] w-[50%] h-[40%] bg-black/20 transform skew-y-12 origin-top-right rounded-bl-xl pointer-events-none blur-[1px]"
                />
                <div
                    className="absolute top-[32%] right-[2px] w-[50%] h-[40%] bg-black/40 transform -skew-y-12 origin-top-left rounded-br-xl pointer-events-none blur-[1px]"
                />

                {/* Workers Layer */}
                <div className="absolute inset-0 pointer-events-none">
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

    // Particles System (Simple CSS bubbles)
    const particles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 5 + 's',
        duration: 3 + Math.random() * 5 + 's'
    })), []);

    return (
        <div
            className="w-full h-full overflow-hidden bg-slate-950 relative rounded-2xl border border-slate-800 shadow-2xl group cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
            style={{
                background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)'
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
                    Nexus Operations View
                </h2>
            </div>

            {/* Scene Container */}
            <div
                className="absolute w-full h-full transition-transform duration-75 ease-out origin-center preserve-3d"
                style={{
                    transform: `translate(${sceneState.panOffset.x}px, ${sceneState.panOffset.y}px) scale(${sceneState.zoomLevel})`
                }}
            >
                {/* Render Areas sorted by Y position (simple depth sorting) */}
                {[...sceneState.areas]
                    .sort((a, b) => (a.position.x + a.position.y) - (b.position.x + b.position.y))
                    .map(area => (
                        <AreaBlock
                            key={area.id}
                            area={area}
                            isSelected={sceneState.selectedAreaId === area.id}
                            onClick={() => onSelectArea(area.id)}
                            workers={sceneState.workers.filter(w => w.areaId === area.id)}
                        />
                    ))
                }
            </div>

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
};


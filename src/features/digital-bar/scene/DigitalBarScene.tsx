import React, { useRef, useState, useMemo } from 'react';
import { BarSceneState } from './digitalBarTypes';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { DigitalBarArea } from './DigitalBarArea';
import { soundEngine } from '../../avatar/soundEngine';

interface DigitalBarSceneProps {
    sceneState: BarSceneState;
    onSelectArea: (areaId: string | null) => void;
    onSetZoom: (zoom: number) => void;
    onSetPan: (x: number, y: number) => void;
}

export const DigitalBarScene: React.FC<DigitalBarSceneProps> = ({
    sceneState,
    onSelectArea,
    onSetZoom,
    onSetPan
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isExpanded, setIsExpanded] = useState(false);
    // Removed local viewMode state to simplify - DigitalBarView handles specific modes, this component focuses on the Scene.
    // However, if we need full screen to contain analytics, we might need it back. 
    // For now, let's keep it pure to the Scene.

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
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
        // Reset pan/zoom on toggle for optimal view
        onSetPan(0, 0);
        onSetZoom(isExpanded ? 1 : 1.3);
    };

    // Ambient Particles
    const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 5 + 's',
        duration: 4 + Math.random() * 6 + 's',
        size: Math.random() * 4 + 2
    })), []);

    const canvasContent = (
        <div
            className={`
                w-full h-full overflow-hidden bg-slate-950 relative rounded-[20px] shadow-2xl group cursor-grab active:cursor-grabbing select-none
                ${isExpanded ? 'fixed inset-0 z-[200] rounded-none' : ''}
            `}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
            style={{
                background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
                width: isExpanded ? '100vw' : '100%',
                height: isExpanded ? '100vh' : '100%'
            }}
        >
            {/* Ambient Starfield (Parallax Layer 1) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute bg-white rounded-full animate-pulse"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: p.size > 4 ? 2 : 1,
                            height: p.size > 4 ? 2 : 1,
                            animation: `float ${p.duration} ease-in-out infinite`,
                            animationDelay: p.delay,
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                    />
                ))}
            </div>
            {/* Nebula Glow (Parallax Layer 2) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    background: 'radial-gradient(circle at 30% 70%, rgba(34,211,238,0.15), transparent 40%), radial-gradient(circle at 70% 30%, rgba(168,85,247,0.15), transparent 40%)',
                    filter: 'blur(60px)'
                }}
            />

            {/* Background & Atmosphere - Holographic Polish */}
            <div className="absolute inset-0 bg-slate-900 pointer-events-none" />

            {/* Ambient Bloom */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_70%)] animate-pulse duration-[8000ms]" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Grid Pattern with Perspective */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) scale(2)',
                    transformOrigin: 'top center'
                }}
            />

            {/* Isometric Canvas Container */}

            {/* Title Overlay */}
            <div className={`absolute top-8 left-8 pointer-events-none z-50 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 drop-shadow-md bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Nexus Digital Bar {isExpanded && '(LIVE)'}
                </h2>
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 right-6 pointer-events-auto z-50 flex gap-2">
                <button
                    onClick={() => {
                        const newState = !soundEngine.isEnabled();
                        soundEngine.setEnabled(newState);
                        if (newState) soundEngine.playClickSoft();
                        // Force re-render of button state
                        setIsDragging(d => d);
                    }}
                    className={`p-3 backdrop-blur-md rounded-full transition-all hover:scale-110 active:scale-95 border border-white/10 shadow-lg ${soundEngine.isEnabled() ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-slate-400'}`}
                    title={soundEngine.isEnabled() ? "Silenciar FX" : "Activar FX"}
                >
                    <Icon svg={ICONS.music} className={`w-5 h-5 ${!soundEngine.isEnabled() && 'opacity-50'}`} />
                </button>

                <button
                    onClick={() => {
                        toggleExpanded();
                        soundEngine.playClickSoft();
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:scale-110 active:scale-95 border border-white/10 shadow-lg"
                    title={isExpanded ? "Contraer Vista" : "Expandir Vista"}
                >
                    <Icon svg={isExpanded ? ICONS.minimize : ICONS.maximize} className="w-5 h-5" />
                </button>
            </div>

            {/* Scene Container - Centered */}
            <div
                className="absolute w-full h-full transition-transform duration-300 ease-out origin-center preserve-3d flex items-center justify-center"
                style={{
                    transform: `translate(${sceneState.panOffset.x}px, ${sceneState.panOffset.y}px) scale(${sceneState.zoomLevel})`
                }}
            >
                {/* Render Areas sorted by Y position */}
                {[...sceneState.areas]
                    .sort((a, b) => (a.position.x + a.position.y) - (b.position.x + b.position.y))
                    .map((area, index) => {
                        // Deterministic visual offset based on index to break the perfect grid slightly (Natural feel)
                        // Do NOT change actual logic position, only visual render transform
                        const offsetX = (index % 2 === 0 ? 1 : -1) * (index * 15);
                        const offsetY = (index % 3 === 0 ? 1 : -1) * (index * 10);

                        // Load Glow Calculation
                        const loadGlow = area.stats.load > 80
                            ? `0 0 ${area.stats.load}px rgba(244, 63, 94, 0.4)` // Rose glow
                            : 'none';

                        return (
                            <div
                                key={area.id}
                                style={{
                                    filter: `drop-shadow(${loadGlow})`,
                                    marginLeft: `${offsetX}px`,
                                    marginTop: `${offsetY}px`
                                }}
                                className="transition-all duration-1000 absolute left-1/2 top-1/2"
                            >
                                <DigitalBarArea
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

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-auto">
                <button
                    className="w-10 h-10 bg-slate-900/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetZoom(Math.min(2.5, sceneState.zoomLevel + 0.2)); }}
                >
                    <Icon svg={ICONS.plus} className="w-5 h-5" />
                </button>
                <button
                    className="w-10 h-10 bg-slate-900/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetZoom(Math.max(0.5, sceneState.zoomLevel - 0.2)); }}
                >
                    <Icon svg={ICONS.minus} className="w-5 h-5" />
                </button>
                <button
                    className="w-10 h-10 bg-slate-900/80 hover:bg-cyan-500 hover:text-white text-slate-400 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-lg transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onSetPan(0, 0); onSetZoom(1); }}
                >
                    <Icon svg={ICONS.refreshCw} className="w-4 h-4" />
                </button>
            </div>

            {isExpanded && (
                <div
                    className="absolute top-6 right-20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold pointer-events-none animate-in fade-in"
                >
                    ESC para Salir
                </div>
            )}
        </div>
    );

    return canvasContent;
};

export default DigitalBarScene;

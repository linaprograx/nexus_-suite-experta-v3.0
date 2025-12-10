import React, { useMemo } from 'react';
import { BarArea, BarWorker } from './digitalBarTypes';
import { SCENE_STYLES, ISO_CONSTANTS } from './sceneStyles';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { WorkerAvatar } from './WorkerAvatar';
import { soundEngine } from '../../avatar/soundEngine';

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
    const w = Math.max(1, size?.width || 1);
    const h = Math.max(1, size?.height || 1);

    if (shape === 'L') {
        for (let y = 0; y < h; y++) tiles.push({ x: 0, y });
        for (let x = 1; x < w; x++) tiles.push({ x, y: h - 1 });
    } else if (shape === 'U') {
        for (let y = 0; y < h; y++) tiles.push({ x: 0, y });
        for (let x = 1; x < w - 1; x++) tiles.push({ x, y: h - 1 });
        for (let y = 0; y < h; y++) tiles.push({ x: w - 1, y });
    } else {
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
};

export const DigitalBarArea = React.memo(({ area, isSelected, onClick, workers }: { area: BarArea, isSelected: boolean, onClick: () => void, workers: BarWorker[] }) => {
    const tiles = useMemo(() => getShapeTiles(area.shape, area.size), [area.shape, area.size]);
    const gradient = SCENE_STYLES.gradients[area.type as keyof typeof SCENE_STYLES.gradients] || SCENE_STYLES.gradients['main-bar'];

    // Calculate center of mass
    const centerTile = tiles[Math.floor(tiles.length / 2)] || { x: 0, y: 0 };
    const { left: centerLeft, top: centerTop } = projectIso(area.position.x + centerTile.x, area.position.y + centerTile.y);

    const lift = isSelected ? -20 : 0;

    return (
        <div
            className="absolute z-10 pointer-events-none"
            style={{ width: 0, height: 0 }}
        >
            {/* Render Tiles */}
            {tiles.map((tile, i) => {
                const { left, top } = projectIso(area.position.x + tile.x, area.position.y + tile.y);
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
                        onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playClickSoft();
                            onClick();
                        }}
                        onMouseEnter={() => soundEngine.playHover()}
                    >
                        {/* Soft Shadow with Selection Pulse */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[30%] bg-black/40 blur-xl rounded-full transition-all duration-700"
                            style={{
                                opacity: isSelected ? 0.6 : 0.25,
                                transform: `translate(-50%, ${isSelected ? '35px' : '10px'}) scale(${isSelected ? 1.3 : 1})`,
                                boxShadow: isSelected ? '0 0 40px rgba(6,182,212,0.5)' : 'none'
                            }}
                        />

                        {/* Top Face - Lift Animation */}
                        <div
                            className={`absolute top-0 left-0 w-full h-[65%] rounded-lg overflow-hidden backdrop-blur-md border-[0.5px] border-white/40 transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]`}
                            style={{
                                background: gradient,
                                boxShadow: isSelected ? SCENE_STYLES.shadows.selected : SCENE_STYLES.shadows.block,
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                            }}
                        >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                        </div>

                        {/* Sides (Simulated 3D) */}
                        <div className="absolute top-[32%] left-[2px] w-[50%] h-[40%] bg-black/20 transform skew-y-12 origin-top-right rounded-bl-md pointer-events-none" />
                        <div className="absolute top-[32%] right-[2px] w-[50%] h-[40%] bg-black/40 transform -skew-y-12 origin-top-left rounded-br-md pointer-events-none" />
                    </div>
                );
            })}

            {/* Label & Workers Overlay */}
            <div
                className="absolute pointer-events-none z-[60] transition-transform duration-500"
                style={{
                    left: centerLeft,
                    top: centerTop,
                    transform: `translateY(${lift - 45}px)`
                }}
            >
                {/* Floating Label */}
                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pb-6">
                    <div className={`
                        p-2.5 rounded-full mb-2 transition-all duration-500 flex items-center justify-center
                        ${isSelected ? 'bg-white text-cyan-600 scale-110 shadow-xl' : 'bg-slate-900/60 text-white backdrop-blur-md border border-white/20'}
                    `}>
                        <Icon svg={ICONS[area.icon as keyof typeof ICONS] || ICONS.activity} className="w-5 h-5" />
                    </div>

                    <span className="text-[9px] font-black text-slate-100 uppercase tracking-widest drop-shadow-md bg-slate-900/60 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
                        {area.name}
                    </span>

                    {/* Active Ticket Pip */}
                    {area.stats.activeTickets > 0 && (
                        <div className="absolute -top-1 -right-1">
                            <span className="flex items-center justify-center w-5 h-5 bg-rose-500 rounded-full text-[9px] font-bold text-white shadow-lg border border-white animate-bounce">
                                {area.stats.activeTickets}
                            </span>
                        </div>
                    )}
                </div>

                {/* Workers Layer */}
                <div className="absolute inset-0 z-[70]">
                    {workers.map((worker, idx) => (
                        <WorkerAvatar key={worker.id} worker={worker} index={idx} total={workers.length} />
                    ))}
                </div>
            </div>
        </div>
    );
});

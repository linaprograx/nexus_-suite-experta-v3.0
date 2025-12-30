import React, { useState, useEffect } from 'react';
import { BarWorker } from './digitalBarTypes';

export const WorkerAvatar = React.memo(({ worker, index, total }: { worker: BarWorker, index: number, total: number }) => {
    // Distribute workers in a small circle around center
    const angle = (index / (total || 1)) * Math.PI * 2;
    const radius = 28;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * (radius * 0.5); // Flattened circle for perspective

    // Animation: bobbing
    const [floatOffset, setFloatOffset] = useState(0);

    useEffect(() => {
        const uniqueOffset = index * 1000;
        const interval = setInterval(() => {
            const time = Date.now() + uniqueOffset;
            setFloatOffset(Math.sin(time / 400) * 4);
        }, 30);
        return () => clearInterval(interval);
    }, [index]);

    return (
        <div
            className="absolute top-1/2 left-1/2 transition-all duration-700 ease-in-out z-30"
            style={{
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY - floatOffset}px))`,
                animation: index % 2 === 0 ? 'sway 3s ease-in-out infinite' : 'pulse 4s ease-in-out infinite'
            }}
        >
            <div className="relative group pointer-events-auto cursor-help hover:scale-125 transition-transform duration-200">
                <style>
                    {`
                    @keyframes sway { 0%, 100% { rotate: 0deg; } 50% { rotate: 5deg; } }
                    `}
                </style>
                <div className={`
                    w-7 h-7 rounded-full border-[1.5px] border-white 
                    bg-gradient-to-br from-amber-400 to-orange-500
                    flex items-center justify-center
                    shadow-[0_4px_10px_rgba(0,0,0,0.3)]
                    overflow-hidden
                `}>
                    <span className="text-[8px] font-black text-white leading-none">{worker.name.substring(0, 2).toUpperCase()}</span>
                </div>

                {/* Activity Indicator Ring */}
                {worker.activity !== 'idle' && (
                    <div className="absolute -inset-0.5 border border-dashed border-white/60 rounded-full animate-[spin_6s_linear_infinite]" />
                )}

                {/* Tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {worker.activity}
                </div>
            </div>
        </div>
    );
});

import React from 'react';

interface NexusOrbProps {
    /** Diameter in pixels. */
    size?: number;
    className?: string;
    /** Disable the outer glow (e.g. in very compact contexts). */
    glow?: boolean;
}

/**
 * Nexus brand mark — a refined warm energy orb (amber → orange → rose).
 * Single source of truth used by the login screen and the sidebar logo.
 */
export const NexusOrb: React.FC<NexusOrbProps> = ({ size = 40, className = '', glow = true }) => {
    const gloss = Math.max(2, size * 0.14);
    return (
        <div
            className={`relative flex-shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {glow && (
                <div
                    className="absolute inset-0 rounded-full bg-orange-500/25 group-hover:bg-orange-500/40 transition-colors duration-700"
                    style={{ filter: `blur(${Math.max(6, size * 0.4)}px)` }}
                />
            )}
            <div
                className="w-full h-full rounded-full relative z-10 overflow-hidden ring-1 ring-white/10"
                style={{ boxShadow: 'inset 0 -10px 18px rgba(0,0,0,0.7), inset 0 4px 14px rgba(255,255,255,0.35)' }}
            >
                {/* Warm conic core */}
                <div
                    className="absolute inset-[-50%] w-[200%] h-[200%] animate-[spin_28s_linear_infinite]"
                    style={{ background: 'conic-gradient(from 210deg, #fbbf24, #f97316, #e11d48, #7c2d12, #f59e0b, #fbbf24)' }}
                />
                {/* Dark core for depth */}
                <div className="absolute inset-[18%] rounded-full bg-[#0a0604]/40" style={{ filter: 'blur(6px)' }} />
                {/* Surface gloss */}
                <div
                    className="absolute bg-white/55 rounded-full -rotate-45"
                    style={{ top: size * 0.16, left: size * 0.22, width: gloss * 1.8, height: gloss * 0.8, filter: 'blur(3px)' }}
                />
            </div>
            {/* Orbit ring */}
            <div className="absolute rounded-full border border-white/10 z-0" style={{ inset: -Math.max(3, size * 0.08) }} />
        </div>
    );
};

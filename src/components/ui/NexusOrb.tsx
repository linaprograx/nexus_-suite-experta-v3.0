import React from 'react';

interface NexusOrbProps {
    /** Diameter in pixels. */
    size?: number;
    className?: string;
    /** Disable the outer glow (e.g. in very compact contexts). */
    glow?: boolean;
}

/**
 * Nexus brand mark. The raster source is also used by the browser and PWA
 * icons, so login, sidebar and installed app always show the same identity.
 */
export const NexusOrb: React.FC<NexusOrbProps> = ({ size = 40, className = '', glow = true }) => {
    return (
        <div
            className={`relative flex-shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {glow && (
                <div
                    className="absolute inset-0 rounded-full bg-fuchsia-500/20 group-hover:bg-cyan-400/30 transition-colors duration-700"
                    style={{ filter: `blur(${Math.max(6, size * 0.4)}px)` }}
                />
            )}
            <img
                src="/nexus-logo.png"
                alt="Nexus"
                draggable={false}
                className="relative z-10 h-full w-full rounded-full object-cover ring-1 ring-white/20"
            />
        </div>
    );
};

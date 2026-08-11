import React from 'react';

interface NexusOrbProps {
    /** Diameter in pixels. */
    size?: number;
    className?: string;
    /** Disable the outer glow (e.g. in very compact contexts). */
    glow?: boolean;
    /** Marca la imagen como prioritaria: úsalo en la pantalla de acceso. */
    prioritaria?: boolean;
}

/**
 * Marca de Nexus. La misma imagen alimenta los iconos del navegador y de la PWA,
 * así que acceso, barra lateral y app instalada muestran la misma identidad.
 *
 * ## El halo espera a la imagen, y no al revés
 *
 * El halo se pintaba desde el primer instante, mientras el PNG aún estaba
 * cargando. Y a estos tamaños no se lee como un halo: el desenfoque es de 16 px
 * sobre un logo de 40, y de 29 sobre uno de 72 — un círculo difuminado a esa
 * proporción es **una mancha cuadrada**. Sobre el fondo oscuro se veía como un
 * recuadro semitransparente flotando donde debía estar el logo, hasta que la
 * imagen terminaba de pintar encima y lo disimulaba.
 *
 * Ahora el halo solo aparece **cuando la imagen ya está**: entra con ella, no
 * antes. Y si la imagen falla, no queda una mancha huérfana.
 */
export const NexusOrb: React.FC<NexusOrbProps> = ({
    size = 40,
    className = '',
    glow = true,
    prioritaria = false,
}) => {
    const [cargada, setCargada] = React.useState(false);

    return (
        <div
            className={`relative flex-shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {glow && cargada && (
                <div
                    className="absolute inset-0 rounded-full bg-fuchsia-500/20 group-hover:bg-cyan-400/30 transition-colors duration-700"
                    style={{ filter: `blur(${Math.max(6, size * 0.4)}px)` }}
                />
            )}
            <img
                src="/nexus-logo.png"
                alt="Nexus"
                // Medidas explícitas: el hueco queda reservado desde el primer
                // cuadro, así que la imagen no empuja nada al aparecer.
                width={size}
                height={size}
                decoding="async"
                {...(prioritaria ? { fetchPriority: 'high' as const } : {})}
                draggable={false}
                onLoad={() => setCargada(true)}
                className={`relative z-10 h-full w-full object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.38)] transition-opacity duration-300 ${cargada ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

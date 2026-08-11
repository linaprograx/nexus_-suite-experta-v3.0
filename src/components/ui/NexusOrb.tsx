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
                    className="absolute rounded-full transition-opacity duration-700 pointer-events-none"
                    style={{
                        // El halo con degradado radial, NO con `filter: blur()`.
                        //
                        // Un elemento con `filter` dentro de un ancestro con
                        // `backdrop-filter` se pinta en WebKit como un
                        // RECTÁNGULO opaco: es el cuadro que rodeaba al logo en
                        // la pantalla de acceso, cuya tarjeta es de cristal
                        // (`backdrop-blur-[24px]`). No era del PNG —sus esquinas
                        // son transparentes y su silueta es un círculo— ni del
                        // tamaño del desenfoque: era el propio filtro.
                        //
                        // Un degradado radial da el mismo halo suave sin filtro
                        // alguno, así que el artefacto no puede reaparecer.
                        inset: -size * 0.35,
                        background: 'radial-gradient(circle closest-side, rgba(217,70,239,0.28), rgba(217,70,239,0.10) 55%, transparent 78%)',
                    }}
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
                // Sin `drop-shadow`: también es un `filter`, y sobre una tarjeta
                // de cristal provoca el mismo rectángulo. El halo ya lo pone el
                // degradado de detrás.
                className={`relative z-10 h-full w-full object-contain transition-opacity duration-300 ${cargada ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

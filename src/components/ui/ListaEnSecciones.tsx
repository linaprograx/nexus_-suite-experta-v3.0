import React from 'react';
import { Plegable } from './Plegable';
import { Seccion, seccionesConResultados } from '../../core/agrupacion/secciones';

/**
 * Una lista repartida en **secciones plegables**. Puntos 1 y 18.
 *
 * Vive en `ui/` y no dentro de Inventario o de Mercado porque las dos
 * pantallas la usan con criterios distintos —familia y proveedor— y **la misma
 * conducta**. Dos copias de esta lógica se separarían a la primera corrección,
 * que es el defecto que este proyecto lleva persiguiendo desde el principio.
 *
 * ## Las tres decisiones que no son obvias
 *
 * **1. Buscar manda sobre plegar.** Mientras hay búsqueda activa, las secciones
 * con resultados se abren solas y el estado manual se ignora. Sin esto,
 * escribir un nombre que existe devolvería una pantalla de cabeceras cerradas
 * —resultados invisibles— y el buscador parecería roto. Al borrar la búsqueda
 * vuelve exactamente lo que el usuario tenía abierto: su estado no se pisa.
 *
 * **2. Una sección abierta a la vez, y solo a mano.** Varias abiertas
 * convierten la lista en el muro que veníamos a evitar. La apertura automática
 * por búsqueda sí puede abrir varias: ahí lo que importa es ver todo lo que
 * coincide.
 *
 * **3. Nada se monta hasta que se abre.** Es lo que hace que esto sea también
 * la mejora de rendimiento (I5 y A4): lo plegado no existe en el DOM.
 */
export function ListaEnSecciones<T>({
    secciones, buscando, coincide, children, vacio, cabeceraExtra, className = '',
}: {
    secciones: Seccion<T>[];
    /** Si hay una búsqueda activa. No basta con mirar `coincide`. */
    buscando: boolean;
    /** Qué cuenta como resultado. Solo se consulta si `buscando`. */
    coincide?: (item: T) => boolean;
    /** Cómo se pinta el contenido de una sección abierta. */
    children: (items: T[], seccion: Seccion<T>) => React.ReactNode;
    vacio?: React.ReactNode;
    /**
     * Contenido extra en la cabecera, a la derecha del título. Va aquí y no
     * dentro del contenido porque tiene que verse **con la sección cerrada**:
     * si hicieras falta abrirla para enterarte de que ese proveedor llega
     * tarde, te enterarías después de haber decidido pedirle.
     */
    cabeceraExtra?: (seccion: Seccion<T>) => React.ReactNode;
    className?: string;
}) {
    const [abiertaAMano, setAbiertaAMano] = React.useState<string | null>(null);

    const porBusqueda = React.useMemo(
        () => (buscando && coincide ? new Set(seccionesConResultados(secciones, coincide)) : null),
        [buscando, coincide, secciones],
    );

    if (secciones.length === 0) return <>{vacio ?? null}</>;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {secciones.map(seccion => {
                // Una sola sección se pinta abierta: plegar lo único que hay
                // deja la pantalla en blanco con una cabecera encima, y eso se
                // lee como «no hay nada», no como «está cerrado».
                const abierta = secciones.length === 1
                    ? true
                    : porBusqueda
                        ? porBusqueda.has(seccion.id)
                        : abiertaAMano === seccion.id;

                return (
                    <Plegable
                        key={seccion.id}
                        abierto={abierta}
                        onAlternar={() => setAbiertaAMano(a => (a === seccion.id ? null : seccion.id))}
                        titulo={
                            <span className={seccion.esSinAsignar ? 'text-amber-600 dark:text-amber-400' : undefined}>
                                {seccion.titulo}
                            </span>
                        }
                        insignia={seccion.items.length}
                        /* Va por `acciones` y no por `insignia`: dentro de la
                           insignia quedaría anidado en el botón que pliega, y
                           en táctil el navegador se queda con el de fuera —el
                           botón de dentro no se dispara nunca en el móvil. */
                        acciones={cabeceraExtra?.(seccion)}
                        className={seccion.esSinAsignar ? 'border-amber-300/60 dark:border-amber-500/30' : ''}
                    >
                        {/* Solo se monta lo abierto. */}
                        <div className="p-2">{children(seccion.items, seccion)}</div>
                    </Plegable>
                );
            })}
        </div>
    );
}

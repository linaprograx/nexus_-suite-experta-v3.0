import React from 'react';
import { createPortal } from 'react-dom';

/**
 * La capa donde viven los modales: **siempre `document.body`**.
 *
 * ## Por qué existe
 *
 * El armazón móvil pinta el contenido dentro de un `<div relative z-20>`, y
 * eso **crea un contexto de apilamiento**. Todo lo que vive ahí dentro queda
 * encerrado en el nivel 20 frente a sus hermanos, por muy alto que sea su
 * z-index propio: un `fixed inset-0 z-50` sigue quedando por debajo de la
 * franja de Grimorio, que está en `z-30`.
 *
 * Es la clase de fallo que se diagnostica mal, porque el síntoma —«el modal
 * sale detrás»— invita a subir el número, y subir el número no arregla nada.
 * Desde dentro de esa caja no hay número que valga. Hay que salir de la caja.
 *
 * ## Cómo se usa
 *
 * Envolviendo la raíz del modal, en lugar de escribir el `fixed inset-0` a
 * mano:
 *
 * ```tsx
 * return (
 *     <CapaModal onFondoPulsado={onClose}>
 *         <div className="relative w-full max-w-lg …">…</div>
 *     </CapaModal>
 * );
 * ```
 *
 * El fondo atenuado lo pone la capa, así que el modal solo se ocupa de su
 * contenido. Quien necesite un fondo distinto puede pasar `fondo={false}`.
 */
export const CapaModal: React.FC<{
    children: React.ReactNode;
    /** Se llama al pulsar fuera del contenido. Omitir para que no se cierre así. */
    onFondoPulsado?: () => void;
    /** Pinta el velo atenuado. Desactívalo si el modal trae el suyo. */
    fondo?: boolean;
    className?: string;
}> = ({ children, onFondoPulsado, fondo = true, className = '' }) => {
    // `z-[100]` es el mismo nivel que usa la primitiva `Modal`, para que todo
    // lo que sea un modal comparta plano y el orden lo decida quién se abrió
    // después, no quién eligió el número más alto.
    const capa = (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${className}`}>
            {fondo && (
                <div
                    className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200"
                    style={{ WebkitBackdropFilter: 'blur(12px)' }}
                    onClick={onFondoPulsado}
                />
            )}
            {children}
        </div>
    );

    // En SSR o durante la primera pasada puede no haber `document`.
    if (typeof document === 'undefined') return capa;
    return createPortal(capa, document.body);
};

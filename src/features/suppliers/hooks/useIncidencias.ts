import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Firestore } from 'firebase/firestore';
import { incidenciasService } from '../incidenciasService';
import { Incidencia, NotaOperativa, TipoIncidencia, Gravedad } from '../../../core/proveedores/incidencias';

/**
 * Incidencias y notas operativas, con caché compartida.
 *
 * Va por `useQuery` y no por el `useState`+`useEffect` de `useSuppliers`
 * porque estos datos se leen desde tres sitios a la vez —la cabecera del
 * proveedor en Mercado, la ficha del producto y el panel de registro— y tres
 * lecturas independientes darían tres respuestas distintas durante unos
 * segundos después de cada escritura. Es literalmente el defecto que este
 * proyecto lleva persiguiendo, aplicado al caché.
 */
export const useIncidencias = (db: Firestore | null, userId: string | null) => {
    const qc = useQueryClient();
    const activo = !!db && !!userId;

    const incidencias = useQuery<Incidencia[]>({
        queryKey: ['incidencias', userId],
        queryFn: () => incidenciasService.listar(db!, userId!),
        enabled: activo,
        staleTime: 60_000,
    });

    const notas = useQuery<NotaOperativa[]>({
        queryKey: ['notas-operativas', userId],
        queryFn: () => incidenciasService.listarNotas(db!, userId!),
        enabled: activo,
        staleTime: 60_000,
    });

    const refrescar = () => {
        qc.invalidateQueries({ queryKey: ['incidencias', userId] });
        qc.invalidateQueries({ queryKey: ['notas-operativas', userId] });
    };

    const registrar = useMutation({
        mutationFn: (d: { proveedorId: string; tipo: TipoIncidencia; gravedad: Gravedad; fecha: Date; fichaId?: string; pedidoId?: string; nota?: string }) =>
            incidenciasService.registrar(db!, userId!, d),
        onSuccess: refrescar,
    });

    const resolver = useMutation({
        mutationFn: (d: { id: string; resuelta: boolean }) =>
            incidenciasService.resolver(db!, userId!, d.id, d.resuelta),
        onSuccess: refrescar,
    });

    const eliminar = useMutation({
        mutationFn: (id: string) => incidenciasService.eliminar(db!, userId!, id),
        onSuccess: refrescar,
    });

    const guardarNota = useMutation({
        mutationFn: (d: { id?: string; texto: string; proveedorId?: string; fichaId?: string }) =>
            incidenciasService.guardarNota(db!, userId!, d),
        onSuccess: refrescar,
    });

    const eliminarNota = useMutation({
        mutationFn: (id: string) => incidenciasService.eliminarNota(db!, userId!, id),
        onSuccess: refrescar,
    });

    return {
        incidencias: incidencias.data || [],
        notas: notas.data || [],
        cargando: incidencias.isLoading || notas.isLoading,
        error: (incidencias.error || notas.error) as Error | null,
        registrar, resolver, eliminar, guardarNota, eliminarNota,
    };
};

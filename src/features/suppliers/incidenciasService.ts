import {
    Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
    query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { Incidencia, NotaOperativa, TipoIncidencia, Gravedad } from '../../core/proveedores/incidencias';

/**
 * Lectura y escritura de incidencias (punto 27) y notas operativas (punto 28).
 *
 * ## Dos colecciones, no una
 *
 * `users/{uid}/incidencias` y `users/{uid}/notas-operativas`. Son dos cosas con
 * ciclos de vida distintos —un suceso con fecha frente a conocimiento vigente—
 * y compartir documento obligaría a que la mitad de los campos estuvieran
 * siempre vacíos, que es como se acaba sin saber qué significa un campo nulo.
 *
 * ## Nada se borra al resolver
 *
 * Resolver una incidencia escribe `resueltaEl`. El histórico es lo único que
 * convierte tres sucesos en un patrón: borrarlos al arreglarlos dejaría al
 * proveedor limpio justo después de haber fallado tres veces.
 *
 * `eliminar` existe solo para deshacer un registro equivocado, y es explícito.
 */

const RUTA_INCIDENCIAS = (uid: string) => `users/${uid}/incidencias`;
const RUTA_NOTAS = (uid: string) => `users/${uid}/notas-operativas`;

/** Firestore devuelve `Timestamp`; el resto de la app trabaja con `Date`. */
const aFecha = (v: any): Date => {
    if (!v) return new Date(0);
    if (v instanceof Timestamp) return v.toDate();
    if (v instanceof Date) return v;
    if (typeof v?.toDate === 'function') return v.toDate();
    return new Date(v);
};

export const incidenciasService = {
    listar: async (db: Firestore, uid: string): Promise<Incidencia[]> => {
        const ref = collection(db, RUTA_INCIDENCIAS(uid));
        const snap = await getDocs(query(ref, orderBy('fecha', 'desc')));
        return snap.docs.map(d => {
            const x = d.data() as any;
            return {
                id: d.id,
                proveedorId: x.proveedorId,
                fichaId: x.fichaId || undefined,
                pedidoId: x.pedidoId || undefined,
                fecha: aFecha(x.fecha),
                tipo: x.tipo as TipoIncidencia,
                gravedad: (x.gravedad || 'leve') as Gravedad,
                nota: x.nota || undefined,
                resueltaEl: x.resueltaEl ? aFecha(x.resueltaEl) : undefined,
            };
        });
    },

    registrar: async (
        db: Firestore, uid: string,
        datos: { proveedorId: string; tipo: TipoIncidencia; gravedad: Gravedad; fecha: Date; fichaId?: string; pedidoId?: string; nota?: string },
    ): Promise<string> => {
        if (!datos.proveedorId) throw new Error('Una incidencia es siempre de un proveedor.');
        const ref = collection(db, RUTA_INCIDENCIAS(uid));
        // Los opcionales se omiten en vez de escribirse como `undefined`:
        // Firestore rechaza `undefined` y guardar `null` crearía un tercer
        // estado —«se miró y no había»— que nadie sabría distinguir de vacío.
        const doc: any = {
            proveedorId: datos.proveedorId,
            tipo: datos.tipo,
            gravedad: datos.gravedad,
            fecha: Timestamp.fromDate(datos.fecha),
            creadaEl: serverTimestamp(),
        };
        if (datos.fichaId) doc.fichaId = datos.fichaId;
        if (datos.pedidoId) doc.pedidoId = datos.pedidoId;
        if (datos.nota?.trim()) doc.nota = datos.nota.trim();
        const creado = await addDoc(ref, doc);
        return creado.id;
    },

    /** Marca resuelta. No borra: el histórico es lo que detecta el patrón. */
    resolver: async (db: Firestore, uid: string, id: string, resuelta = true): Promise<void> => {
        await updateDoc(doc(db, RUTA_INCIDENCIAS(uid), id), {
            resueltaEl: resuelta ? Timestamp.fromDate(new Date()) : null,
        });
    },

    /** Solo para deshacer un registro equivocado. */
    eliminar: async (db: Firestore, uid: string, id: string): Promise<void> => {
        await deleteDoc(doc(db, RUTA_INCIDENCIAS(uid), id));
    },

    listarNotas: async (db: Firestore, uid: string): Promise<NotaOperativa[]> => {
        const snap = await getDocs(collection(db, RUTA_NOTAS(uid)));
        return snap.docs.map(d => {
            const x = d.data() as any;
            return {
                id: d.id,
                proveedorId: x.proveedorId || undefined,
                fichaId: x.fichaId || undefined,
                texto: x.texto || '',
                creadaEl: aFecha(x.creadaEl),
                actualizadaEl: x.actualizadaEl ? aFecha(x.actualizadaEl) : undefined,
            };
        });
    },

    guardarNota: async (
        db: Firestore, uid: string,
        datos: { id?: string; texto: string; proveedorId?: string; fichaId?: string },
    ): Promise<void> => {
        const texto = datos.texto.trim();
        if (!texto) throw new Error('Una nota vacía no es conocimiento.');
        if (!datos.proveedorId && !datos.fichaId) {
            throw new Error('Una nota sin proveedor ni producto no se puede volver a encontrar.');
        }
        if (datos.id) {
            await updateDoc(doc(db, RUTA_NOTAS(uid), datos.id), {
                texto, actualizadaEl: serverTimestamp(),
            });
            return;
        }
        const cuerpo: any = { texto, creadaEl: serverTimestamp() };
        if (datos.proveedorId) cuerpo.proveedorId = datos.proveedorId;
        if (datos.fichaId) cuerpo.fichaId = datos.fichaId;
        await addDoc(collection(db, RUTA_NOTAS(uid)), cuerpo);
    },

    eliminarNota: async (db: Firestore, uid: string, id: string): Promise<void> => {
        await deleteDoc(doc(db, RUTA_NOTAS(uid), id));
    },
};

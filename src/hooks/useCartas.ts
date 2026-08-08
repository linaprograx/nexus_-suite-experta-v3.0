import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc,
    serverTimestamp, getDocs, writeBatch,
} from 'firebase/firestore';

/**
 * Las cartas, como entidad propia.
 *
 * Antes de esto una carta no existía: había una lista plana en `menu_items`,
 * **una sola**, sin nombre, sin concepto y sin fecha. La prueba está en los
 * datos del propio usuario, que acabó escribiendo el nombre del menú en el campo
 * PREPARACIÓN de una receta porque no había ningún otro sitio donde ponerlo.
 *
 * La pertenencia vive en la entrada de `menu_items` (`cartaId`) y **no** dentro
 * de la receta: una misma receta puede estar en la carta de verano y en la de
 * primavera a la vez.
 */

export interface Carta {
    id: string;
    nombre: string;
    /** El concepto del menú: de qué va, frases gancho, cómo se presenta. */
    concepto?: string;
    fecha?: string;
    estado: 'activa' | 'archivada';
    createdAt?: any;
}

const rutaCartas = (userId: string) => `users/${userId}/cartas`;
const rutaMenu = (userId: string) => `users/${userId}/menu_items`;

export const useCartas = () => {
    const { db, userId } = useApp();
    const [cartas, setCartas] = useState<Carta[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!db || !userId) { setCargando(false); return; }
        const q = query(collection(db, rutaCartas(userId)), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q,
            snap => { setCartas(snap.docs.map(d => ({ ...d.data(), id: d.id } as Carta))); setCargando(false); },
            err => { console.error('[useCartas] error de lectura:', err); setCargando(false); });
        return () => unsub();
    }, [db, userId]);

    /**
     * Migración: adopta las entradas antiguas.
     *
     * Solo actúa si hay entradas de menú **sin** `cartaId`. No borra ni reescribe
     * nada: crea una carta y les añade el campo que les falta. Es idempotente, de
     * modo que ejecutarla dos veces no duplica nada.
     */
    const migrarSiHaceFalta = useCallback(async () => {
        if (!db || !userId) return;
        const snap = await getDocs(collection(db, rutaMenu(userId)));
        const huerfanas = snap.docs.filter(d => !(d.data() as any).cartaId);
        if (huerfanas.length === 0) return;

        const ref = await addDoc(collection(db, rutaCartas(userId)), {
            nombre: 'Mi carta',
            concepto: '',
            fecha: new Date().toISOString().slice(0, 10),
            estado: 'activa',
            createdAt: serverTimestamp(),
        });

        // Firestore admite 500 operaciones por lote; una carta no se acerca ni de
        // lejos, pero se trocea por si acaso.
        for (let i = 0; i < huerfanas.length; i += 400) {
            const lote = writeBatch(db);
            huerfanas.slice(i, i + 400).forEach(d =>
                lote.update(doc(db, rutaMenu(userId), d.id), { cartaId: ref.id }));
            await lote.commit();
        }
        console.info(`[useCartas] migradas ${huerfanas.length} entradas a la carta ${ref.id}`);
    }, [db, userId]);

    const crearCarta = useCallback(async (nombre: string) => {
        if (!db || !userId) return null;
        const ref = await addDoc(collection(db, rutaCartas(userId)), {
            nombre: nombre || 'Carta sin título',
            concepto: '',
            fecha: new Date().toISOString().slice(0, 10),
            estado: 'activa',
            createdAt: serverTimestamp(),
        });
        return ref.id;
    }, [db, userId]);

    const actualizarCarta = useCallback(async (id: string, cambios: Partial<Carta>) => {
        if (!db || !userId) return;
        await updateDoc(doc(db, rutaCartas(userId), id), { ...cambios, updatedAt: serverTimestamp() });
    }, [db, userId]);

    /** La carta en la que se está trabajando. La más reciente de las activas. */
    const cartaActiva = cartas.find(c => c.estado === 'activa') || null;

    return { cartas, cartaActiva, cargando, migrarSiHaceFalta, crearCarta, actualizarCarta };
};

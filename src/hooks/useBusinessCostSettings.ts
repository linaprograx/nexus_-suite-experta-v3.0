import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { BusinessCostSettings } from '../core/costing/profitability.types';
import { AJUSTES_COSTE_POR_DEFECTO } from '../core/costing/businessCostSettings';

/**
 * Configuración de costes del negocio, persistida.
 *
 * Vive en `users/{uid}/settings/costes` — fuera de la receta, porque el tipo
 * impositivo, el coste laboral o las comisiones del TPV son del local, no de un
 * cóctel. Las recetas heredan estos valores y pueden sobrescribir algunos
 * (patrón GLOBAL DEFAULT → RECIPE OVERRIDE).
 *
 * Mientras no exista el documento se devuelven los valores por defecto, que son
 * **deliberadamente neutros**: sin impuestos, sin merma, sin mano de obra y sin
 * estructura. Así una instalación que nunca lo configure obtiene exactamente
 * los mismos números que antes de que este módulo existiera.
 */
export const useBusinessCostSettings = () => {
    const { db, userId } = useApp();
    const [ajustes, setAjustes] = useState<BusinessCostSettings>(AJUSTES_COSTE_POR_DEFECTO);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!db || !userId) { setCargando(false); return; }
        const ref = doc(db, `users/${userId}/settings`, 'costes');
        const unsub = onSnapshot(ref,
            snap => {
                // Fusión con los defectos: un documento antiguo al que le falte un
                // campo nuevo no deja el cálculo con `undefined`.
                setAjustes(snap.exists()
                    ? { ...AJUSTES_COSTE_POR_DEFECTO, ...(snap.data() as Partial<BusinessCostSettings>) }
                    : AJUSTES_COSTE_POR_DEFECTO);
                setCargando(false);
            },
            err => { console.error('[useBusinessCostSettings] error de lectura:', err); setCargando(false); });
        return () => unsub();
    }, [db, userId]);

    const guardar = useCallback(async (cambios: Partial<BusinessCostSettings>) => {
        if (!db || !userId) return;
        await setDoc(
            doc(db, `users/${userId}/settings`, 'costes'),
            { ...cambios, updatedAt: serverTimestamp() },
            { merge: true },
        );
    }, [db, userId]);

    return { ajustes, cargando, guardar };
};

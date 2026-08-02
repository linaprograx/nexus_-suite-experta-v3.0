import { useEffect, useRef } from 'react';
import { Firestore, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { AppNotification } from '../types';
import { GrimorioAlert, GRIMORIO_ALERT_PREFIX } from '../utils/grimorioAlerts';

const notifDoc = (appId: string, userId: string, id: string) => `artifacts/${appId}/users/${userId}/notifications/${id}`;

/**
 * #18 · Syncs Grimorio business alerts into the app-wide notification tray.
 * Idempotent: creates missing alerts, refreshes changed ones (preserving read state),
 * and removes alerts whose condition has cleared. Only writes when something changed.
 */
export const useGrimorioAlertSync = (
    alerts: GrimorioAlert[],
    existing: AppNotification[],
    db: Firestore | null,
    userId: string | null,
    appId: string | null,
) => {
    const queryClient = useQueryClient();
    const lastSig = useRef<string>('');

    useEffect(() => {
        if (!db || !userId || !appId) return;

        const desiredById = new Map(alerts.map(a => [a.id, a]));
        const existingGrimorio = existing.filter(n => n.id?.startsWith(GRIMORIO_ALERT_PREFIX));

        // Signature to skip redundant runs (desired + existing grimorio state)
        const sig = JSON.stringify([
            alerts.map(a => [a.id, a.message]),
            existingGrimorio.map(n => [n.id, n.message]),
        ]);
        if (sig === lastSig.current) return;
        lastSig.current = sig;

        const ops: Promise<any>[] = [];

        // Create or refresh desired alerts
        for (const a of alerts) {
            const found = existing.find(n => n.id === a.id);
            if (!found) {
                ops.push(setDoc(doc(db, notifDoc(appId, userId, a.id)), {
                    title: a.title,
                    message: a.message,
                    type: a.type,
                    link: a.link,
                    read: false,
                    source: 'grimorio',
                    createdAt: serverTimestamp(),
                }));
            } else if (found.message !== a.message || found.title !== a.title) {
                // Content changed → refresh text but preserve read state
                ops.push(updateDoc(doc(db, notifDoc(appId, userId, a.id)), {
                    title: a.title,
                    message: a.message,
                    type: a.type,
                }));
            }
        }

        // Remove alerts whose condition has cleared
        for (const n of existingGrimorio) {
            if (n.id && !desiredById.has(n.id)) {
                ops.push(deleteDoc(doc(db, notifDoc(appId, userId, n.id))));
            }
        }

        if (ops.length > 0) {
            Promise.all(ops)
                .then(() => queryClient.invalidateQueries({ queryKey: ['notifications', appId, userId] }))
                .catch(err => console.error('[GrimorioAlertSync] sync failed:', err));
        }
    }, [alerts, existing, db, userId, appId, queryClient]);
};

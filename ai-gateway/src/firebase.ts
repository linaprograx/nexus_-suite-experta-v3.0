/**
 * Shared Firebase Admin access for the gateway (Stripe, agents…).
 * Lazy so the process still boots when credentials are missing.
 */
let adminDb: any = null;

export async function getAdminDb(): Promise<any | null> {
    if (adminDb) return adminDb;
    try {
        const admin = await import('firebase-admin');
        if (!admin.apps.length) {
            const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
            // Prefer the service-account JSON path the gateway already uses for Vertex.
            const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
            let credential;
            if (saPath) {
                const { readFileSync } = await import('fs');
                const { resolve } = await import('path');
                const raw = readFileSync(resolve(process.cwd(), saPath), 'utf-8');
                credential = admin.credential.cert(JSON.parse(raw));
            } else {
                credential = admin.credential.applicationDefault();
            }
            admin.initializeApp({ credential, projectId });
        }
        adminDb = admin.firestore();
        return adminDb;
    } catch (e: any) {
        console.warn('[Firebase] Admin unavailable:', e.message);
        return null;
    }
}

export const firebaseAdminConfigured = () =>
    !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);

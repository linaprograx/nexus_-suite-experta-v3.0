import type { Request, Response } from 'express';
import Stripe from 'stripe';
import {
    PlanId, BillingCycle,
    PLAN_ID_TO_TIER, trialDaysFor, priceIdFor, studioProductId, tierFromPriceId,
} from './plans.js';

/**
 * Stripe Billing for Nexus Suite.
 *
 * Required env vars (ai-gateway/.env — use TEST keys sk_test_ / whsec_ in dev):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_PROFESSIONAL_MONTHLY / _ANNUAL
 *   STRIPE_PRICE_EXPERT_MONTHLY       / _ANNUAL
 *   STRIPE_PRODUCT_STUDIO
 *   STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL   (optional; fall back to FRONTEND_URL)
 *   FRONTEND_URL, FIREBASE_PROJECT_ID
 *
 * Card data is handled exclusively by Stripe's hosted Checkout — this server
 * never sees card numbers and the secret key never reaches the client.
 */

// Lazy init: read the secret at call time, NOT at import time. ES module imports
// are hoisted above dotenv.config(), so reading env at module top gives '' and
// Stripe would look unconfigured even with a valid key in .env.
let _stripe: Stripe | null | undefined;
function getStripe(): Stripe | null {
    if (_stripe !== undefined) return _stripe;
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    _stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any }) : null;
    return _stripe;
}
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

// --- Firebase Admin (lazy) ---
let adminDb: any = null;
async function getAdminDb() {
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
        console.warn('[Stripe] Firebase Admin unavailable — plan will not persist:', e.message);
        return null;
    }
}

async function updateUser(userId: string, data: Record<string, any>) {
    const db = await getAdminDb();
    if (!db) return;
    await db.doc(`users/${userId}/profile/main`).set(
        { ...data, planUpdatedAt: new Date().toISOString() },
        { merge: true }
    );
}

function successUrl(base: string) {
    return process.env.STRIPE_SUCCESS_URL || `${base}/personal?checkout=success`;
}
function cancelUrl(base: string) {
    return process.env.STRIPE_CANCEL_URL || `${base}/personal?checkout=cancelled`;
}

// ============================================
// POST /stripe/create-checkout-session
// body: { planId, billingCycle, studioAmount?, userId, email?, origin? }
// ============================================
export async function createCheckoutSession(req: Request, res: Response) {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe no está configurado en el servidor.' });
    try {
        const { planId, billingCycle, studioAmount, userId, email, origin } = req.body || {};
        if (!planId || !userId) return res.status(400).json({ error: "Faltan 'planId' o 'userId'." });

        const cycle: BillingCycle = billingCycle === 'annual' ? 'annual' : 'monthly';
        const base = origin || process.env.FRONTEND_URL || 'http://localhost:5173';

        // Build the line item — fixed price for professional/expert, dynamic price_data for studio
        let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

        if (planId === 'studio') {
            const productId = studioProductId();
            if (!productId) return res.status(400).json({ error: 'STRIPE_PRODUCT_STUDIO no configurado.' });
            const amount = Number(studioAmount);
            if (!amount || amount < 20000 || amount > 100000) {
                // Guardrail: Studio is negotiated between 200€ and 1000€ / month
                return res.status(400).json({ error: 'studioAmount fuera de rango (20000–100000 céntimos).' });
            }
            lineItem = {
                price_data: {
                    currency: 'eur',
                    product: productId,
                    unit_amount: amount,          // in cents
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            };
        } else {
            const price = priceIdFor(planId as PlanId, cycle);
            if (!price) return res.status(400).json({ error: `Precio no configurado para ${planId}/${cycle}.` });
            lineItem = { price, quantity: 1 };
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [lineItem],
            customer_email: email || undefined,
            client_reference_id: userId,
            allow_promotion_codes: true,
            subscription_data: {
                trial_period_days: trialDaysFor(cycle),
                metadata: { plan_id: planId, userId, billing_cycle: cycle },
            },
            metadata: { plan_id: planId, userId, billing_cycle: cycle },
            success_url: successUrl(base),
            cancel_url: cancelUrl(base),
        });

        res.json({ url: session.url });
    } catch (e: any) {
        console.error('[Stripe] checkout error:', e.message);
        res.status(500).json({ error: e.message });
    }
}

// ============================================
// POST /stripe/create-portal-session
// ============================================
export async function createPortalSession(req: Request, res: Response) {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Stripe no está configurado en el servidor.' });
    try {
        const { userId, origin } = req.body || {};
        if (!userId) return res.status(400).json({ error: "Falta 'userId'." });

        const db = await getAdminDb();
        let customerId: string | undefined;
        if (db) {
            const snap = await db.doc(`users/${userId}/profile/main`).get();
            customerId = snap.exists ? snap.data()?.stripeCustomerId : undefined;
        }
        if (!customerId) return res.status(400).json({ error: 'No hay suscripción asociada a esta cuenta.' });

        const base = origin || process.env.FRONTEND_URL || 'http://localhost:5173';
        const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${base}/personal`,
        });
        res.json({ url: portal.url });
    } catch (e: any) {
        console.error('[Stripe] portal error:', e.message);
        res.status(500).json({ error: e.message });
    }
}

// --- Idempotency: skip events we've already processed (durable via Firestore) ---
const seenEvents = new Set<string>(); // in-process fast path
async function alreadyProcessed(eventId: string): Promise<boolean> {
    if (seenEvents.has(eventId)) return true;
    seenEvents.add(eventId);
    const db = await getAdminDb();
    if (!db) return false; // best-effort only
    const ref = db.doc(`stripe_events/${eventId}`);
    const snap = await ref.get();
    if (snap.exists) return true;
    await ref.set({ processedAt: new Date().toISOString() });
    return false;
}

// ============================================
// POST /stripe/webhook  (raw body)
// ============================================
export async function handleWebhook(req: Request, res: Response) {
    const stripe = getStripe();
    if (!stripe) return res.status(503).end();
    const sig = req.headers['stripe-signature'] as string;
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
    } catch (e: any) {
        console.error('[Stripe] webhook signature failed:', e.message);
        return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    // Acknowledge fast; still guard idempotency
    try {
        if (await alreadyProcessed(event.id)) {
            return res.json({ received: true, duplicate: true });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object as Stripe.Checkout.Session;
                const userId = s.metadata?.userId || s.client_reference_id || undefined;
                const planId = s.metadata?.plan_id as PlanId | undefined;
                const tier = planId ? PLAN_ID_TO_TIER[planId] : undefined;
                if (userId && tier) {
                    await updateUser(userId, {
                        plan: tier,
                        subscriptionStatus: 'active',
                        stripeCustomerId: typeof s.customer === 'string' ? s.customer : undefined,
                        stripeSubscriptionId: typeof s.subscription === 'string' ? s.subscription : undefined,
                    });
                    console.log(`[Stripe] checkout completed: ${userId} → ${tier}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const userId = sub.metadata?.userId;
                // Prefer explicit plan_id metadata, fall back to price → tier
                const planId = sub.metadata?.plan_id as PlanId | undefined;
                const tier = (planId && PLAN_ID_TO_TIER[planId]) || tierFromPriceId(sub.items.data[0]?.price?.id);
                if (userId && tier) {
                    // status can be: active, trialing, past_due, canceled, unpaid…
                    await updateUser(userId, { plan: tier, subscriptionStatus: sub.status });
                    console.log(`[Stripe] subscription updated: ${userId} → ${tier} (${sub.status})`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const userId = sub.metadata?.userId;
                if (userId) {
                    await updateUser(userId, {
                        plan: 'FREE',
                        subscriptionStatus: 'canceled',
                        stripeSubscriptionId: null,
                    });
                    console.log(`[Stripe] subscription deleted: ${userId} → FREE`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const inv = event.data.object as Stripe.Invoice;
                const userId = (inv.subscription_details?.metadata?.userId) || (inv.metadata?.userId) || undefined;
                if (userId) {
                    // Keep the plan but flag the failure so the UI can warn the user
                    await updateUser(userId, { subscriptionStatus: 'past_due' });
                    console.log(`[Stripe] payment failed: ${userId} → past_due`);
                }
                break;
            }

            default:
                break;
        }

        res.json({ received: true });
    } catch (e: any) {
        console.error('[Stripe] webhook handler error:', e.message);
        res.status(500).json({ error: e.message });
    }
}

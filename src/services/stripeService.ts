import { PlanTier } from '../core/product/plans.types';

const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || 'http://localhost:3001';

/** Stripe plan_id (lowercase) matching the metadata on the Stripe products. */
export type StripePlanId = 'professional' | 'expert' | 'studio';
export type BillingCycle = 'monthly' | 'annual';

/** Map internal PlanTier → Stripe plan_id. FREE/STUDIO handled by the UI. */
export const TIER_TO_PLAN_ID: Partial<Record<PlanTier, StripePlanId>> = {
    PRO: 'professional',
    EXPERT: 'expert',
    STUDIO: 'studio',
};

/** Plans that go through automatic Stripe Checkout (Studio is negotiated apart). */
export const CHECKOUT_TIERS: PlanTier[] = ['PRO', 'EXPERT'];
export const isCheckoutTier = (plan: PlanTier) => CHECKOUT_TIERS.includes(plan);

interface CheckoutArgs {
    planId: StripePlanId;
    billingCycle: BillingCycle;
    userId: string;
    email?: string | null;
    /** Studio only: negotiated amount in cents. */
    studioAmount?: number;
}

/**
 * Creates a Stripe Checkout session (subscription mode) and redirects the browser
 * to Stripe's hosted payment page. Secrets and price IDs live only on the gateway.
 */
export async function startCheckout(args: CheckoutArgs): Promise<void> {
    let res: Response;
    try {
        res = await fetch(`${AI_GATEWAY_URL}/stripe/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...args, origin: window.location.origin }),
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor de pagos. Arranca el gateway (cd ai-gateway && npm run dev).');
    }

    if (res.status === 503) throw new Error('Stripe no está configurado en el servidor. Falta STRIPE_SECRET_KEY en ai-gateway/.env.');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `No se pudo iniciar el pago (${res.status})`);
    }
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Respuesta de pago inválida');
    window.location.href = data.url;
}

/** Opens the Stripe Billing Portal to manage / cancel the subscription. */
export async function openBillingPortal(userId: string): Promise<void> {
    let res: Response;
    try {
        res = await fetch(`${AI_GATEWAY_URL}/stripe/create-portal-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, origin: window.location.origin }),
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor de pagos. Arranca el gateway (cd ai-gateway && npm run dev).');
    }

    if (res.status === 503) throw new Error('Stripe no está configurado en el servidor. Falta STRIPE_SECRET_KEY en ai-gateway/.env.');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `No se pudo abrir el portal (${res.status})`);
    }
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Respuesta del portal inválida');
    window.location.href = data.url;
}

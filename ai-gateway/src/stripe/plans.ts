/**
 * Nexus plan / pricing configuration (server side).
 *
 * All Stripe IDs come from environment variables (test keys in dev) — nothing is
 * hardcoded so the same code works in test and live.
 *
 * Plan identity travels through Stripe as `plan_id` metadata in LOWERCASE
 * (professional / expert / studio), matching the metadata already set on the
 * Stripe products. Internally the Nexus app stores the UPPERCASE PlanTier
 * ('FREE' | 'PRO' | 'EXPERT' | 'STUDIO') on users/{uid}/profile/main.plan, so we
 * map between the two here.
 */

export type PlanId = 'professional' | 'expert' | 'studio';
export type BillingCycle = 'monthly' | 'annual';
export type PlanTier = 'FREE' | 'PRO' | 'EXPERT' | 'STUDIO';

// Stripe plan_id (lowercase) → internal Nexus PlanTier (uppercase)
export const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
    essential: 'FREE',
    free: 'FREE',
    professional: 'PRO',
    expert: 'EXPERT',
    studio: 'STUDIO',
};

// Trial length depends on billing cycle
export const trialDaysFor = (cycle: BillingCycle): number => (cycle === 'annual' ? 14 : 7);

/**
 * Resolve the Stripe Price ID for a fixed-price plan (professional / expert)
 * from environment variables. Returns undefined for studio (dynamic price_data)
 * or if the env var is missing.
 */
export const priceIdFor = (planId: PlanId, cycle: BillingCycle): string | undefined => {
    const key = `STRIPE_PRICE_${planId.toUpperCase()}_${cycle.toUpperCase()}`; // e.g. STRIPE_PRICE_PROFESSIONAL_MONTHLY
    return process.env[key];
};

/** Studio product id (dynamic pricing via price_data). */
export const studioProductId = (): string | undefined => process.env.STRIPE_PRODUCT_STUDIO;

// Reverse lookup: given any price id, which PlanTier does it belong to?
export const tierFromPriceId = (priceId?: string): PlanTier | undefined => {
    if (!priceId) return undefined;
    const cycles: BillingCycle[] = ['monthly', 'annual'];
    const plans: PlanId[] = ['professional', 'expert'];
    for (const p of plans) {
        for (const c of cycles) {
            if (priceIdFor(p, c) === priceId) return PLAN_ID_TO_TIER[p];
        }
    }
    return undefined;
};

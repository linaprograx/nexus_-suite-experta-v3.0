import type { Request, Response, NextFunction } from 'express';
import type { PlanTier } from './plans.js';

/**
 * Feature access rules by plan.
 *
 * Sections map to the app's routes (Grimorium, Cerebrity, Pizarrón, Avatar,
 * Colegium). Tune the minimum tier per feature to your commercial packaging —
 * this is the single place to change gating.
 */
export type Feature = 'grimorium' | 'cerebrity' | 'pizarron' | 'avatar' | 'colegium' | 'controlCenter';

const TIER_RANK: Record<PlanTier, number> = { FREE: 0, PRO: 1, EXPERT: 2, STUDIO: 3 };

// Minimum plan required for each feature (adjust freely)
export const FEATURE_MIN_TIER: Record<Feature, PlanTier> = {
    grimorium: 'FREE',      // core, everyone
    colegium: 'FREE',       // core, everyone
    pizarron: 'PRO',
    cerebrity: 'EXPERT',
    avatar: 'EXPERT',
    controlCenter: 'EXPERT', // section control center (EXPERT/STUDIO only)
};

/** Does this plan grant access to the given feature? */
export const canAccessFeature = (plan: PlanTier | undefined, feature: Feature): boolean => {
    const tier = plan && plan in TIER_RANK ? plan : 'FREE';
    return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
};

/**
 * Express middleware guard. Reads the caller's plan from `req.body.plan`
 * (or a header) and blocks the request if the feature isn't included.
 * Usage:  app.post('/some/premium/route', requireFeature('cerebrity'), handler)
 */
export const requireFeature = (feature: Feature) =>
    (req: Request, res: Response, next: NextFunction) => {
        const plan = (req.body?.plan || req.header('x-nexus-plan')) as PlanTier | undefined;
        if (!canAccessFeature(plan, feature)) {
            return res.status(403).json({
                error: `Tu plan no incluye "${feature}".`,
                feature,
                requiredTier: FEATURE_MIN_TIER[feature],
                upgrade: true,
            });
        }
        next();
    };

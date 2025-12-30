
/**
 * Scoring System for Assisted Decisions.
 * Goal: Prioritize insights by economic impact and operational relevance.
 * Range: 0 - 100+ (Minimum to show: 18)
 */

interface ScoreFactors {
    impactAbsEUR?: number;
    impactPct?: number;
    recipesAffected?: number;
    risk?: 'single_supplier' | 'stale_price' | 'volatility' | 'none';
    isConfidenceHigh?: boolean;
}

export const calculatePriorityScore = (factors: ScoreFactors): number => {
    let score = 0;

    // 1. Economic Impact (EUR) - Cap at 55 pts (Tuned Phase 2.3.1)
    // Reduce weight of absolute impact to filter noise.
    if (factors.impactAbsEUR) {
        // Linear: 1 EUR = 2 points. Max 55.
        score += Math.min(55, Math.abs(factors.impactAbsEUR) * 2);
    }

    // 2. Impact Percentage - Cap at 15 pts (Stable)
    if (factors.impactPct) {
        score += Math.min(15, factors.impactPct); // 1% = 1pt
    }

    // 3. Operational Reach (Recipes) - Cap at 20 pts (Tuned Phase 2.3.1)
    // Prioritize transversal impact.
    if (factors.recipesAffected) {
        score += Math.min(20, factors.recipesAffected * 4); // 1 recipe = 4pts -> 5 recipes = max.
    }

    // 4. Risk Modifier
    if (factors.risk) {
        switch (factors.risk) {
            case 'single_supplier': score += 5; break;
            case 'stale_price': score += 3; break;
            case 'volatility': score += 2; break;
            case 'none': break;
        }
    }

    // 5. Confidence - Cap at 15 pts (Tuned Phase 2.3.1)
    if (factors.isConfidenceHigh) {
        score += 15;
    } else {
        score += 5; // Base confidence bumped slightly
    }

    return Math.floor(score);
};

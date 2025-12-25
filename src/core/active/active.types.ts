
export type ActiveScope = 'market' | 'cost' | 'stock' | 'recipe';
export type RiskLevel = 'low' | 'medium' | 'high';
export type Reversibility = 'instant' | 'simple' | 'manual';

export interface ActiveSuggestion {
    id: string; // Unique ID (e.g. SUGGEST_SWITCH_PROV_123)
    type: string; // Template ID (e.g. SUGGEST_SWITCH_PROVIDER_PREVIEW)
    scope: ActiveScope;
    title: string;
    proposal: string;
    why: string;
    evidence: Array<{ label: string; value: string }>;
    expectedImpact: {
        deltaCostAbs?: number;
        deltaCostPct?: number;
        recipesAffected: number;
    };
    confidenceScore: number; // 0-100
    riskLevel: RiskLevel;
    reversibility: Reversibility;
    preview: {
        before: string;
        after: string;
    };
    actions: {
        primary: string; // Label only
        secondary?: string; // e.g. "Dismiss"
    };
    data?: any; // Context data for execution (e.g. { ingredientId, newPrice })
}

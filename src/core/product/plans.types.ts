export type PlanTier = 'FREE' | 'PRO' | 'EXPERT' | 'STUDIO';

export type IntelligenceLayer =
    | 'passive_intelligence'
    | 'assisted_intelligence'
    | 'active_intelligence'
    | 'adaptive_intelligence';

export interface PlanLimits {
    signals: 'basic' | 'pro' | 'advanced';
    assisted_insights: number | 'unlimited'; // Max per view or unlimited
    active_actions: boolean; // Opt-in actions enabled?
    learning: 'none' | 'basic' | 'full' | 'advanced';
    audit_retention_days: number;
    custom_thresholds: boolean;
}

export interface ProductPlan {
    id: PlanTier;
    name: string;
    enabled_layers: IntelligenceLayer[];
    limits: PlanLimits;
    positioning: string;
}

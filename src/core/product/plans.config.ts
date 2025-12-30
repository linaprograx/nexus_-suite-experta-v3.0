import { PlanTier, ProductPlan } from './plans.types';

export const PLANS: Record<PlanTier, ProductPlan> = {
    'FREE': {
        id: 'FREE',
        name: 'Nexus Essential',
        enabled_layers: ['passive_intelligence'],
        limits: {
            signals: 'basic',
            assisted_insights: 0,
            active_actions: false,
            learning: 'none',
            audit_retention_days: 7,
            custom_thresholds: false
        },
        positioning: "Visibilidad y control básico"
    },
    'PRO': {
        id: 'PRO',
        name: 'Nexus Professional',
        enabled_layers: ['passive_intelligence', 'assisted_intelligence'],
        limits: {
            signals: 'pro',
            assisted_insights: 3, // Limited insights
            active_actions: false,
            learning: 'basic', // Read-only derived states
            audit_retention_days: 30,
            custom_thresholds: false
        },
        positioning: "Optimización guiada y priorización"
    },
    'EXPERT': {
        id: 'EXPERT',
        name: 'Nexus Expert',
        enabled_layers: ['passive_intelligence', 'assisted_intelligence', 'active_intelligence'],
        limits: {
            signals: 'advanced',
            assisted_insights: 'unlimited',
            active_actions: true, // Opt-in actions enabled
            learning: 'full', // Full active learning
            audit_retention_days: 90,
            custom_thresholds: true
        },
        positioning: "Decisión y ejecución con control"
    },
    'STUDIO': {
        id: 'STUDIO',
        name: 'Nexus Studio',
        enabled_layers: ['passive_intelligence', 'assisted_intelligence', 'active_intelligence', 'adaptive_intelligence'],
        limits: {
            signals: 'advanced',
            assisted_insights: 'unlimited',
            active_actions: true,
            learning: 'advanced', // Advanced tuning
            audit_retention_days: 365,
            custom_thresholds: true
        },
        positioning: "Sistema operativo de decisiones"
    }
};

// Default plan for new users or fallback
// Setting to 'EXPERT' by default in development/demo so features are visible, 
// but can be toggled to test gating.
export const DEFAULT_PLAN_TIER: PlanTier = 'EXPERT';

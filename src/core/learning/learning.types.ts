
export type EventType =
    | 'suggestion_viewed'
    | 'suggestion_dismissed'
    | 'suggestion_ignored'
    | 'suggestion_accepted'
    | 'action_previewed'
    | 'action_executed'
    | 'action_undone'
    | 'action_undone'
    | 'insight_expanded';

export interface IntelChangeLogEntry {
    id: string;
    timestamp: number;
    ruleId: string;
    description: string;
    before: string; // Human readable or JSON string
    after: string;
    scope: 'market' | 'cost' | 'stock' | 'global';
    reversible: boolean;
}

export type Scope = 'market' | 'cost' | 'stock' | 'recipe';

export interface LearningEvent {
    id: string;
    timestamp: number;
    userId: string;
    type: EventType;
    scope: Scope;
    entity: {
        recipeId?: string | null;
        ingredientId?: string | null;
        supplierId?: string | null;
    };
    signalIds: string[];
    insightId?: string | null;
    suggestionId?: string | null;
    actionId?: string | null;
    meta: {
        confidence?: number | null;
        priorityScore?: number | null;
        impactAbs?: number | null;
        impactPct?: number | null;
        recipesAffected?: number | null;
    };
}

export interface UserIntelProfile {
    userId: string;
    version: number;
    visibility: {
        assisted_minimum_to_show: number; // Default 20
        active_confidence_threshold: number; // Default 80
        max_visible_insights_default: number; // Default 2
    };
    weights: {
        impactAbsEUR: number; // Default 1.0
        recipesAffected: number; // Default 1.0
        impactPct: number; // Default 1.0
        confidence: number; // Default 1.0
    };
    snoozes: {
        byEntity: Record<string, { until: number; reason?: string }>;
    };
    mutes: {
        byScope: Record<string, boolean>;
        bySignalId: Record<string, boolean>;
    };
    history: {
        lastTunedAt: number;
        tuningCounters: Record<string, number>;
    };
}

export const DEFAULT_INTEL_PROFILE: Omit<UserIntelProfile, 'userId'> = {
    version: 1,
    visibility: {
        assisted_minimum_to_show: 20,
        active_confidence_threshold: 80,
        max_visible_insights_default: 2
    },
    weights: {
        impactAbsEUR: 1.0,
        recipesAffected: 1.0,
        impactPct: 1.0,
        confidence: 1.0
    },
    snoozes: { byEntity: {} },
    mutes: { byScope: {}, bySignalId: {} },
    history: {
        lastTunedAt: 0,
        tuningCounters: {}
    }
};

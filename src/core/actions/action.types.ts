
import { ActiveScope, RiskLevel, Reversibility } from '../active/active.types';

export interface ActionPreview {
    before: string;
    after: string;
    delta?: string;
    affectedEntities?: string[]; // IDs or names
}

export interface ExecutionStep {
    step: string;
    effect: string;
}

export interface ExecutableAction {
    id: string; // Unique Action ID
    originSuggestionId: string; // Link back to suggestion
    type: string; // Action Type ID (e.g. ACTION_SET_REFERENCE_SUPPLIER)
    scope: ActiveScope;
    title: string;
    description: string;
    preview: ActionPreview;
    executionPlan: ExecutionStep[];
    reversibility: Reversibility;
    riskLevel: RiskLevel;
    requiresConfirmation: boolean;
    data?: any; // Payload for execution
}

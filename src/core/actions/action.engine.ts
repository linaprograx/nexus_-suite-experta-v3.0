
import { ActiveSuggestion } from '../active/active.types';
import { ExecutableAction } from './action.types';
import { ActionGuardrails } from './action.guardrails';
import { computeActionPreview } from './action.preview';

export const createExecutableAction = (suggestion: ActiveSuggestion): ExecutableAction | null => {
    if (!ActionGuardrails.canCreateAction(suggestion)) {
        return null; // Blocked by guardrails
    }

    // Map suggestion type to action type
    let actionType = '';
    switch (suggestion.type) {
        case 'SUGGEST_SWITCH_PROVIDER_PREVIEW':
            actionType = 'ACTION_SET_REFERENCE_SUPPLIER';
            break;
        case 'SUGGEST_REVIEW_RECIPE_COST':
            actionType = 'ACTION_SET_COST_SOURCE';
            break;
        case 'SUGGEST_RESOLVE_STOCK_LINKS':
            actionType = 'ACTION_RESOLVE_STOCK_LINK';
            break;
        default:
            return null; // Unknown suggestion type
    }

    return {
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        originSuggestionId: suggestion.id,
        type: actionType,
        scope: suggestion.scope,
        title: suggestion.title, // Or genericize based on action type
        description: suggestion.proposal,
        preview: computeActionPreview(suggestion),
        executionPlan: [
            { step: 'Validate State', effect: 'None' },
            { step: 'Apply Operation', effect: 'Update Database' },
            { step: 'Verify Consistency', effect: 'None' }
        ],
        reversibility: suggestion.reversibility,
        riskLevel: suggestion.riskLevel,
        requiresConfirmation: true,
        data: suggestion.data || {} // Forward payload
    };
};

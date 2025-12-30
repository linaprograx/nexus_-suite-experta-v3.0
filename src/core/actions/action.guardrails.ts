
import { ExecutableAction } from './action.types';
import { ActiveSuggestion } from '../active/active.types';

export const ActionGuardrails = {
    // Re-verify thresholds before allowing execution creation
    MIN_CONFIDENCE_TO_EXECUTE: 80,

    canCreateAction: (suggestion: ActiveSuggestion): boolean => {
        if (suggestion.confidenceScore < ActionGuardrails.MIN_CONFIDENCE_TO_EXECUTE) {
            console.warn(`[ActionGuardrails] Blocked: Confidence ${suggestion.confidenceScore} < ${ActionGuardrails.MIN_CONFIDENCE_TO_EXECUTE}`);
            return false;
        }
        return true;
    },

    validateExecution: (action: ExecutableAction): boolean => {
        // Runtime check before commit
        if (!action.preview) return false;
        return true;
    }
};


import { ActiveSuggestion } from '../active/active.types';
import { ActionPreview } from './action.types';

// In a real system, this would calculate complex diffs.
// For now, it promotes the suggestion's preview to the action's preview
// potentially adding more computed details if available.

export const computeActionPreview = (suggestion: ActiveSuggestion): ActionPreview => {
    return {
        before: suggestion.preview.before,
        after: suggestion.preview.after,
        delta: suggestion.expectedImpact.deltaCostAbs
            ? `Impacto estimado: ${suggestion.expectedImpact.deltaCostAbs < 0 ? '-' : '+'}${Math.abs(suggestion.expectedImpact.deltaCostAbs).toFixed(2)}€`
            : undefined,
        affectedEntities: suggestion.expectedImpact.recipesAffected > 0
            ? [`${suggestion.expectedImpact.recipesAffected} recetas afectadas`]
            : []
    };
};

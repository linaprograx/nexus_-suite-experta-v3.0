
import { ActiveSuggestion } from './active.types';
import { AssistedInsight } from '../assisted/assisted.types';
import { evaluateMarketActiveRules } from './active.rules.market';
import { evaluateCostActiveRules } from './active.rules.cost';
import { evaluateStockActiveRules } from './active.rules.stock';
import { ActiveGuardrails } from './active.guardrails';
import { UserIntelProfile, DEFAULT_INTEL_PROFILE } from '../learning/learning.types';

export const generateActiveSuggestions = (insights: AssistedInsight[], profile: UserIntelProfile = DEFAULT_INTEL_PROFILE as UserIntelProfile): ActiveSuggestion[] => {
    // 0. Initial Filtering based on Profile Mutes
    // (Implementation pending: Check profile.mutes.byScope against rules)

    // 1. Generate Candidates
    const candidates = [
        ...evaluateMarketActiveRules(insights),
        ...evaluateCostActiveRules(insights),
        ...evaluateStockActiveRules(insights)
    ];

    // 2. Apply Guardrails & Profile Thresholds
    const validSuggestions = candidates.filter(suggestion => {
        // A. Global Hard Guardrails
        if (!ActiveGuardrails.canSuggest(suggestion)) return false;

        // B. Dynamic Profile Thresholds
        if (suggestion.confidenceScore < profile.visibility.active_confidence_threshold) {
            // Log ignored?
            return false;
        }

        // C. Snoozes
        // Check if Entity ID is snoozed
        if (suggestion.data && (suggestion.data.ingredientId || suggestion.data.supplierId)) {
            const entId = suggestion.data.ingredientId || suggestion.data.supplierId;
            const snooze = profile.snoozes.byEntity[entId];
            if (snooze && snooze.until > Date.now()) {
                return false; // Snoozed
            }
        }

        return true;
    });

    // 3. Prioritize (Max 1 per view/scope usually)
    // User spec: "At most 1 active suggestion visible per view"

    return validSuggestions.slice(0, 1);
};

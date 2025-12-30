
import { ActiveSuggestion } from './active.types';

// Simple in-memory or console audit for Phase 3.0
// In production this would send to an analytics endpoint.

export const logSuggestionImpression = (suggestion: ActiveSuggestion) => {
    console.log(`[ACTIVE_AUDIT] Impression: ${suggestion.id}`, {
        confidence: suggestion.confidenceScore,
        impact: suggestion.expectedImpact
    });
};

export const logSuggestionAction = (suggestionId: string, action: 'accepted' | 'dismissed' | 'previewed') => {
    console.log(`[ACTIVE_AUDIT] Action: ${suggestionId} -> ${action}`);
    // Here we could store in localStorage to prevent re-showing dismissed ones.
};

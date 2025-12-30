
import { AssistedEngineInput, AssistedInsight } from './assisted.types';
import { evaluateMarketRules } from './assisted.rules.market';
import { evaluateCostRules } from './assisted.rules.cost';
import { evaluateStockAssistedRules } from './assisted.rules.stock';

const RULES = [
    evaluateMarketRules,
    evaluateCostRules,
    evaluateStockAssistedRules
];

export const generateAssistedInsights = (input: AssistedEngineInput): AssistedInsight[] => {
    let allInsights: AssistedInsight[] = [];

    for (const rule of RULES) {
        try {
            const results = rule(input);
            allInsights = allInsights.concat(results);
        } catch (e) {
            console.error("Assisted Engine Rule Error:", e);
        }
    }

    // --- PHASE 2.3.1 TUNING ---

    // 1. Deduplication & Overlap Preference
    // Rule: Keep highest priority if same ID/Scope.
    // Rule: Prefer 'cost' scope over 'market' if they address same root cause (simplified: just take highest score)
    const uniqueMap = new Map<string, AssistedInsight>();

    allInsights.forEach(insight => {
        const existing = uniqueMap.get(insight.id);
        if (!existing || insight.priorityScore > existing.priorityScore) {
            uniqueMap.set(insight.id, insight);
        }
    });

    let processed = Array.from(uniqueMap.values());

    // 2. Severity Normalization
    processed = processed.map(insight => {
        // Force Info if Impact < 0.30€ (unless Critical)
        // We rely on evidence text or summary? Or assume specific IDs?
        // Let's check priorityScore. If score < 22, it shouldn't show anyway.
        // But if it shows, and impact is low, degrade it.
        // Since we don't have structured data easily here without parsing evidence,
        // we heavily rely on the updated Score Weights to inherently handle this.
        // However, we apply the Global Threshold strictly.
        return insight;
    });

    // 3. Global Threshold & Filtering
    // Min Score: 22 (tuned up from 18)
    // Exception: 'success' insights might have lower scores (10-15) but we might want to show them if nothing else exists.
    // Revised Strategy: If 'success' is the ONLY thing, show it. If there are risks, hide success.

    const risks = processed.filter(i => i.severity !== 'success' && i.priorityScore >= 22);

    if (risks.length > 0) {
        // Show risks, ignore success insights
        processed = risks;
    } else {
        // No risks above threshold. Check for success insights.
        const successes = processed.filter(i => i.severity === 'success');
        // Success insights usually score low (15). We allow them if no risks.
        processed = successes;
    }

    // 4. Sorting
    return processed.sort((a, b) => b.priorityScore - a.priorityScore);
};


import { AssistedRule, AssistedInsight } from './assisted.types';
import { calculatePriorityScore } from './assisted.scoring';

export const evaluateCostRules: AssistedRule = (input) => {
    const insights: AssistedInsight[] = [];
    const signals = input.signals;

    // 1. COST HIGHER THAN THEORETICAL
    const realHighSignal = signals.find(s => s.id === 'COST_REAL_HIGHER_THAN_THEORETICAL');
    if (realHighSignal) {
        const deltaPct = realHighSignal.context?.deltaPct || 0;
        const deltaAbs = realHighSignal.context?.deltaAbs || 0;

        // Calculate Score
        // High impact if > 10%
        const score = calculatePriorityScore({
            impactPct: deltaPct,
            impactAbsEUR: deltaAbs,
            // We don't have recipe count for a single recipe view, but effectively it's 1 * relevance?
            // Or we treat "Cost View" itself as high focus.
            // Let's rely on impact.
            isConfidenceHigh: true
        });

        // Phase 2.3.1 - Tuned
        const isTrivial = deltaAbs < 0.30;
        const severity = (deltaPct > 20 && !isTrivial) ? 'critical' : (isTrivial ? 'info' : 'warning');

        if (score >= 22 || (isTrivial && score >= 15)) {
            insights.push({
                id: 'INSIGHT_COST_OVERRUN',
                title: 'Desvío de Coste',
                summary: `Coste Real superior al Teórico (+${deltaPct.toFixed(1)}%).`,
                why: 'Precio de compra actual supera lo planificado.',
                evidence: [
                    { label: 'Desvío', value: `+${deltaPct.toFixed(1)}%` },
                    { label: 'Impacto', value: `+${deltaAbs.toFixed(2)}€` }
                ],
                scope: 'cost',
                severity: severity,
                priorityScore: score,
                checklist: [
                    "Revisar precios de entrada",
                    "Comparar mercado"
                ]
            });
        }
    }

    // 2. INCOMPLETE DATA
    const incompleteSignal = signals.find(s => s.id === 'COST_REAL_INCOMPLETE' || s.id === 'COST_THEORETICAL_ZERO');
    if (incompleteSignal) {
        insights.push({
            id: 'INSIGHT_DATA_QUALITY',
            title: 'Datos Incompletos',
            summary: 'Faltan precios o stock para cálculo preciso.',
            why: incompleteSignal.explanation || 'Información insuficiente.',
            evidence: [
                { label: 'Estado', value: 'Incompleto' }
            ],
            scope: 'cost',
            severity: 'warning',
            priorityScore: 25, // High priority (blocker)
            checklist: [
                "Actualizar fichas",
                "Registrar entradas"
            ]
        });
    }

    // 3. SUCCESS / OPTIMIZED
    // If we have Real Cost, Theoretical Cost, and Real <= Theoretical
    const realLowSignal = signals.find(s => s.id === 'COST_REAL_LOWER_THAN_THEORETICAL');
    if (realLowSignal) {
        const deltaPct = realLowSignal.context?.deltaPct || 0;
        insights.push({
            id: 'INSIGHT_COST_OPTIMIZED',
            title: 'Receta Optimizada',
            summary: `Ahorro del ${deltaPct.toFixed(1)}% vs Teórico.`,
            why: 'Compras eficientes mejoran el margen.',
            evidence: [
                { label: 'Ahorro', value: `${deltaPct.toFixed(1)}%` }
            ],
            scope: 'cost',
            severity: 'success',
            priorityScore: 15 // Engine shows this if no risks exist
        });
    }

    return insights;
};

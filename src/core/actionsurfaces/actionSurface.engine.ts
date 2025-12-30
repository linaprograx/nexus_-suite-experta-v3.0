
import { ActionSurface } from './actionSurface.types';
import { ACTION_SURFACE_MAPPING } from './actionSurface.mapping';
import { AssistedInsight } from '../assisted/assisted.types';

export const generateActionSurfaces = (insights: AssistedInsight[]): ActionSurface[] => {
    if (!insights || insights.length === 0) return [];

    // Phase 2.4 Rule: Max 1 Surface per View
    // We take the highest priority insight that has a mapping.
    const sorted = [...insights].sort((a, b) => b.priorityScore - a.priorityScore);

    for (const insight of sorted) {
        const mapping = ACTION_SURFACE_MAPPING[insight.id];
        if (mapping) {
            // Found a mapping for the top priority insight
            return [{
                id: `act_${insight.id}`,
                label: mapping.label || 'Ver detalles',
                description: mapping.description,
                scope: mapping.scope || 'market', // Default
                actionType: mapping.actionType || 'informational',
                anchor: mapping.anchor
            }];
        }
    }

    return [];
};

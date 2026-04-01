import { useMemo } from 'react';
import { pizarronStore } from '../../state/store';
import { BoardNode } from '../../engine/types';
import { useApp } from '../../../../context/AppContext';
import { evaluateMarketSignals } from '../../../../core/signals/signal.engine';
import { useIngredients } from '../../../../hooks/useIngredients';
import { useRecipes } from '../../../../hooks/useRecipes';
import { resolveCostingData, resolveScenarioData } from '../../services/costingResolver';

export const useInspectorLogic = () => {
    const { selection, nodes, viewport, boardResources, interactionState } = pizarronStore.useState();
    const selectionIds = Array.from(selection);
    const { allIngredients } = useApp();
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();

    const firstNode = selectionIds.length > 0 ? nodes[selectionIds[0]] : null;

    // Determine Targets (Single, Group Children, or Multi-Selection)
    const getTargets = (): BoardNode[] => {
        if (!firstNode) return [];
        if (firstNode.type === 'group' && firstNode.childrenIds) {
            const children = firstNode.childrenIds.map(id => nodes[id]).filter(Boolean) as BoardNode[];
            return children;
        }
        return [firstNode];
    };

    // Helper for updates
    const updateNodePatch = (patch: Partial<BoardNode['content']>) => {
        const targets = getTargets();
        targets.forEach(node => {
            pizarronStore.updateNode(node.id, {
                content: { ...node.content, ...patch }
            });
        });
    };

    // Determine Effective Type
    const getEffectiveType = () => {
        if (!firstNode) return null;
        if (firstNode.type === 'group') {
            const targets = getTargets();
            if (targets.length > 0 && targets.every(n => n.type === 'board')) return 'board';
            if (targets.length > 0 && targets.every(n => n.type === 'shape')) return 'shape';
            return 'group';
        }
        return firstNode.type;
    };

    const effectiveType = getEffectiveType();
    const primaryTarget = getTargets()[0] || firstNode;

    const passiveSignals = useMemo(() => {
        if (!firstNode || !allIngredients) return [];
        const ingredientId = (firstNode.content as any).ingredientId;
        if (!ingredientId) return [];

        const marketItem = allIngredients.find(i => i.id === ingredientId);
        if (!marketItem) return [];

        return evaluateMarketSignals({
            product: {
                id: marketItem.id,
                name: marketItem.nombre,
                category: marketItem.categoria,
                supplierData: {},
                referencePrice: (firstNode.content as any).cost || 0,
                referenceSupplierId: null,
                unitBase: (firstNode.content as any).unit || 'ud'
            }
        });
    }, [firstNode, allIngredients]);

    const externalData = useMemo(() => {
        if (!firstNode) return null;

        if (firstNode.type === 'costing' && firstNode.content.recipeIdForCosting) {
            return resolveCostingData(
                firstNode.content.recipeIdForCosting,
                firstNode.content.salePriceOverride || 0,
                recipes,
                ingredients
            );
        }

        if (firstNode.type === 'costing-scenario' && firstNode.content.recipeIdsInScenario) {
            return resolveScenarioData(
                firstNode.content.recipeIdsInScenario,
                recipes,
                ingredients,
                firstNode.content.scenarioId || firstNode.content.title || 'Scenario'
            );
        }

        return null;
    }, [firstNode, recipes, ingredients]);

    return {
        firstNode,
        effectiveType,
        primaryTarget,
        interactionState,
        boardResources,
        passiveSignals,
        externalData,
        updateNodePatch,
        getTargets,
        recipes,
        ingredients
    };
};

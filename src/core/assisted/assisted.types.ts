
import { Signal } from '../signals/signal.types';
import { ContextHint } from '../context/crossLayer.types';
import { Ingredient, Recipe } from '../../types';

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';
export type InsightScope = 'market' | 'cost' | 'stock' | 'recipe';

export interface AssistedInsight {
    id: string;
    title: string;
    summary: string;
    why: string;
    evidence: Array<{ label: string, value: string }>;
    scope: InsightScope;
    severity: InsightSeverity;
    priorityScore: number;
    related?: {
        recipeIds?: string[];
        ingredientIds?: string[];
        supplierIds?: string[];
    };
    checklist?: string[];
}

export interface AssistedEngineInput {
    signals: Signal[];
    contextHints: ContextHint[];
    domain: {
        market: {
            ingredients: Ingredient[];
            selectedIngredient?: Ingredient | null;
        };
        recipes: Recipe[];
        costs?: {
            // For cost insights
            activeEscandalloRecipe?: Recipe;
        }
    };
}

export type AssistedRule = (input: AssistedEngineInput) => AssistedInsight[];


import { Signal } from '../signals/signal.types';
import { ContextHint } from '../context/crossLayer.types';
import { Ingredient, Recipe } from '../../types';

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';
export type InsightScope = 'market' | 'cost' | 'stock' | 'recipe';

export interface InsightAction {
    label: string;
    actionId: string;
    variant: 'primary' | 'secondary';
}

export interface AssistedInsight {
    id: string;
    title: string;
    summary: string;
    why?: string; // made optional
    evidence?: Array<{ label: string, value: string }>; // made optional
    scope: InsightScope;
    severity: InsightSeverity;
    priorityScore?: number; // made optional
    impact?: {
        metric: string;
        value: string | number;
        format: string;
        direction: 'positive' | 'negative' | 'neutral';
    };
    actions?: InsightAction[];
    confidence?: number;
    sourceSignalId?: string;
    related?: {
        recipeIds?: string[];
        ingredientIds?: string[];
        supplierIds?: string[];
    };
    checklist?: string[];
}

export interface InsightDomainContext {
    market: {
        ingredients: Ingredient[];
        selectedIngredient?: Ingredient | null;
    };
    recipes: Recipe[];
    costs?: {
        activeEscandalloRecipe?: Recipe;
    };
    stock?: {
        items: any[];
    };
}

export interface AssistedEngineInput {
    signals: Signal[];
    contextHints: ContextHint[];
    domain: InsightDomainContext;
}

export type AssistedRule = (input: AssistedEngineInput) => AssistedInsight[];

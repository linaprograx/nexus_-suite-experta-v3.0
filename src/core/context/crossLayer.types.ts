
import { Ingredient, Recipe, Escandallo } from '../../types';

export type ContextResultType = 'info' | 'warning' | 'positive';

export interface ContextHint {
    id: string; // Unique ID for the rule (e.g., 'MARKET_IMPACTS_RECIPES')
    message: string; // The human-readable text (e.g., "Impacts 5 recipes")
    type: ContextResultType;
    relevance: number; // 0-1 score, higher means more important to show
    metadata?: Record<string, any>; // Extra data for debugging or detailed views
}

// Input for the engine - aggregation of all necessary data
export interface CrossLayerContextInput {
    market: {
        ingredients: Ingredient[];
        selectedIngredientId?: string;
    };
    recipes: Recipe[];
    stock?: {
        // Placeholder for stock items structure
        items: any[];
    };
    costs?: {
        activeEscandallo?: Escandallo;
        // ... potentially others
    };
}

// A generic rule signature
export type CrossLayerRule = (input: CrossLayerContextInput) => ContextHint[];

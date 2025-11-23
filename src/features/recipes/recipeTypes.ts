import { Recipe } from '../../../types';

export type { Recipe };

export interface RecipeCostBreakdown {
  totalCost: number;
  costPerServing: number; // if servings are defined, otherwise equal to totalCost or 0
  suggestedMargin: number;
  recommendedPrice: number;
  grossProfit: number;
}

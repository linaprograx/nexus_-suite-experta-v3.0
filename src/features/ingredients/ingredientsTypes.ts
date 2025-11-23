import { Ingredient } from '../../../types';

export type { Ingredient };

export interface IngredientStats {
  totalIngredients: number;
  totalValue: number;
  mostUsedCategory: string;
}

export interface IngredientFilter {
  category?: string;
  searchTerm?: string;
}

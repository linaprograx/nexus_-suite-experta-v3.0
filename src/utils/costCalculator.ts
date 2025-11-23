import { Ingredient, IngredientLineItem } from '../../types';
import { convert } from './unitConverter';

export const calculateIngredientPrice = (
  packagePrice: number,
  packageQuantity: number,
  wastePercentage: number = 0
): number => {
  if (packageQuantity === 0) return 0;
  // Formula: (Price / Quantity) / (1 - Waste)
  const basePrice = packagePrice / packageQuantity;
  const yield_ = 1 - (wastePercentage / 100);
  return yield_ > 0 ? basePrice / yield_ : 0;
};

export const calculateRecipeCost = (
  ingredients: IngredientLineItem[],
  ingredientMap: Record<string, Ingredient>
): number => {
  return ingredients.reduce((total, item) => {
    if (!item.ingredientId) return total;
    const ingredient = ingredientMap[item.ingredientId];
    if (!ingredient) return total;

    // Convert item quantity to ingredient's standard unit to match standardPrice
    // However, the ingredient usually stores price per 'standardQuantity' (e.g. 1kg).
    // Let's assume 'standardPrice' in Ingredient is the price for 'standardQuantity'.
    // Wait, let's look at the type definition in types.ts:
    // standardQuantity: number; // ej. 700 (ml), 1000 (g)
    // standardPrice: number; // El precio calculado (ej. precioCompra / standardQuantity) -> This comment suggests standardPrice is unit price (price per 1 unit of standardUnit) OR price for the standardQuantity package.
    
    // Let's re-read the types.ts content I read earlier.
    // "standardPrice: number; // El precio calculado (ej. precioCompra / standardQuantity)"
    // This comment is slightly ambiguous. Usually unit price is per 1 unit (e.g. per 1 g).
    // If it is (precioCompra / standardQuantity), then it IS the price per 1 unit.
    // Example: 10€ for 1000g. standardQuantity = 1000. standardPrice = 10 / 1000 = 0.01 €/g.
    
    // So cost for line item = item.cantidad * converted_to_match_standard_unit * standardPrice
    
    const quantityInStandardUnit = convert(item.cantidad, item.unidad, ingredient.standardUnit);
    const itemCost = quantityInStandardUnit * ingredient.standardPrice;
    
    return total + itemCost;
  }, 0);
};

export const calculateMargin = (cost: number, salePrice: number): number => {
  if (salePrice === 0) return 0;
  // Margin % = ((Price - Cost) / Price) * 100
  return ((salePrice - cost) / salePrice) * 100;
};

export const calculateRecommendedPrice = (cost: number, targetMarginPercent: number = 70): number => {
  // Price = Cost / (1 - Margin%)
  const marginDecimal = targetMarginPercent / 100;
  if (marginDecimal >= 1) return 0; // Avoid division by zero or negative
  return cost / (1 - marginDecimal);
};

export const calculateGrossProfit = (cost: number, salePrice: number): number => {
  return salePrice - cost;
};

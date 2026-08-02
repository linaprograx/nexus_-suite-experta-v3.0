// NOTE: The recipe-costing engine lives in `core/costing/costCalculator.ts` (single source of
// truth — handles unit normalization, purchase enrichment, sub-recipes and standardPrice).
// This file only keeps small, non-duplicated pure helpers.

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

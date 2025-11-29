/**
 * Formats a number as a currency string in Euros.
 * @param value The number to format.
 * @returns A string representing the value in Euros (e.g., "€12,34").
 */
export const formatCost = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '€0.00';
  }
  return `€${value.toFixed(2)}`;
};

/**
 * Determines the color code based on a margin percentage.
 * - Red: margin < 67% (cost > 1/3 of price)
 * - Yellow: 67% <= margin < 75% (cost between 1/4 and 1/3 of price)
 * - Green: margin >= 75% (cost <= 1/4 of price)
 * @param margin The margin percentage (0-100).
 * @returns A string representing the color ('green', 'yellow', 'red').
 */
export const getMarginColor = (margin: number | undefined | null): 'green' | 'yellow' | 'red' => {
  if (margin === undefined || margin === null || isNaN(margin)) {
    return 'red';
  }
  if (margin >= 75) {
    return 'green';
  }
  if (margin >= 67) {
    return 'yellow';
  }
  return 'red';
};

/**
 * Returns Tailwind CSS classes for the margin color.
 * @param margin The margin percentage (0-100).
 * @returns A string of Tailwind CSS classes for text color.
 */
export const getMarginTextColor = (margin: number | undefined | null): string => {
  const color = getMarginColor(margin);
  switch (color) {
    case 'green':
      return 'text-green-600 dark:text-green-400';
    case 'yellow':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'red':
      return 'text-red-600 dark:text-red-400';
  }
};

/**
 * Returns Tailwind CSS classes for a background color bar representing the margin.
 * @param margin The margin percentage (0-100).
 * @returns A string of Tailwind CSS classes for background color.
 */
export const getMarginBgColor = (margin: number | undefined | null): string => {
    const color = getMarginColor(margin);
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
  };

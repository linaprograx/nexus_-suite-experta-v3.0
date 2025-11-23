export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'lt' | 'oz' | 'tbsp' | 'tsp' | 'und' | 'pza' | 'unidad' | string;

const CONVERSION_RATES: Record<string, number> = {
  // Base: g (mass)
  'g': 1,
  'kg': 1000,
  
  // Base: ml (volume)
  'ml': 1,
  'l': 1000,
  'lt': 1000,
  'oz': 29.5735,
  'tbsp': 15,
  'tsp': 5,
  
  // Base: und (count)
  'und': 1,
  'pza': 1,
  'unidad': 1,
};

export function convert(value: number, fromUnit: string, toUnit: string): number {
  if (!value) return 0;
  
  const normalizedFrom = fromUnit.toLowerCase().trim();
  const normalizedTo = toUnit.toLowerCase().trim();

  // If units are the same, return value
  if (normalizedFrom === normalizedTo) return value;

  // Get factors to base unit
  const fromFactor = CONVERSION_RATES[normalizedFrom];
  const toFactor = CONVERSION_RATES[normalizedTo];

  if (!fromFactor || !toFactor) {
    // If unit is unknown, return original value but log warning
    console.warn(`Conversion unit not supported or mismatch: ${fromUnit} -> ${toUnit}`);
    return value;
  }

  // Convert to base unit then to target unit
  const valueInBase = value * fromFactor;
  return valueInBase / toFactor;
}

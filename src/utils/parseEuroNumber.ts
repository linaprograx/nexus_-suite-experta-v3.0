export function parseEuroNumber(value: string | null | undefined): number {
  if (!value) return 0;

  let cleaned = value
    .toString()
    .trim()
    .replace(/\\uFEFF/g, '')  // BOM
    .replace(/\r/g, '')      // retornos ocultos
    .replace(/\s/g, '')      // espacios
    .replace(/€/g, '')        // símbolo €
    .replace(/\./g, '')      // miles
    .replace(',', '.');       // coma → punto

  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

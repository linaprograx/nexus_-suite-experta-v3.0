export function parseEuroNumber(value: string): number {
  if (!value) return 0;
  return Number(
    value
      .toString()
      .replace(/€/g, '')
      .replace(/\s+/g, '')
      .replace(',', '.')
  );
}

/**
 * Parses a money/number string in either Spanish (1.234,56) or US (1,234.56)
 * format into a JS number. Robust to currency symbols and whitespace.
 *
 * Rule: the LAST separator that appears is the decimal separator; any other
 * separators are thousands grouping and get stripped.
 */
export function parseEuroNumber(value: string | number): number {
  if (value === 0) return 0;
  if (!value) return 0;
  if (typeof value === 'number') return value;

  let cleaned = value.toString().replace(/€/g, '').replace(/\s+/g, '').replace(/[^0-9.,-]/g, '');
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma === -1 && lastDot === -1) {
    // Plain integer
    return Number(cleaned) || 0;
  }

  // Whichever separator appears LAST is the decimal separator.
  const decimalSep = lastComma > lastDot ? ',' : '.';
  const thousandsSep = decimalSep === ',' ? '.' : ',';

  // Strip thousands separators, normalize decimal to '.'
  cleaned = cleaned.split(thousandsSep).join('');
  cleaned = cleaned.replace(decimalSep, '.');

  const result = Number(cleaned);
  return isNaN(result) ? 0 : result;
}

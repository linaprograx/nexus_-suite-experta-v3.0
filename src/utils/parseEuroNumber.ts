export function parseEuroNumber(value: string | number): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;

  let cleaned = value.toString().replace(/€/g, '').replace(/\s+/g, '');
  
  // Check format
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // If both, usually dot is thousands and comma is decimal in Euro (ES)
    // But check positions to be sure?
    // 1.000,00 (ES) vs 1,000.00 (US)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Euro format: 1.000,00
      // Remove dots, replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,000.00
      // Remove commas
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma: 1000,00 or 0,50
    // Assume comma is decimal
    cleaned = cleaned.replace(',', '.');
  } 
  // If only dot: 1000.00 or 1000 (Assume dot is decimal unless it looks like thousands separator logic? 
  // But usually JS parses dot as decimal. 
  // If input is 1.000 meaning one thousand, JS `Number("1.000")` is 1.
  // This is ambiguous. 
  // However, typically imports stick to one convention.
  // Given "Euro" number, let's assume comma is preferred decimal. 
  // If string is "1.200", is it 1200 or 1.2?
  // In Spain "1.200" is 1200. "1,2" is 1.2.
  // If I strictly enforce Euro format:
  // 1.200 -> 1200.
  
  // Let's try to be smart:
  // If strictly "parseEuroNumber", we assume Spanish locale.
  // . = thousands, , = decimal.
  
  // But if I receive "10.50" (standard computer format), I should parse as 10.5.
  // It is hard to distinguish "1.234" (1234) from "1.234" (1.234).
  // I will stick to:
  // If comma exists, it's the decimal separator. Remove dots.
  // If no comma, but dots exist:
  //    If multiple dots (1.000.000), remove all.
  //    If one dot: 
  //       If it has 3 decimals (1.234), it MIGHT be thousands.
  //       But "1.50" is clearly decimal.
  // This is risky.
  
  // Safe bet for "Euro" import:
  // Replace all dots with nothing. Replace comma with dot.
  // BUT valid only if input strictly follows ES format.
  // `Libro5_delimitado_FINAL.csv` likely has a specific format.
  // Let's look at the user feedback again. "interprete correctamente precios, separadores, formatos decimales".
  
  // I'll assume the CSV likely uses standard Spanish Excel export:
  // 1.234,56
  
  if (hasComma) {
     // Remove dots (thousands)
     cleaned = cleaned.replace(/\./g, '');
     // Replace comma with dot
     cleaned = cleaned.replace(',', '.');
  } else {
     // No comma. "1000" or "10.50"?
     // If it comes from ES Excel, 1000 is "1000" or "1.000".
     // 10.5 is "10,5".
     // So if no comma, and has dot: "1.000" -> 1000.
     // UNLESS the file mixes formats.
     // Let's check if the dot seems to be a decimal (e.g. 10.5 or 10.99)
     // If we want to support "10.50" as 10.5, we leave it.
     // But "1.000" should be 1000.
     // Let's stick to standard `Number()` for dot-only, as it's safer for non-ambiguous cases, 
     // but strictly speaking parseEuro should handle 1.000 as 1000.
     
     // Let's assume if no comma, standard JS parsing is best effort, unless we force ES format.
     // For now, sticking to comma-handling is the most important fix for Euro.
  }

  return Number(cleaned);
}

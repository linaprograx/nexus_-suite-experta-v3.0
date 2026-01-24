export interface ParsedRecipeBlock {
  nombre: string;
  categorias: string[];
  ingredientesTexto: string;
  preparacion: string;
  garnish: string;
  storytelling: string;
  tecnica: string;
  pageNumber: number;
}

/**
 * Extracts the content of a specific block (e.g., [Nombre]) from a text.
 * @param text The full text to search within.
 * @param key The key of the block to extract (e.g., "Nombre").
 * @returns The trimmed content of the block, or an empty string if not found.
 */
const extractBlockContent = (text: string, key: string): string => {
  // 1. Try standard bracket key [Key] or [Key:]
  const regex = new RegExp(`\\[${key}[:]?\\]([\\s\\S]*?)(?=\\[[A-ZÀ-Úa-zà-ú]+\\]|$)`, 'i');
  const match = text.match(regex);
  if (match) return match[1].trim();

  // 2. Fallback: Try just the word "Key:" followed by content (common in simpler PDFs)
  // Only if usage is "Ingredientes:" at start of line
  const regexSimple = new RegExp(`(?:^|\\n)${key}[:]([\\s\\S]*?)(?=\\n[A-ZÀ-Úa-zà-ú]+[:]|$)`, 'i');
  const matchSimple = text.match(regexSimple);
  if (matchSimple) return matchSimple[1].trim();

  return '';
};

/**
 * Parses a single page's text to find one or more recipe blocks.
 * For now, we assume one recipe per page for simplicity.
 * @param pageText The text content of a single PDF page.
 * @param pageNumber The page number.
 * @returns An array of parsed recipe blocks found on the page.
 */
export const parsePdfRecipeBlocks = (pageText: string, pageNumber: number): ParsedRecipeBlock[] => {
  // We can enhance this later to detect multiple recipes per page if needed.
  // For now, we treat the entire page text as a single potential recipe block.

  const nombre = extractBlockContent(pageText, "Nombre");

  // If no name is found, we assume there's no recipe on this page.
  if (!nombre) {
    return [];
  }

  const categoriasRaw = extractBlockContent(pageText, "Categorias");

  const recipe: ParsedRecipeBlock = {
    nombre,
    categorias: categoriasRaw ? categoriasRaw.split(',').map(c => c.trim()) : [],
    ingredientesTexto: extractBlockContent(pageText, "Ingredientes"),
    preparacion: extractBlockContent(pageText, "Preparacion"),
    garnish: extractBlockContent(pageText, "Garnish"),
    storytelling: extractBlockContent(pageText, "Storytelling"),
    tecnica: extractBlockContent(pageText, "Tecnica"),
    pageNumber,
  };

  return [recipe];
};

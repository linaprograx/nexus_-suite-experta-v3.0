// Helper para parsear bloques simples (ej: [Ingredientes] ... [Preparacion])
export const parseSimpleBlock = (text: string, key: string): string => {
  const regex = new RegExp(`\\[${key}\\]([\\s\\S]*?)(?=\\[[^\\]]+\\]|---|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

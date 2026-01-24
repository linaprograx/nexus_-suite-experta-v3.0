import { askAI } from "../../../utils/aiClient";
import { buildPowerPrompt } from "./promptTemplates";

export async function powerFlavorMapper(ingredients: string[]) {
  const prompt = buildPowerPrompt("Mapeo de Sabores", ingredients);
  return await askAI(prompt);
}

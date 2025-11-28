import { askAI } from "../../../utils/aiClient";
import { buildPowerPrompt } from "./promptTemplates";

export async function powerCreativeBooster(ingredients: string[]) {
  const prompt = buildPowerPrompt("Creative Booster Avanzado", ingredients);
  return await askAI(prompt);
}

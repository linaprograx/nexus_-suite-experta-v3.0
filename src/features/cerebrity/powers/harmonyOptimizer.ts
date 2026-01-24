import { askAI } from "../../../utils/aiClient";
import { buildPowerPrompt } from "./promptTemplates";

export async function powerHarmonyOptimizer(ingredients: string[]) {
  const prompt = buildPowerPrompt("Harmony Optimizer", ingredients);
  return await askAI(prompt);
}

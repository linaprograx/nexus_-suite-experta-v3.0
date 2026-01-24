import { askAI } from "../../../utils/aiClient";
import { buildPowerPrompt } from "./promptTemplates";

export async function powerStorytellingAnalyzer(ingredients: string[]) {
  const prompt = buildPowerPrompt("Analizador de Storytelling", ingredients);
  return await askAI(prompt);
}

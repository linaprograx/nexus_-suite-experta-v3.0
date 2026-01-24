import { askAI } from "../../../utils/aiClient";
import { buildPowerPrompt } from "./promptTemplates";

export async function powerRarenessIdentifier(ingredients: string[]) {
  const prompt = buildPowerPrompt("Identificador de Rarezas", ingredients);
  return await askAI(prompt);
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanJSON } from "./jsonCleaner";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("API Key de Gemini no encontrada. Asegúrate de que VITE_GEMINI_API_KEY está en tu archivo .env");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function askAI(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleaned = cleanJSON(text);
    if (!cleaned) {
      return { error: true, message: "Invalid JSON returned from model." };
    }

    return cleaned;

  } catch (e: any) {
    console.error("AI ERROR:", e);
    return { error: true, message: e.message };
  }
}

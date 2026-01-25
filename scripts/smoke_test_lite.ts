
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Manual config since we are running raw node
const apiKey = process.env.VITE_GEMINI_API_KEY || "NOT_FOUND";

console.log("--- GOOGLE API SMOKE TEST ---");

if (apiKey === "NOT_FOUND") {
    // Try to load from file manually if passed in env
    console.error("Please ensure VITE_GEMINI_API_KEY is available.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

async function test() {
    console.log("1. Testing Model Availability...");

    // Test Text (Baseline)
    try {
        console.log("   Attempting Text Gen (gemini-1.5-flash)...");
        await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: { parts: [{ text: "hi" }] }
        });
        console.log("   ✅ Text Gen WORKS. Key is valid.");
    } catch (e) {
        console.log("   ❌ Text Gen FAILED.", e.message);
        return; // specific key issue
    }

    // Test Image
    try {
        console.log("   Attempting Image Gen (imagen-3.0-generate-001)...");
        const res = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: { parts: [{ text: "cat" }] }
        });
        console.log("   ✅ Image Gen WORKS!");
    } catch (e) {
        console.log("   ❌ Image Gen FAILED.");
        console.log("      Error:", e.message);
        console.log("      Code:", e.status || "Unknown");
    }
}

test();

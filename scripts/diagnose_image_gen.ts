
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error("❌ .env file not found at", envPath);
    process.exit(1);
}

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ VITE_GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

console.log(`🔍 Starting Deep Diagnostic (Key ending in ...${API_KEY.slice(-4)})`);

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testGeminiText() {
    process.stdout.write("1️⃣  Testing Basic Text Generation (gemini-2.0-flash-exp)... ");
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts: [{ text: "Hello" }] }
        });
        console.log("✅ OK");
    } catch (e: any) {
        console.log("❌ FAILED");
        console.error("   Reason:", e.message);
    }
}

async function testImagen() {
    process.stdout.write("2️⃣  Testing Image Generation (imagen-3.0-generate-001)... ");
    try {
        const result = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: { parts: [{ text: "A small red apple" }] }
        });
        console.log("✅ OK (Your key has access!)");
    } catch (e: any) {
        console.log("❌ FAILED");
        if (e.message.includes('404')) console.log("   -> 404 Not Found: This model is likely NOT enabled for your API key (Free Tier?)");
        else if (e.message.includes('403')) console.log("   -> 403 Forbidden: API Key lacks permission (Check Google Cloud Console)");
        else if (e.message.includes('400')) console.log("   -> 400 Bad Request: Model might not support this input format");
        else console.log("   Reason:", e.message);
    }
}

async function testLegacyImagen() {
    process.stdout.write("3️⃣  Testing Legacy Imagen (gemini-1.5-flash)... ");
    // Some users accidentally use Flash for images (not supported, but checking error)
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: { parts: [{ text: "Generate an image of a cat" }] } // This won't work, just checking response
        });
        // If it generates text saying "I can't do images", that's a partial success of the connection
        console.log("⚠️  Received Text (Not Image):", result.response?.text()?.slice(0, 50) + "...");
    } catch (e: any) {
        console.log("❌ FAILED:", e.message);
    }
}

async function checkPollinations() {
    process.stdout.write("4️⃣  Checking Pollinations.ai Connectivity... ");
    const url = "https://image.pollinations.ai/prompt/test?model=turbo&nologo=true";

    // Simple fetch check
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
            console.log("✅ OK (Accessible & Returns Image)");
        } else {
            console.log("❌ FAILED (Status: " + response.status + ", Type: " + response.headers.get('content-type') + ")");
        }
    } catch (e: any) {
        console.log("❌ NETWORK ERROR");
        console.error("   Reason:", e.message);
    }
}

async function run() {
    await testGeminiText();
    await testImagen();
    await testLegacyImagen();
    await checkPollinations();
}

run();

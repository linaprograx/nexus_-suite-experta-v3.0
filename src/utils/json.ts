/**
 * Detects and extracts JSON from a string that might contain markdown blocks or other text.
 */
export function safeParseJson(text: string): any {
    if (!text) return null;

    let cleaned = text.trim();

    // Remove markdown code blocks if present
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        cleaned = jsonMatch[1];
    } else {
        // Fallback: try to find the first { or [ and the last } or ]
        const startBrace = cleaned.indexOf('{');
        const startBracket = cleaned.indexOf('[');
        const startIndex = (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) ? startBrace : startBracket;

        if (startIndex !== -1) {
            const endBrace = cleaned.lastIndexOf('}');
            const endBracket = cleaned.lastIndexOf(']');
            const endIndex = (endBrace !== -1 && endBrace > endBracket) ? endBrace : endBracket;

            if (endIndex !== -1 && endIndex > startIndex) {
                cleaned = cleaned.substring(startIndex, endIndex + 1);
            }
        }
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("[safeParseJson] Error parsing JSON:", e, "Cleaned text:", cleaned);
        return null;
    }
}

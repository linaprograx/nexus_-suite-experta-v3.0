// import { Type } from "@google/genai"; // REMOVED
import { collection, addDoc, serverTimestamp, Firestore } from "firebase/firestore";
// import { callGeminiApi } from "../utils/gemini"; // REMOVED
import { Recipe, PizarronTask, MenuLayout } from "../types";
import { safeParseJson } from "../utils/json";

export interface MenuDesignProposal {
    id: string;
    themeName: string;
    description: string;
    suggestedTypography: string;
    htmlContent: string;
    sections?: any[];
    items?: string[]; // Recipe IDs
}

export const makeMenuService = {
    /**
     * Generates 3 menu design proposals using the Gemini engine.
     * This is the canonical algorithm used by Make Menu.
     */
    async generateProposals(
        recipes: Recipe[],
        tasks: any[],
        sections: string[],
        menuContext: 'cocktails' | 'food' = 'cocktails',
        style: string = 'Moderno',
        color: string = '#14b8a6'
    ): Promise<MenuDesignProposal[]> {

        const contextPrompt = recipes.map(r => r.nombre).join(', ');
        const taskTexts = tasks.map(t => typeof t === 'string' ? t : t.texto || '');

        let contextInstructions = "";
        if (menuContext === 'cocktails') {
            contextInstructions = `STRICT CONTEXT: COCKTAIL / DRINKS MENU. FORBIDDEN: "Platos", "Entrantes", "Comida". SECTIONS: "Signatures", "Classics", "Highballs", etc.`;
        } else {
            contextInstructions = `CONTEXT: RESTAURANT / FOOD MENU.`;
        }

        try {
            // Dynamic import for secure Architecture
            const { generateText } = await import('./ai/textService');
            const { buildSystemPrompt, MENU_DESIGN_SPECIALIST } = await import('./ai/systemPersonas');

            const systemPrompt = buildSystemPrompt(
                'Menu Design Architect',
                `${MENU_DESIGN_SPECIALIST}
                ${contextInstructions}
                USER PREFERENCES: Style: ${style}, Accent Color: ${color}.
                OUTPUT FORMAT: Strictly return a JSON Array of 3 objects.`
            );

            const userQuery = `Create 3 layouts for items: ${contextPrompt}. Return JSON Array with objects having: 'themeName', 'description', 'suggestedTypography', 'htmlContent' (HTML string), and 'structure' (array of {title: string, itemIndices: number[]}).`;

            const response = await generateText(userQuery, systemPrompt);

            if (!response.text) throw new Error("AI returned empty response.");

            // Clean Markdown
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const results = safeParseJson(cleanJson);

            if (!results || !Array.isArray(results)) {
                console.error("[MakeMenuService] Invalid response format:", cleanJson);
                throw new Error("Invalid AI Response Format.");
            }

            return results.map((r, i) => {
                // Map itemIndices to actual IDs
                const sections = (r.structure || []).map((s: any) => ({
                    title: s.title,
                    items: (s.itemIndices || []).map((idx: number) => recipes[idx]?.id).filter(Boolean)
                }));

                // Fallback if no structure: use flat list
                const flatItems = recipes.map(rec => rec.id);

                return {
                    ...r,
                    id: `proposal_${Date.now()}_${i}`,
                    items: sections.length > 0 ? undefined : flatItems,
                    sections: sections.length > 0 ? sections : (sections.length === 0 && contextPrompt.includes('Estructura') ? sections : [{ title: 'Menú', items: flatItems }])
                };
            });

        } catch (e: any) {
            console.error("[MakeMenuService] Generation Error:", e);
            throw e;
        }
    },

    /**
     * Saves a menu design proposal to the persistent history.
     */
    async saveProposal(db: Firestore, appId: string, proposal: any) {
        const historyCol = collection(db, `artifacts/${appId}/public/data/make-menu-history`);
        return await addDoc(historyCol, {
            ...proposal,
            createdAt: serverTimestamp(),
            source: 'Pizarrón'
        });
    }
};

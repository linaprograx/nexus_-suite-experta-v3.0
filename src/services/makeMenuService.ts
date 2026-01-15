import { Type } from "@google/genai";
import { collection, addDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { callGeminiApi } from "../utils/gemini";
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
        // Support PizarronTask[] (legacy) or string[]
        const taskTexts = tasks.map(t => typeof t === 'string' ? t : t.texto || '');
        let contextInstructions = "";

        if (menuContext === 'cocktails') {
            contextInstructions = `
            STRICT CONTEXT: COCKTAIL / DRINKS MENU. 
            FORBIDDEN TERMS: "Platos", "Entrantes", "Comida", "Postres". 
            USE SECTIONS LIKE: "Signatures", "Classics", "Highballs", "Experimental", "Zero Proof".
            `;
        } else {
            contextInstructions = `CONTEXT: RESTAURANT / FOOD MENU.`;
        }

        const systemPrompt = `
        You are an expert Menu Graphic Designer. 
        ${contextInstructions}
        
        USER PREFERENCES:
        - Style: ${style}
        - Main Color Accent: ${color} (Use this color for titles, lines, or highlights in the HTML).

        Generate exactly 3 DISTINCT design proposals. They must be structurally and conceptually unique.
        
        1. Variant A (Narrative/Editorial): Story, philosophy, complex descriptions, grouped by mood or origin.
        2. Variant B (Minimal/Industrial): Clean, list-based, functional, grouped by technique or main spirit.
        3. Variant C (Experimental/Avant-Garde): Scientific classification, lab-style, grouped by flavor profile or molecular structure.
        
        CRITICAL: For each proposal, you MUST generate a 'htmlContent' field containing a complete, beautiful, responsive HTML/CSS representation of the menu. 
        - Use TailwindCSS classes or inline styles.
        - The visual design must match the Variant's intent perfectly.
        - Do not include <html> or <body> tags, just the inner content.
        - Also provide 'suggestedTypography' with @import Google Fonts links.
        - LAYOUT RULE: Use p-6 or p-8 for padding. Avoid >2 columns unless necessary. Content must breathe.
        - TYPOGRAPHY: Ensure high contrast and readability. Use uppercase for headers.

        Distribute items (recipes) into logical sections for EACH variant. 
        Use 0-based indices to refer to items.
        Return strictly a JSON array.
        `;

        const userQuery = `Create 3 layouts for: ${contextPrompt}. Style: ${style}. Accent Color: ${color}. Total Items: ${recipes.length}.`;

        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        themeName: { type: Type.STRING },
                        description: { type: Type.STRING },
                        suggestedTypography: { type: Type.STRING },
                        htmlContent: { type: Type.STRING },
                        // ADDED: Sections with item indices
                        structure: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    itemIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                                }
                            }
                        }
                    }
                }
            }
        };

        try {
            const response = await callGeminiApi(userQuery, systemPrompt, generationConfig);
            if (!response.text) throw new Error("La IA no devolvió texto válido.");

            const results = safeParseJson(response.text);
            if (!results || !Array.isArray(results)) {
                console.error("[MakeMenuService] Invalid response format:", response.text);
                throw new Error("La IA no devolvió un formato válido.");
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
                    items: sections.length > 0 ? undefined : flatItems, // If sections exist, items are inside them
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

import { callGeminiApi } from '../../../utils/gemini';
import { PlanTier } from '../../../core/product/plans.types';
import { brandGuardianBasePrompt } from '../../../lib/ai/prompts/brandGuardian/base';
import { genericProfile } from '../../../lib/ai/prompts/brandGuardian/profiles/generic';
import { mezcalProfile } from '../../../lib/ai/prompts/brandGuardian/profiles/mezcal';
import { ginProfile } from '../../../lib/ai/prompts/brandGuardian/profiles/gin';
import { visualCocktailPrompt } from '../../../lib/ai/prompts/visualCocktail';
import { visualBrandPrompt } from '../../../lib/ai/prompts/visualBrand';
import { ImageGenerator } from '../../../lib/ai/image/imageGenerator';

// --- Interfaces ---

export interface GeminiRef {
    text: string;
    type: 'visual' | 'flavor' | 'conceptual';
}

export interface ChampionGenerationParams {
    brand: string;
    constraints: string[];
    concept: string;
    ingredients?: string[];
    palette?: string; // Hex or Name
    visualRefs?: string[];
    userPlan: PlanTier;
}

export interface JuryEvaluationParams {
    proposal: any;
    brief: any;
    userPlan: PlanTier;
    difficulty: 'Easy' | 'Medium' | 'World Class';
}

// --- Prompts ---

const SYSTEM_ROLES = {
    TACTICIAN: "Eres un estratega veterano de competencias (World Class). Tu objetivo es dar UN consejo táctico breve y específico basado en las reglas.",
    CREATIVE_DIRECTOR: "Eres el Director Creativo de Nexus Spirits. Transformas conceptos en recetas de alto nivel, con storytelling inmersivo y rituales WOW.",
    JURY_PANEL: "Eres un panel de jueces internacionales. Eres estricto y evalúas con precisión técnica, creativa y de marca.",
    INTERVIEWER: "Eres un juez inquisidor. Valoras la precisión técnica y el conocimiento de producto.",
    COACH: "Eres un entrenador de bartenders campeones. Das feedback constructivo pero directo sobre las respuestas del alumno.",
    BRAND_GUARDIAN: "You are a World Class Brand Guardian. You protect brand equity above all else."
};

// --- Service ---

import { selectJuryPrompt, JuryDifficulty } from '../../../lib/ai/promptSelector';
import { creativeWorldClassPrompt } from '../../../lib/ai/prompts/creativeWorldClass';
import { checklistAdvisorPrompt } from '../../../lib/ai/prompts/checklistAdvisor';

const getBrandProfile = (brandName: string): string => {
    const lower = brandName.toLowerCase();
    if (lower.includes('mezcal') || lower.includes('agave')) return mezcalProfile;
    if (lower.includes('gin') || lower.includes('tanqueray') || lower.includes('no. ten')) return ginProfile;
    return genericProfile;
};

export const GeminiChampionService = {

    // --- NEW: Brand Guardian ---
    // --- NEW: Brand Guardian ---
    async evaluateBrandAlignment(proposal: any, brief: any): Promise<any> {
        const profile = getBrandProfile(brief.brand);

        let prompt = brandGuardianBasePrompt + "\n\n" + profile + "\n\n";
        prompt += `CONTEXT:\nBrand: ${brief.brand}\nCocktail: ${proposal.title}\nIntro: ${proposal.shortIntro || proposal.description}\nRitual: ${proposal.ritual}\nTechnique: ${proposal.method}`;

        try {
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.BRAND_GUARDIAN, { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(jsonText);

            // GENERATE BRAND RADAR IMAGE (VISUAL BRAND IDENTITY)
            // 1. Generate specialized prompt
            const visualIdentityPrompt = await GeminiChampionService.generateVisualBrandPrompt(brief, proposal);

            // 2. Generate Graphic
            result.imageUrl = await ImageGenerator.generateGraphicUrl(visualIdentityPrompt);

            return result;
        } catch (e) {
            console.error("Brand Guardian Error", e);
            return { brandAlignmentScore: 0, verdict: "WEAK", risks: ["Analysis Failed"], strategicRecommendation: "Review manually.", imageUrl: null };
        }
    },

    // --- NEW: Visual Prompt Helpers ---
    // --- NEW: Visual Prompt Helpers (OPTIMIZED - NO AI CALL) ---
    async generateVisualCocktailPrompt(proposal: any): Promise<string> {
        // Deterministic Prompt Construction to save API Quota (Fixes 429 Error)
        const glassware = proposal.glassware || "Elegant Glass";
        const garnish = typeof proposal.garnish === 'string' ? proposal.garnish : proposal.garnish?.name || "minimalist garnish";

        // "Nano Banana" Template
        return `Hyper-realistic award-winning cocktail photography of "${proposal.title}". Served in a ${glassware}. Garnish: ${garnish}. Style: Cinematic lighting, 8k resolution, shallow depth of field, liquid texture focus, professional studio, dark moody background with brand colors, 8k, photorealistic`;
    },

    async generateVisualBrandPrompt(brief: any, proposal: any): Promise<string> {
        // Deterministic Fallback to save quota
        return `Futuristic radar chart for ${brief.brand}, neon colors, data visualization, minimalist, clean lines, ${proposal.shortIntro || "concept"}, 8k, vector style`;
    },

    async generateVisualImpactAssessment(proposal: any): Promise<string> {
        // Deterministic Fallback to save quota
        return "Visually striking presentation with strong brand alignment and premium execution.";
    },

    // --- NEW: Real Image Generation (Refactored) ---
    async generateCocktailImage(imagePrompt: string): Promise<string> {
        try {
            return await ImageGenerator.generateImageUrl(imagePrompt);
        } catch (e) {
            console.error("Image Gen Error", e);
            // DYNAMIC FALLBACK: Pollinations with the actual prompt
            const encoded = encodeURIComponent(imagePrompt + ", 8k, photorealistic");
            // Switched to Turbo due to Flux maintenance
            return `https://pollinations.ai/p/${encoded}?width=1024&height=1024&model=turbo&nologo=true`;
        }
    },

    // Phase 1: Briefing -> Hint
    async generateTacticalHint(brand: string, constraints: string[]): Promise<string> {
        const prompt = `Analiza este brief:
        Marca: ${brand}
        Reglas: ${constraints.join(', ')}
        
        Dame 1 consejo táctico (máximo 20 palabras) para ganar.`;

        try {
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.TACTICIAN);
            return response.text || "Enfócate en la simplicidad.";
        } catch (e) {
            return "Revisa las reglas con cuidado.";
        }
    },

    // Phase 2: Creative -> Proposal
    async generateCreativeProposal(params: ChampionGenerationParams): Promise<any> {
        const { brand, constraints, concept, ingredients, userPlan, palette, visualRefs } = params;

        // Use the new World Class Prompt
        let prompt = creativeWorldClassPrompt
            .replace('{{brand}}', brand)
            .replace('{{constraints}}', constraints.join(', '))
            .replace('{{concept}}', concept)
            .replace('{{ingredients}}', ingredients?.join(', ') || "A elección del Director Creativo")
            .replace('{{palette}}', palette || "No especificada")
            .replace('{{visualRefs}}', visualRefs?.join(', ') || "Estilo Libre");

        // FORCE GLASSWARE INTO THE CONCEPT IF NOT PRESENT
        // This ensures the creative director considers it, but the prompt template might need it.
        // Actually, the prompt *output* determines the glassware. We need to respect *that* output in the image.


        try {
            console.log(">>> CALLING GEMINI CREATIVE: ", prompt.substring(0, 100) + "...");
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.CREATIVE_DIRECTOR, { responseMimeType: "application/json" });
            console.log(">>> GEMINI RAW RESPONSE:", response.text);

            // ROBUST JSON CLEANING
            let jsonText = response.text || "";
            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

            // Find the first '{' and last '}' to ensure we have a valid object
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }

            let proposal;
            try {
                proposal = JSON.parse(jsonText);
            } catch (parseError) {
                console.error("JSON Parse Error. Raw Text:", response.text);
                throw new Error("La IA generó una respuesta inválida. Intenta de nuevo.");
            }

            // OPTIMIZATION: Parallelize visual tasks
            // We wrap visual generation in its own try/catch so it doesn't fail the whole proposal
            let imageUrl = null;
            let imagePrompt = null;
            let visualAnalysis = null;

            try {
                const [visualData, analysis] = await Promise.all([
                    (async () => {
                        const prompt = await GeminiChampionService.generateVisualCocktailPrompt(proposal);
                        const url = await GeminiChampionService.generateCocktailImage(prompt);
                        return { prompt, url };
                    })(),
                    GeminiChampionService.generateVisualImpactAssessment(proposal)
                ]);
                imageUrl = visualData.url;
                imagePrompt = visualData.prompt;
                visualAnalysis = analysis;
            } catch (visualError) {
                console.warn("Visual Generation Failed (Non-critical):", visualError);
                // Fallbacks are already handled in helper methods, but just in case
            }

            proposal.imageUrl = imageUrl;
            proposal.imagePrompt = imagePrompt;
            proposal.visualAnalysis = visualAnalysis;

            return proposal;
        } catch (e) {
            console.error("Gemini Creative Critical Error (DEBUG_001):", e);
            throw new Error("GEMINI_CRITICAL_FAIL_DEBUG_001: " + (e as Error).message);
        }
    },

    // Phase 3: Validation -> Jury Verdict
    async evaluateProposal(params: JuryEvaluationParams): Promise<any> {
        const { proposal, brief, userPlan, difficulty } = params;
        const systemRole = selectJuryPrompt(difficulty as JuryDifficulty);

        // Enhanced Context for Jury with STRICT JSON ENFORCEMENT
        const prompt = `
        EVALÚA ESTA PROPUESTA DE CÓCTEL OFICIALMENTE.
        
        CONTEXTO DE LA COMPETENCIA:
        - Marca: ${brief.brand}
        - Reglas Oficiales: ${brief.constraints.join(', ')}
        - Target: ${brief.targetAudience}
        
        PROPUESTA DEL COMPETIDOR: 
        - Nombre: ${proposal.title}
        - Intro Concept: ${proposal.shortIntro || proposal.description}
        - Receta: ${JSON.stringify(proposal.recipe)}
        - Elaboraciones Complejas: ${JSON.stringify(proposal.complexPreparations || [])}
        - Garnish: ${JSON.stringify(proposal.garnish)}
        - Ritual de Servicio: ${proposal.ritual}
        - Perfil de Sabor: ${JSON.stringify(proposal.flavorProfile)}

        MODO DE EVALUACIÓN: ${difficulty.toUpperCase()}
        TU ROL: Juez ${(userPlan === 'STUDIO' || userPlan === 'EXPERT') ? "Generalista" : "Especializado"}

        IMPORTANTE: Debes devolver un JSON VÁLIDO con la siguiente estructura exacta para que el sistema lo procese:

        {
            "overallScore": (0-100),
            "verdict": "COMPETITIVE / FINALIST / NOT COMPETITIVE",
            "feedback": ["Feedback General", "Punto a favor", "Punto a mejorar"],
            "categoryScores": {
                "Sabor": 0-100,
                "Técnica": 0-100,
                "Storytelling": 0-100,
                "Marca": 0-100
            },
            "juryBreakdown": {
                "technical": { "score": 0-100, "comment": "Crítica técnica específica" },
                "brand": { "score": 0-100, "comment": "Alineación con ${brief.brand}" },
                "creative": { "score": 0-100, "comment": "Evaluación del concepto y ritual" }
            }
        }
        `;

        try {
            const response = await callGeminiApi(prompt, systemRole, { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            const juryResult = JSON.parse(jsonText);

            // RUN BRAND GUARDIAN IN PARALLEL AND MERGE? 
            // Or call it separately? For now, we will assume the hook calls it separately if needed, 
            // OR we can embed it here. 
            // The prompt says "Output: Brand Alignment Score...".
            // Since the user wants "Avatar -> Brand Evaluation", it might be a separate UI step.
            // But usually it's better to verify all at once.
            // I will expose `evaluateBrandAlignment` to be called by the hook optionally.

            return juryResult;
        } catch (e) {
            console.error("Gemini Jury Error", e);
            throw e;
        }
    },

    // Phase 4: Plan -> Checklist Advisor (NEW)
    async generateChecklist(proposal: any, competitionType: string): Promise<any> {
        let prompt = checklistAdvisorPrompt
            .replace('{{recipeJson}}', JSON.stringify(proposal.recipe))
            // We infer techniques from method text + recipe
            .replace('{{techniques}}', proposal.complexPreparations?.map((p: any) => p.method).join(', ') || "Standard")
            .replace('{{ritual}}', proposal.ritual || "Standard Service");

        try {
            const response = await callGeminiApi(prompt, "Eres el Jefe de Logística de la competencia.", { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonText);
            // Safeguard: Ensure we return { checklist: [...] } even if array is returned directly
            if (Array.isArray(parsed)) return { checklist: parsed };
            if (parsed.checklist) return parsed;
            return { checklist: [] };
        } catch (e) {
            console.error("Gemini Checklist Error", e);
            return { checklist: [] };
        }
    },


    // Phase 4: Plan -> Q&A Generation
    async generateJuryQuestions(proposal: any): Promise<string[]> {
        const prompt = `
        Genera 3 preguntas difíciles sobre este cóctel: "${proposal.title}".
        Contexto tecnico: ${JSON.stringify(proposal.complexPreparations || [])}
        Devuelve un array de strings JSON.
        `;

        try {
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.INTERVIEWER, { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonText);
        } catch (e) {
            return ["¿Por qué este ingrediente?", "¿Cómo escalarías la producción?"];
        }
    },

    async evaluateUserAnswer(question: string, answer: string, difficulty: string): Promise<any> {
        const prompt = `
        Pregunta del Juez: "${question}"
        Respuesta del Bartender: "${answer}"
        Nivel de Juez: ${difficulty}

        Evalúa la respuesta.
        FORMATO JSON:
        {
            "score": (0-100),
            "feedback": "Feedback directo.",
            "betterAnswer": "Sugerencia de mejor respuesta."
        }
        `;

        try {
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.COACH, { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonText);
        } catch (e) {
            return { score: 0, feedback: "Error evaluando respuesta.", betterAnswer: "" };
        }
    }
};

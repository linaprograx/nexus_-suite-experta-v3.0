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
    async generateVisualCocktailPrompt(proposal: any): Promise<string> {
        const context = `
        COCKTAIL DETAILS:
        Name: ${proposal.title}
        Glassware: ${proposal.glassware || "Elegant Glass"}
        Garnish: ${JSON.stringify(proposal.garnish)}
        Color/Appearance: ${proposal.appearance || "Vibrant"}
        Ingredients: ${JSON.stringify(proposal.recipe)}
        `;

        try {
            const response = await callGeminiApi(visualCocktailPrompt + "\n\n" + context, "Visual Director");
            return response.text.replace(/[*_`]/g, '').trim();
        } catch (e) {
            return `Cocktail ${proposal.title}, professional photography, 8k`;
        }
    },

    async generateVisualBrandPrompt(brief: any, proposal: any): Promise<string> {
        const context = `
        BRAND: ${brief.brand}
        COCKTAIL: ${proposal.title}
        CONCEPT: ${proposal.shortIntro}
        `;

        try {
            const response = await callGeminiApi(visualBrandPrompt + "\n\n" + context, "Brand Strategist");
            // The prompt asks for: 1. Description, 2. Prompt. We assume the model separates them or we just use the whole text as context for the image gen if strictly followed.
            // But the user prompt `visualBrand.ts` says "You must output...".
            // Let's assume the last paragraph is the prompt or we just use the whole aesthetic description.
            // To be safe, let's treat the whole response as the aesthetic definition for the image generator.
            return response.text.trim();
        } catch (e) {
            return `Futuristic radar chart for ${brief.brand}, neon colors, data visualization`;
        }
    },

    async generateVisualImpactAssessment(proposal: any): Promise<string> {
        const prompt = `
        Analyze the visual description of this cocktail: "${proposal.title}".
        Garnish: ${JSON.stringify(proposal.garnish)}
        Glass: ${proposal.glassware}
        
        Write a 3-line "Visual Impact Assessment" for a competition jury.
        Tone: Professional, appreciative of details.
        Output: Just the text.
        `;
        try {
            const response = await callGeminiApi(prompt, "Visual Judge");
            return response.text.trim();
        } catch (e) {
            return "Visually striking presentation with strong brand alignment.";
        }
    },

    // --- NEW: Real Image Generation (Refactored) ---
    async generateCocktailImage(imagePrompt: string): Promise<string> {
        try {
            return await ImageGenerator.generateImageUrl(imagePrompt);
        } catch (e) {
            console.error("Image Gen Error", e);
            return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
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

        try {
            const response = await callGeminiApi(prompt, SYSTEM_ROLES.CREATIVE_DIRECTOR, { responseMimeType: "application/json" });
            const jsonText = response.text.replace(/```json|```/g, '').trim();
            const proposal = JSON.parse(jsonText);

            // REAL VISUAL IDENTITY LAYER
            // 1. Generate specialized visual prompt
            const visualPrompt = await GeminiChampionService.generateVisualCocktailPrompt(proposal);

            // 2. Generate Image
            proposal.imageUrl = await GeminiChampionService.generateCocktailImage(visualPrompt);
            proposal.imagePrompt = visualPrompt; // Update with the better prompt

            // 3. Generate Visual Impact Assessment
            proposal.visualAnalysis = await GeminiChampionService.generateVisualImpactAssessment(proposal);


            return proposal;
        } catch (e) {
            console.error("Gemini Creative Error", e);
            throw new Error("Error generando propuesta World Class.");
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

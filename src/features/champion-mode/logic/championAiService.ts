import { ChampionProposal, CompetitionBrief } from '../types';
import { PlanTier } from '../../../core/product/plans.types';

// --- Types ---

export interface AiEvaluationResult {
    overallScore: number;
    categoryScores: {
        storytelling: number;
        balance: number;
        branding: number;
        innovation: number;
        viability: number;
    };
    verdict: string;
    feedback: string[];
    // Elite+ Features
    juryBreakdown?: {
        technical: { score: number; comment: string };
        brand: { score: number; comment: string };
        creative: { score: number; comment: string };
    };
    // Jupiter Features
    debugAnalysis?: {
        detectedIngredients: string[];
        ruleBreaches: string[];
        confidence: number;
    };
}

// --- Knowledge Base (Semantic Fragments) ---

const INGREDIENT_TAGS: Record<string, string[]> = {
    'mezcal': ['ahumado', 'terroso', 'agave', 'fuerte'],
    'tequila': ['agave', 'citrico', 'herbaceo'],
    'gin': ['botanico', 'seco', 'floral'],
    'rum': ['dulce', 'tropical', 'madera'],
    'whisky': ['madera', 'cereal', 'humo'],
    'palo santo': ['sagrado', 'madera', 'incienso'],
    'hibisco': ['floral', 'acido', 'rojo'],
    'cafe': ['amargo', 'tostado', 'energizante'],
    'citricos': ['acido', 'fresco', 'cortante']
};

const TECHNIQUE_TAGS: Record<string, string[]> = {
    'shake': ['aeracion', 'dilucion', 'textura'],
    'stir': ['dilucion', 'claridad', 'peso'],
    'throw': ['aeracion', 'temperatura', 'show'],
    'fat wash': ['textura', 'sabor', 'complejidad'],
    'clarificacion': ['textura', 'visual', 'tecnico']
};

// --- Logic Engine ---

const parseInput = (text: string): { ingredients: string[]; techniques: string[] } => {
    const lowerText = text.toLowerCase();
    const ingredients = Object.keys(INGREDIENT_TAGS).filter(i => lowerText.includes(i));
    const techniques = Object.keys(TECHNIQUE_TAGS).filter(t => lowerText.includes(t));
    return { ingredients, techniques };
};

const calculateScore = (
    baseScore: number,
    ingredients: string[],
    techniques: string[],
    brief: CompetitionBrief
): { score: number; feedback: string[] } => {
    let score = baseScore;
    const feedback: string[] = [];

    // 1. Context Match (Brand)
    if (brief.brand.toLowerCase().includes('nexus') || brief.brand === 'Nexus Spirits') {
        if (techniques.includes('clarificacion') || techniques.includes('stir')) {
            score += 5;
            feedback.push("La técnica elegida resuena con la sofisticación de Nexus.");
        }
    }

    // 2. Complexity Check
    if (ingredients.length > 5 && brief.constraints.includes('Max 5 Ingredientes')) {
        score -= 20;
        feedback.push("⚠️ EXCESO DE INGREDIENTES: La regla de 'Max 5' ha sido violada.");
    }

    // 3. Flavor Harmony (Basic Logic)
    if (ingredients.includes('mezcal') && ingredients.includes('cafe')) {
        score += 8;
        feedback.push("Mezcal + Café es una combinación ganadora clásica y potente.");
    } else if (ingredients.includes('gin') && ingredients.includes('cafe')) {
        score -= 5;
        feedback.push("Riesgo alto: Gin y Café suelen chocar en perfiles botánicos.");
    }

    // 4. Technique Bonus
    if (techniques.length > 0) {
        score += 3 * techniques.length;
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        feedback
    };
};

// --- Public Service ---

export const ChampionAiService = {
    evaluate: (
        proposal: ChampionProposal | null,
        brief: CompetitionBrief,
        userPlan: PlanTier
    ): AiEvaluationResult => {
        if (!proposal) {
            return {
                overallScore: 0,
                categoryScores: { storytelling: 0, balance: 0, branding: 0, innovation: 0, viability: 0 },
                verdict: 'Esperando Propuesta...',
                feedback: ['Ingresa tu concepto y receta para comenzar la evaluación.']
            };
        }

        // 1. Parse Context
        const combinedText = `${proposal.title} ${proposal.description} ${proposal.recipe.map(r => r.ingredient).join(' ')}`;
        const context = parseInput(combinedText);

        // 2. Base Evaluation
        const baseCalc = calculateScore(70, context.ingredients, context.techniques, brief); // Base 70
        let finalScore = baseCalc.score;
        let mainFeedback = baseCalc.feedback;

        // 3. Generate Category Scores (Derived from base w/ variance)
        const categories = {
            storytelling: Math.min(100, finalScore + (proposal.description.length > 50 ? 5 : -5)),
            balance: Math.min(100, finalScore + (context.ingredients.length >= 3 ? 5 : 0)),
            branding: Math.min(100, finalScore + (brief.brand ? 5 : 0)),
            innovation: Math.min(100, finalScore + (context.techniques.length > 0 ? 10 : -5)),
            viability: Math.min(100, Math.max(0, 100 - (proposal.recipe.length * 5))), // Fewer ingredients = cleaner execution usually
        };

        // Recalculate Overall weighted
        finalScore = Math.round(
            (categories.storytelling * 0.25) +
            (categories.balance * 0.25) +
            (categories.branding * 0.15) +
            (categories.innovation * 0.15) +
            (categories.viability * 0.20)
        );

        // 4. Generate Verdict
        let verdict = 'Participante';
        if (finalScore >= 90) verdict = '🏆 GANADOR POTENCIAL';
        else if (finalScore >= 80) verdict = 'FINALISTA SÓLIDO';
        else if (finalScore >= 70) verdict = 'COMPETITIVO';
        else verdict = 'NECESITA REVISIÓN';

        // 5. Tiered Output Generation
        const result: AiEvaluationResult = {
            overallScore: finalScore,
            categoryScores: categories,
            verdict,
            feedback: mainFeedback.length > 0 ? mainFeedback : ["Propuesta técnica correcta, pero busca más conexión emocional."]
        };

        // ELITE/JUPITER: Multi-Jury
        if (userPlan === 'ELITE' || userPlan === 'JUPITER') {
            result.juryBreakdown = {
                technical: {
                    score: categories.balance,
                    comment: context.techniques.length > 0
                        ? `Buen uso de técnicas avanzadas (${context.techniques.join(', ')}).`
                        : "Falta demostración técnica para elevar el perfil."
                },
                brand: {
                    score: categories.branding,
                    comment: `Alineación con ${brief.brand} dentro de los parámetros esperados.`
                },
                creative: {
                    score: categories.innovation,
                    comment: context.ingredients.length > 0
                        ? `Interesante paleta de sabores: ${context.ingredients.join(' + ')}.`
                        : "El perfil de sabor parece conservador."
                }
            };
        }

        // JUPITER: Debug Mode
        if (userPlan === 'JUPITER') {
            result.debugAnalysis = {
                detectedIngredients: context.ingredients,
                ruleBreaches: brief.constraints.filter(c =>
                    (c.includes('Max 5') && context.ingredients.length > 5)
                ),
                confidence: 0.98
            };
        }

        return result;
    }
};

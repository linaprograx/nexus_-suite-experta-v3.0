import { ChampionProposal, CompetitionBrief } from '../types';

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
}

export const evaluateProposal = (proposal: ChampionProposal | null, brief?: CompetitionBrief): AiEvaluationResult => {
    if (!proposal) {
        return {
            overallScore: 0,
            categoryScores: { storytelling: 0, balance: 0, branding: 0, innovation: 0, viability: 0 },
            verdict: 'Pendiente',
            feedback: ['Genera una propuesta para iniciar la evaluación.']
        };
    }

    // Mock evaluation logic - seeded by title + brand
    const seed = proposal.title.length + (brief?.brand?.length || 0);

    // Helper to get score
    const getScore = (offset: number) => 75 + ((seed + offset) % 24);

    const scores = {
        storytelling: getScore(1),
        balance: getScore(5),
        branding: getScore(10),
        innovation: getScore(15),
        viability: getScore(20),
    };

    const feedbacks: string[] = [];

    // --- CHECK CONSTRAINTS ---
    if (brief) {
        // Branding Boost/Penalty
        if (brief.brand === 'Nexus Spirits') {
            scores.branding += 5;
            feedbacks.push("Excelente alineación con los valores de Nexus Spirits.");
        } else if (brief.brand === 'Vortex Vodka' && proposal.recipe.length > 4) {
            scores.branding -= 10;
            feedbacks.push("Vortex exige minimalismo. Demasiados ingredientes.");
        }

        // Constraint Checks
        if (brief.constraints.includes('Max 5 Ingredientes') && proposal.recipe.length > 5) {
            scores.viability -= 15;
            feedbacks.push("⚠️ Descalificación por regla 'Max 5 Ingredientes'.");
        }

        if (brief.constraints.includes('Base: Gin') && !proposal.recipe.some(i => i.ingredient.toLowerCase().includes('gin'))) {
            scores.branding -= 10;
            feedbacks.push("⚠️ Falta ingrediente base obligatorio: Gin.");
        }

        if (brief.constraints.includes('No Artesanales') && proposal.recipe.some(i => i.ingredient.toLowerCase().includes('infusión') || i.ingredient.toLowerCase().includes('jarabe'))) {
            scores.viability -= 5;
            feedbacks.push("Ojo: Las reglas prohíben ingredientes artesanales complejos.");
        }
    }

    // Cliping scores 0-100
    Object.keys(scores).forEach(k => {
        // @ts-ignore
        if (scores[k] > 100) scores[k] = 100;
        // @ts-ignore
        if (scores[k] < 0) scores[k] = 0;
    });

    const overall = Math.round(
        (scores.storytelling * 0.25) +
        (scores.balance * 0.25) +
        (scores.branding * 0.15) +
        (scores.innovation * 0.15) +
        (scores.viability * 0.20)
    );

    let verdict = 'Competitivo';
    if (overall >= 90) verdict = 'Ganador Potencial';
    else if (overall >= 80) verdict = 'Finalista Fuerte';
    else if (overall < 80) verdict = 'Necesita Ajustes';

    // Add generic feedback if list is short
    if (feedbacks.length < 2) {
        if (overall > 85) feedbacks.push("Historia sólida con buen gancho emocional.");
        else feedbacks.push("El storytelling podría ser más personal.");

        feedbacks.push("Mise en place viable para 7 minutos.");
    }

    return {
        overallScore: overall,
        categoryScores: scores,
        verdict,
        feedback: feedbacks
    };
};

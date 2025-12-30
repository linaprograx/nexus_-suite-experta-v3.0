import { ChampionProposal } from '../types';

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

export const evaluateProposal = (proposal: ChampionProposal | null): AiEvaluationResult => {
    if (!proposal) {
        return {
            overallScore: 0,
            categoryScores: { storytelling: 0, balance: 0, branding: 0, innovation: 0, viability: 0 },
            verdict: 'Pendiente',
            feedback: ['Genera una propuesta para iniciar la evaluación.']
        };
    }

    // Mock evaluation logic - in a real app this would call an LLM
    // We'll base "randomness" on string length to be deterministic but varied
    const seed = proposal.title.length + proposal.description.length;

    // Helper to get score between 75 and 98
    const getScore = (offset: number) => 75 + ((seed + offset) % 24);

    const scores = {
        storytelling: getScore(1),
        balance: getScore(5),
        branding: getScore(10),
        innovation: getScore(15),
        viability: getScore(20),
    };

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

    const feedbacks = [
        overall > 85 ? "Historia sólida con buen gancho emocional." : "El storytelling podría ser más personal.",
        scores.balance > 85 ? "Equilibrio de sabores técnicamente correcto." : "Revisar la acidez en el retrogusto.",
        "Mise en place viable para 7 minutos.",
    ];

    return {
        overallScore: overall,
        categoryScores: scores,
        verdict,
        feedback: feedbacks
    };
};

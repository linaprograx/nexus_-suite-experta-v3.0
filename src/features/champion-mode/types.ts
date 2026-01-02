export interface ChampionProposal {
    title: string;
    description: string;
    recipe: { ingredient: string; amount: string }[];
    score: number;
}

export interface CompetitionBrief {
    brand: string;
    competitionType: string;
    constraints: string[];
    targetAudience: string;
}

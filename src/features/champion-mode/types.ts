export interface ChampionProposal {
    title: string;
    description: string;
    recipe: { ingredient: string; amount: string }[];
    score: number;
}

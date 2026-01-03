import { JURY_PROFESSIONAL_PROMPT } from './prompts/juryProfessional';
import { JURY_ADVANCED_PROMPT } from './prompts/juryAdvanced';
import { JURY_WORLD_CLASS_PROMPT } from './prompts/juryWorldClass';

export type JuryDifficulty = 'Easy' | 'Medium' | 'World Class';

export const selectJuryPrompt = (difficulty: JuryDifficulty): string => {
    switch (difficulty) {
        case 'Easy':
            return JURY_PROFESSIONAL_PROMPT;
        case 'Medium':
            return JURY_ADVANCED_PROMPT;
        case 'World Class':
            return JURY_WORLD_CLASS_PROMPT;
        default:
            return JURY_WORLD_CLASS_PROMPT;
    }
};

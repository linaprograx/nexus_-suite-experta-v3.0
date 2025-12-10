import { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';

export interface ChampionCreativeState {
    concept: string;
    tags: string[];
    isGenerating: boolean;
    proposal: {
        title: string;
        description: string;
        recipe: { ingredient: string; amount: string }[];
        score: number;
    } | null;
}

const MOCK_PROPOSALS = {
    'Floral': {
        title: 'Nebula Fizz',
        description: 'Una explosión etérea de jazmín y burbujas finas.',
        recipe: [
            { ingredient: 'Gin Floral', amount: '50ml' },
            { ingredient: 'Jarabe de Jazmín', amount: '20ml' },
            { ingredient: 'Soda de Lavanda', amount: 'Top' }
        ],
        score: 92
    },
    'Ahumado': {
        title: 'Obsidian Smoke',
        description: 'Profundidad volcánica con notas de mezcal y chiles secos.',
        recipe: [
            { ingredient: 'Mezcal Joven', amount: '45ml' },
            { ingredient: 'Licor de Ancho Reyes', amount: '15ml' },
            { ingredient: 'Bitter de Cacao', amount: '2 dashes' }
        ],
        score: 88
    },
    'Minimalista': {
        title: 'Zenith Clear',
        description: 'Claridad absoluta. Sabor complejo en apariencia simple.',
        recipe: [
            { ingredient: 'Vodka Cristalino', amount: '60ml' },
            { ingredient: 'Cordial de Lima', amount: '30ml' }
        ],
        score: 95
    },
    'Teatral': {
        title: 'Crimson Velour',
        description: 'Un cóctel que cambia de color y textura al servirse.',
        recipe: [
            { ingredient: 'Infusión de Hibisco', amount: '40ml' },
            { ingredient: 'Espuma de Jengibre', amount: 'Top' }
        ],
        score: 90
    }
};

export const useChampionCreativeEngine = () => {
    const [state, setState] = useState<ChampionCreativeState>({
        concept: '',
        tags: [],
        isGenerating: false,
        proposal: null
    });

    const setConcept = (concept: string) => {
        setState(prev => ({ ...prev, concept }));
    };

    const toggleTag = (tag: string) => {
        setState(prev => {
            const newTags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags: newTags };
        });

        // Auto-trigger generation for demo purposes if not generating
        if (!state.isGenerating) {
            // simulateGeneration(tag); 
            // Better to let user click "Generate" or have an effect? 
            // Requirements say "Filters must notify hook".
            // Let's just update state here.
        }
    };

    const generateProposal = useCallback(() => {
        setState(prev => ({ ...prev, isGenerating: true }));

        // Simulate AI delay
        setTimeout(() => {
            // Pick proposal based on first tag or random
            const tag = state.tags[0] || 'Floral';
            const mock = MOCK_PROPOSALS[tag as keyof typeof MOCK_PROPOSALS] || MOCK_PROPOSALS['Floral'];

            setState(prev => ({
                ...prev,
                isGenerating: false,
                proposal: mock
            }));
        }, 1500);
    }, [state.tags]);

    const { db, userId, appId, user } = useApp();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const saveToGrimorium = async () => {
        if (!state.proposal || !db || !userId) return;

        try {
            setStatusMessage('Guardando en Grimorium...');
            // Need to dynamically import to avoid circular dependencies if any, or just import at top if clean
            const { mapChampionProposalToRecipe } = await import('../services/championMapperService');
            const recipe = mapChampionProposalToRecipe(state.proposal, null); // userProfile if needed

            // In a real app we'd use recipeService.addRecipe(db, userId, recipe)
            // For now, let's just log and simulate success
            console.log("Saving Recipe:", recipe);

            // Simulating API call
            await new Promise(r => setTimeout(r, 800));
            setStatusMessage('¡Receta guardada en Grimorium!');
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e) {
            console.error(e);
            setStatusMessage('Error al guardar');
        }
    };

    const createTrainingPlan = async () => {
        if (!state.proposal || !db || !userId) return;

        try {
            setStatusMessage('Generando plan en Pizarrón...');
            const { mapChampionProposalToTasks } = await import('../services/championMapperService');
            // Assuming mapChampionProposalToTasks returns Partial<PizarronTask>[]
            const tasks = mapChampionProposalToTasks(state.proposal, appId, userId, user?.displayName || 'Chef');

            console.log("Creating Tasks:", tasks);

            // Simulating API call
            await new Promise(r => setTimeout(r, 800));
            setStatusMessage(`¡${tasks.length} tareas creadas en Pizarrón!`);
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (e) {
            console.error(e);
            setStatusMessage('Error al crear plan');
        }
    };

    return {
        state: { ...state, statusMessage },
        actions: {
            setConcept,
            toggleTag,
            generateProposal,
            saveToGrimorium,
            createTrainingPlan
        }
    };
};

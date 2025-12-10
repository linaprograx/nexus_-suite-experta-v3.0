import { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { evaluateProposal, AiEvaluationResult } from '../logic/championAiEvaluator';
import { exportProposalToPdf } from '../logic/championPdfExporter';

export interface ChampionCreativeState {
    viewMode: 'DESIGN' | 'PRESENTATION';
    concept: string;
    tags: string[];
    isGenerating: boolean;
    proposal: {
        title: string;
        description: string;
        recipe: { ingredient: string; amount: string }[];
        score: number;
    } | null;
    aiEvaluation: AiEvaluationResult | null;
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
    },
    'Cítrico': {
        title: 'Luminous drops',
        description: 'Frescura eléctrica con notas de yuzu y bergamota.',
        recipe: [
            { ingredient: 'Vodka Cítrico', amount: '50ml' },
            { ingredient: 'Jugo de Yuzu', amount: '20ml' },
            { ingredient: 'Jarabe de Lemongrass', amount: '15ml' }
        ],
        score: 91
    },
    'Especiado': {
        title: 'Silk Road',
        description: 'Un viaje sensorial por la ruta de la seda.',
        recipe: [
            { ingredient: 'Rum Añejo', amount: '60ml' },
            { ingredient: 'Chai Tea Cordial', amount: '30ml' },
            { ingredient: 'Cardamom Bitters', amount: '2 dashes' }
        ],
        score: 89
    }
};

export const useChampionCreativeEngine = () => {
    const { db, userId, appId, user } = useApp();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [state, setState] = useState<ChampionCreativeState>({
        viewMode: 'DESIGN',
        concept: '',
        tags: [],
        isGenerating: false,
        proposal: null,
        aiEvaluation: null
    });

    // Actions
    const setConcept = (concept: string) => setState(prev => ({ ...prev, concept }));

    const setViewMode = (mode: 'DESIGN' | 'PRESENTATION') => setState(prev => ({ ...prev, viewMode: mode }));

    const toggleTag = (tag: string) => {
        setState(prev => {
            const newTags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags: newTags };
        });
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
                proposal: mock,
                aiEvaluation: null // Reset evaluation on new generation
            }));
        }, 1500);
    }, [state.tags]);

    const runAiEvaluation = useCallback(() => {
        if (!state.proposal) return;

        setStatusMessage('Juez IA analizando...');
        setTimeout(() => {
            const result = evaluateProposal(state.proposal as any); // Type cast for simpler mock compatibility
            setState(prev => ({ ...prev, aiEvaluation: result }));
            setStatusMessage('Evaluación completada');
            setTimeout(() => setStatusMessage(null), 2000);
        }, 1200);
    }, [state.proposal]);

    const triggerPdfExport = useCallback(async () => {
        if (!state.proposal) return;

        setStatusMessage('Generando PDF Premium...');
        const success = await exportProposalToPdf(state.proposal as any);

        if (success) {
            setStatusMessage('PDF descargado correctamente');
        } else {
            setStatusMessage('Error al generar PDF');
        }
        setTimeout(() => setStatusMessage(null), 3000);
    }, [state.proposal]);

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
            setViewMode,
            setConcept,
            toggleTag,
            generateProposal,
            runAiEvaluation,
            triggerPdfExport,
            saveToGrimorium,
            createTrainingPlan
        }
    };
};

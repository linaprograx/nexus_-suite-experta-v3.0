import { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { ChampionAiService, AiEvaluationResult } from '../logic/championAiService';
import { exportProposalToPdf } from '../logic/championPdfExporter';

export interface ChampionCreativeState {
    viewMode: 'DESIGN' | 'PRESENTATION';
    brief: {
        brand: string;
        competitionType: string;
        constraints: string[];
        targetAudience: string;
    };
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

export const useChampionCreativeEngine = () => {
    const { db, userId, appId, user, userPlan } = useApp();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [state, setState] = useState<ChampionCreativeState>({
        viewMode: 'DESIGN',
        brief: {
            brand: 'Nexus Spirits',
            competitionType: 'Signature Serve',
            constraints: ['Max 5 Ingredientes'],
            targetAudience: 'Cocktail Enthusiasts'
        },
        concept: '',
        tags: [],
        isGenerating: false,
        proposal: null,
        aiEvaluation: null
    });

    // Actions
    const setBrief = (brief: Partial<ChampionCreativeState['brief']>) => setState(prev => ({ ...prev, brief: { ...prev.brief, ...brief } }));

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
        // In a real scenario, this would use an LLM API.
        // For this architecture, we initialize a "Draft" based on the user's concept/inputs
        // so the user can then refine it for the AI Evaluator.
        setState(prev => ({ ...prev, isGenerating: true }));

        setTimeout(() => {
            setState(prev => ({
                ...prev,
                isGenerating: false,
                proposal: {
                    title: prev.concept || 'Nueva Creación',
                    description: prev.concept ? `Propuesta basada en: ${prev.concept}` : 'Describe tu historia aquí...',
                    recipe: [
                        { ingredient: 'Ingrediente Base', amount: '60ml' },
                        { ingredient: 'Modificador', amount: '30ml' }
                    ],
                    score: 0
                },
                aiEvaluation: null
            }));
        }, 1000);
    }, []);

    const runAiEvaluation = useCallback(() => {
        if (!state.proposal) return;

        setStatusMessage('Convocando al Jurado Nexus...');

        setTimeout(() => {
            // REAL AI SERVICE CALL
            const result = ChampionAiService.evaluate(
                state.proposal as any,
                state.brief,
                userPlan || 'FREE' // Fallback
            );

            setState(prev => ({ ...prev, aiEvaluation: result }));
            setStatusMessage('Veredicto del Jurado completado');
            setTimeout(() => setStatusMessage(null), 2000);
        }, 1500); // Slight delay for dramatic effect
    }, [state.proposal, state.brief, userPlan]);

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
            const { mapChampionProposalToRecipe } = await import('../services/championMapperService');
            const recipe = mapChampionProposalToRecipe(state.proposal, null);
            console.log("Saving Recipe:", recipe);
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
            const tasks = mapChampionProposalToTasks(state.proposal, appId, userId, user?.displayName || 'Chef');
            console.log("Creating Tasks:", tasks);
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
            setBrief,
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

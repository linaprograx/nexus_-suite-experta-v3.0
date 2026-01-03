import { useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { GeminiChampionService } from '../services/GeminiChampionService'; // Real AI
import { exportProposalToPdf } from '../logic/championPdfExporter';

export interface ChampionCreativeState {
    viewMode: 'DESIGN' | 'PRESENTATION';
    brief: {
        brand: string;
        competitionType: string;
        constraints: string[];
        targetAudience: string;
    };
    // Phase 1 Extras
    tacticalHint: string | null;

    // Phase 2
    concept: string;
    tags: string[]; // These are visual refs now
    palette: string | null;
    isGenerating: boolean;
    proposal: {
        title: string;
        description: string;
        shortIntro?: string; // Phase 2
        imageUrl?: string;   // Phase 2
        imagePrompt?: string; // Phase 2
        recipe: { ingredient: string; amount: string }[];
        method?: string;
        complexPreparations?: { name: string; yield: string; ingredients: string; method: string }[];
        glassware?: string;
        garnish?: string | { name: string; description: string };
        ritual?: string;
        flavorProfile?: string | Record<string, string>;
        colorHex?: string;
    } | null;

    // Phase 3
    aiEvaluation: any | null;
    brandEvaluation: any | null; // New Brand Guardian Result
    juryDifficulty: 'Easy' | 'Medium' | 'World Class';

    // Phase 4
    juryQuestions: string[];
    qaFeedback: { question: string; answer: string; feedback: any } | null;
    checklist: { category: string; item: string; priority: string }[];

    // Global Config
    availableBrands: string[];
}

export const useChampionCreativeEngine = () => {
    const { db, userId, appId, user, userPlan } = useApp();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [state, setState] = useState<ChampionCreativeState>({
        viewMode: 'DESIGN',
        brief: {
            brand: 'Nexus Spirits',
            competitionType: 'Signature Serve',
            constraints: ['Max 5 Ingredientes', 'No Azúcar Refinada'], // Default rules
            targetAudience: 'Cocktail Enthusiasts'
        },
        tacticalHint: null,
        concept: '',
        tags: [],
        palette: null,
        isGenerating: false,
        proposal: null,
        aiEvaluation: null,
        brandEvaluation: null,
        juryDifficulty: 'World Class',
        juryQuestions: [],
        qaFeedback: null,
        checklist: [],
        availableBrands: (() => {
            const saved = localStorage.getItem('champion_brands');
            return saved ? JSON.parse(saved) : ['Nexus Spirits', 'Aether Gin', 'Solaris Rum', 'Vortex Vodka'];
        })()
    });

    // ... (Phase 1, 2, 3 Actions remain same)
    const setBrief = (brief: Partial<ChampionCreativeState['brief']>) => setState(prev => ({ ...prev, brief: { ...prev.brief, ...brief } }));

    const addRule = (rule: string) => {
        if (!rule) return;
        setState(prev => ({
            ...prev,
            brief: { ...prev.brief, constraints: [...prev.brief.constraints, rule] }
        }));
    };

    const removeRule = (index: number) => {
        setState(prev => ({
            ...prev,
            brief: { ...prev.brief, constraints: prev.brief.constraints.filter((_, i) => i !== index) }
        }));
    };

    const generateTacticalHint = async () => {
        setStatusMessage('Analizando reglas...');
        const hint = await GeminiChampionService.generateTacticalHint(state.brief.brand, state.brief.constraints);
        setState(prev => ({ ...prev, tacticalHint: hint }));
        setStatusMessage(null);
    };

    // --- Phase 2: Creative Actions ---

    const setConcept = (concept: string) => setState(prev => ({ ...prev, concept }));
    const setPalette = (color: string) => setState(prev => ({ ...prev, palette: color }));

    const toggleVisualRef = (ref: string) => {
        setState(prev => {
            const newTags = prev.tags.includes(ref)
                ? prev.tags.filter(t => t !== ref)
                : [...prev.tags, ref];
            return { ...prev, tags: newTags };
        });
    };

    const generateProposal = useCallback(async () => {
        if (!state.concept) {
            setStatusMessage('Error: Ingresa un concepto primero.');
            setTimeout(() => setStatusMessage(null), 2000);
            return;
        }

        setState(prev => ({ ...prev, isGenerating: true }));
        setStatusMessage('Gemini creando propuesta World Class...');

        try {
            const proposal = await GeminiChampionService.generateCreativeProposal({
                brand: state.brief.brand,
                constraints: state.brief.constraints,
                concept: state.concept,
                ingredients: [], // Could extract from concept string if needed
                palette: state.palette || undefined,
                visualRefs: state.tags,
                userPlan: userPlan || 'FREE'
            });

            setState(prev => ({
                ...prev,
                isGenerating: false,
                proposal: proposal,
                aiEvaluation: null // Reset evaluation
            }));
            setStatusMessage('Propuesta generada con éxito');
        } catch (error) {
            console.error(error);
            setStatusMessage('Error al generar propuesta');
            setState(prev => ({ ...prev, isGenerating: false }));
        }
        setTimeout(() => setStatusMessage(null), 2000);
    }, [state.concept, state.brief, userPlan, state.palette, state.tags]);

    // --- Phase 3: Validation Actions ---

    const setJuryDifficulty = (difficulty: 'Easy' | 'Medium' | 'World Class') =>
        setState(prev => ({ ...prev, juryDifficulty: difficulty }));

    const runAiEvaluation = useCallback(async () => {
        if (!state.proposal) return;

        setStatusMessage(`Convocando Jurado (${state.juryDifficulty})...`);

        try {
            const result = await GeminiChampionService.evaluateProposal({
                proposal: state.proposal,
                brief: state.brief,
                userPlan: userPlan || 'FREE',
                difficulty: state.juryDifficulty
            });

            setState(prev => ({ ...prev, aiEvaluation: result }));
            setStatusMessage('Veredicto emitido');

            // Auto-run Brand Guardian if Plan is Expert/Studio
            if (userPlan === 'EXPERT' || userPlan === 'STUDIO') {
                setStatusMessage('Consultando Brand Guardian...');
                const brandResult = await GeminiChampionService.evaluateBrandAlignment(state.proposal, state.brief);
                setState(prev => ({ ...prev, brandEvaluation: brandResult }));
                setStatusMessage('Análisis de Marca finalizado');
            }

        } catch (e) {
            setStatusMessage('Error en el juicio');
        }
        setTimeout(() => setStatusMessage(null), 2000);
    }, [state.proposal, state.brief, userPlan, state.juryDifficulty]);

    // --- Phase 4: Plan Actions ---

    const generateQuestions = async () => {
        if (!state.proposal) return;
        setStatusMessage('Jurado preparando preguntas...');
        const qs = await GeminiChampionService.generateJuryQuestions(state.proposal);
        setState(prev => ({ ...prev, juryQuestions: qs }));
        setStatusMessage(null);
    };

    const validateAnswer = async (question: string, answer: string) => {
        setStatusMessage('Jurado evaluando respuesta...');
        const feedback = await GeminiChampionService.evaluateUserAnswer(question, answer, state.juryDifficulty);
        setState(prev => ({ ...prev, qaFeedback: { question, answer, feedback } }));
        setStatusMessage(null);
    };

    const generateChecklist = async () => {
        if (!state.proposal) return;
        setStatusMessage('Optimizando logística...');
        const result = await GeminiChampionService.generateChecklist(state.proposal, state.brief.competitionType);
        if (result && result.checklist) {
            setState(prev => ({ ...prev, checklist: result.checklist }));
        }
        setStatusMessage(null);
    };

    // --- Misc ---

    const setViewMode = (mode: 'DESIGN' | 'PRESENTATION') => setState(prev => ({ ...prev, viewMode: mode }));

    const triggerPdfExport = useCallback(async () => {
        if (!state.proposal) return;
        setStatusMessage('Generando PDF Premium...');
        const success = await exportProposalToPdf(state.proposal as any);
        if (success) setStatusMessage('PDF descargado');
        else setStatusMessage('Error al generar PDF');
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

    const addBrand = (newBrand: string) => {
        if (!newBrand || state.availableBrands.includes(newBrand)) return;
        const updatedBrands = [...state.availableBrands, newBrand];
        localStorage.setItem('champion_brands', JSON.stringify(updatedBrands));

        setState(prev => ({
            ...prev,
            availableBrands: updatedBrands,
            brief: { ...prev.brief, brand: newBrand } // Auto-select new brand
        }));
    };

    const removeBrand = (brandToRemove: string) => {
        const updatedBrands = state.availableBrands.filter(b => b !== brandToRemove);
        localStorage.setItem('champion_brands', JSON.stringify(updatedBrands));

        setState(prev => ({
            ...prev,
            availableBrands: updatedBrands,
            // If currently selected brand is removed, fallback to first available
            brief: {
                ...prev.brief,
                brand: prev.brief.brand === brandToRemove
                    ? (updatedBrands.find(b => b !== brandToRemove) || 'Nexus Spirits')
                    : prev.brief.brand
            }
        }));
    };

    return {
        state: { ...state, statusMessage },
        actions: {
            setViewMode,
            setBrief,
            addRule,
            removeRule,
            generateTacticalHint,
            setConcept,
            setPalette,
            toggleVisualRef,
            generateProposal,
            setJuryDifficulty,
            runAiEvaluation,
            generateQuestions,
            validateAnswer,
            generateChecklist,
            triggerPdfExport,
            saveToGrimorium,
            createTrainingPlan,
            addBrand,
            removeBrand
        }
    };
};

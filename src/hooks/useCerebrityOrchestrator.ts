import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAvatarCognition, SimulationResult, CognitiveProfile, SimulationContext } from './useAvatarCognition';
import { getCerebrityCognitiveCore, CerebrityCognitiveState } from '../services/cerebrityCognitiveCore';
import { SynthesisAdapter, MakeMenuAdapter, LabAdapter, CriticAdapter, TrendLocatorAdapter } from '../services/cerebrityAdapters';

// --- Types ---

export interface WorldClassOutput {
    titulo: string;
    intencion_cognitiva: string;
    decisiones_clave: string[];
    ejecucion_tecnica: string;
    firma_world_class: string;
    is_world_class: boolean;
}

export interface JuryEvaluation {
    veredicto: 'APROBADO' | 'FINALISTA' | 'GANADOR' | 'DESCARTADO';
    puntuacion_global: number; // 0-100
    fortalezas: string[];
    debilidades: string[];
    riesgo_detectado: 'Bajo' | 'Medio' | 'Alto';
    comentario_jurado: string;
    recomendacion: string;
}

export interface OrchestratorState {
    lastGeneration: WorldClassOutput | null;
    lastEvaluation: JuryEvaluation | null;
    isGenerating: boolean;
    isEvaluating: boolean;
    cognitiveState: CerebrityCognitiveState | null;
}

// --- Hook ---

export const useCerebrityOrchestrator = () => {
    const { userPlan } = useApp();
    const { getActiveProfile, simulateDecision } = useAvatarCognition();
    const cognitiveCore = getCerebrityCognitiveCore();

    const [state, setState] = useState<OrchestratorState>({
        lastGeneration: null,
        lastEvaluation: null,
        isGenerating: false,
        isEvaluating: false,
        cognitiveState: null
    });

    // Sync Avatar profile to cognitive core
    useEffect(() => {
        const profile = getActiveProfile();
        if (profile) {
            cognitiveCore.updateAvatarProfile(profile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Subscribe to cognitive state changes
    useEffect(() => {
        const unsubscribe = cognitiveCore.subscribe((cognitiveState) => {
            setState(prev => ({ ...prev, cognitiveState }));
        });
        return () => { unsubscribe(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 1. World Class Generation Logic (Platinum+ Gate)
    const generateWorldClassOutput = async (prompt_context: string): Promise<WorldClassOutput> => {
        setState(prev => ({ ...prev, isGenerating: true }));

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 1500));

        const profile = getActiveProfile();

        // Gate: Only EXPERT (Platinum) or STUDIO (Jupiter) can generate World Class
        const canGenerateWorldClass = userPlan === 'EXPERT' || userPlan === 'STUDIO';

        if (!profile) {
            const fallback: WorldClassOutput = {
                titulo: "Generación Estándar (Sin Perfil)",
                intencion_cognitiva: "Cumplimiento de solicitud básica.",
                decisiones_clave: ["Se usaron parámetros por defecto."],
                ejecucion_tecnica: "Nivel promedio.",
                firma_world_class: "N/A",
                is_world_class: false
            };
            setState(prev => ({ ...prev, isGenerating: false, lastGeneration: fallback }));
            return fallback;
        }

        if (!canGenerateWorldClass) {
            const standardOutput: WorldClassOutput = {
                titulo: `Generación Estándar: ${prompt_context}`,
                intencion_cognitiva: "Ejecución funcional eficiente.",
                decisiones_clave: ["Optimización de recursos", "Enfoque en viabilidad"],
                ejecucion_tecnica: "Correcta y alineada a estándares de mercado.",
                firma_world_class: "Bloqueado (Requiere Platinum)",
                is_world_class: false
            };
            setState(prev => ({ ...prev, isGenerating: false, lastGeneration: standardOutput }));
            return standardOutput;
        }

        // Logic for World Class
        // We use the profile to "color" the output
        const axisStr = profile.researchAxis.join(' + ');
        const toneStr = profile.tone;

        const worldClassOutput: WorldClassOutput = {
            titulo: `${prompt_context} [${toneStr.toUpperCase()}]`,
            intencion_cognitiva: `Manifestación de ${axisStr} filtrada por ${profile.riskTolerance}.`,
            decisiones_clave: [
                `Priorizar ${profile.researchAxis[0] || 'Técnica'} sobre accesibilidad.`,
                profile.riskTolerance === 'Audaz' || profile.riskTolerance === 'Experimental' ? "Incorporar elementos disonantes intencionales." : "Asegurar armonía clásica."
            ],
            ejecucion_tecnica: `Precisión absoluta en ${axisStr}.`,
            firma_world_class: `Sello de ${profile.name} // Nexus Elite`,
            is_world_class: true
        };

        setState(prev => ({ ...prev, isGenerating: false, lastGeneration: worldClassOutput }));
        return worldClassOutput;
    };

    // 2. Competition Jury Mode Logic
    const evaluateCompetitionEntry = async (concept: string): Promise<JuryEvaluation> => {
        setState(prev => ({ ...prev, isEvaluating: true }));

        // Run internal simulation first to see "what the avatar thinks"
        const simContext: SimulationContext = {
            contextType: 'Competition',
            constraints: ['Tiempo', 'Jurado Internacional'],
            pressureLevel: 80
        };
        const simResult = simulateDecision(simContext);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Jury Logic based on Simulation + Profile
        // If simulation risk is Critical, Jury might penalize if implementation isn't perfect.

        let score = 75;
        let verdict: JuryEvaluation['veredicto'] = 'APROBADO';

        if (simResult.riskAssessment === 'Alto') score += 10; // Reward risk in competition
        if (simResult.riskAssessment === 'Crítico') score -= 5; // Too risky?

        // Random variance for "Realism" mock
        score += Math.floor(Math.random() * 15) - 5;
        if (score > 100) score = 100;

        if (score >= 95) verdict = 'GANADOR';
        else if (score >= 85) verdict = 'FINALISTA';
        else if (score < 60) verdict = 'DESCARTADO';

        const evaluation: JuryEvaluation = {
            veredicto: verdict,
            puntuacion_global: score,
            fortalezas: [
                `Coherencia con ${simResult.decision}`,
                `Uso efectivo de ${simResult.principlesActivated[0] || 'técnica base'}`
            ],
            debilidades: simResult.tradeoffs.length > 0 ? simResult.tradeoffs : ["Falta de riesgo percibido"],
            riesgo_detectado: simResult.riskAssessment === 'Crítico' ? 'Alto' : simResult.riskAssessment === 'Alto' ? 'Medio' : 'Bajo',
            comentario_jurado: `El jurado valora la intención de ${simResult.decision} pero ${score < 90 ? 'detecta brechas en la ejecución final.' : 'aplaude la maestría técnica demostrada.'}`,
            recomendacion: simResult.expectedFeedback
        };

        setState(prev => ({ ...prev, isEvaluating: false, lastEvaluation: evaluation }));
        return evaluation;
    };

    // ============================================================================
    // NEW: AVATAR-AWARE CEREBRITY ACTIONS
    // ============================================================================

    /**
     * Get cognitive filter for Synthesis
     */
    const getSynthesisFilter = (rawInput: string): string => {
        const profile = getActiveProfile();
        if (!profile) return rawInput;
        return SynthesisAdapter.applyCognitiveFilter(rawInput, profile);
    };

    /**
     * Get editorial style for Make Menu
     */
    const getMenuEditorialStyle = (): string => {
        const profile = getActiveProfile();
        if (!profile) return 'Estilo estándar';
        return MakeMenuAdapter.getEditorialStyle(profile);
    };

    /**
     * Validate menu coherence
     */
    const validateMenuCoherence = (recipes: any[]): { valid: boolean; reason?: string } => {
        const profile = getActiveProfile();
        if (!profile) return { valid: true };

        const synthesisOutput = cognitiveCore.getLatestSynthesisOutput();
        return MakeMenuAdapter.validateMenuCoherence(recipes, profile, synthesisOutput || undefined);
    };

    /**
     * Get Lab analysis bias
     */
    const getLabAnalysisBias = (): string => {
        const profile = getActiveProfile();
        if (!profile) return 'Análisis neutral';
        return LabAdapter.getAnalysisBias(profile);
    };

    /**
     * Auto-select Critic persona
     */
    const getCriticPersona = (): string => {
        const profile = getActiveProfile();
        if (!profile) return 'Inspector Michelin';
        return CriticAdapter.selectCriticPersona(profile);
    };

    /**
     * Get Critic severity
     */
    const getCriticSeverity = (): number => {
        const profile = getActiveProfile();
        if (!profile) return 0.5;
        return CriticAdapter.getCriticSeverity(profile.riskTolerance);
    };

    /**
     * Filter trends by Avatar
     */
    const filterTrendsByAvatar = (trends: any[]): any[] => {
        const profile = getActiveProfile();
        if (!profile) return trends;
        return TrendLocatorAdapter.filterTrendsByAvatar(trends, profile);
    };

    /**
     * Get creative context for cross-section flow
     */
    const getCreativeContext = () => {
        return cognitiveCore.getCreativeContext();
    };

    return {
        state,
        actions: {
            // Legacy actions
            generateWorldClassOutput,
            evaluateCompetitionEntry,

            // New Avatar-aware actions
            getSynthesisFilter,
            getMenuEditorialStyle,
            validateMenuCoherence,
            getLabAnalysisBias,
            getCriticPersona,
            getCriticSeverity,
            filterTrendsByAvatar,
            getCreativeContext
        },
        // Expose cognitive core for direct access if needed
        cognitiveCore
    };
};

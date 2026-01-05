import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// --- Types ---

export type AvatarType = 'Mixologist' | 'Chef' | 'Patissier' | 'Sommelier' | 'Barista' | 'Concierge' | 'Manager' | 'Owner';
export type Tone = 'Técnico' | 'Creativo' | 'Vanguardista' | 'Michelin-grade' | 'Eficiente' | 'Exclusivo';
export type ResearchAxis = 'Precisión' | 'Creatividad' | 'Competición' | 'Coste' | 'Alta cocina' | 'Sostenibilidad';
export type RiskLevel = 'Conservador' | 'Moderado' | 'Audaz' | 'Experimental';

export interface CognitiveProfile {
    id: string;
    name: string;
    tone: Tone;
    researchAxis: ResearchAxis[];
    activePrinciples: string[];
    riskTolerance: RiskLevel;
}

export interface SimulationContext {
    contextType: 'Service' | 'Competition' | 'R&D' | 'Crisis';
    constraints: string[];
    pressureLevel: number; // 0-100
}

export interface SimulationResult {
    decision: string;
    reasoning: string[];
    principlesActivated: string[];
    tradeoffs: string[];
    riskAssessment: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    expectedFeedback: string;
}

export interface AvatarConfig {
    name: string;
    emoji: string;

    // Legacy fields mapped to active profile
    tone: Tone;
    researchAxis: ResearchAxis[];
    activePrinciples: string[];
    competitionMode: boolean;

    // New Structure
    profiles: CognitiveProfile[];
    activeProfileId: string;
}

// --- Initial Data ---

const INITIAL_PROFILES: Record<string, CognitiveProfile[]> = {
    'Mixologist': [
        { id: 'mix_default', name: 'Servicio Estándar', tone: 'Eficiente', researchAxis: ['Coste'], activePrinciples: ['p3', 'p1'], riskTolerance: 'Conservador' },
        { id: 'mix_comp', name: 'Modo Competición', tone: 'Vanguardista', researchAxis: ['Competición', 'Creatividad'], activePrinciples: ['p1', 'p4', 'p2'], riskTolerance: 'Audaz' }
    ],
    'Chef': [
        { id: 'chef_default', name: 'Mise en Place', tone: 'Técnico', researchAxis: ['Precisión'], activePrinciples: ['p1'], riskTolerance: 'Conservador' },
        { id: 'chef_rd', name: 'I+D Creativo', tone: 'Creativo', researchAxis: ['Creatividad', 'Alta cocina'], activePrinciples: ['p2', 'p4'], riskTolerance: 'Experimental' }
    ]
};

const DEFAULT_CONFIG: AvatarConfig = {
    name: 'Avatar',
    emoji: '🤖',
    tone: 'Técnico',
    researchAxis: ['Precisión'],
    activePrinciples: [],
    competitionMode: false,
    profiles: [],
    activeProfileId: ''
};

// --- Hook Implementation ---

// --- Hook Implementation ---

export const useAvatarCognition = () => {
    const { userPlan } = useApp();
    // Initialize from LocalStorage or default to Mixologist
    const [activeAvatarType, setActiveAvatarType] = useState<AvatarType>(() => {
        const saved = localStorage.getItem('nexus_active_avatar');
        return (saved as AvatarType) || 'Mixologist';
    });

    // Persist active avatar changes
    useEffect(() => {
        localStorage.setItem('nexus_active_avatar', activeAvatarType);
    }, [activeAvatarType]);

    // We store a map of configs per avatar type
    const [avatarConfigs, setAvatarConfigs] = useState<Record<AvatarType, AvatarConfig>>({
        'Mixologist': {
            ...DEFAULT_CONFIG,
            name: 'Mixólogo Profesional',
            emoji: '🍸',
            profiles: INITIAL_PROFILES['Mixologist'],
            activeProfileId: 'mix_default',
            tone: 'Eficiente',
            researchAxis: ['Coste'],
            activePrinciples: ['p3', 'p1']
        },
        'Chef': {
            ...DEFAULT_CONFIG,
            name: 'Chef Profesional',
            emoji: '👨‍🍳',
            profiles: INITIAL_PROFILES['Chef'],
            activeProfileId: 'chef_default',
            tone: 'Técnico',
            researchAxis: ['Precisión'],
            activePrinciples: ['p1']
        },
        'Patissier': { ...DEFAULT_CONFIG, name: 'Repostero Michelin', emoji: '🍰' },
        'Sommelier': { ...DEFAULT_CONFIG, name: 'Sommelier', emoji: '🍷' },
        'Barista': { ...DEFAULT_CONFIG, name: 'Barista', emoji: '☕' },
        'Concierge': { ...DEFAULT_CONFIG, name: 'Concierge', emoji: '🛎️' },
        'Manager': { ...DEFAULT_CONFIG, name: 'Gerente', emoji: '💼' },
        'Owner': { ...DEFAULT_CONFIG, name: 'Owner', emoji: '👑' },
    });

    // --- Actions ---

    const getActiveConfig = (): AvatarConfig => {
        return avatarConfigs[activeAvatarType];
    };

    const getActiveProfile = (): CognitiveProfile | undefined => {
        const config = getActiveConfig();
        return config.profiles.find(p => p.id === config.activeProfileId);
    };

    const updateConfig = (avatar: AvatarType, updates: Partial<AvatarConfig>) => {
        setAvatarConfigs(prev => ({
            ...prev,
            [avatar]: { ...prev[avatar], ...updates }
        }));
    };

    const updateActiveProfile = (updates: Partial<CognitiveProfile>) => {
        const config = getActiveConfig();
        const updatedProfiles = config.profiles.map(p =>
            p.id === config.activeProfileId ? { ...p, ...updates } : p
        );

        // Also update legacy top-level fields for compatibility
        const currentProfile = updatedProfiles.find(p => p.id === config.activeProfileId);
        const legacyUpdates = currentProfile ? {
            tone: currentProfile.tone,
            researchAxis: currentProfile.researchAxis,
            activePrinciples: currentProfile.activePrinciples
        } : {};

        updateConfig(activeAvatarType, {
            profiles: updatedProfiles,
            ...legacyUpdates
        });
    };

    const switchProfile = (profileId: string) => {
        const config = getActiveConfig();
        const newProfile = config.profiles.find(p => p.id === profileId);
        if (newProfile) {
            updateConfig(activeAvatarType, {
                activeProfileId: profileId,
                tone: newProfile.tone,
                researchAxis: newProfile.researchAxis,
                activePrinciples: newProfile.activePrinciples
            });
        }
    };

    const togglePrinciple = (principleId: string) => {
        const profile = getActiveProfile();
        if (!profile) return;

        let limit = 1;
        if (userPlan === 'PRO') limit = 2;
        if (userPlan === 'EXPERT' || userPlan === 'STUDIO') limit = 99;

        const isActive = profile.activePrinciples.includes(principleId);
        let newPrinciples = [];

        if (isActive) {
            newPrinciples = profile.activePrinciples.filter(id => id !== principleId);
        } else {
            if (profile.activePrinciples.length >= limit) {
                // If limit reached, remove first (FIFO) or just block. 
                // FIFO feels better for single selection (replace).
                if (limit === 1) {
                    newPrinciples = [principleId];
                } else {
                    // Start removing from the beginning if limit reached? 
                    // Or just return to block? Let's return to block for multi.
                    // Actually user asked for "Visual feedback... warning not error".
                    // For now let's just replace the oldest if it's single selection.
                    // For multi, let's just block addition.
                    return;
                }
            } else {
                newPrinciples = [...profile.activePrinciples, principleId];
            }
        }
        updateActiveProfile({ activePrinciples: newPrinciples });
    };

    const toggleResearchAxis = (axis: ResearchAxis) => {
        const profile = getActiveProfile();
        if (!profile) return;

        let limit = 1;
        if (userPlan === 'PRO') limit = 2;
        if (userPlan === 'EXPERT' || userPlan === 'STUDIO') limit = 99;

        const isActive = profile.researchAxis.includes(axis);
        let newAxis: ResearchAxis[] = [];

        if (isActive) {
            newAxis = profile.researchAxis.filter(a => a !== axis);
        } else {
            if (profile.researchAxis.length >= limit) {
                if (limit === 1) {
                    newAxis = [axis];
                } else {
                    return;
                }
            } else {
                newAxis = [...profile.researchAxis, axis];
            }
        }
        updateActiveProfile({ researchAxis: newAxis });
    };

    const createProfile = (name: string) => {
        const newId = `profile_${Date.now()}`;
        const newProfile: CognitiveProfile = {
            id: newId,
            name,
            tone: 'Técnico',
            researchAxis: ['Precisión'],
            activePrinciples: [],
            riskTolerance: 'Moderado'
        };
        const config = getActiveConfig();
        updateConfig(activeAvatarType, {
            profiles: [...config.profiles, newProfile],
            activeProfileId: newId,
            tone: newProfile.tone,
            researchAxis: newProfile.researchAxis,
            activePrinciples: newProfile.activePrinciples
        });
    };

    // --- Simulation Logic (Mock) ---
    // --- Simulation Logic (Real Cognitive Engine) ---
    const simulateDecision = (context: SimulationContext): SimulationResult => {
        const profile = getActiveProfile();
        // Fallback for safety
        if (!profile) return {
            decision: 'Error de Perfil',
            reasoning: ['No hay perfil activo.'],
            principlesActivated: [],
            tradeoffs: [],
            riskAssessment: 'Bajo',
            expectedFeedback: 'Configurar perfil.'
        };

        // 1. Membership Gating (Mapping: FREE->GENESIS, PRO->ASCENDANT, EXPERT->PLATINUM, STUDIO->JUPITER)
        // If plan is low, we simplify the output or limit complexity.
        // For simulation, we allow full logic but maybe add a warning if they are exceeding their "Real" capacity.
        // Actually, logic said: "Genesis: 1 Axis...". We enforce limits in toggle, but here we enforce logic outcome.

        let decision = "";
        let riskValue: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' = "Bajo";
        const reasoning: string[] = [];
        const tradeoffs: string[] = [];
        const activePrinciples = profile.activePrinciples;
        let effectiveRiskTolerance = profile.riskTolerance;

        // 2. Context Modifier
        // CRISIS lowers risk tolerance automatically.
        if (context.contextType === 'Crisis') {
            reasoning.push("CONTEXTO CRÍTICO DETECTADO: Reduciendo tolerancia al riesgo.");
            effectiveRiskTolerance = 'Conservador';
        }

        // 3. Cognitive Engine Core
        const axis = profile.researchAxis;

        // --- Heuristic: TONE vs RISK ---
        if (effectiveRiskTolerance === 'Conservador') {
            riskValue = "Bajo";
            decision = `Ejecución estándar orientada a ${axis.length > 0 ? axis.join(' y ') : 'estabilidad'}.`;
            reasoning.push("Prioridad absoluta: Estabilidad y consistencia.");
            if (activePrinciples.includes('p4')) tradeoffs.push("Impacto Visual reducido por seguridad.");
        }
        else if (effectiveRiskTolerance === 'Moderado') {
            riskValue = "Medio";
            decision = `Optimización balanceada entre técnica y ${axis[0] || 'calidad'}.`;
            reasoning.push("Busca mejora incremental sin arriesgar el servicio.");
        }
        else if (effectiveRiskTolerance === 'Audaz') {
            riskValue = "Alto";
            decision = `Propuesta disruptiva enfocada en ${axis.join(' + ')}.`;
            reasoning.push("Se acepta volatilidad a cambio de impacto.");
            tradeoffs.push("Posible inconsistencia en servicio masivo.");
        }
        else if (effectiveRiskTolerance === 'Experimental') {
            riskValue = "Crítico";
            decision = "Innovación radical (Beta).";
            reasoning.push("Maximización de novedad. Ignorando restricciones de seguridad estándar.");
            tradeoffs.push("Alto coste operativo", "Inviabilidad comercial potencial");
        }

        // --- Heuristic: AXIS CONFLICTS ---
        // Coste vs Alta cocina/Creatividad
        if (axis.includes('Coste') && (axis.includes('Creatividad') || axis.includes('Alta cocina'))) {
            tradeoffs.push("Conflicto Eje: Coste limita la expresión creativa.");
            reasoning.push("Se aplicarán técnicas de 'Creatividad Frugal' para cumplir ambos ejes.");
        }

        // --- Heuristic: PRINCIPLES ---
        if (activePrinciples.includes('p3') && context.pressureLevel > 70) {
            // Eficacia de Coste + Presión
            decision = "Simplificación operativa inmediata.";
            reasoning.push("Principio 'Eficacia de Coste' dominando bajo presión.");
        }

        // --- Heuristic: CONTEXT PRESSURE ---
        if (context.pressureLevel > 85 && effectiveRiskTolerance !== 'Experimental') {
            decision = "Protocolo de Supervivencia: Servicio Base.";
            reasoning.push(`PRESIÓN EXTREMA (${context.pressureLevel}%): Abortando procesos complejos.`);
            riskValue = "Medio"; // Risk is managed by simplifying
        }

        // 4. Final Formatting
        return {
            decision,
            reasoning,
            principlesActivated: activePrinciples,
            tradeoffs,
            riskAssessment: riskValue,
            expectedFeedback: riskValue === 'Alto' || riskValue === 'Crítico' ? "Polarizante (Love/Hate)" : "Consistente"
        };
    };

    const isManagerActive = () => activeAvatarType === 'Manager' || activeAvatarType === 'Owner';

    // Create new avatar with membership limits
    const createNewAvatar = (type: AvatarType, customName?: string, customEmoji?: string): { success: boolean; error?: string } => {
        // Get membership limits
        const avatarLimit = {
            'FREE': 1,
            'PRO': 2,
            'EXPERT': 4,
            'STUDIO': 99
        }[userPlan] || 1;

        // Count existing avatars (non-default configs)
        const existingAvatars = Object.values(avatarConfigs).filter(config =>
            config.profiles.length > 0 || config.name !== DEFAULT_CONFIG.name
        ).length;

        if (existingAvatars >= avatarLimit) {
            return {
                success: false,
                error: `Tu estado actual permite ${avatarLimit} manifestación(es). Esta capacidad se expande al alcanzar el siguiente nivel de consciencia.`
            };
        }

        // Check if avatar type already exists
        const existing = avatarConfigs[type];
        if (existing && (existing.profiles.length > 0 || existing.name !== DEFAULT_CONFIG.name)) {
            return {
                success: false,
                error: `La manifestación ${type} ya existe. Selecciónala para configurarla.`
            };
        }

        // Create new avatar with default profile
        const defaultProfile: CognitiveProfile = {
            id: `${type.toLowerCase()}_default`,
            name: 'Perfil Estándar',
            tone: 'Técnico',
            researchAxis: ['Precisión'],
            activePrinciples: [],
            riskTolerance: 'Moderado'
        };

        const newConfig: AvatarConfig = {
            ...DEFAULT_CONFIG,
            name: customName || type,
            emoji: customEmoji || getDefaultEmoji(type),
            profiles: [defaultProfile],
            activeProfileId: defaultProfile.id,
            tone: 'Técnico',
            researchAxis: ['Precisión'],
            activePrinciples: []
        };

        setAvatarConfigs(prev => ({
            ...prev,
            [type]: newConfig
        }));

        // Auto-select the new avatar
        setActiveAvatarType(type);

        return { success: true };
    };

    // Helper to get default emoji
    const getDefaultEmoji = (type: AvatarType): string => {
        const emojiMap: Record<AvatarType, string> = {
            'Mixologist': '🍸',
            'Chef': '👨‍🍳',
            'Patissier': '🍰',
            'Sommelier': '🍷',
            'Barista': '☕',
            'Concierge': '🛎️',
            'Manager': '💼',
            'Owner': '👑'
        };
        return emojiMap[type] || '🤖';
    };

    return {
        activeAvatarType,
        avatarConfigs,
        setActiveAvatarType,
        getActiveConfig,
        getActiveProfile,
        updateConfig,
        updateActiveProfile,
        switchProfile,
        createProfile,
        togglePrinciple,
        toggleResearchAxis,
        simulateDecision,
        isManagerActive,
        createNewAvatar
    };
};

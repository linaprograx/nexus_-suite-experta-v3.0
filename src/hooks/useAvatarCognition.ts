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
    riskAssessment: string;
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

export const useAvatarCognition = () => {
    const { userPlan } = useApp();
    // Mock State - In real app, this would use Context or Zustand with Persistence
    const [activeAvatarType, setActiveAvatarType] = useState<AvatarType>('Mixologist');

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
        if (userPlan === 'ASCENDANT') limit = 2;
        if (userPlan === 'PLATINUM' || userPlan === 'JUPITER') limit = 99;

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
        if (userPlan === 'ASCENDANT') limit = 2;
        if (userPlan === 'PLATINUM' || userPlan === 'JUPITER') limit = 99;

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
    const simulateDecision = (context: SimulationContext): SimulationResult => {
        const profile = getActiveProfile();
        if (!profile) return { decision: 'Error', reasoning: [], principlesActivated: [], tradeoffs: [], riskAssessment: 'Unknown' };

        // Simple mock logic based on profile traits
        let decision = "Proceder con cautela";
        let risk = "Bajo";
        const reasoning = [];
        const tradeoffs = [];

        if (profile.tone === 'Vanguardista' || profile.riskTolerance === 'Audaz') {
            decision = "Ejecutar técnica experimental";
            risk = "Alto";
            reasoning.push("Priorizando impacto visual sobre estabilidad.");
            tradeoffs.push("Mayor coste de ingredientes", "Posible inconsistencia");
            reasoning.push("Priorizando impacto visual sobre estabilidad.");
            tradeoffs.push("Mayor coste de ingredientes", "Posible inconsistencia");
        } else if (profile.researchAxis.includes('Coste')) {
            decision = "Optimizar receta estándar";
            reasoning.push("Maximizando margen operativo.");
            tradeoffs.push("Menor complejidad aromática");
        } else {
            reasoning.push("Manteniendo estándares de calidad base.");
        }

        if (context.pressureLevel > 80 && profile.riskTolerance !== 'Experimental') {
            reasoning.push("Presión crítica detectada: Simplificando ejecución.");
        }

        return {
            decision,
            reasoning,
            principlesActivated: profile.activePrinciples,
            tradeoffs,
            riskAssessment: risk
        };
    };

    const isManagerActive = () => activeAvatarType === 'Manager' || activeAvatarType === 'Owner';

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
        isManagerActive
    };
};

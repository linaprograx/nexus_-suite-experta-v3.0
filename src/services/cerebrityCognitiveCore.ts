import { CognitiveProfile, RiskLevel, ResearchAxis } from '../hooks/useAvatarCognition';

// ============================================================================
// CEREBRITY COGNITIVE CORE
// Single source of truth for creative session state
// ============================================================================

export interface ConceptSeed {
    id: string;
    timestamp: number;
    concept: string;
    narrative: string;
    technicalNotes: string;
    cognitiveContext: {
        profile: CognitiveProfile;
        intent: string;
    };
}

export interface TechnicalValidation {
    id: string;
    timestamp: number;
    ingredients: string[];
    aromaticProfile: string;
    innovationScore: number;
    stabilityScore: number;
    recommendation: string;
}

export interface CriticResult {
    id: string;
    timestamp: number;
    targetContent: string;
    persona: string;
    feedback: string;
    severity: number;
}

export interface TrendMatch {
    id: string;
    timestamp: number;
    trend: any;
    alignmentScore: number;
    compatibilityReason: string;
}

export interface CreativeMemoryEntry {
    timestamp: number;
    section: 'synthesis' | 'makeMenu' | 'lab' | 'critic' | 'trendLocator';
    action: string;
    output: any;
    coherenceScore: number;
}

export interface CerebrityCognitiveState {
    // Avatar Binding
    avatarProfile: CognitiveProfile | null;
    avatarRiskTolerance: RiskLevel;
    avatarPrinciples: string[];

    // Session Creative Context
    sessionIntent: string;
    activeCreativeAxis: ResearchAxis[];
    creativeMemory: CreativeMemoryEntry[];

    // Cross-Section State
    synthesisOutputs: ConceptSeed[];
    labValidations: TechnicalValidation[];
    criticFeedback: CriticResult[];
    trendAlignment: TrendMatch[];

    // Session Metadata
    sessionStartTime: number;
    lastActivity: number;
}

// ============================================================================
// COGNITIVE CORE CLASS
// ============================================================================

export class CerebrityCognitiveCore {
    private state: CerebrityCognitiveState;
    private listeners: Set<(state: CerebrityCognitiveState) => void> = new Set();

    constructor(initialProfile: CognitiveProfile | null = null) {
        this.state = {
            avatarProfile: initialProfile,
            avatarRiskTolerance: initialProfile?.riskTolerance || 'Moderado',
            avatarPrinciples: initialProfile?.activePrinciples || [],
            sessionIntent: '',
            activeCreativeAxis: initialProfile?.researchAxis || [],
            creativeMemory: [],
            synthesisOutputs: [],
            labValidations: [],
            criticFeedback: [],
            trendAlignment: [],
            sessionStartTime: Date.now(),
            lastActivity: Date.now()
        };
    }

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    getState(): CerebrityCognitiveState {
        return { ...this.state };
    }

    updateAvatarProfile(profile: CognitiveProfile) {
        this.state = {
            ...this.state,
            avatarProfile: profile,
            avatarRiskTolerance: profile.riskTolerance,
            avatarPrinciples: profile.activePrinciples,
            activeCreativeAxis: profile.researchAxis,
            lastActivity: Date.now()
        };
        this.notifyListeners();
    }

    setSessionIntent(intent: string) {
        this.state = {
            ...this.state,
            sessionIntent: intent,
            lastActivity: Date.now()
        };
        this.notifyListeners();
    }

    // ============================================================================
    // CREATIVE MEMORY
    // ============================================================================

    addToCreativeMemory(
        section: CreativeMemoryEntry['section'],
        action: string,
        output: any,
        coherenceScore: number = 1.0
    ) {
        const entry: CreativeMemoryEntry = {
            timestamp: Date.now(),
            section,
            action,
            output,
            coherenceScore
        };

        this.state = {
            ...this.state,
            creativeMemory: [entry, ...this.state.creativeMemory].slice(0, 50), // Keep last 50
            lastActivity: Date.now()
        };
        this.notifyListeners();
    }

    getRecentMemory(section?: CreativeMemoryEntry['section'], limit: number = 5): CreativeMemoryEntry[] {
        let memory = this.state.creativeMemory;
        if (section) {
            memory = memory.filter(m => m.section === section);
        }
        return memory.slice(0, limit);
    }

    // ============================================================================
    // SECTION OUTPUTS
    // ============================================================================

    addSynthesisOutput(output: ConceptSeed) {
        this.state = {
            ...this.state,
            synthesisOutputs: [output, ...this.state.synthesisOutputs].slice(0, 10),
            lastActivity: Date.now()
        };
        this.addToCreativeMemory('synthesis', 'concept_generated', output, 1.0);
        this.notifyListeners();
    }

    getLatestSynthesisOutput(): ConceptSeed | null {
        return this.state.synthesisOutputs[0] || null;
    }

    addLabValidation(validation: TechnicalValidation) {
        this.state = {
            ...this.state,
            labValidations: [validation, ...this.state.labValidations].slice(0, 10),
            lastActivity: Date.now()
        };
        this.addToCreativeMemory('lab', 'technical_validation', validation, 1.0);
        this.notifyListeners();
    }

    getLatestLabValidation(): TechnicalValidation | null {
        return this.state.labValidations[0] || null;
    }

    addCriticFeedback(feedback: CriticResult) {
        this.state = {
            ...this.state,
            criticFeedback: [feedback, ...this.state.criticFeedback].slice(0, 10),
            lastActivity: Date.now()
        };
        this.addToCreativeMemory('critic', 'feedback_generated', feedback, 1.0);
        this.notifyListeners();
    }

    addTrendAlignment(trend: TrendMatch) {
        this.state = {
            ...this.state,
            trendAlignment: [trend, ...this.state.trendAlignment].slice(0, 20),
            lastActivity: Date.now()
        };
        this.addToCreativeMemory('trendLocator', 'trend_matched', trend, trend.alignmentScore);
        this.notifyListeners();
    }

    // ============================================================================
    // CROSS-SECTION CONTEXT
    // ============================================================================

    getCreativeContext() {
        return {
            sessionIntent: this.state.sessionIntent,
            lastSynthesis: this.getLatestSynthesisOutput(),
            lastLabValidation: this.getLatestLabValidation(),
            recentMemory: this.getRecentMemory(undefined, 3),
            avatarProfile: this.state.avatarProfile
        };
    }

    // ============================================================================
    // COHERENCE VALIDATION
    // ============================================================================

    validateCoherence(section: string, proposedAction: string): { valid: boolean; reason?: string } {
        if (!this.state.avatarProfile) {
            return { valid: true }; // No profile, no validation
        }

        // Example: Check if action contradicts recent decisions
        const recentMemory = this.getRecentMemory(undefined, 5);

        // Check for contradictions based on principles
        if (this.state.avatarPrinciples.includes('p3')) { // Eficacia de Coste
            if (proposedAction.toLowerCase().includes('luxury') || proposedAction.toLowerCase().includes('premium ingredients')) {
                return {
                    valid: false,
                    reason: 'Contradice principio activo: Eficacia de Coste'
                };
            }
        }

        if (this.state.avatarRiskTolerance === 'Conservador') {
            if (proposedAction.toLowerCase().includes('experimental') || proposedAction.toLowerCase().includes('radical')) {
                return {
                    valid: false,
                    reason: 'Excede tolerancia al riesgo del Avatar (Conservador)'
                };
            }
        }

        return { valid: true };
    }

    // ============================================================================
    // LISTENERS (for React integration)
    // ============================================================================

    subscribe(listener: (state: CerebrityCognitiveState) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================

    resetSession() {
        const profile = this.state.avatarProfile;
        this.state = {
            avatarProfile: profile,
            avatarRiskTolerance: profile?.riskTolerance || 'Moderado',
            avatarPrinciples: profile?.activePrinciples || [],
            sessionIntent: '',
            activeCreativeAxis: profile?.researchAxis || [],
            creativeMemory: [],
            synthesisOutputs: [],
            labValidations: [],
            criticFeedback: [],
            trendAlignment: [],
            sessionStartTime: Date.now(),
            lastActivity: Date.now()
        };
        this.notifyListeners();
    }

    getSessionDuration(): number {
        return Date.now() - this.state.sessionStartTime;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let cognitiveCore: CerebrityCognitiveCore | null = null;

export const getCerebrityCognitiveCore = (): CerebrityCognitiveCore => {
    if (!cognitiveCore) {
        cognitiveCore = new CerebrityCognitiveCore();
    }
    return cognitiveCore;
};

export const resetCerebrityCognitiveCore = (profile?: CognitiveProfile) => {
    cognitiveCore = new CerebrityCognitiveCore(profile);
    return cognitiveCore;
};

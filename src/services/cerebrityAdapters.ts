import { CognitiveProfile, RiskLevel, ResearchAxis, Tone } from '../hooks/useAvatarCognition';
import { Recipe } from '../types';
import { ConceptSeed } from './cerebrityCognitiveCore';

// ============================================================================
// CEREBRITY COGNITIVE ADAPTERS
// Section-specific cognitive filters and transformations
// ============================================================================

// ============================================================================
// SYNTHESIS ADAPTER
// ============================================================================

export const SynthesisAdapter = {
    /**
     * Apply cognitive filter to raw user input
     * Injects Avatar profile context into AI prompts
     */
    applyCognitiveFilter(rawInput: string, profile: CognitiveProfile): string {
        const principleDescriptions = getPrincipleDescriptions(profile.activePrinciples);

        const cognitiveContext = `
CONTEXTO COGNITIVO DEL AVATAR:
- Tono dominante: ${profile.tone}
- Ejes de investigación prioritarios: ${profile.researchAxis.join(', ')}
- Tolerancia al riesgo: ${profile.riskTolerance}
- Principios activos: ${principleDescriptions}

INSTRUCCIÓN:
Tu respuesta debe reflejar este perfil cognitivo. ${getRiskInstruction(profile.riskTolerance)}
${getToneInstruction(profile.tone)}

SOLICITUD DEL USUARIO:
${rawInput}
    `.trim();

        return cognitiveContext;
    },

    /**
     * Validate synthesis output against Avatar profile
     */
    validateOutput(output: any, profile: CognitiveProfile): { valid: boolean; reason?: string } {
        // Check if output aligns with risk tolerance
        if (profile.riskTolerance === 'Conservador') {
            const riskyKeywords = ['experimental', 'radical', 'nunca antes visto', 'disruptivo'];
            const outputText = JSON.stringify(output).toLowerCase();

            for (const keyword of riskyKeywords) {
                if (outputText.includes(keyword)) {
                    return {
                        valid: false,
                        reason: `Output contiene elementos de alto riesgo incompatibles con perfil Conservador: "${keyword}"`
                    };
                }
            }
        }

        return { valid: true };
    }
};

// ============================================================================
// MAKE MENU ADAPTER
// ============================================================================

export const MakeMenuAdapter = {
    /**
     * Get editorial style based on Avatar tone
     */
    getEditorialStyle(profile: CognitiveProfile): string {
        const styleMap: Record<Tone, string> = {
            'Técnico': 'Descripciones precisas y técnicas. Enfoque en método y ejecución.',
            'Creativo': 'Narrativa evocativa. Lenguaje sensorial y emocional.',
            'Vanguardista': 'Experimental y disruptivo. Rompe convenciones.',
            'Michelin-grade': 'Alta cocina. Lenguaje refinado y técnico-poético.',
            'Eficiente': 'Directo y funcional. Sin adornos innecesarios.',
            'Exclusivo': 'Lenguaje premium. Énfasis en rareza y exclusividad.'
        };

        return styleMap[profile.tone] || styleMap['Técnico'];
    },

    /**
     * Validate menu coherence with Avatar profile and Synthesis output
     */
    validateMenuCoherence(
        recipes: Recipe[],
        profile: CognitiveProfile,
        synthesisOutput?: ConceptSeed
    ): { valid: boolean; reason?: string } {
        // Check cost principle
        if (profile.activePrinciples.includes('p3')) { // Eficacia de Coste
            // If synthesis suggested luxury concept, reject
            if (synthesisOutput?.concept.toLowerCase().includes('luxury') ||
                synthesisOutput?.concept.toLowerCase().includes('premium')) {
                return {
                    valid: false,
                    reason: 'Concepto de Synthesis sugiere lujo, pero Avatar tiene principio "Eficacia de Coste" activo'
                };
            }
        }

        // Check minimalism principle
        if (profile.activePrinciples.includes('p2')) { // Minimalismo Radical
            if (recipes.length > 8) {
                return {
                    valid: false,
                    reason: 'Menú excesivamente extenso para perfil con "Minimalismo Radical"'
                };
            }
        }

        // Check sustainability principle
        if (profile.activePrinciples.includes('p5')) { // Sostenibilidad
            // Could check recipe ingredients for sustainability markers
            // For now, just pass
        }

        return { valid: true };
    },

    /**
     * Generate menu prompt with Avatar context
     */
    generateMenuPrompt(
        recipes: Recipe[],
        profile: CognitiveProfile,
        synthesisContext?: ConceptSeed
    ): string {
        const editorialStyle = this.getEditorialStyle(profile);
        const contextualNarrative = synthesisContext
            ? `\nCONTEXTO CREATIVO: ${synthesisContext.narrative}`
            : '';

        return `
PERFIL EDITORIAL: ${editorialStyle}
TONO: ${profile.tone}
PRINCIPIOS: ${getPrincipleDescriptions(profile.activePrinciples)}
${contextualNarrative}

RECETAS SELECCIONADAS:
${recipes.map(r => `- ${r.nombre}`).join('\n')}

Genera un diseño de menú que refleje este perfil cognitivo.
    `.trim();
    }
};

// ============================================================================
// THE LAB ADAPTER
// ============================================================================

export const LabAdapter = {
    /**
     * Get analysis bias based on Avatar profile
     */
    getAnalysisBias(profile: CognitiveProfile): string {
        const biases: string[] = [];

        if (profile.researchAxis.includes('Creatividad')) {
            biases.push('Prioriza combinaciones innovadoras sobre estabilidad aromática');
        }

        if (profile.researchAxis.includes('Precisión')) {
            biases.push('Enfatiza balance técnico y proporciones exactas');
        }

        if (profile.researchAxis.includes('Alta cocina')) {
            biases.push('Busca complejidad y sofisticación en perfiles');
        }

        if (profile.riskTolerance === 'Conservador') {
            biases.push('Favorece perfiles aromáticos probados y seguros');
        } else if (profile.riskTolerance === 'Experimental') {
            biases.push('Explora combinaciones atípicas y disonantes');
        }

        return biases.join('. ') || 'Análisis neutral y balanceado';
    },

    /**
     * Generate Lab analysis prompt with cognitive bias
     */
    generateAnalysisPrompt(
        ingredients: string[],
        profile: CognitiveProfile
    ): string {
        const bias = this.getAnalysisBias(profile);

        return `
SESGO COGNITIVO DEL ANÁLISIS: ${bias}
TOLERANCIA AL RIESGO: ${profile.riskTolerance}

INGREDIENTES A ANALIZAR:
${ingredients.join(', ')}

Analiza esta combinación aplicando el sesgo cognitivo especificado.
    `.trim();
    }
};

// ============================================================================
// THE CRITIC ADAPTER
// ============================================================================

export const CriticAdapter = {
    /**
     * Auto-select critic persona based on Avatar profile
     */
    selectCriticPersona(profile: CognitiveProfile): string {
        // Michelin-grade tone → Inspector Michelin
        if (profile.tone === 'Michelin-grade') {
            return 'Inspector Michelin';
        }

        // Experimental risk → Cliente Furioso (stress test)
        if (profile.riskTolerance === 'Experimental') {
            return 'Cliente Furioso';
        }

        // Sustainability axis → Experto Sostenibilidad
        if (profile.researchAxis.includes('Sostenibilidad')) {
            return 'Experto en Sostenibilidad';
        }

        // Cost principle → Auditor Financiero
        if (profile.activePrinciples.includes('p3')) {
            return 'Auditor Financiero';
        }

        // Vanguardista tone → Influencer Trendy
        if (profile.tone === 'Vanguardista') {
            return 'Influencer Trendy';
        }

        // Default
        return 'Inspector Michelin';
    },

    /**
     * Get critic severity based on risk tolerance
     */
    getCriticSeverity(riskTolerance: RiskLevel): number {
        const severityMap: Record<RiskLevel, number> = {
            'Conservador': 0.3,  // Gentle feedback
            'Moderado': 0.5,     // Balanced
            'Audaz': 0.7,        // Harsh
            'Experimental': 0.9  // Brutal stress test
        };

        return severityMap[riskTolerance];
    },

    /**
     * Generate critic prompt with Avatar-aligned persona and severity
     */
    generateCriticPrompt(
        content: string,
        profile: CognitiveProfile,
        focus: string[]
    ): string {
        const persona = this.selectCriticPersona(profile);
        const severity = this.getCriticSeverity(profile.riskTolerance);
        const severityInstruction = severity > 0.7
            ? 'Sé extremadamente crítico y exigente.'
            : severity > 0.5
                ? 'Sé equilibrado pero honesto.'
                : 'Sé constructivo y alentador.';

        const focusText = focus.length > 0
            ? `Enfócate especialmente en: ${focus.join(', ')}.`
            : '';

        return `
PERSONA CRÍTICA: ${persona}
SEVERIDAD: ${(severity * 100).toFixed(0)}% (${severityInstruction})
EJES DE EVALUACIÓN: ${profile.researchAxis.join(', ')}
${focusText}

CONTENIDO A EVALUAR:
${content}

Analiza desde la perspectiva de ${persona} con la severidad especificada.
    `.trim();
    }
};

// ============================================================================
// TREND LOCATOR ADAPTER
// ============================================================================

export const TrendLocatorAdapter = {
    /**
     * Filter trends by Avatar compatibility
     */
    filterTrendsByAvatar(trends: any[], profile: CognitiveProfile): any[] {
        return trends.filter(trend => {
            // Reject high-cost trends if cost principle is active
            if (profile.activePrinciples.includes('p3')) {
                if (trend.costImpact === 'high' || trend.titulo?.toLowerCase().includes('luxury')) {
                    return false;
                }
            }

            // Reject complex trends if minimalism is active
            if (profile.activePrinciples.includes('p2')) {
                if (trend.complexity === 'high' || trend.titulo?.toLowerCase().includes('elaborado')) {
                    return false;
                }
            }

            // Prioritize sustainability trends if principle is active
            if (profile.activePrinciples.includes('p5')) {
                if (trend.tags?.includes('sostenibilidad') || trend.tags?.includes('eco')) {
                    trend.priority = 'high';
                    trend.avatarAlignment = 'perfect';
                }
            }

            // Prioritize trends aligned with research axes
            if (profile.researchAxis.includes('Creatividad') && trend.tags?.includes('innovación')) {
                trend.priority = 'high';
                trend.avatarAlignment = 'strong';
            }

            return true;
        });
    },

    /**
     * Calculate trend alignment score with Avatar
     */
    calculateAlignmentScore(trend: any, profile: CognitiveProfile): number {
        let score = 0.5; // Base score

        // Boost for axis alignment
        if (profile.researchAxis.includes('Creatividad') && trend.tags?.includes('innovación')) {
            score += 0.2;
        }

        if (profile.researchAxis.includes('Sostenibilidad') && trend.tags?.includes('eco')) {
            score += 0.3;
        }

        // Penalty for principle conflicts
        if (profile.activePrinciples.includes('p3') && trend.costImpact === 'high') {
            score -= 0.4;
        }

        // Risk tolerance alignment
        if (profile.riskTolerance === 'Experimental' && trend.novelty === 'high') {
            score += 0.2;
        } else if (profile.riskTolerance === 'Conservador' && trend.novelty === 'high') {
            score -= 0.3;
        }

        return Math.max(0, Math.min(1, score)); // Clamp to 0-1
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPrincipleDescriptions(principleIds: string[]): string {
    const descriptions: Record<string, string> = {
        'p1': 'Técnica > Narrativa (Prioridad en ejecución técnica)',
        'p2': 'Minimalismo Radical (Menos es más)',
        'p3': 'Eficacia de Coste (Optimización económica)',
        'p4': 'Impacto Visual (Presentación memorable)',
        'p5': 'Sostenibilidad (Responsabilidad ambiental)'
    };

    return principleIds.map(id => descriptions[id] || id).join(', ') || 'Ninguno';
}

function getRiskInstruction(riskTolerance: RiskLevel): string {
    const instructions: Record<RiskLevel, string> = {
        'Conservador': 'Prioriza estabilidad y seguridad. Evita propuestas radicales.',
        'Moderado': 'Balancea innovación con viabilidad.',
        'Audaz': 'Acepta riesgo calculado. Propón ideas disruptivas.',
        'Experimental': 'Maximiza novedad. Ignora restricciones convencionales.'
    };

    return instructions[riskTolerance];
}

function getToneInstruction(tone: Tone): string {
    const instructions: Record<Tone, string> = {
        'Técnico': 'Usa lenguaje preciso y técnico.',
        'Creativo': 'Usa lenguaje evocativo y sensorial.',
        'Vanguardista': 'Rompe convenciones. Sé experimental.',
        'Michelin-grade': 'Lenguaje refinado y técnico-poético.',
        'Eficiente': 'Sé directo y funcional.',
        'Exclusivo': 'Enfatiza rareza y exclusividad.'
    };

    return instructions[tone];
}

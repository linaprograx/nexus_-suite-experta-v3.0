import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useApp } from '../../context/AppContext';
import { PlanTier } from '../../core/product/plans.types';

// --- Types & Constants ---
type AvatarType = 'Mixólogo Profesional' | 'Chef Profesional' | 'Repostero Michelin';
type ResearchAxis = 'Creatividad' | 'Técnica' | 'Competición' | 'Coste' | 'Alta Cocina';
type FeedbackStyle = 'Didáctico' | 'Crítico' | 'Implacable';
type Tone = 'Técnico' | 'Creativo' | 'Competitivo' | 'Michelin';

interface AvatarConfig {
    name: string;
    emoji: string;
    tone: Tone;
    researchAxis: ResearchAxis;
    depthLevel: number;
    technicalRigor: number;
    creativeRisk: number;
    competitionMode: boolean;
    feedbackStyle: FeedbackStyle;
}

const DEFAULT_CONFIG: AvatarConfig = {
    name: '',
    emoji: '🧑‍🍳',
    tone: 'Técnico',
    researchAxis: 'Técnica',
    depthLevel: 50,
    technicalRigor: 80,
    creativeRisk: 40,
    competitionMode: false,
    feedbackStyle: 'Didáctico'
};

const getNarrativeTier = (plan: PlanTier): string => {
    switch (plan) {
        case 'FREE': return 'Génesis';
        case 'PRO': return 'Ascendente';
        case 'EXPERT': return 'Platinum';
        case 'STUDIO': return 'Jupiter';
        default: return 'Iniciado';
    }
};

// --- Components ---

// 1. Avatar Card (VISUAL UPDATE to MATCH MEMBERSHIP CARD)
interface AvatarCardProps {
    type: AvatarType;
    description: string;
    isActive: boolean;
    isLatent: boolean;
    membershipTier: string;
    config: AvatarConfig;
    onSelect: () => void;
    onConfigure: () => void;
}

const AvatarCard: React.FC<AvatarCardProps> = ({ type, description, isActive, isLatent, membershipTier, config, onSelect, onConfigure }) => {
    const displayName = config.name || type;
    const displayEmoji = config.emoji;

    return (
        <div
            onClick={!isLatent ? onSelect : undefined}
            className={`
                relative overflow-hidden rounded-[32px] p-8 h-[460px] transition-all duration-1000 group flex flex-col
                ${isLatent
                    ? 'cursor-default border border-white/5 bg-white/[0.01] backdrop-blur-[2px] opacity-60 hover:opacity-100'
                    : isActive
                        // UPDATED STYLE: Matching the Membership Card Active State exactly
                        ? 'cursor-pointer border border-indigo-500/50 bg-[#0f1322] shadow-[0_0_50px_rgba(99,102,241,0.4)] z-10'
                        : 'cursor-pointer border border-white/10 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06] hover:border-white/20 hover:shadow-2xl hover:-translate-y-1'
                }
            `}
        >
            {/* Premium Glow Halo for Active State (MATCHING MEMBERSHIP CARD) */}
            {isActive && <div className="absolute inset-0 rounded-[32px] shadow-[0_0_80px_rgba(99,102,241,0.25)] pointer-events-none" />}

            {!isLatent && !isActive && (
                <>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
                        <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
                    </div>
                </>
            )}

            {isActive && (
                <>
                    {/* Keeping the internal pulse but softening it to not fight the border */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
                </>
            )}

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-700 ${isActive
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/40'
                                : isLatent
                                    ? 'bg-white/5 grayscale opacity-50'
                                    : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'
                            }`}>
                            {displayEmoji}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className={`px-3 py-1 rounded-full border backdrop-blur-md transition-all ${isActive
                                    ? 'bg-indigo-950/50 border-indigo-500/30 text-indigo-200'
                                    : 'bg-slate-900/50 border-white/10 text-slate-400'
                                }`}>
                                <span className="text-[9px] font-bold uppercase tracking-widest">{membershipTier}</span>
                            </div>

                            {isActive && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)] backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Manifestado</span>
                                </div>
                            )}

                            {isLatent && (
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                                    <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500">Latente</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`text-3xl font-serif font-medium tracking-wide transition-colors duration-500 leading-tight ${isActive ? 'text-white drop-shadow-lg' : isLatent ? 'text-slate-500' : 'text-slate-300 group-hover:text-white'
                            }`}>
                            {displayName}
                        </h3>
                        {isActive && config.name && (
                            <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold">
                                {type}
                            </p>
                        )}
                        <p className={`text-sm leading-relaxed font-light transition-colors duration-500 ${isLatent ? 'text-slate-600' : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                            {description}
                        </p>
                    </div>
                </div>

                <div className={`transition-all duration-700 mt-auto ${isLatent ? 'opacity-50 group-hover:opacity-100' : ''}`}>
                    {isLatent ? (
                        <div className="border-t border-white/5 pt-6">
                            <p className="text-xs text-slate-500 font-serif italic mb-4">
                                "La ascensión de tu consciencia permitirá canalizar esta entidad."
                            </p>
                            <button className="flex items-center gap-2 text-[10px] text-indigo-400/50 uppercase tracking-widest font-bold group-hover:text-indigo-400 transition-colors">
                                Ver mapa de consciencia <Icon svg={ICONS.chevronRight} className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {isActive ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onConfigure(); }}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs uppercase tracking-widest font-bold shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/25 hover:scale-[1.02] transition-all duration-300 border border-indigo-400/20"
                                >
                                    Orquestar Entidad
                                </button>
                            ) : (
                                <button
                                    className="w-full py-4 bg-white/5 text-slate-400 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/10"
                                >
                                    Recibir Avatar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Avatar Orchestrator
interface ConfigModalProps {
    onClose: () => void;
    avatarType: AvatarType;
    membershipTier: string;
    currentConfig: AvatarConfig;
    onSave: (config: AvatarConfig) => void;
}

const AvatarOrchestrator: React.FC<ConfigModalProps> = ({ onClose, avatarType, membershipTier, currentConfig, onSave }) => {
    const [config, setConfig] = useState<AvatarConfig>(currentConfig);
    const EMOJIS = ['🧑‍🍳', '👨‍🔬', '🧙‍♂️', '🧛‍♂️', '🤖', '👽', '🦄', '🐙', '🦁', '🦉', '🦅', '🐺'];

    // ... Implementation logic remains the same ...
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-[#0B0F19] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl shadow-inner">
                            {config.emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-500/30 text-[10px] text-indigo-300 uppercase tracking-widest font-bold">
                                    {membershipTier}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">•</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Orquestación Neural</span>
                            </div>
                            <h2 className="text-3xl font-serif text-white mb-1">{config.name || avatarType}</h2>
                            <p className="text-sm text-slate-400">{avatarType}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.user} className="w-4 h-4" /> 1. Identidad Cognitiva
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 block">Nombre de la Entidad</label>
                                        <input
                                            type="text"
                                            value={config.name}
                                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                            placeholder={avatarType}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">Símbolo Visual</label>
                                        <div className="flex flex-wrap gap-2">
                                            {EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setConfig({ ...config, emoji })}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${config.emoji === emoji
                                                            ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110 shadow-lg'
                                                            : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.search} className="w-4 h-4" /> 2. Enfoque de Investigación
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">Eje Primario</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Creatividad', 'Técnica', 'Competición', 'Coste', 'Alta Cocina'].map((axis) => (
                                                <button
                                                    key={axis}
                                                    onClick={() => setConfig({ ...config, researchAxis: axis as ResearchAxis })}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${config.researchAxis === axis
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            : 'bg-black/20 text-slate-500 border border-white/5 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {axis}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">Profundidad</label>
                                            <span className="text-[10px] text-indigo-300 font-mono">{config.depthLevel}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={config.depthLevel}
                                            onChange={(e) => setConfig({ ...config, depthLevel: parseInt(e.target.value) })}
                                            className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-10">
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.brain} className="w-4 h-4" /> 3. Protocolos de IA
                                </h4>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">Rigor Técnico</label>
                                            <span className="text-[10px] text-indigo-300 font-mono">{config.technicalRigor}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={config.technicalRigor}
                                            onChange={(e) => setConfig({ ...config, technicalRigor: parseInt(e.target.value) })}
                                            className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">Riesgo Creativo</label>
                                            <span className="text-[10px] text-indigo-300 font-mono">{config.creativeRisk}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={config.creativeRisk}
                                            onChange={(e) => setConfig({ ...config, creativeRisk: parseInt(e.target.value) })}
                                            className="w-full accent-purple-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.trophy} className="w-4 h-4" /> 4. Perfil Competitivo
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <span className="text-xs text-slate-300">Modo Competición (Default)</span>
                                        <div
                                            onClick={() => setConfig({ ...config, competitionMode: !config.competitionMode })}
                                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.competitionMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.competitionMode ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 block">Estilo de Feedback</label>
                                        <div className="flex gap-2">
                                            {['Didáctico', 'Crítico', 'Implacable'].map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setConfig({ ...config, feedbackStyle: style as FeedbackStyle })}
                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${config.feedbackStyle === style
                                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                            : 'bg-black/20 text-slate-500 border border-transparent hover:border-white/10'
                                                        }`}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 flex justify-between items-center bg-[#0B0F19]">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Icon svg={ICONS.lock} className="w-3 h-3" />
                        <span>Los cambios afectan la resonancia cognitiva inmediatamente.</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors">
                            Descartar
                        </button>
                        <button
                            onClick={() => { onSave(config); onClose(); }}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all hover:scale-105"
                        >
                            Guardar Avatar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Consciousness Map (Same as before)
const ConsciousnessMap: React.FC<{ onClose: () => void, currentPlan: PlanTier }> = ({ onClose, currentPlan }) => {
    const [flippedState, setFlippedState] = useState<string | null>(null);

    const STATES = [
        {
            id: 'FREE',
            name: 'Génesis',
            desc: 'La chispa inicial. Consciencia singular enfocada en la maestría individual y la fundacion técnica.',
            feat: '1 Entidad',
            detail: 'En el estado Génesis, tu consciencia está anclada a una única manifestación. Es el momento de la profundidad, de conocer a fondo una disciplina antes de expandirse.',
            unlocks: ['Orquestación básica', 'Modo Competición Estándar', 'Análisis de Costos']
        },
        {
            id: 'PRO',
            name: 'Ascendente',
            desc: 'La primera expansión. Dualidad cognitiva que permite gestionar múltiples dominios de expertise.',
            feat: '2 Entidades',
            detail: 'El estado Ascendente rompe la singularidad. Permite contrastar disciplinas (ej. Mixología vs Cocina) y encontrar sinergias operativas.',
            unlocks: ['Dualidad Avatar', 'Jurado Especializado', 'Predicción de Tendencias']
        },
        {
            id: 'EXPERT',
            name: 'Platinum',
            desc: 'Dominio arquitectónico. Estructura mental compleja capaz de sostener múltiples realidades operativas.',
            feat: '4 Entidades',
            detail: 'Platinum es el estado de los directores creativos. Gestiona un equipo completo de inteligencias especializadas bajo una visión unificada.',
            unlocks: ['Consejo de Avatars', 'Modo "Implacable"', 'Análisis de Mercado Global']
        },
        {
            id: 'STUDIO',
            name: 'Jupiter',
            desc: 'Omnipresencia cognitiva. Capacidad de manifestación ilimitada y control total de la realidad.',
            feat: 'Infinito',
            detail: 'Jupiter no tiene límites. Es la fusión total con el sistema, permitiendo instanciar cualquier forma de inteligencia necesaria al instante.',
            unlocks: ['Modo Dios', 'Personalización de Algoritmos', 'API Neural Directa']
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl transition-opacity" onClick={onClose} />
            <div className="relative max-w-6xl w-full bg-[#0B0F19] border border-white/10 rounded-[40px] p-0 shadow-2xl overflow-hidden h-[80vh] flex flex-col">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="p-12 pb-0 relative z-10 text-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-4 block">Mapa de Evolución</span>
                    <h2 className="text-4xl font-serif text-white mb-4">Estados de Consciencia</h2>
                </div>

                <div className="flex-1 p-12 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-6 content-center relative z-10 px-12">
                    {STATES.map((state, i) => {
                        const isCurrent = currentPlan === state.id;
                        const isFlipped = flippedState === state.id;

                        return (
                            <div
                                key={state.id}
                                onClick={() => setFlippedState(isFlipped ? null : state.id)}
                                className="relative h-[400px] cursor-pointer group perspective-1000"
                            >
                                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                                    <div className={`absolute inset-0 backface-hidden p-8 rounded-3xl border flex flex-col justify-between transition-all duration-500 ${isCurrent
                                            ? 'bg-[#0f1322] border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.4)] z-10 scale-105'
                                            : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/[0.04] hover:scale-[1.02] hover:border-white/20'
                                        }`}>
                                        {isCurrent && <div className="absolute inset-0 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.25)] pointer-events-none" />}

                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-slate-600'}`}>
                                                    Fase {i + 1}
                                                </span>
                                                {isCurrent ? (
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-pulse" />
                                                ) : (
                                                    <Icon svg={ICONS.search} className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                                                )}
                                            </div>
                                            <h3 className={`text-2xl font-serif mb-4 leading-tight ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                {state.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 line-clamp-4">
                                                {state.desc}
                                            </p>
                                        </div>

                                        <div className="border-t border-white/5 pt-6 flex justify-between items-end">
                                            <p className={`text-xl font-mono ${isCurrent ? 'text-indigo-200' : 'text-slate-600 group-hover:text-slate-300'}`}>{state.feat}</p>
                                            <span className="text-[10px] uppercase tracking-widest text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">Voltear</span>
                                        </div>
                                    </div>

                                    <div className={`absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-3xl border flex flex-col bg-[#0B0F19] overflow-hidden ${isCurrent
                                            ? 'border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.3)]'
                                            : 'border-white/10 shadow-2xl'
                                        }`}>
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>{state.name} Details</span>
                                            <button className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                                <Icon svg={ICONS.x} className="w-3 h-3 text-slate-400" />
                                            </button>
                                        </div>

                                        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                            <p className="text-sm text-slate-300 leading-relaxed font-light">
                                                {state.detail}
                                            </p>

                                            <div>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-3">Manifestaciones</span>
                                                <ul className="space-y-2">
                                                    {state.unlocks.map((u, idx) => (
                                                        <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                                                            <span className="text-indigo-500 mt-0.5">•</span> {u}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mt-auto">
                                                <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Resonancia</span>
                                                <p className={`text-xs ${isCurrent ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                    {isCurrent ? 'Frecuencia Activa - Estabilizada' : 'Requiere Ascensión Previa'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="p-8 text-center flex-shrink-0">
                    <button onClick={onClose} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
                        Cerrar Mapa
                    </button>
                </div>
            </div>
        </div>
    );
}

// 4. Main View
export const AvatarCoreView: React.FC = () => {
    // ... Main View Implementation (omitted for brevity, assume no changes needed here) ...
    const { userPlan } = useApp();
    const [activeAvatar, setActiveAvatar] = useState<AvatarType>('Mixólogo Profesional');
    const [configAvatar, setConfigAvatar] = useState<AvatarType | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [avatarConfigs, setAvatarConfigs] = useState<Record<string, AvatarConfig>>({
        'Mixólogo Profesional': { ...DEFAULT_CONFIG, emoji: '🍸' },
        'Chef Profesional': { ...DEFAULT_CONFIG, emoji: '👨‍🍳' },
        'Repostero Michelin': { ...DEFAULT_CONFIG, emoji: '🍰' },
    });

    // ... constants ...
    const AVATARS: { type: AvatarType; description: string }[] = [
        {
            type: 'Mixólogo Profesional',
            description: 'Arquitecto de sabores líquidos. Domina la alquimia de los espirituosos y la narrativa de la hospitalidad.'
        },
        {
            type: 'Chef Profesional',
            description: 'Maestro de la materia prima. Transforma ingredientes en experiencias gastronómicas sensoriales y precisas.'
        },
        {
            type: 'Repostero Michelin',
            description: 'Científico del placer dulce. Precisión molecular aplicada al arte efímero de la pastelería de vanguardia.'
        }
    ];

    const handleSaveConfig = (newConfig: AvatarConfig) => {
        if (configAvatar) {
            setAvatarConfigs(prev => ({
                ...prev,
                [configAvatar]: newConfig
            }));
        }
    };

    const getUnlockCount = (plan: PlanTier): number => {
        switch (plan) {
            case 'FREE': return 1;
            case 'PRO': return 2;
            case 'EXPERT': return 4;
            case 'STUDIO': return 99;
            default: return 1;
        }
    };

    const unlockedSlots = getUnlockCount(userPlan);
    const narrativeTier = getNarrativeTier(userPlan);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-transparent relative">
            <style>{`
                @keyframes shine {
                    0% { left: -100%; top: -100%; }
                    100% { left: 200%; top: 200%; }
                }
                .animate-shine {
                    animation: shine 3s infinite linear; 
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s ease-in-out infinite;
                }
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>

            <div className="relative z-10 mb-20 text-center max-w-4xl mx-auto pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-[0.4em] mb-6 block">
                    Nexus Cognitive System
                </span>
                <h1 className="text-5xl md:text-6xl font-serif text-white mb-8 tracking-tight drop-shadow-2xl">
                    Avatar Core
                </h1>
                <p className="text-xl text-slate-400 font-light leading-relaxed max-w-2xl mx-auto">
                    Tu identidad digital no es estática. Es una entidad cognitiva viva que evoluciona con tu nivel de consciencia operativa.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1400px] mx-auto px-4 pb-48 animate-in fade-in zoom-in-95 duration-1000 delay-200">
                {AVATARS.map((avatar, index) => {
                    const isLatent = index >= unlockedSlots;
                    return (
                        <AvatarCard
                            key={avatar.type}
                            type={avatar.type}
                            description={avatar.description}
                            isActive={activeAvatar === avatar.type}
                            isLatent={isLatent}
                            membershipTier={narrativeTier}
                            config={avatarConfigs[avatar.type]}
                            onSelect={() => !isLatent && setActiveAvatar(avatar.type)}
                            onConfigure={() => setConfigAvatar(avatar.type)}
                        />
                    );
                })}
            </div>

            <div className="fixed bottom-12 left-0 w-full flex justify-center z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                <button
                    onClick={() => setShowMap(true)}
                    className="pointer-events-auto flex items-center gap-12 px-12 py-5 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] hover:bg-slate-950/80 transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-indigo-500/20 group"
                >
                    <div className="flex flex-col text-right group-hover:text-indigo-200 transition-colors">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Estado de Consciencia</span>
                        <span className="text-lg text-white font-serif tracking-wide">{narrativeTier}</span>
                    </div>

                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:via-indigo-400/50 transition-colors" />

                    <div className="flex flex-col text-left group-hover:text-indigo-200 transition-colors">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Capacidad de Manifestación</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg text-white font-mono">{unlockedSlots >= 99 ? '∞' : unlockedSlots}</span>
                            <span className="text-[10px] text-slate-600 uppercase">Avatares</span>
                        </div>
                    </div>
                </button>
            </div>

            {configAvatar && (
                <AvatarOrchestrator
                    avatarType={configAvatar}
                    currentConfig={avatarConfigs[configAvatar]}
                    membershipTier={narrativeTier}
                    onSave={handleSaveConfig}
                    onClose={() => setConfigAvatar(null)}
                />
            )}
            {showMap && <ConsciousnessMap currentPlan={userPlan} onClose={() => setShowMap(false)} />}
        </div>
    );
};

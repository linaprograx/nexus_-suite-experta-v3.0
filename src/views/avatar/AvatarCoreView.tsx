import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useApp } from '../../context/AppContext';
import { PlanTier } from '../../core/product/plans.types';
import { useAvatarCognition, AvatarType, AvatarConfig, Tone, ResearchAxis } from '../../hooks/useAvatarCognition';

// --- Constants ---
const getNarrativeTier = (plan: PlanTier): string => {
    switch (plan) {
        case 'FREE': return 'Génesis';
        case 'PRO': return 'Ascendente';
        case 'EXPERT': return 'Platinum';
        case 'STUDIO': return 'Jupiter';
        default: return 'Iniciado';
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

// --- Components ---

// 1. Avatar Card
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
                    ? 'cursor-default border border-white/20 bg-slate-600 opacity-90' // Solid Medium Grey, high visibility
                    : isActive
                        ? 'cursor-pointer border border-indigo-500/50 bg-[#0f1322] shadow-[0_0_50px_rgba(99,102,241,0.4)] z-10'
                        : 'cursor-pointer border border-white/10 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06] hover:border-white/20 hover:shadow-2xl'
                }
            `}
        >
            {isActive && <div className="absolute inset-0 rounded-[32px] shadow-[0_0_80px_rgba(99,102,241,0.25)] pointer-events-none" />}

            {!isLatent && !isActive && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
                    <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />
                </div>
            )}

            {isActive && (
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
            )}

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-700 ${isActive
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/40'
                            : isLatent
                                ? 'bg-slate-600/50 text-slate-300'
                                : 'bg-white/5 group-hover:bg-white/10 group-hover:scale-105'
                            }`}>
                            {isLatent ? <Icon svg={ICONS.lock} className="w-6 h-6 text-slate-600" /> : displayEmoji}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {/* Badge Logic: Only show Tier if Is Active OR Is Available. Latent shows 'Requerido' */}
                            {!isLatent ? (
                                <div className={`px-3 py-1 rounded-full border backdrop-blur-md transition-all ${isActive
                                    ? 'bg-indigo-950/50 border-indigo-500/30 text-indigo-200'
                                    : 'bg-slate-900/50 border-white/10 text-slate-400'
                                    }`}>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{membershipTier}</span>
                                </div>
                            ) : (
                                <div className="px-3 py-1 rounded-full bg-slate-600/50 border border-white/10">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">No Manifestado</span>
                                </div>
                            )}

                            {isActive && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)] backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">Manifestado</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`text-3xl font-serif font-medium tracking-wide transition-colors duration-500 leading-tight ${isActive ? 'text-white drop-shadow-lg' : isLatent ? 'text-slate-200' : 'text-slate-300 group-hover:text-white'
                            }`}>
                            {displayName}
                        </h3>
                        {isActive && config.name && (
                            <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold">
                                {type}
                            </p>
                        )}
                        <p className={`text-sm leading-relaxed font-light transition-colors duration-500 ${isLatent ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                            {description}
                        </p>
                    </div>
                </div>

                <div className={`transition-all duration-700 mt-auto ${isLatent ? 'opacity-70' : ''}`}>
                    {isLatent ? (
                        <div className="border-t border-white/10 pt-6">
                            <p className="text-xs text-slate-400 font-serif italic mb-4">
                                "Esta entidad se activa cuando tu Avatar asciende al siguiente estado."
                            </p>
                            <button className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-indigo-400/70 transition-colors">
                                Ver estados de Membresía <Icon svg={ICONS.chevronRight} className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {isActive ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onConfigure(); }}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs uppercase tracking-widest font-bold shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/25 hover:scale-[1.02] transition-all duration-300 border border-indigo-400/20"
                                >
                                    Configurar Avatar
                                </button>
                            ) : (
                                <button
                                    className="w-full py-4 bg-white/5 text-slate-400 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/10"
                                >
                                    Manifestar Entidad
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. Avatar Orchestrator (Config Modal)
interface ConfigModalProps {
    onClose: () => void;
    avatarType: AvatarType;
    membershipTier: string;
    onSave: (config: AvatarConfig) => void;
}

const AvatarOrchestrator: React.FC<ConfigModalProps> = ({ onClose, avatarType, membershipTier, onSave }) => {
    const { getActiveConfig, updateConfig } = useAvatarCognition();
    const currentConfig = getActiveConfig(); // In real app, we'd fetch specific config by type if editing non-active
    const [config, setConfig] = useState<AvatarConfig>(currentConfig);
    const EMOJIS = ['🧑‍🍳', '👨‍🔬', '🧙‍♂️', '🧛‍♂️', '🤖', '👽', '🦄', '🐙', '🦁', '🦉', '🦅', '🐺'];

    const handleSave = () => {
        onSave(config);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-[#0B0F19] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
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
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Configuración del Avatar</span>
                            </div>
                            <h2 className="text-3xl font-serif text-white mb-1">{config.name || avatarType}</h2>
                            <p className="text-sm text-slate-400">{avatarType}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Sections */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* LEFT COLUMN */}
                        <div className="space-y-10">
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.trendingUp} className="w-4 h-4 text-emerald-400" /> 1. Identidad Cognitiva
                                </h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 block">Nombre del Avatar</label>
                                        <input type="text" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} placeholder={avatarType} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">Símbolo Visual</label>
                                        <div className="flex flex-wrap gap-2">
                                            {EMOJIS.map(emoji => (
                                                <button key={emoji} onClick={() => setConfig({ ...config, emoji })} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${config.emoji === emoji ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110 shadow-lg' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>{emoji}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2"><Icon svg={ICONS.search} className="w-4 h-4" /> 2. Perfil Cognitivo</h4>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">Estilo Cognitivo</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Clásico', 'Técnico', 'Creativo', 'Vanguardista', 'Michelin-grade'].map((tone) => (
                                                <button key={tone} onClick={() => setConfig({ ...config, tone: tone as Tone })} className={`px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${config.tone === tone ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-black/20 text-slate-500 border border-white/5 hover:bg-white/5'}`}>{tone}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block">Enfoque Primario</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Precisión', 'Creatividad', 'Competición', 'Coste', 'Alta cocina'].map((axis) => (
                                                <button key={axis} onClick={() => setConfig({ ...config, researchAxis: [axis as ResearchAxis] })} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${config.researchAxis.includes(axis as ResearchAxis) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-black/20 text-slate-500 border border-white/5 hover:bg-white/5'}`}>{axis}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        {/* RIGHT COLUMN */}
                        <div className="space-y-10">
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2"><Icon svg={ICONS.trendingUp} className="w-4 h-4 text-emerald-400" /> 3. Principios Mentales</h4>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                            Los principios definen las reglas inquebrantables de tu Avatar. Gestiona su prioridad en <strong>Avatar Intelligence</strong>.
                                        </p>
                                        <div className="flex gap-2">
                                            {config.activePrinciples.length > 0 ? (
                                                config.activePrinciples.map(p => (
                                                    <span key={p} className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-300 uppercase tracking-widest">{p}</span>
                                                ))
                                            ) : <span className="text-[9px] text-slate-600 uppercase">Sin principios activos</span>}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <section>
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-2"><Icon svg={ICONS.star} className={`w-4 h-4 ${config.competitionMode ? 'text-amber-400' : 'text-slate-600'}`} /> 4. Competición</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                        <div>
                                            <span className="text-xs text-white font-bold block mb-1">Modo Competición</span>
                                            <span className="text-[10px] text-slate-500">Habilita evaluación comparativa contra estándares globales.</span>
                                        </div>
                                        <div onClick={() => setConfig({ ...config, competitionMode: !config.competitionMode })} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${config.competitionMode ? 'bg-indigo-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.competitionMode ? 'left-6' : 'left-1'}`} /></div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 flex justify-between items-center bg-[#0B0F19]">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Icon svg={ICONS.lock} className="w-3 h-3" />
                        <span>Resonancia cognitiva actualizada al guardar.</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Descartar</button>
                        <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all hover:scale-105">Guardar Avatar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Consciousness Map
const ConsciousnessMap: React.FC<{ onClose: () => void, currentPlan: PlanTier }> = ({ onClose, currentPlan }) => {
    const [flippedState, setFlippedState] = useState<string | null>(null);

    const checkStatus = (planId: string): 'PAST' | 'CURRENT' | 'FUTURE' => {
        const tiers = ['FREE', 'PRO', 'EXPERT', 'STUDIO'];
        const currentIdx = tiers.indexOf(currentPlan);
        const targetIdx = tiers.indexOf(planId);
        if (targetIdx < currentIdx) return 'PAST';
        if (targetIdx === currentIdx) return 'CURRENT';
        return 'FUTURE';
    };

    const STATES = [
        {
            id: 'FREE',
            name: 'Génesis',
            desc: 'La chispa inicial. Consciencia singular enfocada en la maestría individual y la fundamentación técnica.',
            feat: '1 Entidad',
            detail: 'Estado de consciencia anclado a una única manifestación. Ideal para la profundidad técnica y el dominio vertical de una disciplina.',
            unlocks: ['Perfil Cognitivo Base', 'Modo Competición Estándar', 'Análisis de Costos Singular'],
            limits: 'Sin acceso a orquestación multi-avatar ni predicción de mercado.'
        },
        {
            id: 'PRO',
            name: 'Ascendente',
            desc: 'La primera expansión. Dualidad cognitiva que permite gestionar múltiples dominios de expertise simultáneamente.',
            feat: '2 Entidades',
            detail: 'Ruptura de la singularidad. Permite contrastar disciplinas (ej. Mixología vs Cocina) y encontrar sinergias operativas. La IA sugiere conexiones laterales.',
            unlocks: ['Dualidad Avatar', 'Jurado Especializado', 'Predicción de Tendencias'],
            limits: 'Simulación de equipo limitada a 2 nodos.'
        },
        {
            id: 'EXPERT',
            name: 'Platinum',
            desc: 'Dominio arquitectónico. Estructura mental compleja capaz de sostener múltiples realidades operativas.',
            feat: '4 Entidades',
            detail: 'Estado de dirección creativa. Gestiona un equipo completo de inteligencias especializadas. La incertidumbre creativa se convierte en un activo estratégico.',
            unlocks: ['Consejo de Avatars', 'Modo Feedback "Implacable"', 'Análisis de Mercado Global'],
            limits: 'Requiere alta coherencia en la configuración de principios.'
        },
        {
            id: 'STUDIO',
            name: 'Jupiter',
            desc: 'Omnipresencia cognitiva. Capacidad de manifestación ilimitada y control total de la realidad operativa.',
            feat: 'Infinito',
            detail: 'Fusión total con el sistema. Instanciación dinámica de inteligencia según demanda. Tú defines las reglas de la física de tu negocio.',
            unlocks: ['Modo Dios (Parametrización total)', 'Personalización de Algoritmos', 'API Neural Directa'],
            limits: 'Ninguno. Límite solo por hardware cognitivo.'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl transition-opacity" onClick={onClose} />
            <div className="relative max-w-6xl w-full bg-[#0B0F19] border border-white/10 rounded-[40px] p-0 shadow-2xl overflow-hidden h-auto max-h-[90vh] flex flex-col">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="p-8 pb-4 relative z-10 text-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-4 block">Mapa de Evolución</span>
                    <h2 className="text-4xl font-serif text-white mb-4">Estados de Consciencia</h2>
                </div>

                <div className="flex-1 overflow-hidden relative z-10 flex items-center justify-center p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-[1400px]">
                        {STATES.map((state, i) => {
                            const status = checkStatus(state.id);
                            const isCurrent = status === 'CURRENT';
                            const isFlipped = flippedState === state.id;

                            return (
                                <div
                                    key={state.id}
                                    onClick={() => setFlippedState(isFlipped ? null : state.id)}
                                    className="relative w-full h-[450px] cursor-pointer group perspective-1000"
                                >
                                    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                        {/* Front Face */}
                                        <div className={`absolute inset-0 backface-hidden p-6 rounded-3xl border flex flex-col justify-between items-center text-center transition-all duration-500 ${isCurrent
                                            ? 'bg-[#0f1322] border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.2)] z-10'
                                            : 'bg-white/[0.02] border-white/5 opacity-80 hover:opacity-100 hover:bg-white/[0.04] hover:border-white/20'
                                            }`}>
                                            {isCurrent && <div className="absolute inset-0 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.25)] pointer-events-none" />}
                                            <div className="w-full">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 block ${isCurrent ? 'text-indigo-400' : 'text-slate-600'}`}>
                                                    Fase {i + 1}
                                                </span>
                                                <h3 className={`text-2xl font-serif mb-4 leading-tight ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                    {state.name}
                                                </h3>
                                                <div className={`w-12 h-1 bg-gradient-to-r mx-auto rounded-full mb-6 ${isCurrent ? 'from-indigo-500 to-indigo-300' : 'from-slate-700 to-slate-800'}`} />
                                                <p className="text-xs text-slate-500 leading-relaxed font-light line-clamp-5">
                                                    {state.desc}
                                                </p>
                                            </div>
                                            <div className="w-full border-t border-white/5 pt-4">
                                                <p className={`text-xl font-mono mb-2 ${isCurrent ? 'text-indigo-200' : 'text-slate-600'}`}><Icon svg={ICONS.star} className={`w-4 h-4 ${isCurrent ? 'text-amber-400' : 'text-slate-600'}`} />{state.feat}</p>
                                                <span className="text-[9px] uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1 opacity-100 group-hover:text-white transition-colors">
                                                    Ver Detalles <Icon svg={ICONS.chevronRight} className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>

                                        {/* Back Face */}
                                        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border flex flex-col bg-[#141824] overflow-hidden ${isCurrent ? 'border-indigo-500/50' : 'border-white/10'
                                            }`}>
                                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#141824] z-10">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>{state.name}</span>
                                                <button className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest">Volver</button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                                <p className="text-xs text-slate-300 leading-relaxed font-light">
                                                    {state.detail}
                                                </p>
                                                <div>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Desbloqueos</span>
                                                    <ul className="space-y-1.5">
                                                        {state.unlocks.map((u, idx) => (
                                                            <li key={idx} className="text-[10px] text-slate-400 flex items-start gap-2">
                                                                <span className="text-indigo-500 mt-0.5">•</span> {u}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {status !== 'FUTURE' && (
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Límites</span>
                                                        <p className="text-[10px] text-slate-400 leading-relaxed">{state.limits}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 border-t border-white/5 bg-[#141824] z-10">
                                                {status === 'CURRENT' && (
                                                    <button className="w-full py-3 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-widest cursor-default">
                                                        Estado Actual
                                                    </button>
                                                )}
                                                {status === 'FUTURE' && (
                                                    <button className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02]">
                                                        Ascender
                                                    </button>
                                                )}
                                                {status === 'PAST' && (
                                                    <button className="w-full py-3 rounded-lg bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest cursor-default">
                                                        Integrado
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="p-6 text-center flex-shrink-0">
                    <button onClick={onClose} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold">
                        Cerrar Mapa
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main View ---
export const AvatarCoreView: React.FC = () => {
    const { userPlan } = useApp();
    const { activeAvatarType, avatarConfigs, setActiveAvatarType, updateConfig, createNewAvatar } = useAvatarCognition();
    const [configAvatarType, setConfigAvatarType] = useState<AvatarType | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [modalMode, setModalMode] = useState<'consciousness' | 'create'>('consciousness');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const AVATARS: { type: AvatarType; description: string }[] = [
        {
            type: 'Mixologist',
            description: 'Arquitecto de sabores líquidos. Domina la alquimia de los espirituosos y la narrativa de la hospitalidad.'
        },
        {
            type: 'Chef',
            description: 'Maestro de la materia prima. Transforma ingredientes en experiencias gastronómicas sensoriales y precisas.'
        },
        {
            type: 'Patissier',
            description: 'Científico del placer dulce. Precisión molecular aplicada al arte efímero de la pastelería de vanguardia.'
        }
    ];

    const unlockedSlots = getUnlockCount(userPlan);
    const narrativeTier = getNarrativeTier(userPlan);

    return (
        <div className="h-full w-full relative overflow-hidden">
            <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 bg-transparent pb-32">
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
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>



                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1400px] mx-auto px-4 pb-48 animate-in fade-in zoom-in-95 duration-1000 delay-200">
                    {AVATARS.map((avatar, index) => {
                        const isLatent = index >= unlockedSlots;
                        return (
                            <AvatarCard
                                key={avatar.type}
                                type={avatar.type}
                                description={avatar.description}
                                isActive={activeAvatarType === avatar.type}
                                isLatent={isLatent}
                                membershipTier={narrativeTier}
                                config={avatarConfigs[avatar.type]}
                                onSelect={() => !isLatent && setActiveAvatarType(avatar.type)}
                                onConfigure={() => setConfigAvatarType(avatar.type)}
                            />
                        );
                    })}

                    {/* Create New Avatar Button */}
                    {Object.values(avatarConfigs).filter(c => c.profiles.length > 0).length < getUnlockCount(userPlan) && (
                        <div
                            onClick={() => { setModalMode('create'); setShowMap(true); }}
                            className="relative overflow-hidden rounded-[32px] p-8 h-[460px] transition-all duration-500 cursor-pointer border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 flex flex-col items-center justify-center group"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Icon svg={ICONS.plus} className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-serif text-white mb-4">Manifestar Nueva Identidad</h3>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                                    Capacidad disponible: {getUnlockCount(userPlan) - Object.values(avatarConfigs).filter(c => c.profiles.length > 0).length} manifestación(es)
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-12 left-0 w-full flex justify-center z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <button
                        onClick={() => setShowMap(true)}
                        className="pointer-events-auto flex items-center gap-8 px-8 py-2 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] hover:bg-slate-950/80 transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-indigo-500/20 group hover:animate-pulse-slow"
                    >
                        <div className="flex flex-col text-right group-hover:text-indigo-200 transition-colors">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Estado de Consciencia</span>
                            <span className="text-base text-white font-serif tracking-wide">{narrativeTier}</span>
                        </div>

                        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:via-indigo-400/50 transition-colors" />

                        <div className="flex flex-col text-left group-hover:text-indigo-200 transition-colors">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Capacidad de Manifestación</span>
                            <div className="flex items-center gap-2">
                                <span className="text-base text-white font-mono">{unlockedSlots >= 99 ? '∞' : unlockedSlots}</span>
                                <span className="text-[9px] text-slate-600 uppercase">Avatares</span>
                            </div>
                        </div>
                    </button>
                </div>

                {configAvatarType && (
                    <AvatarOrchestrator
                        avatarType={configAvatarType}
                        membershipTier={narrativeTier}
                        onSave={(newConfig) => {
                            updateConfig(configAvatarType, newConfig);
                        }}
                        onClose={() => setConfigAvatarType(null)}
                    />
                )}
                {showMap && modalMode === 'consciousness' && <ConsciousnessMap currentPlan={userPlan} onClose={() => setShowMap(false)} />}

                {/* Create Avatar Modal */}
                {showMap && modalMode === 'create' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setShowMap(false)} />
                        <div className="relative max-w-4xl w-full bg-[#0B0F19] border border-white/10 rounded-[40px] p-8 shadow-2xl">
                            <div className="text-center mb-8">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-4 block">Nueva Manifestación</span>
                                <h2 className="text-4xl font-serif text-white mb-4">Selecciona un Rol</h2>
                                <p className="text-slate-400">Define la identidad profesional de tu nueva manifestación cognitiva</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {(['Mixologist', 'Chef', 'Patissier', 'Sommelier', 'Barista', 'Concierge', 'Manager', 'Owner'] as AvatarType[]).map(type => {
                                    const exists = avatarConfigs[type].profiles.length > 0;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (!exists) {
                                                    const result = createNewAvatar(type);
                                                    if (result.success) {
                                                        setShowMap(false);
                                                    } else {
                                                        setErrorMessage(result.error || 'Error al crear avatar');
                                                    }
                                                }
                                            }}
                                            disabled={exists}
                                            className={`p-6 rounded-2xl border transition-all ${exists
                                                ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                                                : 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 cursor-pointer hover:scale-105'
                                                }`}
                                        >
                                            <div className="text-4xl mb-3">{avatarConfigs[type].emoji}</div>
                                            <div className="text-sm font-bold text-white mb-1">{type}</div>
                                            {exists && <div className="text-[10px] text-indigo-400 uppercase tracking-wider">Ya existe</div>}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setShowMap(false)}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Glassmorphism Error Modal */}
                {errorMessage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setErrorMessage(null)} />
                        <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_20px_80px_-12px_rgba(0,0,0,0.8)] max-w-md w-full animate-in zoom-in-95 fade-in duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-3xl" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Icon svg={ICONS.alertCircle} className="w-8 h-8 text-rose-400" />
                                </div>
                                <h3 className="text-xl font-serif text-white text-center mb-4">Capacidad Alcanzada</h3>
                                <p className="text-slate-300 text-center mb-6 leading-relaxed">{errorMessage}</p>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium transition-all shadow-lg hover:shadow-indigo-500/50"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

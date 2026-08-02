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
                relative overflow-hidden rounded-2xl p-3 lg:p-5 min-h-[200px] lg:h-[260px] transition-all duration-500 group flex flex-col
                ${isLatent
                    ? 'cursor-default opacity-50 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10'
                    : isActive
                        ? 'cursor-pointer border border-indigo-400 dark:border-indigo-500/50 bg-white dark:bg-[#0f1322] shadow-[0_0_40px_rgba(99,102,241,0.25)] dark:shadow-[0_0_40px_rgba(99,102,241,0.35)] scale-[1.02] z-10'
                        : 'cursor-pointer bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:hover:bg-white/[0.06] dark:hover:border-white/20 hover:border-indigo-200 hover:shadow-indigo-100 dark:hover:shadow-xl hover:scale-[1.01]'
                }
            `}
        >
            {isActive && <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/15 blur-[80px] rounded-full pointer-events-none" />}

            <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Top row: emoji + badges */}
                <div className="flex justify-between items-start">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${isActive
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-500/40'
                        : isLatent
                            ? 'bg-slate-200 dark:bg-white/5'
                            : 'bg-slate-100 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-white/10'
                        }`}>
                        {isLatent ? <Icon svg={ICONS.lock} className="w-4 h-4 text-slate-400 dark:text-slate-600" /> : displayEmoji}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        {isActive && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-200">Activo</span>
                            </div>
                        )}
                        {isLatent && (
                            <div className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Bloqueado</span>
                            </div>
                        )}
                        <div className={`px-2 py-0.5 rounded-full border ${isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{membershipTier}</span>
                        </div>
                    </div>
                </div>

                {/* Name + description */}
                <div className="mt-3 flex-1">
                    <h3 className={`text-lg font-serif font-medium tracking-wide leading-tight mb-1.5 ${isActive
                        ? 'text-slate-900 dark:text-white'
                        : isLatent
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                        {displayName}
                    </h3>
                    <p className={`text-[11px] leading-relaxed font-light line-clamp-3 ${isLatent
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}>
                        {description}
                    </p>
                </div>

                {/* CTA */}
                <div className="mt-3">
                    {isLatent ? (
                        <button className="w-full py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 cursor-default">
                            Requiere Ascenso
                        </button>
                    ) : isActive ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onConfigure(); }}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                        >
                            Configurar
                        </button>
                    ) : (
                        <button className="w-full py-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold hover:bg-indigo-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5">
                            Manifestar
                        </button>
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

// All available principles with real names
const ALL_PRINCIPLES = [
    { id: 'p1', name: 'Técnica > Narrativa', desc: 'La ejecución técnica es siempre prioritaria sobre el storytelling.' },
    { id: 'p2', name: 'Minimalismo Radical', desc: 'Menos elementos, mayor impacto. Elimina todo lo no esencial.' },
    { id: 'p3', name: 'Eficacia de Coste', desc: 'Maximizar la relación calidad/coste en cada decisión operativa.' },
    { id: 'p4', name: 'Impacto Visual', desc: 'La presentación y el factor visual son diferenciadores clave.' },
    { id: 'p5', name: 'Sostenibilidad', desc: 'Decisiones orientadas al impacto medioambiental y social.' },
];

const TONE_OPTIONS: Tone[] = ['Técnico', 'Creativo', 'Vanguardista', 'Michelin-grade', 'Eficiente', 'Exclusivo'];
const AXIS_OPTIONS: ResearchAxis[] = ['Precisión', 'Creatividad', 'Competición', 'Coste', 'Alta cocina', 'Sostenibilidad'];

const EMOJI_GROUPS = {
    'Gastronomía': ['🍸', '🧑‍🍳', '👨‍🍳', '🍷', '☕', '🍰', '🦞', '🍣', '🥂', '🍽️'],
    'Personalidad': ['🧙‍♂️', '🦁', '🦅', '🐺', '🦄', '🧛‍♂️', '👑', '🤖', '🧬', '⚡'],
    'Símbolos':    ['✦', '◈', '⬡', '◎', '△', '⬢', '✿', '◉', '⊕', '✺'],
};

const AvatarOrchestrator: React.FC<ConfigModalProps> = ({ onClose, avatarType, membershipTier, onSave }) => {
    const { avatarConfigs } = useAvatarCognition();
    const currentConfig = avatarConfigs[avatarType];
    const [config, setConfig] = useState<AvatarConfig>(currentConfig);
    const [emojiGroup, setEmojiGroup] = useState<keyof typeof EMOJI_GROUPS>('Gastronomía');
    const [customEmoji, setCustomEmoji] = useState('');

    const togglePrinciple = (id: string) => {
        const active = config.activePrinciples.includes(id)
            ? config.activePrinciples.filter(p => p !== id)
            : [...config.activePrinciples, id];
        setConfig({ ...config, activePrinciples: active });
    };

    const handleSave = () => {
        onSave(config);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-[#0B0F19] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Live Preview Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        {/* Live emoji preview */}
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl shadow-inner transition-all duration-300">
                            {config.emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-500/30 text-[9px] text-indigo-300 uppercase tracking-widest font-bold">{membershipTier}</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest">·</span>
                                <span className="text-[9px] text-slate-500 uppercase tracking-widest">{avatarType}</span>
                            </div>
                            {/* Live name preview */}
                            <h2 className="text-2xl font-serif text-white leading-tight">{config.name || avatarType}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-purple-400 font-bold uppercase">{config.tone}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase">{config.researchAxis.join(' + ')}</span>
                                {config.competitionMode && <span className="text-[10px] text-amber-400 font-bold uppercase">· Competición ON</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT */}
                        <div className="space-y-8">
                            {/* 1. Identidad */}
                            <section>
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.trendingUp} className="w-3.5 h-3.5 text-emerald-400" /> 1. Identidad Cognitiva
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
                                        <input
                                            type="text"
                                            value={config.name}
                                            onChange={e => setConfig({ ...config, name: e.target.value })}
                                            placeholder={avatarType}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">Símbolo Visual</label>
                                        {/* Emoji group tabs */}
                                        <div className="flex gap-1 mb-2">
                                            {(Object.keys(EMOJI_GROUPS) as (keyof typeof EMOJI_GROUPS)[]).map(g => (
                                                <button key={g} onClick={() => setEmojiGroup(g)}
                                                    className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${emojiGroup === g ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {EMOJI_GROUPS[emojiGroup].map(emoji => (
                                                <button key={emoji} onClick={() => setConfig({ ...config, emoji })}
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${config.emoji === emoji ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Custom emoji input */}
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={customEmoji}
                                                onChange={e => setCustomEmoji(e.target.value)}
                                                placeholder="Escribe cualquier emoji..."
                                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                maxLength={4}
                                            />
                                            <button
                                                onClick={() => { if (customEmoji) { setConfig({ ...config, emoji: customEmoji }); setCustomEmoji(''); } }}
                                                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-all"
                                            >
                                                Usar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Perfil Cognitivo */}
                            <section>
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.search} className="w-3.5 h-3.5" /> 2. Perfil Cognitivo
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">Tono Cognitivo</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {TONE_OPTIONS.map(tone => (
                                                <button key={tone} onClick={() => setConfig({ ...config, tone })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${config.tone === tone ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/[0.03] text-slate-500 border border-white/5 hover:bg-white/5 hover:text-slate-300'}`}>
                                                    {tone}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">Eje de Investigación</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {AXIS_OPTIONS.map(axis => (
                                                <button key={axis} onClick={() => setConfig({ ...config, researchAxis: config.researchAxis.includes(axis) ? config.researchAxis.filter(a => a !== axis) : [...config.researchAxis, axis] })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${config.researchAxis.includes(axis) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/[0.03] text-slate-500 border border-white/5 hover:bg-white/5 hover:text-slate-300'}`}>
                                                    {axis}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-8">
                            {/* 3. Principios — now fully interactive with names */}
                            <section>
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.trendingUp} className="w-3.5 h-3.5 text-emerald-400" /> 3. Principios Mentales
                                </h4>
                                <div className="space-y-2">
                                    {ALL_PRINCIPLES.map(p => {
                                        const isActive = config.activePrinciples.includes(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => togglePrinciple(p.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${isActive ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex-1 pr-3">
                                                    <span className={`text-xs font-bold block mb-0.5 ${isActive ? 'text-purple-200' : 'text-slate-400 group-hover:text-slate-200'}`}>{p.name}</span>
                                                    <span className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">{p.desc}</span>
                                                </div>
                                                <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${isActive ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${isActive ? 'left-5' : 'left-1'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 4. Competición */}
                            <section>
                                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                    <Icon svg={ICONS.star} className={`w-3.5 h-3.5 ${config.competitionMode ? 'text-amber-400' : 'text-slate-600'}`} /> 4. Competición
                                </h4>
                                <div
                                    onClick={() => setConfig({ ...config, competitionMode: !config.competitionMode })}
                                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${config.competitionMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
                                >
                                    <div>
                                        <span className={`text-sm font-bold block mb-0.5 ${config.competitionMode ? 'text-amber-200' : 'text-white'}`}>Modo Competición</span>
                                        <span className="text-[10px] text-slate-500">Evaluación comparativa contra estándares globales.</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${config.competitionMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.competitionMode ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-white/5 flex justify-between items-center bg-[#0B0F19]">
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                        <Icon svg={ICONS.lock} className="w-3 h-3" />
                        <span>Guardado en Firestore al confirmar.</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Descartar</button>
                        <button onClick={handleSave} className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02]">Guardar Avatar</button>
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
            <div className="relative max-w-6xl w-full bg-[#0B0F19] border border-white/10 rounded-[40px] p-0 shadow-2xl overflow-hidden h-auto max-h-[90dvh] flex flex-col">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="p-8 pb-4 relative z-10 text-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em] mb-4 block">Mapa de Evolución</span>
                    <h2 className="text-4xl font-serif text-white mb-4">Estados de Consciencia</h2>
                </div>

                <div className="lg:flex-1 lg:overflow-hidden relative z-10 flex lg:items-center lg:justify-center p-3 lg:p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 w-full max-w-[1400px]">
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
        { type: 'Mixologist', description: 'Arquitecto de sabores líquidos. Domina la alquimia de los espirituosos y la narrativa de la hospitalidad.' },
        { type: 'Chef', description: 'Maestro de la materia prima. Transforma ingredientes en experiencias gastronómicas sensoriales y precisas.' },
        { type: 'Patissier', description: 'Científico del placer dulce. Precisión molecular aplicada al arte efímero de la pastelería de vanguardia.' },
        { type: 'Sommelier', description: 'Guardián de la viticultura. Conecta la tierra, el tiempo y el paladar a través del lenguaje del vino.' },
        { type: 'Barista', description: 'Alquimista del café. Extrae la esencia del origen en cada taza con precisión y rituales de servicio.' },
        { type: 'Concierge', description: 'Arquitecto de experiencias. Orquesta la hospitalidad perfecta anticipando cada necesidad del huésped.' },
        { type: 'Manager', description: 'Director de operaciones. Gestiona equipos, costes y estrategia con visión de negocio 360°.' },
        { type: 'Owner', description: 'Visionario del negocio. Define la identidad, cultura y dirección estratégica del establecimiento.' },
    ];

    const unlockedSlots = getUnlockCount(userPlan);
    const narrativeTier = getNarrativeTier(userPlan);

    return (
        <div className="min-h-full lg:h-full w-full relative lg:overflow-hidden">
            <div className="lg:h-full w-full lg:overflow-y-auto custom-scrollbar p-2 lg:p-8 bg-transparent pb-32">
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



                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-[1400px] mx-auto px-0 lg:px-4 pb-32 animate-in fade-in zoom-in-95 duration-700">
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
                </div>

                <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom)+0.75rem)] lg:bottom-12 left-0 w-full flex justify-center z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <button
                        onClick={() => setShowMap(true)}
                        className="pointer-events-auto flex items-center gap-3 lg:gap-8 px-4 lg:px-8 py-2 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] hover:bg-slate-950/80 transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-indigo-500/20 group hover:animate-pulse-slow"
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

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

import React, { useState, useEffect } from 'react';
import { useAvatarCognition, Tone, ResearchAxis, RiskLevel, CognitiveProfile, SimulationContext, SimulationResult } from '../../hooks/useAvatarCognition';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useApp } from '../../context/AppContext';

// --- VISUAL CONSTANTS (ROSE/GOLD/CHAMPAGNE) ---
const THEME = {
    gradient: 'from-rose-500/20 to-amber-500/20',
    border: 'border-rose-200 dark:border-rose-500/20',
    text_accent: 'text-rose-600 dark:text-rose-200',
    text_subtle: 'text-slate-500 dark:text-rose-200/50',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    modal_bg: 'bg-white/95 dark:bg-[#0f0406]/95',
};

// --- CONFIGURATION MODAL ---
interface ConfigModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const CognitiveConfigModal: React.FC<ConfigModalProps> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-2xl ${THEME.modal_bg} backdrop-blur-md border border-slate-200 dark:border-rose-500/20 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]`}>
                <div className="absolute top-0 right-0 p-4 z-10">
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 border-b border-slate-100 dark:border-rose-500/10 bg-rose-50/50 dark:bg-rose-500/5">
                    <h3 className="text-xl font-serif text-slate-900 dark:text-white tracking-wide">{title}</h3>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const AvatarIntelligenceView: React.FC = () => {
    const { activeAvatarType, getActiveConfig, getActiveProfile, updateConfig, updateActiveProfile, switchProfile, createProfile, simulateDecision, togglePrinciple, toggleResearchAxis } = useAvatarCognition();
    const config = getActiveConfig();
    const activeProfile = getActiveProfile();

    // UI State
    const [activeModal, setActiveModal] = useState<'calibration' | 'profiles' | null>(null);
    const [simContext, setSimContext] = useState<SimulationContext>({ contextType: 'Service', constraints: [], pressureLevel: 50 });
    const [simResult, setSimResult] = useState<SimulationResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Run Simulation
    const handleSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            const result = simulateDecision(simContext);
            setSimResult(result);
            setIsSimulating(false);
        }, 1500);
    };

    if (!activeProfile) return null;

    // --- RENDER ---
    return (
        <div className="h-full w-full relative overflow-hidden flex flex-col">
            {/* Header - Fixed Top Center */}
            <div className="absolute top-4 left-0 w-full text-center z-10 pointer-events-none">
                <span className="text-[10px] uppercase tracking-[0.3em] text-rose-600/60 dark:text-rose-300/40 block mb-1 font-bold">Nexus Cognitive System</span>
                <h1 className="text-2xl font-serif text-slate-900 dark:text-white tracking-tight drop-shadow-sm opacity-90 mb-1">
                    Avatar Intelligence
                </h1>
                <p className="text-xs text-slate-600 dark:text-rose-100/60 font-light tracking-wide max-w-lg mx-auto leading-relaxed opacity-80">
                    Laboratorio de calibración cognitiva.
                </p>
            </div>

            {/* MAIN CONTENT GRID - Fixed height, no page scroll */}
            <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col lg:flex-row items-center justify-between px-8 pt-24 pb-8 z-10 gap-12 lg:gap-0">

                {/* --- LEFT COLUMN: CONTROLS & MATRIX --- */}
                <div className="w-full lg:w-[320px] h-full flex flex-col gap-6 animate-in slide-in-from-left-8 duration-700 order-2 lg:order-1 relative z-20">
                    {/* Profile Selector (Moved to Left Column) */}
                    <div className="flex flex-col gap-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-rose-200/40 uppercase tracking-[0.2em]">Perfil Activo</span>
                            <button onClick={() => setActiveModal('profiles')} className="text-xs text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1">
                                <Icon svg={ICONS.settings} className="w-3 h-3" /> Config
                            </button>
                        </div>
                        <div className="flex bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-xl p-1 border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
                            {config.profiles.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => switchProfile(p.id)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap flex-1
                                        ${config.activeProfileId === p.id
                                            ? 'bg-rose-500 text-white shadow-md'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-rose-500/10 pb-2 mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-rose-200/40 uppercase tracking-[0.2em]">Principios Activos</span>
                            <span className="text-[10px] text-slate-400 dark:text-rose-200/30">{activeProfile.activePrinciples.length} ACTIVOS</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {[
                                { id: 'p1', title: 'Técnica > Narrativa', weight: 'primary' },
                                { id: 'p2', title: 'Minimalismo Radical', weight: 'secondary' },
                                { id: 'p3', title: 'Eficacia de Coste', weight: 'tertiary' },
                                { id: 'p4', title: 'Impacto Visual', weight: 'secondary' },
                                { id: 'p5', title: 'Sostenibilidad', weight: 'tertiary' }
                            ].map((p) => {
                                const isActive = activeProfile.activePrinciples.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => togglePrinciple(p.id)}
                                        className={`
                                            group w-full text-left px-4 py-3 rounded-lg border transition-all duration-300 relative overflow-hidden
                                            ${isActive
                                                ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30 text-rose-700 dark:text-rose-100 shadow-sm'
                                                : 'bg-transparent border-transparent text-slate-400 dark:text-rose-200/20 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-rose-200/60'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-center relative z-10">
                                            <span className="text-xs uppercase tracking-widest font-medium">{p.title}</span>
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_10px_currentColor]" />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-8">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-rose-200/40 uppercase tracking-[0.2em] block mb-2">Tolerancia al Riesgo</span>
                            <div className="px-4 py-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-700 dark:text-rose-100 font-medium">{activeProfile.riskTolerance}</span>
                                    <div className={`w-2 h-2 rounded-full ${activeProfile.riskTolerance === 'Audaz' ? 'bg-amber-500' :
                                        activeProfile.riskTolerance === 'Experimental' ? 'bg-red-500' : 'bg-emerald-500'
                                        }`} />
                                </div>
                                <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full opacity-60 rounded-full ${activeProfile.riskTolerance === 'Audaz' ? 'w-3/4 bg-amber-500' :
                                        activeProfile.riskTolerance === 'Experimental' ? 'w-full bg-red-500' : 'w-1/4 bg-emerald-500'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CENTER COLUMN: COGNITIVE CORE (Layer 1) --- */}
                <div className="relative w-full lg:flex-1 h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-1000 order-1 lg:order-2 z-10">
                    <div className="relative w-72 h-72 group cursor-pointer mt-[-40px]" onClick={() => setActiveModal('calibration')}>
                        {/* Orbitals */}
                        <div className="absolute inset-0 rounded-full border border-rose-400/20 dark:border-rose-500/10 scale-[1.4] animate-[spin_40s_linear_infinite]" />
                        <div className="absolute inset-0 rounded-full border border-rose-400/30 dark:border-rose-500/20 scale-125 animate-[spin_20s_linear_infinite]" />
                        <div className="absolute inset-0 rounded-full border border-rose-400/10 dark:border-rose-200/5 border-t-rose-500/30 dark:border-t-rose-300/20 scale-110 animate-[spin_30s_linear_infinite_reverse]" />

                        {/* Core Nucleus */}
                        <div className="absolute inset-0 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-rose-200 dark:border-rose-500/30 shadow-2xl dark:shadow-[0_0_80px_rgba(225,29,72,0.15)] flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105">
                            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-rose-500/5 to-transparent animate-pulse" />

                            <span className="text-[10px] text-slate-500 dark:text-rose-300/50 uppercase tracking-widest mb-1 font-bold z-10">Tono Cognitivo</span>
                            <h2 className="text-2xl font-serif text-slate-900 dark:text-white drop-shadow-md mb-2 z-10">{activeProfile.tone}</h2>

                            <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 z-10 max-w-[180px] overflow-hidden">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse shrink-0" />
                                <span className="text-[10px] text-rose-700 dark:text-rose-200 uppercase tracking-widest font-bold truncate">
                                    {activeProfile.researchAxis.join(' + ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Traceability Metrics */}
                    <div className="mt-16 grid grid-cols-2 gap-8 text-center opacity-90 dark:opacity-80">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-rose-200/40 block mb-1 font-bold">Precisión</span>
                            <span className="text-lg font-mono text-slate-700 dark:text-rose-100">94.2%</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-rose-200/40 block mb-1 font-bold">Creatividad</span>
                            <span className="text-lg font-mono text-slate-700 dark:text-rose-100">88.5%</span>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: INTERACTIVE SIMULATION (Layer 3 - Floating Window) --- */}
                <div className="w-full lg:w-[360px] h-full flex flex-col justify-center animate-in slide-in-from-right-8 duration-700 order-3 lg:order-3 z-30 py-4">
                    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-6 w-full max-h-full flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-black/5">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-rose-200/40 uppercase tracking-[0.2em]">Simulador de Decisión</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                        </div>

                        {/* Context Inputs */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2 font-bold">Contexto</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Service', 'Competition', 'R&D', 'Crisis'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setSimContext(prev => ({ ...prev, contextType: c as any }))}
                                            className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all ${simContext.contextType === c ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-500 hover:text-rose-600 dark:hover:text-white'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2 font-bold">Presión: {simContext.pressureLevel}%</label>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={simContext.pressureLevel}
                                    onChange={(e) => setSimContext({ ...simContext, pressureLevel: parseInt(e.target.value) })}
                                    className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={handleSimulation}
                                disabled={isSimulating}
                                className="w-full py-3 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-rose-100 transition-all flex items-center justify-center gap-2 hover:border-rose-200"
                            >
                                {isSimulating ? 'Procesando...' : 'Ejecutar Simulación'}
                                {!isSimulating && <Icon svg={ICONS.play} className="w-3 h-3" />}
                            </button>
                        </div>

                        {/* Results Output - TERMINAL (Forced Dark Mode) */}
                        <div className="flex-1 bg-slate-950 rounded-xl p-4 font-mono text-[10px] text-rose-200/80 overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner">
                            {isSimulating ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50">
                                    <div className="w-8 h-8 border-2 border-t-rose-500 border-r-transparent border-b-rose-500 border-l-transparent rounded-full animate-spin" />
                                    <span className="text-slate-400">Analizando variables...</span>
                                </div>
                            ) : simResult ? (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div>
                                        <span className="text-emerald-400 block mb-1">&gt; DECISIÓN</span>
                                        <p className="text-white text-xs font-sans leading-relaxed">{simResult.decision}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block mb-1">&gt; RIESGO EVALUADO</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${simResult.riskAssessment === 'Alto' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                            {simResult.riskAssessment}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block mb-1">&gt; RAZONAMIENTO</span>
                                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                                            {simResult.reasoning.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 italic">
                                    Esperando parámetros de simulación...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL: CALIBRATION */}
            {activeModal === 'calibration' && (
                <CognitiveConfigModal title="Calibración Cognitiva" onClose={() => setActiveModal(null)}>
                    <div className="space-y-8">
                        {/* Tone Section */}
                        <div>
                            <label className="text-xs text-slate-500 dark:text-rose-200/60 uppercase tracking-widest block mb-3 font-bold">Tono Base</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Técnico', 'Creativo', 'Vanguardista', 'Eficiente', 'Michelin-grade', 'Exclusivo'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => updateActiveProfile({ tone: t as Tone })}
                                        className={`py-3 rounded-lg border text-xs font-bold uppercase transition-all
                                            ${activeProfile.tone === t
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-100'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-transparent text-slate-500 hover:border-rose-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
                                            }
                                         `}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Axis Section */}
                        <div>
                            <label className="text-xs text-slate-500 dark:text-rose-200/60 uppercase tracking-widest block mb-3 font-bold">Eje de Investigación</label>
                            <div className="flex flex-wrap gap-2">
                                {['Precisión', 'Creatividad', 'Competición', 'Coste', 'Alta cocina', 'Sostenibilidad'].map(axis => (
                                    <button
                                        key={axis}
                                        onClick={() => toggleResearchAxis(axis as ResearchAxis)}
                                        className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all
                                            ${activeProfile.researchAxis.includes(axis as ResearchAxis)
                                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-200'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        {axis}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Risk Section */}
                        <div>
                            <label className="text-xs text-slate-500 dark:text-rose-200/60 uppercase tracking-widest block mb-3 font-bold">Tolerancia al Riesgo</label>
                            <div className="w-full bg-slate-100 dark:bg-white/5 p-1 rounded-lg flex">
                                {['Conservador', 'Moderado', 'Audaz', 'Experimental'].map(risk => (
                                    <button
                                        key={risk}
                                        onClick={() => updateActiveProfile({ riskTolerance: risk as RiskLevel })}
                                        className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all
                                            ${activeProfile.riskTolerance === risk
                                                ? 'bg-white dark:bg-rose-500 text-slate-900 dark:text-white shadow-sm dark:shadow-lg'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        {risk}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Principles Section */}
                        <div>
                            <label className="text-xs text-slate-500 dark:text-rose-200/60 uppercase tracking-widest block mb-3 font-bold">Principios Activos</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'p1', title: 'Técnica > Narrativa' },
                                    { id: 'p2', title: 'Minimalismo Radical' },
                                    { id: 'p3', title: 'Eficacia de Coste' },
                                    { id: 'p4', title: 'Impacto Visual' },
                                    { id: 'p5', title: 'Sostenibilidad' }
                                ].map(p => {
                                    const isActive = activeProfile.activePrinciples.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => togglePrinciple(p.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                                                ${isActive ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-white/10'}
                                            `}
                                        >
                                            <span className={`text-sm ${isActive ? 'text-rose-600 dark:text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>{p.title}</span>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </CognitiveConfigModal>
            )}

            {/* MODAL: PROFILE MANAGER */}
            {activeModal === 'profiles' && (
                <CognitiveConfigModal title="Gestor de Perfiles" onClose={() => setActiveModal(null)}>
                    <div className="space-y-4">
                        {config.profiles.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none">
                                <div>
                                    <h4 className="text-slate-900 dark:text-white font-serif">{p.name}</h4>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-black/20 px-2 py-0.5 rounded">{p.tone}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-black/20 px-2 py-0.5 rounded truncate max-w-[120px]">{p.researchAxis.join(', ')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {config.activeProfileId === p.id && (
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">Activo</span>
                                    )}
                                    <button
                                        onClick={() => switchProfile(p.id)}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-rose-600 dark:hover:text-white"
                                    >
                                        <Icon svg={ICONS.play} className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => createProfile(`Nuevo Perfil ${config.profiles.length + 1}`)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-white hover:border-rose-400/40 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Icon svg={ICONS.plus} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-bold uppercase tracking-widest text-xs">Crear Nuevo Perfil</span>
                        </button>
                    </div>
                </CognitiveConfigModal>
            )}


        </div>
    );
};

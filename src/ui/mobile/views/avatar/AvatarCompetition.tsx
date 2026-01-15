import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChampionProvider } from '../../../../features/champion-mode/context/ChampionContext';
import { useChampionCreativeEngine } from '../../../../features/champion-mode/hooks/useChampionCreativeEngine';

// New mobile-native sub-views
import { MobileChampionBriefing } from './support/MobileChampionBriefing';
import { MobileChampionCreative } from './support/MobileChampionCreative';
import { MobileChampionValidation } from './support/MobileChampionValidation';
import { MobileChampionPlan } from './support/MobileChampionPlan';
import { useChampionContext } from '../../../../features/champion-mode/context/ChampionContext';
import GlassCard from '../../components/GlassCard';

const CompetitionContent: React.FC = () => {
    const { state, actions } = useChampionContext();
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    const phases = [
        { id: 1, label: 'BRIEFING' },
        { id: 2, label: 'MOTOR' },
        { id: 3, label: 'VALIDACIÓN' },
        { id: 4, label: 'PLAN' },
    ];

    const renderActiveView = () => {
        switch (activeStepIndex) {
            case 0: return <MobileChampionBriefing />;
            case 1: return <MobileChampionCreative />;
            case 2: return <MobileChampionValidation />;
            case 3: return <MobileChampionPlan />;
            default: return <MobileChampionBriefing />;
        }
    };

    if (state.viewMode === 'PRESENTATION' && state.proposal) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] bg-emerald-950 flex flex-col pt-12"
            >
                <div className="absolute top-6 right-6">
                    <button
                        onClick={() => actions.setViewMode('DESIGN')}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-8">
                    <div className="space-y-2 text-center">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Signature</span>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{state.proposal.title}</h2>
                    </div>

                    <div className="relative group mx-auto w-full max-w-[320px]">
                        <img
                            src={state.proposal.imageUrl}
                            alt={state.proposal.title}
                            className="w-full aspect-[4/5] object-cover rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10"
                        />
                        <div className="absolute -bottom-4 -right-4 bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-950">
                            <span className="material-symbols-outlined">workspace_premium</span>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">El Ritual</h3>
                            <GlassCard rounded="3xl" padding="lg" className="bg-white/5 border-white/10 italic text-sm text-white/90 leading-relaxed font-medium text-center">
                                "{state.proposal.ritual}"
                            </GlassCard>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">Storytelling</h3>
                            <p className="text-xs text-white/70 leading-relaxed text-center px-4">
                                {state.proposal.shortIntro || state.proposal.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-t from-emerald-950 to-transparent">
                    <button
                        onClick={() => actions.setViewMode('DESIGN')}
                        className="w-full py-5 bg-white text-emerald-950 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl"
                    >
                        Salir de Escena
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Phase Tracker */}
            <div className="px-2">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-[18px] left-8 right-8 h-0.5 bg-emerald-950/10 z-0"></div>
                    {phases.map((phase, idx) => {
                        const isActive = activeStepIndex === idx;
                        const isCompleted = activeStepIndex > idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveStepIndex(idx)}
                                className="relative z-10 flex flex-col items-center gap-3 transition-all active:scale-95"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${isActive
                                    ? 'bg-emerald-950 border-emerald-400 text-white shadow-xl shadow-emerald-900/40 scale-110'
                                    : isCompleted
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'bg-white/40 border-emerald-900/10 text-emerald-900/20 backdrop-blur-sm'
                                    }`}>
                                    {isCompleted ? (
                                        <span className="material-symbols-outlined !text-[16px]">check</span>
                                    ) : (
                                        phase.id
                                    )}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-emerald-950' : 'text-emerald-900/20'
                                    }`}>
                                    {phase.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Sub-view */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStepIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {renderActiveView()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Premium Status Toast */}
            <AnimatePresence>
                {state.statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-32 left-8 right-8 z-[150]"
                    >
                        <div className="bg-emerald-950/90 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">auto_awesome</span>
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{state.statusMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AvatarCompetition: React.FC = () => {
    const engine = useChampionCreativeEngine();
    return (
        <ChampionProvider engine={engine}>
            <CompetitionContent />
        </ChampionProvider>
    );
};

export default AvatarCompetition;

import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarCognition, AvatarType } from '../../../hooks/useAvatarCognition';
import { useApp } from '../../../context/AppContext';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
    initialTab?: 'Core' | 'Intelligence' | 'Competition';
    notify?: (msg: string, type?: 'success' | 'error' | 'loading') => void;
}

const Avatar: React.FC<Props> = ({ onNavigate, initialTab = 'Core', notify }) => {
    const { userPlan } = useApp();
    const { activeAvatarType, avatarConfigs, setActiveAvatarType } = useAvatarCognition();
    const [activeTab, setActiveTab] = useState<'Core' | 'Intelligence' | 'Competition'>(initialTab);

    const AVATARS: AvatarType[] = ['Mixologist', 'Chef', 'Patissier'];

    // Tab labels in Spanish
    const TAB_LABELS = {
        Core: 'Núcleo',
        Intelligence: 'Inteligencia',
        Competition: 'Competición'
    };

    // Determine unlocked avatars based on plan
    const unlockedSlots = userPlan === 'FREE' ? 1 : userPlan === 'PRO' ? 2 : userPlan === 'EXPERT' ? 4 : 99;

    // Get theme colors based on tab
    const tabTheme = {
        Core: { bg: 'from-violet-900/40', accent: '#7C3AED', text: 'text-violet-300' },
        Intelligence: { bg: 'from-red-900/40', accent: '#DC2626', text: 'text-red-300' },
        Competition: { bg: 'from-emerald-900/40', accent: '#10B981', text: 'text-emerald-300' },
    }[activeTab];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <header className="px-5 pt-6 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex-1"></div>
                    <button
                        onClick={() => onNavigate(PageName.Dashboard)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Title */}
                <div className="mb-6 px-2">
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.25em] mb-2">Sistema Cognitivo Nexus</p>
                    <h1 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-2">Núcleo Avatar</h1>
                    <p className="text-xs text-white/70 max-w-xs leading-relaxed">
                        Tu identidad digital evoluciona con tu consciencia operativa.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {(['Core', 'Intelligence', 'Competition'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-white text-zinc-900 shadow-md'
                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/20'
                                }`}
                            style={activeTab === tab ? { color: tabTheme.accent } : {}}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-32 relative z-10">
                <AnimatePresence mode="wait">

                    {/* CORE TAB */}
                    {activeTab === 'Core' && (
                        <motion.div
                            key="Core"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {AVATARS.map((type, index) => {
                                const config = avatarConfigs[type];
                                const isActive = activeAvatarType === type;
                                const isLocked = index >= unlockedSlots;

                                return (
                                    <GlassCard
                                        key={type}
                                        rounded="3xl"
                                        padding="lg"
                                        className={`relative transition-all cursor-pointer ${isActive ? 'shadow-xl' : ''
                                            }`}
                                        onClick={() => !isLocked && setActiveAvatarType(type)}
                                        style={isActive ? {
                                            boxShadow: `0 8px 30px ${tabTheme.accent}30, 0 0 0 2px ${tabTheme.accent}20`
                                        } : {}}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all ${isLocked
                                                        ? 'bg-zinc-700 text-zinc-500'
                                                        : isActive
                                                            ? 'text-white shadow-lg'
                                                            : 'bg-zinc-100 text-zinc-700'
                                                        }`}
                                                    style={isActive ? { backgroundColor: tabTheme.accent } : {}}
                                                >
                                                    {isLocked ? '🔒' : config.emoji}
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-bold ${isActive ? 'text-zinc-900' : 'text-zinc-700'}`}>
                                                        {config.name || type}
                                                    </h3>
                                                    {isActive && (
                                                        <span className="text-xs font-medium" style={{ color: tabTheme.accent }}>
                                                            Profesional Activo
                                                        </span>
                                                    )}
                                                    {isLocked && (
                                                        <span className="text-xs font-medium text-zinc-500">
                                                            Upgrade to unlock
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: `${tabTheme.accent}40`, color: tabTheme.accent }}>
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        {!isLocked && isActive && (
                                            <div className="mt-5 pt-5 border-t border-zinc-200">
                                                <PremiumButton
                                                    variant="secondary"
                                                    size="sm"
                                                    fullWidth
                                                    customColor={tabTheme.accent}
                                                >
                                                    Configurar Avatar
                                                </PremiumButton>
                                            </div>
                                        )}
                                    </GlassCard>
                                );
                            })}

                            {/* Estados de Consciencia */}
                            <GlassCard rounded="3xl" padding="lg" className="bg-gradient-to-r from-violet-50 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900 mb-1">Estados de Consciencia</h3>
                                        <p className="text-xs text-zinc-600">Evolución del sistema cognitivo</p>
                                    </div>
                                    <PremiumButton
                                        variant="secondary"
                                        size="sm"
                                        customColor={tabTheme.accent}
                                    >
                                        Ver Mapa
                                    </PremiumButton>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* INTELLIGENCE TAB */}
                    {activeTab === 'Intelligence' && (
                        <motion.div
                            key="Intelligence"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-red-50 to-transparent">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-red-600 flex items-center justify-center text-white text-4xl shadow-xl action-glow-red">
                                        {avatarConfigs[activeAvatarType].emoji}
                                    </div>
                                    <div className="flex-1">
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[8px] font-black uppercase tracking-wider">
                                            Perfil Activo
                                        </span>
                                        <h2 className="text-2xl font-bold text-zinc-900 mt-2">{avatarConfigs[activeAvatarType].name}</h2>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Tono</p>
                                        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                            {avatarConfigs[activeAvatarType].tone}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Eje de Investigación</p>
                                        <div className="flex flex-wrap gap-2">
                                            {avatarConfigs[activeAvatarType].researchAxis.map(axis => (
                                                <span key={axis} className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold">
                                                    {axis}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Active Principles */}
                            <div>
                                <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Principios Activos</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {avatarConfigs[activeAvatarType].activePrinciples.map(principle => (
                                        <GlassCard key={principle} rounded="2xl" padding="md">
                                            <p className="text-xs font-bold text-zinc-900">{principle}</p>
                                        </GlassCard>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* COMPETITION TAB */}
                    {activeTab === 'Competition' && (
                        <motion.div
                            key="Competition"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-emerald-50 to-transparent">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl action-glow-emerald">
                                        <span className="material-symbols-outlined text-3xl fill-1">emoji_events</span>
                                    </div>
                                    <div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-wider">
                                            Modo Campeón
                                        </span>
                                        <h2 className="text-xl font-bold text-zinc-900 mt-2">Arena de Competición</h2>
                                    </div>
                                </div>

                                <p className="text-sm text-zinc-600 mb-6">
                                    Participa en desafíos creativos y recibe retroalimentación de un jurado especializado.
                                </p>

                                <PremiumButton
                                    module="avatarCompetition"
                                    variant="gradient"
                                    size="lg"
                                    fullWidth
                                    icon={<span className="material-symbols-outlined !text-base">arrow_forward</span>}
                                    iconPosition="right"
                                >
                                    Entrar al Modo Campeón
                                </PremiumButton>
                            </GlassCard>

                            {/* Championship History (mock) */}
                            <div>
                                <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Desafíos Recientes</h3>
                                <GlassCard rounded="2xl" padding="lg">
                                    <div className="text-center py-6">
                                        <span className="material-symbols-outlined text-5xl text-emerald-500 mb-3 block">workspace_premium</span>
                                        <h4 className="text-sm font-bold text-zinc-900 mb-2">Aún no hay desafíos</h4>
                                        <p className="text-xs text-zinc-500">Entra al Modo Campeón para empezar a competir</p>
                                    </div>
                                </GlassCard>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default Avatar;

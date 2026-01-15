import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarCognition } from '../../../hooks/useAvatarCognition';
import { useApp } from '../../../context/AppContext';

// New Modular Sub-components
import AvatarCore from './avatar/AvatarCore';
import AvatarIntelligence from './avatar/AvatarIntelligence';
import AvatarCompetition from './avatar/AvatarCompetition';

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

    // Sync state with prop for standalone routing
    React.useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Determine unlocked avatars based on plan
    const unlockedSlots = userPlan === 'FREE' ? 1 : userPlan === 'PRO' ? 2 : userPlan === 'EXPERT' ? 4 : 99;

    // Theme configuration based on active tab
    const THEMES = {
        Core: { accent: '#7C3AED', label: 'Núcleo Avatar', description: 'Tu identidad digital no es estática. Es una entidad cognitiva viva.' },
        Intelligence: { accent: '#DC2626', label: 'Inteligencia', description: 'Análisis profundo de patrones cognitivos y redes neuronales.' },
        Competition: { accent: '#10B981', label: 'Competición', description: 'Mide tu desempeño contra los mejores del ecosistema.' }
    };

    const currentTheme = THEMES[activeTab];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">
            {/* Minimal Header */}
            <header className="px-5 pt-8 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${activeTab === 'Core' ? 'text-white/40' : 'text-black/30'
                            }`}>Nexus Cognitive System</p>
                        <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none ${activeTab === 'Core' ? 'text-white' : 'text-zinc-950'
                            }`}>
                            {currentTheme.label}
                        </h1>
                    </div>
                    <button
                        onClick={() => onNavigate(PageName.Dashboard)}
                        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${activeTab === 'Core'
                            ? 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                            : 'bg-black/5 border-black/10 text-black/40 hover:text-black'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <p className={`text-[10px] max-w-[240px] leading-relaxed mb-6 font-medium ${activeTab === 'Core' ? 'text-white/50' : 'text-black/50'
                    }`}>
                    {currentTheme.description}
                </p>

                {/* Internal Tabs (Sync with Global Navigation) */}
                <div className="flex gap-2">
                    {(['Core', 'Intelligence', 'Competition'] as const).map(tab => {
                        const targetPage = tab === 'Core' ? PageName.AvatarCore
                            : tab === 'Intelligence' ? PageName.AvatarIntelligence
                                : PageName.AvatarCompetition;
                        return (
                            <button
                                key={tab}
                                onClick={() => onNavigate(targetPage)}
                                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-zinc-900 shadow-xl'
                                    : 'bg-white/5 text-white/40 border border-white/5'
                                    }`}
                            >
                                {tab === 'Core' ? 'Núcleo' : tab === 'Intelligence' ? 'Inteligencia' : 'Competición'}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 pb-40 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {activeTab === 'Core' && (
                            <AvatarCore
                                activeAvatarType={activeAvatarType}
                                avatarConfigs={avatarConfigs}
                                setActiveAvatarType={setActiveAvatarType}
                                updateConfig={useAvatarCognition().updateConfig}
                                createNewAvatar={useAvatarCognition().createNewAvatar}
                                unlockedSlots={unlockedSlots}
                                accentColor={currentTheme.accent}
                            />
                        )}

                        {activeTab === 'Intelligence' && (
                            <AvatarIntelligence
                                config={avatarConfigs[activeAvatarType]}
                                accentColor={currentTheme.accent}
                            />
                        )}

                        {activeTab === 'Competition' && (
                            <AvatarCompetition />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Glow Atmosphere */}
            <div
                className="fixed bottom-0 left-0 right-0 h-40 pointer-events-none z-0 transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% 100%, ${currentTheme.accent}20 0%, transparent 70%)`
                }}
            />
        </div>
    );
};

export default Avatar;

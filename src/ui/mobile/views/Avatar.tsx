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
    const { activeAvatarType, avatarConfigs, setActiveAvatarType, updateConfig, createNewAvatar } = useAvatarCognition();
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

    // Mobile Gradient Logic (Matched to Desktop for Total Identity)
    const getGradientStyle = () => {
        switch (activeTab) {
            case 'Core': return { background: 'linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.8) 30%, rgba(0,0,0,0) 50%)' }; // Slightly extended for mobile verticality
            case 'Intelligence': return { background: 'linear-gradient(180deg, #e11d48 0%, rgba(225, 29, 72, 0.8) 20%, rgba(225, 29, 72, 0) 40%)' };
            case 'Competition': return { background: 'linear-gradient(180deg, #84CC16 0%, rgba(132, 204, 22, 0.8) 20%, rgba(0,0,0,0) 40%)' };
            default: return { background: 'none' };
        }
    };

    return (
        <div
            className="relative overflow-hidden flex flex-col h-full transition-all duration-700"
            style={getGradientStyle()}
        >
            <main className="flex-1 overflow-y-auto custom-scroll pb-24 relative z-10 pt-2">
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
                                updateConfig={updateConfig}
                                createNewAvatar={createNewAvatar}
                                unlockedSlots={unlockedSlots}
                                accentColor={THEMES.Core.accent}
                            />
                        )}

                        {activeTab === 'Intelligence' && avatarConfigs[activeAvatarType] ? (
                            <AvatarIntelligence
                                config={avatarConfigs[activeAvatarType]}
                                accentColor={THEMES.Intelligence.accent}
                            />
                        ) : activeTab === 'Intelligence' ? (
                            <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10 mt-20">
                                <p className="text-xs text-zinc-500">Selecciona un Avatar en el Núcleo para ver su Inteligencia.</p>
                            </div>
                        ) : null}

                        {activeTab === 'Competition' && (
                            <AvatarCompetition />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Avatar;

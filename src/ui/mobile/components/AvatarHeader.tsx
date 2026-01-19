import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageName, PAGE_THEMES } from '../types';
import { CLASS_NAMES, TRANSITIONS } from '../../../theme/motion';
import { motion } from 'framer-motion';

interface AvatarHeaderProps {
    currentPage: PageName;
}

export const AvatarHeader: React.FC<AvatarHeaderProps> = ({
    currentPage
}) => {
    const navigate = useNavigate();

    const pageTitles: Record<string, string> = {
        [PageName.AvatarCore]: 'CORE',
        [PageName.AvatarIntelligence]: 'INTELLIGENCE',
        [PageName.AvatarCompetition]: 'COMPETITION'
    };

    const activeTitle = pageTitles[currentPage] || 'CORE';

    const sections = [
        { id: PageName.AvatarCore, label: 'CORE', icon: 'person', route: '/avatar/core' },
        { id: PageName.AvatarIntelligence, label: 'INTELLIGENCE', icon: 'psychology', route: '/avatar/intelligence' },
        { id: PageName.AvatarCompetition, label: 'COMPETITION', icon: 'emoji_events', route: '/avatar/competition' }
    ];

    const handleNavigate = (route: string) => {
        navigate(route);
    };

    return (
        <header className="pt-4 pb-4 px-5 z-10 relative">
            {/* Title Section */}
            <div className="mb-6 px-2">
                <h1 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9] mb-2 drop-shadow-xl"
                    style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    Avatar
                </h1>
                <p className="text-lg font-bold text-white/90 tracking-wide drop-shadow-md">
                    {activeTitle}
                </p>
            </div>

            {/* Sub-Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 px-1">
                {sections.map(section => {
                    const isActive = currentPage === section.id;
                    const sectionTheme = PAGE_THEMES[section.id] || PAGE_THEMES['default'];
                    const sectionColor = sectionTheme.accent;

                    return (
                        <button
                            key={section.id}
                            onClick={() => handleNavigate(section.route)}
                            className={`
                                px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest 
                                whitespace-nowrap transition-all relative flex items-center gap-2
                                ${CLASS_NAMES.pressEffect}
                                ${isActive ? 'text-zinc-800 scale-105' : 'bg-zinc-200/50 backdrop-blur-md border border-zinc-300/30 text-zinc-500 hover:bg-zinc-200'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeAvatarPill"
                                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                                    transition={TRANSITIONS.spring}
                                    initial={false}
                                />
                            )}
                            <span className={`material-symbols-outlined !text-sm relative z-10 ${isActive ? 'fill-1' : ''}`}
                                style={{ color: isActive ? sectionColor : 'inherit' }}>
                                {section.icon}
                            </span>
                            <span className="relative z-10">{section.label}</span>
                        </button>
                    );
                })}
            </div>
        </header>
    );
};

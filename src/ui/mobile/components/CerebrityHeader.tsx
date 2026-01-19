import React from 'react';
import { PageName, PAGE_THEMES } from '../types';
import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { CLASS_NAMES, TRANSITIONS } from '../../../theme/motion';
import { motion } from 'framer-motion';

interface CerebrityHeaderProps {
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
}

export const CerebrityHeader: React.FC<CerebrityHeaderProps> = ({
    currentPage,
    onNavigate
}) => {
    const pageTitles: Record<string, string> = {
        [PageName.CerebritySynthesis]: 'SYNTHESIS',
        [PageName.CerebrityMakeMenu]: 'MAKE MENU',
        [PageName.CerebrityCritic]: 'THE CRITIC',
        [PageName.CerebrityLab]: 'THE LAB',
        [PageName.CerebrityTrend]: 'TRENDS'
    };

    const activeTitle = pageTitles[currentPage] || 'ARTIFICIAL INTELLIGENCE';

    const sections = [
        { id: PageName.CerebritySynthesis, label: 'SYNTESIS', icon: 'auto_awesome' },
        { id: PageName.CerebrityMakeMenu, label: 'MAKE MENU', icon: 'edit_note' },
        { id: PageName.CerebrityCritic, label: 'CRITIC', icon: 'rate_review' },
        { id: PageName.CerebrityLab, label: 'THE LAB', icon: 'science' },
        { id: PageName.CerebrityTrend, label: 'TRENDS', icon: 'trending_up' }
    ];

    return (
        <header className="pt-4 pb-4 px-5 z-10 relative">
            {/* Title Section */}
            <div className="mb-6 px-2">
                <h1 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9] mb-2 drop-shadow-xl"
                    style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    Cerebrity
                </h1>
                <p className="text-lg font-bold text-white/90 tracking-wide drop-shadow-md">
                    {activeTitle}
                </p>
            </div>

            {/* Sub-Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {sections.map(section => {
                    const isActive = currentPage === section.id;
                    const sectionTheme = PAGE_THEMES[section.id] || PAGE_THEMES['default'];
                    const sectionColor = sectionTheme.accent;

                    return (
                        <button
                            key={section.id}
                            onClick={() => onNavigate(section.id)}
                            className={`
                                px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest 
                                whitespace-nowrap transition-all relative flex items-center gap-2
                                ${CLASS_NAMES.pressEffect}
                                ${isActive ? 'text-zinc-800 scale-105' : 'bg-zinc-200/50 backdrop-blur-md border border-zinc-300/30 text-zinc-500 hover:bg-zinc-200'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeCerebrityPill"
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

import React from 'react';
import { PageName, PAGE_THEMES } from '../types';

interface CerebrityHeaderProps {
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
}

export const CerebrityHeader: React.FC<CerebrityHeaderProps> = ({
    currentPage,
    onNavigate
}) => {
    const sections = [
        { id: PageName.CerebrityMakeMenu, label: 'MAKE MENU', icon: 'edit_note' },
        { id: PageName.CerebrityCritic, label: 'CRITIC', icon: 'rate_review' },
        { id: PageName.CerebrityLab, label: 'THE LAB', icon: 'science' },
        { id: PageName.CerebrityTrend, label: 'TRENDS', icon: 'trending_up' }
    ];

    const activeTheme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];
    const activeColor = activeTheme.accent;

    return (
        <header className="pt-6 pb-4 px-5 z-10 relative">
            {/* Title Section */}
            <div className="mb-6 px-2">
                <h1 className="text-6xl font-black text-zinc-900 italic tracking-tighter leading-[0.9] mb-1"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    Cerebrity
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                        Artificial Intelligence
                    </span>
                    <div className="h-px flex-1 bg-zinc-200"></div>
                </div>
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
                                px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest 
                                whitespace-nowrap transition-all relative flex items-center gap-2
                                ${isActive
                                    ? 'bg-white text-zinc-800 shadow-lg scale-105'
                                    : 'bg-zinc-200/50 backdrop-blur-md border border-zinc-300/30 text-zinc-500 hover:bg-zinc-200'
                                }
                            `}
                        >
                            <span className={`material-symbols-outlined !text-sm ${isActive ? 'fill-1' : ''}`}
                                style={{ color: isActive ? sectionColor : 'inherit' }}>
                                {section.icon}
                            </span>
                            {section.label}
                            {isActive && (
                                <div
                                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                                    style={{ backgroundColor: sectionColor }}
                                ></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </header>
    );
};

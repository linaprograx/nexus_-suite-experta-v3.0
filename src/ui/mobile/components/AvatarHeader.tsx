import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLASS_NAMES, TRANSITIONS } from '../../../theme/motion';
import { motion } from 'framer-motion';

interface AvatarHeaderProps {
    currentPage: string; // Using string to allow flexible page names or PageName enum
}

/**
 * AvatarHeader
 * Shared header for Avatar sections (Core, Intelligence, Competition)
 * Aligned with Grimorio Style: Fixed, Large Serif Title, Pill Nav
 */
export const AvatarHeader: React.FC<AvatarHeaderProps> = ({
    currentPage,
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping active section based on current page/path
    // This allows us to highlight the correct pill
    const activeSection = React.useMemo(() => {
        if (location.pathname.includes('/avatar/intelligence')) return 'intelligence';
        if (location.pathname.includes('/avatar/competition')) return 'competition';
        return 'core';
    }, [location.pathname]);

    const sections = [
        { id: 'core', label: 'NÚCLEO', route: '/avatar/core', color: 'indigo' },
        { id: 'intelligence', label: 'INTELIGENCIA', route: '/avatar/intelligence', color: 'rose' },
        { id: 'competition', label: 'COMPETICIÓN', route: '/avatar/competition', color: 'emerald' }
    ];

    const handleSectionClick = (route: string) => {
        navigate(route);
    };

    // Determine current page title based on active section
    const pageTitle = React.useMemo(() => {
        switch (activeSection) {
            case 'intelligence': return 'Cognición Activa';
            case 'competition': return 'Global Rank';
            default: return 'Identidad Digital';
        }
    }, [activeSection]);


    return (
        <header className="pt-4 pb-2 px-6 z-20 relative shrink-0">
            {/* Title Section */}
            <div className="mb-6">
                <h1 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9] mb-2 drop-shadow-xl opacity-90"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    Avatar
                </h1>
                <p className="text-lg font-bold text-white/80 tracking-wide drop-shadow-md flex items-center gap-2">
                    {pageTitle}
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {sections.map(section => {
                    const isActive = activeSection === section.id;

                    // Colors
                    const activeBg = section.color === 'indigo' ? 'bg-indigo-500' :
                        section.color === 'rose' ? 'bg-rose-500' :
                            'bg-emerald-500';

                    const activeText = section.color === 'indigo' ? 'text-indigo-500' :
                        section.color === 'rose' ? 'text-rose-500' :
                            'text-emerald-500';

                    return (
                        <button
                            key={section.id}
                            onClick={() => handleSectionClick(section.route)}
                            className={`
                                px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest 
                                whitespace-nowrap transition-all relative
                                ${CLASS_NAMES.pressEffect}
                                ${isActive ? 'text-white scale-105 shadow-lg' : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:bg-white/20'}
                                ${isActive ? activeBg : ''}
                            `}
                        >
                            {/* No internal motion bg needed if we color the button itself, 
                                 but Grimorio uses white pill + colored text. 
                                 Let's stick to Grimorio EXACTLY: Active = White BG + Colored Text.
                             */}
                            {isActive ? (
                                <span className={`relative z-10 ${activeText} transition-colors`}>{section.label}</span>
                            ) : (
                                <span className="relative z-10">{section.label}</span>
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="activeAvatarPill"
                                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                                    transition={TRANSITIONS.spring}
                                    initial={false}
                                    style={{ zIndex: 0 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </header>
    );
};

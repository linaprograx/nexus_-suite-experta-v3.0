import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CLASS_NAMES, TRANSITIONS } from '../../../theme/motion';
import { motion } from 'framer-motion';

interface GrimorioHeaderProps {
    activeSection: 'recipes' | 'stock' | 'market';
    pageTitle: string;
    onSectionChange?: (section: 'recipes' | 'stock' | 'market') => void;
}

/**
 * GrimorioHeader
 * Shared header for all 3 Grimorio sections
 * Shows: GRIMORIO (large) -> Page Title -> Navigation tabs
 */
export const GrimorioHeader: React.FC<GrimorioHeaderProps> = ({
    activeSection,
    pageTitle,
    onSectionChange
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const sections = [
        { id: 'recipes' as const, label: 'RECETAS', route: '/grimorio/recipes', color: 'orange' },
        { id: 'stock' as const, label: 'INVENTARIO', route: '/grimorio/stock', color: 'red' },
        { id: 'market' as const, label: 'MERCADO', route: '/grimorio/market', color: 'green' }
    ];

    const activeColor = sections.find(s => s.id === activeSection)?.color || 'orange';

    const colorClasses = {
        orange: {
            active: 'bg-orange-500',
            text: 'text-orange-500',
            border: 'border-orange-500'
        },
        red: {
            active: 'bg-red-500',
            text: 'text-red-500',
            border: 'border-red-500'
        },
        green: {
            active: 'bg-emerald-500',
            text: 'text-emerald-500',
            border: 'border-emerald-500'
        }
    };

    const handleSectionClick = (section: typeof sections[0]) => {
        if (onSectionChange) {
            onSectionChange(section.id);
        }
        navigate(section.route);
    };

    return (
        <header className="pt-4 pb-4 px-5 z-10 relative">
            {/* Title Section */}
            <div className="mb-6 px-2">
                <h1 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9] mb-2 drop-shadow-xl"
                    style={{ fontFamily: 'Georgia, serif' }}>
                    Grimorio
                </h1>
                <p className="text-lg font-bold text-white/90 tracking-wide drop-shadow-md">
                    {pageTitle}
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {sections.map(section => {
                    const isActive = activeSection === section.id;
                    const colors = colorClasses[section.color as keyof typeof colorClasses];

                    return (
                        <button
                            key={section.id}
                            onClick={() => handleSectionClick(section)}
                            className={`
                                px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest 
                                whitespace-nowrap transition-all relative
                                ${CLASS_NAMES.pressEffect}
                                ${isActive ? 'text-zinc-800 scale-105' : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeGrimorioPill"
                                    className="absolute inset-0 bg-white rounded-full shadow-lg"
                                    transition={TRANSITIONS.spring}
                                    initial={false}
                                />
                            )}
                            <span className="relative z-10">{section.label}</span>
                        </button>
                    );
                })}
            </div>
        </header>
    );
};

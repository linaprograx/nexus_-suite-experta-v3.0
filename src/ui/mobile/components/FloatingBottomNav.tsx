import React, { useEffect, useRef, useMemo } from 'react';
import { PageName, PAGE_THEMES } from '../types';
import { MOBILE_BACKGROUNDS, MOBILE_BLUR, MOBILE_SHADOWS, MOBILE_BORDERS } from '../design-tokens';
import { CLASS_NAMES } from '../../../theme/motion';

interface FloatingBottomNavProps {
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
}

// 1. Definition of Main Navigation Items
const MAIN_NAV_ITEMS = [
    { page: PageName.Dashboard, icon: 'dashboard', label: 'Inicio' },
    {
        // Grimorio acts as a Section. Default click goes to Recipes.
        page: PageName.GrimorioRecipes,
        groupKey: 'grimorio',
        icon: 'menu_book',
        label: 'Grimorio',
        subPages: [PageName.GrimorioRecipes, PageName.GrimorioStock, PageName.GrimorioMarket]
    },
    {
        // Cerebrity Section
        page: PageName.CerebritySynthesis,
        groupKey: 'cerebrity',
        icon: 'neurology',
        label: 'Cerebrity',
        subPages: [PageName.CerebritySynthesis, PageName.CerebrityMakeMenu, PageName.CerebrityCritic, PageName.CerebrityLab, PageName.CerebrityTrend]
    },
    { page: PageName.Pizarron, icon: 'layers', label: 'Pizarrón' },
    {
        // Avatar/Personal Section
        page: PageName.AvatarCore,
        groupKey: 'avatar',
        icon: 'person',
        label: 'Avatar',
        subPages: [PageName.AvatarCore, PageName.AvatarIntelligence, PageName.AvatarCompetition]
    },
    { page: PageName.Colegium, icon: 'school', label: 'Colegium' },
    // ❌ Removed duplicate: { page: PageName.Personal, icon: 'dvr', label: 'Personal' }
    // Avatar section above already handles personal/avatar pages
];

const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({ currentPage, onNavigate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 2. Identify Active Item/Group
    const activeItem = useMemo(() => {
        return MAIN_NAV_ITEMS.find(item => {
            if (item.page === currentPage) return true;
            if (item.subPages && item.subPages.includes(currentPage)) return true;
            return false;
        });
    }, [currentPage]);

    // 3. Dynamic Color Logic
    // We want the icon to take the color of the CURRENT PAGE (even if deep inside a section)
    const activeThemeColor = (PAGE_THEMES[currentPage] || PAGE_THEMES['default']).accent;

    // Auto-scroll logic (Simplified)
    useEffect(() => {
        if (!scrollContainerRef.current || !activeItem) return;
        const index = MAIN_NAV_ITEMS.indexOf(activeItem);
        if (index !== -1) {
            const container = scrollContainerRef.current;
            const itemWidth = 72;
            const gap = 8;
            const centerPos = (index * (itemWidth + gap)) - 150; // Approx center
            container.scrollTo({ left: Math.max(0, centerPos), behavior: 'smooth' });
        }
    }, [activeItem]);

    return (
        <div
            className="absolute bottom-6 left-5 right-5 z-50 mb-[env(safe-area-inset-bottom)]"
            style={{ pointerEvents: 'auto' }}
        >
            <div
                ref={scrollContainerRef}
                className="h-[4.5rem] rounded-[2rem] overflow-x-auto overflow-y-hidden no-scrollbar px-2 dark:!bg-black/90 dark:!border-white/10 dark:!shadow-2xl transition-all duration-500 ease-out"
                style={{
                    backgroundColor: MOBILE_BACKGROUNDS.navBlur,
                    backdropFilter: MOBILE_BLUR.navigation,
                    WebkitBackdropFilter: MOBILE_BLUR.navigation,
                    border: MOBILE_BORDERS.glassSubtle,
                    boxShadow: MOBILE_SHADOWS.navBlur,
                    maxWidth: '100%',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start' // Changed from center to avoid clipping left-side items on overflow
                }}
            >
                <nav className="flex items-center gap-2 min-w-max px-2 h-full w-fit mx-auto">
                    {MAIN_NAV_ITEMS.map((item) => {
                        // Check if this item is the "Active" one (either direct match or group match)
                        const isActive = activeItem === item;

                        // Use activeThemeColor if this item is active, otherwise gray
                        const iconColor = isActive ? activeThemeColor : '#a1a1aa';

                        return (
                            <button
                                key={item.label}
                                onClick={() => onNavigate(item.page)}
                                className={`
                                    flex flex-col items-center justify-center
                                    w-[64px] h-14
                                    rounded-[1.5rem]
                                    transition-all duration-300
                                    flex-shrink-0
                                    ${isActive
                                        ? 'bg-white dark:bg-zinc-800 shadow-xl scale-110'
                                        : 'bg-transparent hover:bg-white/10 hover:scale-105'
                                    }
                                    ${CLASS_NAMES.pressEffect}
                                `}
                                style={isActive ? {
                                    boxShadow: `0 4px 20px ${activeThemeColor}40, 0 0 0 2px ${activeThemeColor}20`
                                } : {}}
                            >
                                <span
                                    className={`
                                        material-symbols-outlined !text-[26px] transition-colors duration-300
                                        ${isActive ? 'fill-1' : ''}
                                    `}
                                    style={{ color: iconColor }}
                                >
                                    {item.icon}
                                </span>
                                {isActive && (
                                    <div
                                        className="w-1 h-1 rounded-full mt-1.5"
                                        style={{ backgroundColor: activeThemeColor }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default FloatingBottomNav;

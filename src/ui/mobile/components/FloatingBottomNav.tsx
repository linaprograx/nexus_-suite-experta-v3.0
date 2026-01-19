import React, { useEffect, useRef } from 'react';
import { PageName, PAGE_THEMES } from '../types';
import { MOBILE_BACKGROUNDS, MOBILE_BLUR, MOBILE_SHADOWS, MOBILE_BORDERS } from '../design-tokens';
import { CLASS_NAMES } from '../../../theme/motion';

interface FloatingBottomNavProps {
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
}

const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({ currentPage, onNavigate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // All 12 navigation items matching Stitch prototypes
    const navItems = [
        { page: PageName.Dashboard, icon: 'dashboard', label: 'Dashboard' },
        { page: PageName.GrimorioRecipes, icon: 'book_2', label: 'Recipes' },
        { page: PageName.GrimorioStock, icon: 'inventory_2', label: 'Stock' },
        { page: PageName.GrimorioMarket, icon: 'travel_explore', label: 'Market' },
        { page: PageName.CerebritySynthesis, icon: 'auto_awesome', label: 'Synthesis' },
        { page: PageName.CerebrityMakeMenu, icon: 'edit_note', label: 'Make Menu' },
        { page: PageName.CerebrityCritic, icon: 'rate_review', label: 'Critic' },
        { page: PageName.CerebrityLab, icon: 'science', label: 'Lab' },
        { page: PageName.CerebrityTrend, icon: 'trending_up', label: 'Trends' },
        { page: PageName.Pizarron, icon: 'layers', label: 'Pizarrón' },
        { page: PageName.AvatarCore, icon: 'person', label: 'Núcleo' },
        { page: PageName.AvatarIntelligence, icon: 'psychology', label: 'Inteligencia' },
        { page: PageName.AvatarCompetition, icon: 'emoji_events', label: 'Competición' },
        { page: PageName.Colegium, icon: 'school', label: 'Colegium' },
        { page: PageName.Personal, icon: 'dvr', label: 'Personal' },
    ];

    // Determine if a nav item should be highlighted
    const isActive = (page: PageName): boolean => {
        return currentPage === page;
    };

    // Get theme color for current page
    const currentTheme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];
    const themeColor = currentTheme.accent;

    // Auto-scroll to center the active item (showing 5 items at a time)
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const activeIndex = navItems.findIndex(item => isActive(item.page));

        if (activeIndex !== -1) {
            // Calculate to show exactly 5 items with active centered
            const itemWidth = 72; // Width of each nav item
            const gap = 8; // Gap between items
            const totalItemWidth = itemWidth + gap;

            // Center the active item: scroll to position where active item is in the middle (index 2 of 5 visible items)
            const scrollPosition = (activeIndex * totalItemWidth) - (totalItemWidth * 2);

            container.scrollTo({
                left: Math.max(0, scrollPosition),
                behavior: 'smooth'
            });
        }
    }, [currentPage]);

    return (
        <div
            className="absolute bottom-6 left-5 right-5 z-50 mb-[env(safe-area-inset-bottom)]"
            style={{ pointerEvents: 'auto' }}
        >
            <div
                ref={scrollContainerRef}
                className="h-[4.5rem] rounded-[2rem] overflow-x-auto overflow-y-hidden no-scrollbar px-4"
                style={{
                    background: MOBILE_BACKGROUNDS.navBlur,
                    backdropFilter: MOBILE_BLUR.navigation,
                    WebkitBackdropFilter: MOBILE_BLUR.navigation,
                    border: MOBILE_BORDERS.glassSubtle,
                    boxShadow: MOBILE_SHADOWS.navBlur,
                    maxWidth: '400px', // Limit to ~5 items (5 * 72px + gaps + padding)
                    margin: '0 auto'
                }}
            >
                <nav className="flex items-center justify-start h-full gap-2 min-w-max">
                    {navItems.map((item, index) => {
                        const active = isActive(item.page);

                        // Check if any Grimorio is active for border
                        const isAnyGrimorioActive = [
                            PageName.GrimorioRecipes,
                            PageName.GrimorioStock,
                            PageName.GrimorioMarket
                        ].includes(currentPage);

                        // Get Grimorio border color
                        const grimorioBorderColor =
                            currentPage === PageName.GrimorioRecipes ? '#7e22ce' : // purple
                                currentPage === PageName.GrimorioStock ? '#2563eb' : // blue
                                    currentPage === PageName.GrimorioMarket ? '#10b981' : // emerald
                                        'transparent';

                        // Group Grimorio items
                        const isGrimorioItem = [
                            PageName.GrimorioRecipes,
                            PageName.GrimorioStock,
                            PageName.GrimorioMarket
                        ].includes(item.page);

                        const isCerebrityItem = [
                            PageName.CerebritySynthesis,
                            PageName.CerebrityMakeMenu,
                            PageName.CerebrityCritic,
                            PageName.CerebrityLab,
                            PageName.CerebrityTrend
                        ].includes(item.page);

                        const isAvatarItem = [
                            PageName.AvatarCore,
                            PageName.AvatarIntelligence,
                            PageName.AvatarCompetition
                        ].includes(item.page);

                        // If first grimorio item, wrap all 3 in border
                        if (item.page === PageName.GrimorioRecipes) {
                            const grimorioItems = navItems.filter(nav => [
                                PageName.GrimorioRecipes,
                                PageName.GrimorioStock,
                                PageName.GrimorioMarket
                            ].includes(nav.page));

                            return (
                                <div
                                    key="grimorio-group"
                                    className={`flex gap-2 ${isAnyGrimorioActive ? 'border rounded-[2rem] p-1' : ''}`}
                                    style={isAnyGrimorioActive ? {
                                        borderColor: grimorioBorderColor,
                                        borderWidth: '1px',
                                        transition: 'border-color 0.3s ease'
                                    } : {}}
                                >
                                    {grimorioItems.map(gItem => {
                                        const gActive = isActive(gItem.page);
                                        const gTheme = PAGE_THEMES[gItem.page] || PAGE_THEMES['default'];
                                        const gColor = gTheme.accent;

                                        return (
                                            <button
                                                key={gItem.page}
                                                onClick={() => onNavigate(gItem.page)}
                                                className={`
                                                    flex flex-col items-center justify-center
                                                    w-[68px] h-14
                                                    rounded-[1.5rem]
                                                    transition-all duration-300
                                                    flex-shrink-0
                                                    ${gActive
                                                        ? 'bg-white shadow-lg scale-110'
                                                        : 'bg-transparent hover:bg-white/30 hover:scale-105'
                                                    }
                                                    ${CLASS_NAMES.pressEffect}
                                                `}
                                                style={gActive ? {
                                                    boxShadow: `0 4px 20px ${gColor}40, 0 0 0 2px ${gColor}20`
                                                } : {}}
                                            >
                                                <span
                                                    className={`
                                                        material-symbols-outlined !text-[22px] transition-colors
                                                        ${gActive ? 'fill-1' : ''}
                                                    `}
                                                    style={{
                                                        color: gActive ? gColor : '#71717a'
                                                    }}
                                                >
                                                    {gItem.icon}
                                                </span>
                                                {gActive && (
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full mt-1"
                                                        style={{ backgroundColor: gColor }}
                                                    ></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        }

                        // Handle Cerebrity items (grouping)
                        if (item.page === PageName.CerebritySynthesis) {
                            const cerebrityPages = [
                                PageName.CerebritySynthesis,
                                PageName.CerebrityMakeMenu,
                                PageName.CerebrityCritic,
                                PageName.CerebrityLab,
                                PageName.CerebrityTrend
                            ];
                            const isAnyCerebrityActive = cerebrityPages.includes(currentPage);
                            const cerebrityItems = navItems.filter(nav => cerebrityPages.includes(nav.page));

                            // Get accurate theme accent for the ring
                            const currentCerebrityTheme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];
                            const ringColor = isAnyCerebrityActive ? currentCerebrityTheme.accent : 'transparent';

                            return (
                                <div
                                    key="cerebrity-group"
                                    className={`flex gap-2 transition-all duration-500 ease-in-out ${isAnyCerebrityActive ? 'border rounded-[2rem] p-1' : ''}`}
                                    style={isAnyCerebrityActive ? {
                                        borderColor: ringColor,
                                        borderWidth: '1.5px',
                                        boxShadow: `0 0 15px ${ringColor}30`
                                    } : {}}
                                >
                                    {cerebrityItems.map(cItem => {
                                        const cActive = isActive(cItem.page);
                                        const cTheme = PAGE_THEMES[cItem.page] || PAGE_THEMES['default'];
                                        const cColor = cTheme.accent;

                                        return (
                                            <button
                                                key={cItem.page}
                                                onClick={() => onNavigate(cItem.page)}
                                                className={`
                                                    flex flex-col items-center justify-center
                                                    w-[68px] h-14
                                                    rounded-[1.5rem]
                                                    transition-all duration-300
                                                    flex-shrink-0
                                                    ${cActive
                                                        ? 'bg-white shadow-lg scale-110'
                                                        : 'bg-transparent hover:bg-white/30 hover:scale-105'
                                                    }
                                                    ${CLASS_NAMES.pressEffect}
                                                `}
                                                style={cActive ? {
                                                    boxShadow: `0 4px 20px ${cColor}40, 0 0 0 2px ${cColor}20`
                                                } : {}}
                                            >
                                                <span
                                                    className={`
                                                        material-symbols-outlined !text-[22px] transition-colors
                                                        ${cActive ? 'fill-1' : ''}
                                                    `}
                                                    style={{
                                                        color: cActive ? cColor : '#71717a'
                                                    }}
                                                >
                                                    {cItem.icon}
                                                </span>
                                                {cActive && (
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full mt-1"
                                                        style={{ backgroundColor: cColor }}
                                                    ></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        }

                        // Handle Avatar items (grouping)
                        if (item.page === PageName.AvatarCore) {
                            const avatarPages = [
                                PageName.AvatarCore,
                                PageName.AvatarIntelligence,
                                PageName.AvatarCompetition
                            ];
                            const isAnyAvatarActive = avatarPages.includes(currentPage);
                            const avatarItems = navItems.filter(nav => avatarPages.includes(nav.page));

                            // Get accurate theme accent for the ring
                            const currentAvatarTheme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];
                            const ringColor = isAnyAvatarActive ? currentAvatarTheme.accent : 'transparent';

                            return (
                                <div
                                    key="avatar-group"
                                    className={`flex gap-2 transition-all duration-500 ease-in-out ${isAnyAvatarActive ? 'border rounded-[2rem] p-1' : ''}`}
                                    style={isAnyAvatarActive ? {
                                        borderColor: ringColor,
                                        borderWidth: '1.5px',
                                        boxShadow: `0 0 15px ${ringColor}30`
                                    } : {}}
                                >
                                    {avatarItems.map(aItem => {
                                        const aActive = isActive(aItem.page);
                                        const aTheme = PAGE_THEMES[aItem.page] || PAGE_THEMES['default'];
                                        const aColor = aTheme.accent;

                                        return (
                                            <button
                                                key={aItem.page}
                                                onClick={() => onNavigate(aItem.page)}
                                                className={`
                                                    flex flex-col items-center justify-center
                                                    w-[68px] h-14
                                                    rounded-[1.5rem]
                                                    transition-all duration-300
                                                    flex-shrink-0
                                                    ${aActive
                                                        ? 'bg-white shadow-lg scale-110'
                                                        : 'bg-transparent hover:bg-white/30 hover:scale-105'
                                                    }
                                                    ${CLASS_NAMES.pressEffect}
                                                `}
                                                style={aActive ? {
                                                    boxShadow: `0 4px 20px ${aColor}40, 0 0 0 2px ${aColor}20`
                                                } : {}}
                                            >
                                                <span
                                                    className={`
                                                        material-symbols-outlined !text-[22px] transition-colors
                                                        ${aActive ? 'fill-1' : ''}
                                                    `}
                                                    style={{
                                                        color: aActive ? aColor : '#71717a'
                                                    }}
                                                >
                                                    {aItem.icon}
                                                </span>
                                                {aActive && (
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full mt-1"
                                                        style={{ backgroundColor: aColor }}
                                                    ></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        }

                        // Skip individual items already grouped
                        if (isCerebrityItem) {
                            return null;
                        }

                        // Skip individual avatar items
                        if (isAvatarItem) {
                            return null;
                        }

                        // Skip individual grimorio items (already rendered in group)
                        if (isGrimorioItem) {
                            return null;
                        }

                        // Render non-Grimorio items normally
                        if (!isGrimorioItem) {
                            return (
                                <button
                                    key={item.page}
                                    onClick={() => onNavigate(item.page)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        w-[68px] h-14
                                        rounded-[1.5rem]
                                        transition-all duration-300
                                        flex-shrink-0
                                        ${active
                                            ? 'bg-white shadow-lg scale-110'
                                            : 'bg-transparent hover:bg-white/30 hover:scale-105'
                                        }
                                        ${CLASS_NAMES.pressEffect}
                                    `}
                                    style={active ? {
                                        boxShadow: `0 4px 20px ${themeColor}40, 0 0 0 2px ${themeColor}20`
                                    } : {}}
                                >
                                    <span
                                        className={`
                                            material-symbols-outlined !text-[22px] transition-colors
                                            ${active ? 'fill-1' : ''}
                                        `}
                                        style={{
                                            color: active ? themeColor : '#71717a'
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                    {active && (
                                        <div
                                            className="w-1.5 h-1.5 rounded-full mt-1"
                                            style={{ backgroundColor: themeColor }}
                                        ></div>
                                    )}
                                </button>
                            );
                        }

                        return null;
                    })}
                </nav>
            </div>
        </div>
    );
};

export default FloatingBottomNav;

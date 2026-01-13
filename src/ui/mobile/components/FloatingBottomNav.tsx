import React, { useEffect, useRef } from 'react';
import { PageName, PAGE_THEMES } from '../types';
import { MOBILE_BACKGROUNDS, MOBILE_BLUR, MOBILE_SHADOWS, MOBILE_BORDERS } from '../design-tokens';

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
        { page: PageName.CerebrityMakeMenu, icon: 'edit_note', label: 'Make Menu' },
        { page: PageName.CerebrityCritic, icon: 'rate_review', label: 'Critic' },
        { page: PageName.CerebrityLab, icon: 'science', label: 'Lab' },
        { page: PageName.CerebrityTrend, icon: 'trending_up', label: 'Trends' },
        { page: PageName.Pizarron, icon: 'layers', label: 'Pizarrón' },
        { page: PageName.AvatarCore, icon: 'person', label: 'Avatar' },
        { page: PageName.Personal, icon: 'credit_card', label: 'Personal' },
        { page: PageName.Colegium, icon: 'school', label: 'Colegium' },
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
            className="absolute bottom-6 left-5 right-5 z-50"
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
                        return (
                            <button
                                key={item.page}
                                onClick={() => onNavigate(item.page)}
                                className={`
                  flex flex-col items-center justify-center
                  w-[68px] h-14
                  rounded-xl
                  transition-all duration-300
                  flex-shrink-0
                  ${active
                                        ? 'bg-white shadow-lg scale-110'
                                        : 'bg-transparent hover:bg-white/30 hover:scale-105'
                                    }
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
                    })}
                </nav>
            </div>
        </div>
    );
};

export default FloatingBottomNav;

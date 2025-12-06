import React from 'react';

type GradientTheme = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'blue';

interface PremiumLayoutProps {
    children?: React.ReactNode; // Fallback for flexibility
    leftSidebar?: React.ReactNode;
    mainContent?: React.ReactNode;
    rightSidebar?: React.ReactNode;
    gradientTheme?: GradientTheme;
    className?: string;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
    children,
    leftSidebar,
    mainContent,
    rightSidebar,
    gradientTheme = 'indigo',
    className = ''
}) => {

    // Gradient definitions mapping
    const gradients: Record<GradientTheme, string> = {
        violet: "from-[#EDE9FE] to-white dark:from-[#1E1B2A] dark:to-slate-950", // CerebrIty Creativity
        cyan: "from-[#CCFBF1] to-white dark:from-[#162A29] dark:to-slate-950",   // CerebrIty Lab
        emerald: "from-[#D1FAE5] to-white dark:from-[#064E3B] dark:to-slate-950", // Escandallator (Money/Freshness)
        amber: "from-[#FEF3C7] to-white dark:from-[#451A03] dark:to-slate-950",   // Trend Locator (Fire/Ideas)
        rose: "from-[#FFE4E6] to-white dark:from-[#4C0519] dark:to-slate-950",    // Make Menu (Aesthetics)
        indigo: "from-[#E0E7FF] to-white dark:from-[#1E1B4B] dark:to-slate-950",  // Grimorium (Archive)
        slate: "from-[#F1F5F9] to-white dark:from-[#0F172A] dark:to-slate-950",   // Neutral/Fallback
        blue: "from-[#DBEAFE] to-white dark:from-[#172554] dark:to-slate-950"     // Colegium (Learning)
    };

    const activeGradient = gradients[gradientTheme];

    // Main layout container structure
    // We aim for a layout that respects the CerebrIty 3-column "invisible" feel
    // Default grid: fixed left, flexible center, fixed right. 
    // Adapts to tablet/mobile.

    return (
        <div className={`h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6 ${className}`}>
            {/* Main Container with Rounded Corners and Gradient */}
            <div className={`flex-1 grid grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px] gap-6 overflow-hidden rounded-3xl bg-gradient-to-b ${activeGradient} p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5`}>

                {/* Left Sidebar Column */}
                <div className="h-full min-h-0 overflow-hidden flex flex-col">
                    {leftSidebar}
                </div>

                {/* Main Content Column */}
                <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl">
                    {/* If children is provided instead of slots, render children here (migration ease) */}
                    {mainContent || children}
                </div>

                {/* Right Sidebar Column */}
                <div className="h-full min-h-0 overflow-hidden flex flex-col">
                    {rightSidebar}
                </div>

            </div>
        </div>
    );
};

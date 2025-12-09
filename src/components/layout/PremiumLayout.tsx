import React from 'react';

type GradientTheme = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'blue' | 'colegium' | 'red' | 'yellow' | 'ice' | 'lime';

interface PremiumLayoutProps {
    children?: React.ReactNode; // Fallback for flexibility
    leftSidebar?: React.ReactNode;
    mainContent?: React.ReactNode;
    rightSidebar?: React.ReactNode;
    header?: React.ReactNode; // Content to render above the main grid (e.g. Navigation Pills)
    gradientTheme?: GradientTheme;
    className?: string;
    layoutMode?: 'standard' | 'compact' | 'colegium';
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
    children,
    leftSidebar,
    mainContent,
    rightSidebar,
    header,
    gradientTheme = 'indigo',
    className = '',
    layoutMode = 'standard'
}) => {

    // Gradient definitions mapping
    const gradients: Record<GradientTheme, string> = {
        violet: "from-[#EDE9FE] to-white dark:from-[#1E1B2A] dark:to-slate-950", // CerebrIty Creativity
        cyan: "from-[#CCFBF1] to-white dark:from-[#162A29] dark:to-slate-950",   // CerebrIty Lab
        emerald: "from-[#D1FAE5] to-white dark:from-[#064E3B] dark:to-slate-950", // Escandallator (Money/Freshness)
        amber: "from-orange-500/15 via-orange-100/10 to-transparent",   // Pizarron Special Theme
        rose: "from-[#FFE4E6] to-white dark:from-[#4C0519] dark:to-slate-950",    // Make Menu (Aesthetics)
        indigo: "from-[#E0E7FF] to-white dark:from-[#1E1B4B] dark:to-slate-950",  // Grimorium (Archive)
        slate: "from-[#F1F5F9] to-white dark:from-[#0F172A] dark:to-slate-950",   // Neutral/Fallback
        blue: "from-[#DBEAFE] to-white dark:from-[#172554] dark:to-slate-950",     // Colegium (Learning)
        colegium: "from-[#DBEAFE] to-white dark:from-[#172554] dark:to-slate-950",  // Alias
        red: "from-[#FEE2E2] to-white dark:from-[#450A0A] dark:to-slate-950",       // Escandallo (New)
        yellow: "from-[#FEF9C3] to-white dark:from-[#422006] dark:to-slate-950",    // Batcher (New)
        ice: "from-[#E0F2FE] to-white dark:from-[#082F49] dark:to-slate-950",        // Stock (New)
        lime: "from-[#ECFCCB] to-white dark:from-[#365314] dark:to-slate-950"        // Zero Waste (Eco - New)
    };

    const activeGradient = gradients[gradientTheme];

    // Grid Column Logic
    let gridCols = 'grid-cols-1 lg:grid-cols-[310px,minmax(0,1fr),320px]';
    if (layoutMode === 'compact') {
        gridCols = 'grid-cols-1 lg:grid-cols-[100px,minmax(0,1fr),100px]';
    } else if (layoutMode === 'colegium') {
        gridCols = 'grid-cols-1 lg:grid-cols-[150px,minmax(0,1fr),150px]';
    }

    return (
        <div className={`h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6 ${className}`}>
            {/* Header / Navbar Area */}
            {header && (
                <div className="flex-shrink-0 mb-4 z-30 relative">
                    {header}
                </div>
            )}

            {/* Main Container with Rounded Corners and Gradient */}
            <div className={`flex-1 grid ${gridCols} gap-4 overflow-hidden rounded-3xl bg-gradient-to-b ${activeGradient} p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5 ${className}`}>

                {/* Left Sidebar Column */}
                <div className="h-full min-h-0 flex flex-col relative z-20">
                    {leftSidebar}
                </div>

                {/* Main Content Column */}
                <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                    {/* If children is provided instead of slots, render children here (migration ease) */}
                    {mainContent}
                </div>

                {/* Right Sidebar Column */}
                <div className="h-full min-h-0 flex flex-col relative z-20">
                    {rightSidebar}
                </div>

            </div>
            {/* Render children (Modals, Overlays) independent of slots */}
            {children}
        </div>
    );
};

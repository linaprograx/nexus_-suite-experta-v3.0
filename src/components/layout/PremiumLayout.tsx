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
        violet: "from-[#7C3AED] via-[#7C3AED]/35 to-transparent dark:from-[#4C1D95] dark:via-[#4C1D95]/30 dark:to-transparent",
        cyan: "from-[#06B6D4] via-[#06B6D4]/35 to-transparent dark:from-[#155E75] dark:via-[#155E75]/30 dark:to-transparent",
        emerald: "from-[#10B981] via-[#10B981]/35 to-transparent dark:from-[#065F46] dark:via-[#065F46]/30 dark:to-transparent",
        amber: "from-[#F59E0B] via-[#F59E0B]/35 to-transparent dark:from-[#B45309] dark:via-[#B45309]/30 dark:to-transparent",
        rose: "from-[#F43F5E] via-[#F43F5E]/35 to-transparent dark:from-[#9D174D] dark:via-[#9D174D]/30 dark:to-transparent",
        indigo: "from-[#6366F1] via-[#6366F1]/35 to-transparent dark:from-[#3730A3] dark:via-[#3730A3]/30 dark:to-transparent",
        slate: "from-[#64748B] via-[#64748B]/35 to-transparent dark:from-[#1E293B] dark:via-[#1E293B]/30 dark:to-transparent",
        blue: "from-[#3B82F6] via-[#3B82F6]/35 to-transparent dark:from-[#1E3A8A] dark:via-[#1E3A8A]/30 dark:to-transparent",
        colegium: "from-[#60A5FA] via-[#60A5FA]/35 to-transparent dark:from-[#1E3A8A] dark:via-[#1E3A8A]/30 dark:to-transparent",
        red: "from-[#EF4444] via-[#EF4444]/35 to-transparent dark:from-[#7F1D1D] dark:via-[#7F1D1D]/30 dark:to-transparent",
        yellow: "from-[#EAB308] via-[#EAB308]/35 to-transparent dark:from-[#854D0E] dark:via-[#854D0E]/30 dark:to-transparent",
        ice: "from-[#38BDF8] via-[#38BDF8]/35 to-transparent dark:from-[#0C4A6E] dark:via-[#0C4A6E]/30 dark:to-transparent",
        lime: "from-[#84CC16] via-[#84CC16]/35 to-transparent dark:from-[#3F6212] dark:via-[#3F6212]/30 dark:to-transparent"
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

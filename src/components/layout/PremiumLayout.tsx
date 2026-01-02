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
    layoutMode?: 'standard' | 'compact' | 'colegium' | 'zen';
    transparentColumns?: boolean;
    id?: string;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
    children,
    leftSidebar,
    mainContent,
    rightSidebar,
    header,
    gradientTheme = 'indigo',
    className = '',
    layoutMode = 'standard',
    transparentColumns = false,
    id
}) => {

    // Gradient definitions mapping (Avatar Standard: 4-Stop Opacity)
    // 1/4 (0%) -> 100% opacity
    // 2/4 (50%) -> 50% opacity
    // 3/4 (75%) -> 10% opacity
    // 4/4 (100%) -> 0% transparent from middle downwards
    const gradients: Record<GradientTheme, string> = {
        violet: "bg-[linear-gradient(to_bottom,rgb(139,92,246)_0%,rgba(139,92,246,0.5)_50%,rgba(139,92,246,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(139,92,246,0.4)_0%,rgba(139,92,246,0.2)_50%,rgba(139,92,246,0.05)_75%,transparent_100%)]",
        cyan: "bg-[linear-gradient(to_bottom,rgb(6,182,212)_0%,rgba(6,182,212,0.5)_50%,rgba(6,182,212,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(6,182,212,0.4)_0%,rgba(6,182,212,0.2)_50%,rgba(6,182,212,0.05)_75%,transparent_100%)]",
        emerald: "bg-[linear-gradient(to_bottom,rgb(16,185,129)_0%,rgba(16,185,129,0.5)_50%,rgba(16,185,129,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(16,185,129,0.4)_0%,rgba(16,185,129,0.2)_50%,rgba(16,185,129,0.05)_75%,transparent_100%)]",
        amber: "bg-[linear-gradient(to_bottom,rgb(245,158,11)_0%,rgba(245,158,11,0.5)_50%,rgba(245,158,11,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(245,158,11,0.4)_0%,rgba(245,158,11,0.2)_50%,rgba(245,158,11,0.05)_75%,transparent_100%)]",
        rose: "bg-[linear-gradient(to_bottom,rgb(244,63,94)_0%,rgba(244,63,94,0.5)_50%,rgba(244,63,94,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(244,63,94,0.4)_0%,rgba(244,63,94,0.2)_50%,rgba(244,63,94,0.05)_75%,transparent_100%)]",
        indigo: "bg-[linear-gradient(to_bottom,rgb(99,102,241)_0%,rgba(99,102,241,0.5)_50%,rgba(99,102,241,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(99,102,241,0.4)_0%,rgba(99,102,241,0.2)_50%,rgba(99,102,241,0.05)_75%,transparent_100%)]",
        slate: "bg-[linear-gradient(to_bottom,rgb(100,116,139)_0%,rgba(100,116,139,0.5)_50%,rgba(100,116,139,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(100,116,139,0.4)_0%,rgba(100,116,139,0.2)_50%,rgba(100,116,139,0.05)_75%,transparent_100%)]",
        blue: "bg-[linear-gradient(to_bottom,rgb(59,130,246)_0%,rgba(59,130,246,0.5)_50%,rgba(59,130,246,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(59,130,246,0.4)_0%,rgba(59,130,246,0.2)_50%,rgba(59,130,246,0.05)_75%,transparent_100%)]",
        colegium: "bg-[linear-gradient(to_bottom,rgb(168,85,247)_0%,rgba(168,85,247,0.5)_50%,rgba(168,85,247,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(168,85,247,0.4)_0%,rgba(168,85,247,0.2)_50%,rgba(168,85,247,0.05)_75%,transparent_100%)]",
        red: "bg-[linear-gradient(to_bottom,rgb(239,68,68)_0%,rgba(239,68,68,0.5)_50%,rgba(239,68,68,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(239,68,68,0.4)_0%,rgba(239,68,68,0.2)_50%,rgba(239,68,68,0.05)_75%,transparent_100%)]",
        yellow: "bg-[linear-gradient(to_bottom,rgb(234,179,8)_0%,rgba(234,179,8,0.5)_50%,rgba(234,179,8,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(234,179,8,0.4)_0%,rgba(234,179,8,0.2)_50%,rgba(234,179,8,0.05)_75%,transparent_100%)]",
        ice: "bg-[linear-gradient(to_bottom,rgb(14,165,233)_0%,rgba(14,165,233,0.5)_50%,rgba(14,165,233,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(14,165,233,0.4)_0%,rgba(14,165,233,0.2)_50%,rgba(14,165,233,0.05)_75%,transparent_100%)]",
        lime: "bg-[linear-gradient(to_bottom,rgb(132,204,22)_0%,rgba(132,204,22,0.5)_50%,rgba(132,204,22,0.1)_75%,transparent_100%)] dark:bg-[linear-gradient(to_bottom,rgba(132,204,22,0.4)_0%,rgba(132,204,22,0.2)_50%,rgba(132,204,22,0.05)_75%,transparent_100%)]"
    };

    const activeGradient = gradients[gradientTheme];

    // Grid Column Logic - Proportional System (No fixed pixels)
    // Standard: Left (Sidebar) ~20%, Middle (Main) ~55%, Right (Detail) ~25%
    let gridCols = 'grid-cols-1 md:grid-cols-[2fr_5.5fr_2.5fr]';

    if (layoutMode === 'compact') {
        // Compact: Smaller sidebars ~10% each
        gridCols = 'grid-cols-1 md:grid-cols-[1fr_8fr_1fr]';
    } else if (layoutMode === 'colegium') {
        // Colegium: Balanced sidebars ~15% each
        gridCols = 'grid-cols-1 md:grid-cols-[1.5fr_7fr_1.5fr]';
    } else if (layoutMode === 'zen') {
        gridCols = 'grid-cols-1';
    }

    // Avatar Standard Column Class
    // User Update: Optional transparent columns (no shadow, no bg)
    const columnClass = `h-full min-h-0 flex flex-col relative z-20 ${transparentColumns || layoutMode === 'zen' ? 'bg-transparent shadow-none border-0' : 'bg-transparent shadow-premium'} rounded-2xl overflow-y-auto ${layoutMode === 'zen' ? 'p-0' : 'p-6'} scrollbar-hide`;

    const isZen = layoutMode === 'zen';

    return (
        <div id={id} className={`w-full flex flex-col ${isZen ? 'h-screen p-0' : 'h-[calc(100vh-80px)] px-4 lg:px-8 py-6'} ${className}`}>
            {/* Header / Navbar Area */}
            {header && !isZen && (
                <div className="flex-shrink-0 mb-4 z-30 relative">
                    {header}
                </div>
            )}

            {/* Main Container with Rounded Corners and Gradient */}
            <div className={`flex-1 grid ${gridCols} gap-4 overflow-hidden ${isZen ? 'rounded-none border-0 bg-slate-50 dark:bg-slate-900' : `rounded-3xl p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5 ${activeGradient}`} ${className}`}>

                {/* Left Sidebar Column */}
                <div className={columnClass}>
                    {leftSidebar}
                </div>

                {/* Main Content Column */}
                <div className={columnClass}>
                    {/* If children is provided instead of slots, render children here (migration ease) */}
                    {mainContent}
                </div>

                {/* Right Sidebar Column */}
                <div className={columnClass}>
                    {rightSidebar}
                </div>

            </div>
            {/* Render children (Modals, Overlays) independent of slots */}
            {children}
        </div>
    );
};

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
    backgroundMode?: 'card' | 'screen';
    transparentColumns?: boolean;
    id?: string;
}



// Gradient definitions mapping (Avatar Standard: 4-Stop Opacity)
// Optimized: Moved outside component to prevent re-creation on every render.
// Colors: Tuned to "Mobile Deep" saturation (600/700 scale).
const gradients: Record<GradientTheme, string> = {
    violet: "bg-[linear-gradient(to_bottom,#7c3aed_0%,rgba(124,58,237,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(124,58,237,0.7)_0%,rgba(124,58,237,0.5)_20%,transparent_40%)]", // Violet-600
    cyan: "bg-[linear-gradient(to_bottom,#0891b2_0%,rgba(8,145,178,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(8,145,178,0.7)_0%,rgba(8,145,178,0.5)_20%,transparent_40%)]", // Cyan-600
    emerald: "bg-[linear-gradient(to_bottom,#059669_0%,rgba(5,150,105,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(5,150,105,0.7)_0%,rgba(5,150,105,0.5)_20%,transparent_40%)]", // Emerald-600
    amber: "bg-[linear-gradient(to_bottom,#d97706_0%,rgba(217,119,6,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(217,119,6,0.7)_0%,rgba(217,119,6,0.5)_20%,transparent_40%)]", // Amber-600
    rose: "bg-[linear-gradient(to_bottom,#e11d48_0%,rgba(225,29,72,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(225,29,72,0.7)_0%,rgba(225,29,72,0.5)_20%,transparent_40%)]", // Rose-600
    indigo: "bg-[linear-gradient(to_bottom,#4f46e5_0%,rgba(79,70,229,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(79,70,229,0.7)_0%,rgba(79,70,229,0.5)_20%,transparent_40%)]", // Indigo-600
    slate: "bg-[linear-gradient(to_bottom,#475569_0%,rgba(71,85,105,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(71,85,105,0.7)_0%,rgba(71,85,105,0.5)_20%,transparent_40%)]", // Slate-600
    blue: "bg-[linear-gradient(to_bottom,#2563eb_0%,rgba(37,99,235,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(37,99,235,0.7)_0%,rgba(37,99,235,0.5)_20%,transparent_40%)]", // Blue-600
    colegium: "bg-[linear-gradient(to_bottom,#9333ea_0%,rgba(147,51,234,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(147,51,234,0.7)_0%,rgba(147,51,234,0.5)_20%,transparent_40%)]",
    red: "bg-[linear-gradient(to_bottom,#dc2626_0%,rgba(220,38,38,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(220,38,38,0.7)_0%,rgba(220,38,38,0.5)_20%,transparent_40%)]", // Red-600
    yellow: "bg-[linear-gradient(to_bottom,#ca8a04_0%,rgba(202,138,4,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(202,138,4,0.7)_0%,rgba(202,138,4,0.5)_20%,transparent_40%)]", // Yellow-600
    ice: "bg-[linear-gradient(to_bottom,#0284c7_0%,rgba(2,132,199,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(2,132,199,0.7)_0%,rgba(2,132,199,0.5)_20%,transparent_40%)]", // Sky-600 (Darker Ice)
    lime: "bg-[linear-gradient(to_bottom,#65a30d_0%,rgba(101,163,13,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(101,163,13,0.7)_0%,rgba(101,163,13,0.5)_20%,transparent_40%)]" // Lime-600
};

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
    children,
    leftSidebar,
    mainContent,
    rightSidebar,
    header,
    gradientTheme = 'indigo',
    className = '',
    layoutMode = 'standard',
    backgroundMode = 'card',
    transparentColumns = false,
    id
}) => {

    const activeGradient = gradients[gradientTheme];

    // Grid Column Logic ... (Keep existing)
    let gridCols = 'grid-cols-1 md:grid-cols-[2fr_5.5fr_2.5fr]';

    if (layoutMode === 'compact') {
        gridCols = 'grid-cols-1 md:grid-cols-[1fr_8fr_1fr]';
    } else if (layoutMode === 'colegium') {
        gridCols = 'grid-cols-1 md:grid-cols-[2.5fr_7.5fr]';
    } else if (layoutMode === 'zen') {
        gridCols = 'grid-cols-1';
    }

    const columnClass = `h-full min-h-0 flex flex-col relative z-20 ${transparentColumns || layoutMode === 'zen' ? 'bg-transparent shadow-none border-0' : 'bg-transparent shadow-premium'} rounded-2xl ${(layoutMode === 'colegium' || layoutMode === 'zen') ? 'overflow-hidden' : 'overflow-y-auto'} ${layoutMode === 'zen' ? 'p-0' : 'p-6'} scrollbar-hide`;

    const isZen = layoutMode === 'zen';

    return (
        <div id={id} className={`w-full flex flex-col ${isZen ? 'h-full p-0 py-6' : 'h-full px-4 lg:px-8 py-6'} ${className} relative`}>

            {/* Absolute Background for Screen Mode (Migrator Style) */}
            {backgroundMode === 'screen' && (
                <div className={`absolute inset-0 pointer-events-none rounded-3xl z-0 ${activeGradient}`} />
            )}

            {/* Header / Navbar Area */}
            {header && !isZen && (
                <div className="flex-shrink-0 mb-4 z-30 relative">
                    {header}
                </div>
            )}

            {/* Main Container */}
            <div className={`flex-1 grid ${gridCols} gap-4 overflow-hidden ${isZen ? 'rounded-none border-0 bg-slate-50 dark:bg-slate-900' : backgroundMode === 'screen' ? 'p-4' : `rounded-3xl p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5 ${activeGradient}`} ${className}`}>

                {/* Left Sidebar Column */}
                <div className={columnClass}>
                    {leftSidebar}
                </div>

                {/* Main Content Column */}
                <div className={columnClass}>
                    {mainContent}
                </div>

                {/* Right Sidebar Column */}
                {layoutMode !== 'colegium' && (
                    <div className={columnClass}>
                        {rightSidebar}
                    </div>
                )}

            </div>
            {children}
        </div>
    );
};

import React from 'react';
import { useUI } from '../../../context/UIContext';

interface DashboardLayoutProps {
    header: React.ReactNode;
    leftColumn: React.ReactNode;
    centerColumn: React.ReactNode;
    rightColumn: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    header,
    leftColumn,
    centerColumn,
    rightColumn
}) => {
    const { compactMode } = useUI();

    return (
        <div className={`h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-32 transition-all duration-500 custom-scrollbar ${compactMode ? 'p-3' : 'p-6 lg:p-10'}`}>
            {/* Header Zone */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                {header}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column: Context (3 cols) */}
                <div className="md:col-span-12 lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                    {leftColumn}
                </div>

                {/* Center Column: Action (6 cols) -> On Tablet expands to 7/12 looks weird, use 8 or 9? 
                    Let's stick to simple responsive:
                    Desktop (LG): 3 - 6 - 3
                    Tablet (MD): 5 (Left+Right stacked?) - 7 (Center)? No, standard is usually columns drop.
                    
                    Let's try a reflow logic:
                    LG: 3 | 6 | 3 (12 total)
                    MD: 4 | 8 (Right col drops to bottom or merges?)
                    
                    Simpler approach for MD:
                    Left (4) | Center (8)
                    Right (drops below Left or full width bottom)
                */}
                <div className="md:col-span-7 lg:col-span-6 space-y-6 animate-in fade-in zoom-in-95 duration-700 delay-200">
                    {centerColumn}
                </div>

                {/* Right Column: Intelligence (TR 3 cols) */}
                <div className="md:col-span-5 lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                    {rightColumn}
                </div>
            </div>
        </div>
    );
};

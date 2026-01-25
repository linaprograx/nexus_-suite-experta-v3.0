import React from 'react';

interface ChampionColumnProps {
    title: string;
    children?: React.ReactNode;
    accentColor?: string;
    scrollable?: boolean;
    onDoubleClick?: () => void;
    isFocused?: boolean;
    className?: string;
}

export const ChampionColumn: React.FC<ChampionColumnProps> = ({
    title,
    children,
    accentColor = "bg-cyan-500",
    scrollable = false,
    onDoubleClick,
    isFocused = false,
    className = ""
}) => (
    <div
        onDoubleClick={onDoubleClick}
        className={`h-full flex flex-col overflow-hidden rounded-[30px] bg-transparent transition-all duration-500 ease-[cubic-bezier(0.18,0.89,0.32,1.28)] ${isFocused ? 'scale-[1.01] ring-2 ring-violet-400/30' : 'hover:scale-[1.005]'} ${className}`}
    >
        <div className="px-6 py-5 flex justify-between items-center select-none cursor-pointer">
            <h3 className="font-bold text-slate-600 tracking-wider text-[0.95rem] flex items-center gap-3 uppercase">
                <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
                {title}
            </h3>
        </div>

        {/* Content */}
        <div className={`flex-1 relative w-full min-h-0 ${scrollable ? "overflow-y-auto custom-scrollbar pb-32" : "overflow-hidden"}`}>
            {children}
        </div>
    </div>
);

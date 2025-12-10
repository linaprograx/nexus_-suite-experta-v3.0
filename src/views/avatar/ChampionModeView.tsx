import React from 'react';
import { CompetitionBriefPanel } from '../../features/champion-mode/components/CompetitionBriefPanel';
import { ChampionCreativePanel } from '../../features/champion-mode/components/ChampionCreativePanel';
import { ChampionFineTuningPanel } from '../../features/champion-mode/components/ChampionFineTuningPanel';

// Layout Helper
// Layout Helper
const ChampionColumn = ({
    title,
    children,
    accentColor = "bg-slate-500",
    scrollable = false,
    delay = 0
}: {
    title: string,
    children?: React.ReactNode,
    accentColor?: string,
    scrollable?: boolean,
    delay?: number
}) => (
    <div
        className={`h-full min-h-0 flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-white/5 backdrop-blur-xl shadow-[0px_4px_20px_rgba(0,0,0,0.06)]`}
    >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-semibold text-slate-200 tracking-wider text-[1.1rem] flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_12px_currentColor]`}></span>
                {title}
            </h3>
        </div>
        <div className={`flex-1 p-0 ${scrollable ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
            {children}
        </div>
    </div>
);

const ChampionModeView: React.FC = () => {
    return (
        <div className="h-[calc(100vh-6rem)] w-full grid grid-cols-1 xl:grid-cols-12 gap-6 text-slate-200 p-6 overflow-hidden">
            {/* Column 1: Briefing (3 cols) */}
            <div className="xl:col-span-3 h-full min-h-0">
                <ChampionColumn title="Brief de Competición" accentColor="bg-cyan-500 text-cyan-500" delay={100}>
                    <div className="p-4 h-full">
                        <CompetitionBriefPanel />
                    </div>
                </ChampionColumn>
            </div>

            {/* Column 2: Creative Engine (6 cols - Main Stage) */}
            <div className="xl:col-span-6 h-full min-h-0">
                <ChampionColumn title="Lienzo Creativo" accentColor="bg-violet-500 text-violet-500" scrollable={true} delay={200}>
                    <div className="p-4 h-full">
                        <ChampionCreativePanel />
                    </div>
                </ChampionColumn>
            </div>

            {/* Column 3: Fine Tuning (3 cols) */}
            <div className="xl:col-span-3 h-full min-h-0">
                <ChampionColumn title="Validación & Ajuste" accentColor="bg-fuchsia-500 text-fuchsia-500" delay={300}>
                    <div className="p-4 h-full">
                        <ChampionFineTuningPanel />
                    </div>
                </ChampionColumn>
            </div>
        </div>
    );
};

export default ChampionModeView;

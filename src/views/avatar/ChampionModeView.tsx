import React from 'react';

// ⚠️ VERIFICA QUE ESTOS ARCHIVOS EXISTAN — SI ALGUNO NO EXISTE → ERROR 500
import { CompetitionBriefPanel } from '../../features/champion-mode/components/CompetitionBriefPanel';
import { ChampionCreativePanel } from '../../features/champion-mode/components/ChampionCreativePanel';
import { ChampionFineTuningPanel } from '../../features/champion-mode/components/ChampionFineTuningPanel';
import { ChampionPresentationView } from '../../features/champion-mode/components/ChampionPresentationView';

import { useChampionCreativeEngine } from '../../features/champion-mode/hooks/useChampionCreativeEngine';
import { ChampionProvider } from '../../features/champion-mode/context/ChampionContext';

// UI
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';


const ChampionColumn = ({
    title,
    children,
    accentColor = "bg-cyan-500",
    scrollable = false,
    onDoubleClick,
    isFocused = false,
    className = ""
}: {
    title: string;
    children?: React.ReactNode;
    accentColor?: string;
    scrollable?: boolean;
    onDoubleClick?: () => void;
    isFocused?: boolean;
    className?: string;
}) => (
    <div
        onDoubleClick={onDoubleClick}
        className={`h-full flex flex-col overflow-hidden rounded-[30px] bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border border-white/40 transition-all duration-500 ease-[cubic-bezier(0.18,0.89,0.32,1.28)] ${isFocused ? 'scale-[1.01] ring-2 ring-violet-400/30' : 'hover:scale-[1.005]'} ${className}`}
    >
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-200/40 select-none cursor-pointer">
            <h3 className="font-bold text-slate-600 tracking-wider text-[0.95rem] flex items-center gap-3 uppercase">
                <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
                {title}
            </h3>
            <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Double-click to Focus</span>
        </div>

        {/* Content */}
        <div className={`flex-1 relative ${scrollable ? "overflow-y-auto custom-scrollbar" : "overflow-hidden"}`}>
            {children}
        </div>
    </div>
);


const ChampionModeView: React.FC = () => {
    const engine = useChampionCreativeEngine();
    const { viewMode } = engine.state;
    const [focusCol, setFocusCol] = React.useState<number | null>(null);

    const handleFocus = (colIndex: number) => {
        soundEngine.playSlide();
        setFocusCol(prev => prev === colIndex ? null : colIndex);
    };

    return (
        <ChampionProvider engine={engine}>
            <div className="h-[calc(100vh-6rem)] w-full p-6 overflow-hidden relative font-sans">

                {/* PRESENTATION VIEW */}
                {viewMode === 'PRESENTATION' ? (
                    <ChampionPresentationView />
                ) : (
                    <div className="h-full w-full flex flex-col gap-6 relative z-10">

                        {/* STEP INDICATOR - Hide when focused to save space */}
                        <div className={`w-full flex justify-center items-center gap-4 transition-all duration-500 ${focusCol !== null ? 'opacity-0 -mt-10 pointer-events-none' : 'opacity-100'}`}>
                            {['Briefing', 'Motor Creativo', 'Validación', 'Plan'].map((step, i) => (
                                <div key={step} className="flex items-center gap-2">

                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border 
                                        ${i === 1
                                            ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30'
                                            : 'bg-white border-slate-200 text-slate-400'}
                                    `}>
                                        {i + 1}
                                    </div>

                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${i === 1 ? "text-violet-600" : "text-slate-300"}`}>
                                        {step}
                                    </span>

                                    {i < 3 && <div className="w-8 h-[1px] bg-slate-100" />}
                                </div>
                            ))}
                        </div>

                        {/* 3-COLUMN LAYOUT */}
                        <div className={`flex-1 w-full grid gap-8 min-h-0 transition-all duration-500 ease-[cubic-bezier(0.18,0.89,0.32,1.28)] ${focusCol === 1 ? 'grid-cols-[1fr_0fr_0fr]' :
                                focusCol === 2 ? 'grid-cols-[0fr_1fr_0fr]' :
                                    focusCol === 3 ? 'grid-cols-[0fr_0fr_1fr]' :
                                        'grid-cols-1 xl:grid-cols-[28fr_44fr_28fr]'
                            }`}>

                            {/* COLUMN 1 */}
                            <div className={`h-full min-h-0 transition-all duration-500 ${focusCol && focusCol !== 1 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
                                <ChampionColumn
                                    title="Brief de Competición"
                                    accentColor="bg-cyan-500"
                                    onDoubleClick={() => handleFocus(1)}
                                    isFocused={focusCol === 1}
                                >
                                    <div className="p-5">
                                        <CompetitionBriefPanel />
                                    </div>
                                </ChampionColumn>
                            </div>

                            {/* COLUMN 2 */}
                            <div className={`h-full min-h-0 transition-all duration-500 ${focusCol && focusCol !== 2 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
                                <ChampionColumn
                                    title="Lienzo Creativo"
                                    accentColor="bg-violet-500"
                                    scrollable
                                    onDoubleClick={() => handleFocus(2)}
                                    isFocused={focusCol === 2}
                                >
                                    <div className="p-5">
                                        <ChampionCreativePanel />
                                    </div>
                                </ChampionColumn>
                            </div>

                            {/* COLUMN 3 */}
                            <div className={`h-full min-h-0 transition-all duration-500 ${focusCol && focusCol !== 3 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>
                                <ChampionColumn
                                    title="Plan de Entrenamiento"
                                    accentColor="bg-emerald-500"
                                    onDoubleClick={() => handleFocus(3)}
                                    isFocused={focusCol === 3}
                                >
                                    <div className="p-5">
                                        <ChampionFineTuningPanel />
                                    </div>
                                </ChampionColumn>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </ChampionProvider>
    );
};

export default ChampionModeView;

import React from 'react';
import { useChampionCreativeEngine } from '../../features/champion-mode/hooks/useChampionCreativeEngine';
import { ChampionProvider } from '../../features/champion-mode/context/ChampionContext';
import { ChampionIntroBanner } from '../../features/champion-mode/components/ChampionIntroBanner';

// Views
import { ChampionBriefingView } from '../../features/champion-mode/components/views/ChampionBriefingView';
import { ChampionCreativeView } from '../../features/champion-mode/components/views/ChampionCreativeView';
import { ChampionValidationView } from '../../features/champion-mode/components/views/ChampionValidationView';
import { ChampionPlanView } from '../../features/champion-mode/components/views/ChampionPlanView';
import { ChampionPresentationView } from '../../features/champion-mode/components/ChampionPresentationView';

export const ChampionModeView: React.FC = () => {
    const engine = useChampionCreativeEngine();
    const { viewMode } = engine.state;
    const [activeStepIndex, setActiveStepIndex] = React.useState(0);

    const renderActiveView = () => {
        if (viewMode === 'PRESENTATION') return <ChampionPresentationView />;

        switch (activeStepIndex) {
            case 0: return <ChampionBriefingView />;
            case 1: return <ChampionCreativeView />;
            case 2: return <ChampionValidationView />;
            case 3: return <ChampionPlanView />;
            default: return <ChampionBriefingView />;
        }
    };

    return (
        <ChampionProvider engine={engine}>
            <div className="w-full h-[calc(100vh-7rem)] p-6 relative flex flex-col font-sans overflow-hidden overscroll-none">

                {/* INTRO BANNER (Only in Design Mode) */}
                {viewMode !== 'PRESENTATION' && <ChampionIntroBanner />}

                {/* NAVIGATION BAR - FIXED & INTERACTIVE */}
                <div className={`w-full flex justify-center items-center gap-4 transition-all duration-500 mb-8 z-50 ${viewMode === 'PRESENTATION' ? 'opacity-30 hover:opacity-100' : 'opacity-100 relative'}`}>
                    {['Briefing', 'Motor Creativo', 'Validación', 'Plan'].map((step, i) => {
                        const isActive = activeStepIndex === i;
                        return (
                            <div
                                key={step}
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => {
                                    if (i === 3) {
                                        setActiveStepIndex(3);
                                        // engine.actions.setViewMode('DESIGN'); // Optional: force exit
                                    } else {
                                        setActiveStepIndex(i);
                                        engine.actions.setViewMode('DESIGN'); // Exit presentation on nav click
                                    }
                                }}
                            >
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300
                                    ${isActive
                                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30 scale-110'
                                        : 'bg-white border-slate-200 text-slate-400 group-hover:border-violet-300 group-hover:text-violet-500'}
                                `}>
                                    {i + 1}
                                </div>

                                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${isActive ? "text-violet-600" : "text-slate-300 group-hover:text-violet-400"}`}>
                                    {step}
                                </span>

                                {i < 3 && <div className={`w-8 h-[1px] transition-colors duration-300 ${isActive ? 'bg-violet-200' : 'bg-slate-100'}`} />}
                            </div>
                        );
                    })}
                </div>

                {/* ACTIVE VIEW CONTAINER */}
                <div className="flex-1 min-h-0 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {renderActiveView()}
                </div>

            </div>
        </ChampionProvider>
    );
};

export default ChampionModeView;

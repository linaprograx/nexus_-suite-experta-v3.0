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
            <div className="w-full min-h-full lg:h-full p-4 lg:p-6 relative flex flex-col font-sans lg:overflow-hidden lg:overscroll-none">

                {/* INTRO BANNER (Only in Design Mode) */}
                {viewMode !== 'PRESENTATION' && <ChampionIntroBanner />}

                {/* NAVIGATION BAR - FIXED & INTERACTIVE */}
                <div className={`w-full flex justify-center items-center gap-1.5 lg:gap-4 transition-all duration-500 mb-5 lg:mb-8 z-50 ${viewMode === 'PRESENTATION' ? 'opacity-30 hover:opacity-100' : 'opacity-100 relative'}`}>
                    {['Briefing', 'Motor Creativo', 'Validación', 'Plan'].map((step, i) => {
                        const isActive = activeStepIndex === i;
                        const isCompleted = i < activeStepIndex;
                        return (
                            <div
                                key={step}
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => {
                                    setActiveStepIndex(i);
                                    if (i !== 3) engine.actions.setViewMode('DESIGN');
                                }}
                            >
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300
                                    ${isActive
                                        ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30 scale-110'
                                        : isCompleted
                                        ? 'bg-rose-900/60 border-rose-700/60 text-rose-300'
                                        : 'bg-white/10 border-white/20 text-slate-400 group-hover:border-rose-400/50 group-hover:text-rose-300'}
                                `}>
                                    {isCompleted ? '✓' : i + 1}
                                </div>

                                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${isActive ? 'inline' : 'hidden lg:inline'} ${isActive ? 'text-rose-300' : isCompleted ? 'text-rose-500' : 'text-slate-500 group-hover:text-rose-400'}`}>
                                    {step}
                                </span>

                                {i < 3 && <div className={`w-3 lg:w-8 h-[1px] transition-colors duration-300 ${isCompleted ? 'bg-rose-700' : 'bg-white/10'}`} />}
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

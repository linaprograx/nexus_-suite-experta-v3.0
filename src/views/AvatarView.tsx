import React, { useState, useEffect } from 'react';
import { AvatarCoreView } from './avatar/AvatarCoreView';
import { AvatarIntelligenceView } from './avatar/AvatarIntelligenceView';
import AvatarInsightsView from './avatar/AvatarInsightsView';
import DigitalBarView from './avatar/DigitalBarView';
import ChampionModeView from './avatar/ChampionModeView';
import { useAvatarCognition } from '../hooks/useAvatarCognition';

interface AvatarViewProps {
    // Add props if needed (e.g., global state)
}

type AvatarTab = 'core' | 'intelligence' | 'insights' | 'digital-bar' | 'champion';

const AvatarView: React.FC<AvatarViewProps> = () => {
    const [activeTab, setActiveTab] = useState<AvatarTab>('core');
    const { isManagerActive } = useAvatarCognition();
    const showManagerTabs = isManagerActive();

    // Reset tab if current tab becomes hidden
    useEffect(() => {
        if (!showManagerTabs && (activeTab === 'insights' || activeTab === 'digital-bar')) {
            setActiveTab('core');
        }
    }, [showManagerTabs, activeTab]);

    // Vertical Gradients (Top-to-Bottom)
    const getGradientStyle = () => {
        switch (activeTab) {
            case 'core': return { background: 'linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.8) 20%, rgba(0,0,0,0) 40%)' };
            // REFINED GRADIENT for Legibility: Strong Rosé top, fast fade to transparent by 40% (Matched to PremiumLayout Standard)
            case 'intelligence': return { background: 'linear-gradient(180deg, #e11d48 0%, rgba(225, 29, 72, 0.8) 20%, rgba(225, 29, 72, 0) 40%)' };
            case 'insights': return { background: 'linear-gradient(180deg, #FB923C 0%, rgba(251, 146, 60, 0.8) 20%, rgba(0,0,0,0) 40%)' };
            case 'digital-bar': return { background: 'linear-gradient(180deg, #22D3EE 0%, rgba(34, 211, 238, 0.8) 20%, rgba(0,0,0,0) 40%)' };
            case 'champion': return { background: 'linear-gradient(180deg, #84CC16 0%, rgba(132, 204, 22, 0.8) 20%, rgba(0,0,0,0) 40%)' };
            default: return { background: 'none' };
        }
    };

    const getBorderClass = () => {
        switch (activeTab) {
            case 'core': return 'border-t border-[#6366F1]/30';
            case 'intelligence': return 'border-t border-rose-500/20'; // Rosé Border
            case 'insights': return 'border-t border-[#FB923C]/30';
            case 'digital-bar': return 'border-t border-[#22D3EE]/30';
            case 'champion': return 'border-t border-[#84CC16]/30';
            default: return 'border-t border-slate-700/20';
        }
    };

    return (
        <div className="h-full w-full flex flex-col px-4 lg:px-8 py-6 overflow-hidden">

            {/* Navigation Pill Container (Invisible BG) */}
            <div className="flex-shrink-0 mb-6 z-10 overflow-x-auto no-scrollbar">
                <div className="inline-flex p-1.5 rounded-full">
                    <button
                        onClick={() => setActiveTab('core')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === 'core'
                            ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Avatar Core
                    </button>

                    <button
                        onClick={() => setActiveTab('intelligence')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === 'intelligence'
                            ? 'bg-rose-500/80 text-white shadow-lg shadow-rose-500/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Avatar Intelligence
                    </button>

                    <button
                        onClick={() => setActiveTab('champion')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === 'champion'
                            ? 'bg-[#84CC16] text-white shadow-lg shadow-[#84CC16]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Modo Competición
                    </button>

                    {showManagerTabs && (
                        <>
                            <button
                                onClick={() => setActiveTab('insights')}
                                className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === 'insights'
                                    ? 'bg-[#FB923C] text-white shadow-lg shadow-[#FB923C]/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Performance Insights
                            </button>
                            <button
                                onClick={() => setActiveTab('digital-bar')}
                                className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === 'digital-bar'
                                    ? 'bg-[#22D3EE] text-white shadow-lg shadow-[#22D3EE]/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Digital Bar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Card */}
            <div
                className={`flex-1 w-full overflow-hidden rounded-[2rem] p-0 shadow-2xl ring-1 ring-white/10 border-b-0 relative transition-all duration-700 ${getBorderClass()}`}
                style={getGradientStyle()}
            >
                {/* Background Glows/Noise */}
                <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.02] pointer-events-none"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full pointer-events-none mix-blend-overlay"></div>

                {activeTab === 'core' && <AvatarCoreView />}
                {activeTab === 'intelligence' && <AvatarIntelligenceView />}
                {activeTab === 'champion' && <ChampionModeView />}
                {showManagerTabs && activeTab === 'insights' && <AvatarInsightsView />}
                {showManagerTabs && activeTab === 'digital-bar' && <DigitalBarView />}
            </div>
        </div>
    );
};

export default AvatarView;

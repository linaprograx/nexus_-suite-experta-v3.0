import React, { useState } from 'react';
import { AvatarCoreView } from './avatar/AvatarCoreView';
import AvatarInsightsView from './avatar/AvatarInsightsView';
import DigitalBarView from './avatar/DigitalBarView';
import ChampionModeView from './avatar/ChampionModeView';

interface AvatarViewProps {
    // Add props if needed (e.g., global state)
}

type AvatarTab = 'core' | 'insights' | 'digital-bar' | 'champion';

const AvatarView: React.FC<AvatarViewProps> = () => {
    const [activeTab, setActiveTab] = useState<AvatarTab>('core');

    // Vertical Gradients (Top-to-Bottom)
    const getGradientStyle = () => {
        switch (activeTab) {
            case 'core': return { background: 'linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.85) 45%, rgba(0,0,0,0) 100%)' };
            case 'insights': return { background: 'linear-gradient(180deg, #FB923C 0%, rgba(251, 146, 60, 0.1) 45%, rgba(0,0,0,0) 100%)' };
            case 'digital-bar': return { background: 'linear-gradient(180deg, #22D3EE 0%, rgba(34, 211, 238, 0.1) 45%, rgba(0,0,0,0) 100%)' };
            case 'champion': return { background: 'linear-gradient(180deg, #84CC16 0%, rgba(132, 204, 22, 0.1) 45%, rgba(0,0,0,0) 100%)' };
            default: return { background: 'none' };
        }
    };

    const getBorderClass = () => {
        switch (activeTab) {
            case 'core': return 'border-t border-[#6366F1]/30';
            case 'insights': return 'border-t border-[#FB923C]/30';
            case 'digital-bar': return 'border-t border-[#22D3EE]/30';
            case 'champion': return 'border-t border-[#84CC16]/30';
            default: return 'border-t border-slate-700/20';
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col px-4 lg:px-8 py-6">

            {/* Navigation Pill Container (Invisible) */}
            <div className="flex-shrink-0 mb-6 z-10">
                <div className="inline-flex p-1.5 rounded-full">
                    <button
                        onClick={() => setActiveTab('core')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'core'
                            ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Avatar Core
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'insights'
                            ? 'bg-[#FB923C] text-white shadow-lg shadow-[#FB923C]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Performance Insights
                    </button>
                    <button
                        onClick={() => setActiveTab('digital-bar')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'digital-bar'
                            ? 'bg-[#22D3EE] text-white shadow-lg shadow-[#22D3EE]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Digital Bar
                    </button>
                    <button
                        onClick={() => setActiveTab('champion')}
                        className={`py-2 px-6 text-xs font-bold rounded-full transition-all duration-300 ${activeTab === 'champion'
                            ? 'bg-[#84CC16] text-white shadow-lg shadow-[#84CC16]/25'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Modo Competición
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div
                className={`flex-1 overflow-hidden rounded-[2rem] p-6 shadow-2xl ring-1 ring-white/10 border-b-0 relative transition-all duration-700 ${getBorderClass()}`}
                style={getGradientStyle()}
            >
                {/* Background Glows/Noise */}
                <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.02] pointer-events-none"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full pointer-events-none mix-blend-overlay"></div>

                {activeTab === 'core' && <AvatarCoreView />}
                {activeTab === 'insights' && <AvatarInsightsView />}
                {activeTab === 'digital-bar' && <DigitalBarView />}
                {activeTab === 'champion' && <ChampionModeView />}
            </div>
        </div>
    );
};

export default AvatarView;

import React, { useState, useEffect } from 'react';
import { AvatarCoreView } from './avatar/AvatarCoreView';
import { AvatarIntelligenceView } from './avatar/AvatarIntelligenceView';
import AvatarInsightsView from './avatar/AvatarInsightsView';
import DigitalBarView from './avatar/DigitalBarView';
import ChampionModeView from './avatar/ChampionModeView';
import { useAvatarCognition } from '../hooks/useAvatarCognition';
import { usarAcentoDeSeccion } from '../store/acentoStore';
// import { Button } from '../components/ui/Button'; // Removed in favor of native button for styling control

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

    /**
     * UN SOLO degradado para toda la sección, el rojo de «Inteligencia».
     *
     * Cada pestaña tenía el suyo —negro, rojo, naranja, cian, violeta— y el
     * resultado era que Avatar no tenía color: tenía cinco. Con el resaltado de
     * la barra lateral llevando ahora el color de cada sección, eso dejaba a
     * Avatar sin poder coincidir con nada.
     *
     * `#e11d48` es el que ya usaba «Inteligencia», elegido por el fundador. Las
     * pestañas se distinguen por su rótulo y su píldora activa, que es lo que
     * de verdad se mira; el degradado dice a qué SECCIÓN has entrado.
     */
    const COLOR_AVATAR = '#e11d48';

    // Se publica igual que en CerebrIty, para que todo lo que quiera ir a juego
    // —barra lateral incluida— lea el mismo valor y no una copia suya.
    usarAcentoDeSeccion(COLOR_AVATAR);

    const getGradientStyle = () => ({
        background: `linear-gradient(180deg, ${COLOR_AVATAR} 0%, rgba(225, 29, 72, 0.8) 20%, rgba(225, 29, 72, 0) 40%)`,
    });

    // Determine current page title/subtitle based on active tab
    const getPageHeaderInfo = () => {
        switch (activeTab) {
            case 'core': return { subtitle: 'Identidad Digital', themeColor: 'text-[#6366F1]' };
            case 'intelligence': return { subtitle: 'Cognición Activa', themeColor: 'text-rose-500' };
            case 'champion': return { subtitle: 'Modo Competición', themeColor: 'text-violet-400' };
            case 'insights': return { subtitle: 'Performance Insights', themeColor: 'text-[#FB923C]' };
            case 'digital-bar': return { subtitle: 'Gestión Operativa', themeColor: 'text-[#22D3EE]' };
            default: return { subtitle: 'System', themeColor: 'text-slate-400' };
        }
    };

    const headerInfo = getPageHeaderInfo();

    return (
        <div className="min-h-full w-full flex flex-col relative">
            {/* VIBRANT GRADIENT BACKGROUND (Full Screen with Floating feel via internal padding) */}
            <div
                className="fixed lg:absolute inset-x-0 top-0 h-[100dvh] lg:h-full pointer-events-none transition-all duration-700 ease-in-out z-0 rounded-3xl"
                style={getGradientStyle()}
            />

            {/* Background Glows/Noise */}
            <div className="fixed lg:absolute inset-x-0 top-0 h-[100dvh] lg:h-full overflow-hidden z-0 pointer-events-none rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.02]"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-white/5 blur-[100px] rounded-full mix-blend-overlay"></div>
            </div>

            {/* PERSISTENT HEADER SECTION */}
            <div className="flex-shrink-0 pt-2 lg:pt-8 pb-3 lg:pb-4 z-10 relative px-4 lg:px-12">

                {/* Titles */}
                <div className="flex flex-col items-start gap-1 mb-4 lg:mb-6">
                    <h1 className="text-[2.25rem] lg:text-8xl font-black italic text-white tracking-tighter drop-shadow-2xl leading-none opacity-90 pl-1"
                        style={{ fontFamily: 'Georgia, serif' }}>
                        Avatar
                    </h1>
                    <span className="text-base lg:text-2xl font-bold text-white/80 tracking-wide drop-shadow-md flex items-center gap-2 font-sans ml-2">
                        {headerInfo.subtitle}
                    </span>
                </div>

                {/* Navigation Pills - Standard Nexus Style (Pills) */}
                <div className="flex lg:flex-wrap justify-start gap-2 lg:gap-3 overflow-x-auto lg:overflow-visible no-scrollbar snap-x snap-mandatory -mx-1 px-1 animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
                    <button
                        onClick={() => setActiveTab('core')}
                        className={`shrink-0 snap-start rounded-full transition-all duration-300 px-4 lg:px-8 h-10 lg:py-3 text-[10px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest border ${activeTab === 'core'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40 scale-105'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        Núcleo
                    </button>

                    <button
                        onClick={() => setActiveTab('intelligence')}
                        className={`shrink-0 snap-start rounded-full transition-all duration-300 px-4 lg:px-8 h-10 lg:py-3 text-[10px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest border ${activeTab === 'intelligence'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40 scale-105'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        Inteligencia
                    </button>

                    <button
                        onClick={() => setActiveTab('champion')}
                        className={`shrink-0 snap-start rounded-full transition-all duration-300 px-4 lg:px-8 h-10 lg:py-3 text-[10px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest border ${activeTab === 'champion'
                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/40 scale-105'
                            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        Competición
                    </button>

                    {showManagerTabs && (
                        <>
                            <div className="w-px h-8 bg-white/20 mx-2 self-center" />
                            <button
                                onClick={() => setActiveTab('insights')}
                                className={`shrink-0 snap-start rounded-full transition-all duration-300 px-4 lg:px-8 h-10 lg:py-3 text-[10px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest border ${activeTab === 'insights'
                                    ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/40 scale-105'
                                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                Insights
                            </button>
                            <button
                                onClick={() => setActiveTab('digital-bar')}
                                className={`shrink-0 snap-start rounded-full transition-all duration-300 px-4 lg:px-8 h-10 lg:py-3 text-[10px] lg:text-xs font-black uppercase tracking-wider lg:tracking-widest border ${activeTab === 'digital-bar'
                                    ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-900/40 scale-105'
                                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                Bar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA - Maximize Space */}
            <div className="flex-1 w-full lg:overflow-hidden relative z-10 flex flex-col min-h-0">
                <div className="flex-1 w-full lg:h-full relative lg:overflow-y-auto no-scrollbar bg-transparent px-4 md:px-12 pb-24 lg:pb-12">
                    {activeTab === 'core' && <AvatarCoreView />}
                    {activeTab === 'intelligence' && <AvatarIntelligenceView />}
                    {activeTab === 'champion' && <ChampionModeView />}
                    {showManagerTabs && activeTab === 'insights' && <AvatarInsightsView />}
                    {showManagerTabs && activeTab === 'digital-bar' && <DigitalBarView />}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default AvatarView;

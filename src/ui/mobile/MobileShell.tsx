import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import './mobile.css';
import Atmosphere from './components/Atmosphere';
import BottomNav from './components/BottomNav';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import GrimorioRecipes from './views/GrimorioRecipes';
import GrimorioStock from './views/GrimorioStock';
import GrimorioMarket from './views/GrimorioMarket';
import Pizarron from './views/Pizarron';
import CerebritySynthesis from './views/CerebritySynthesis';
import CerebrityCritic from './views/CerebrityCritic';
import CerebrityMakeMenu from './views/CerebrityMakeMenu';
import CerebrityLab from './views/CerebrityLab';
import CerebrityTrend from './views/CerebrityTrend';
import Colegium from './views/Colegium';
import Personal from './views/Personal';
import Avatar from './views/Avatar';
import { PageName, UserProfile } from './types';

export const MobileShell: React.FC = () => {
    // Local state for navigation
    const [currentPage, setCurrentPage] = useState<PageName>(PageName.Login);

    // Dummy user for UI dev (will link to real context in Phase 4)
    const [user] = useState<UserProfile>({
        name: 'Lian Alviz',
        photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
        role: 'Bar Manager'
    });

    const handleUnlock = () => {
        // Simulate unlock delay if needed, or just switch
        setCurrentPage(PageName.Dashboard);
    };

    const handleNavigate = (page: string) => {
        // Cast string to PageName if valid, logic to be refined
        setCurrentPage(page as PageName);
    };

    // Simple notify mock
    const notify = (msg: string, type: 'success' | 'error' | 'loading' = 'success') => {
        console.log(`[MobileShell] Notify: ${msg} (${type})`);
    };

    const renderContent = () => {
        switch (currentPage) {
            case PageName.Login:
                return <Login onUnlock={handleUnlock} user={user} />;
            case PageName.Dashboard:
                return <Dashboard onNavigate={handleNavigate as any} user={user} />;
            case PageName.GrimorioRecipes:
                return <GrimorioRecipes onNavigate={handleNavigate as any} user={user} />;
            case PageName.GrimorioStock:
                return <GrimorioStock onNavigate={handleNavigate as any} user={user} />;
            case PageName.GrimorioMarket:
                return <GrimorioMarket onNavigate={handleNavigate as any} user={user} />;
            case PageName.Pizarron:
                return <Pizarron onNavigate={handleNavigate as any} user={user} notify={notify} />;
            case PageName.CerebritySynthesis:
                return <CerebritySynthesis onNavigate={handleNavigate as any} user={user} notify={notify} />;
            case PageName.CerebrityCritic:
                return <CerebrityCritic onNavigate={handleNavigate as any} />;
            case PageName.CerebrityLab:
                return <CerebrityLab onNavigate={handleNavigate as any} />;
            case PageName.CerebrityTrend:
                return <CerebrityTrend onNavigate={handleNavigate as any} />;
            case PageName.CerebrityMakeMenu:
                return <CerebrityMakeMenu onNavigate={handleNavigate as any} />;
            case PageName.Colegium:
                return <Colegium onNavigate={handleNavigate as any} />;
            case PageName.Personal:
                return <Personal onNavigate={handleNavigate as any} user={user} />;
            case PageName.AvatarCore:
            case PageName.AvatarIntelligence:
            case PageName.AvatarCompetition:
                return <Avatar onNavigate={handleNavigate as any} user={user} notify={notify} initialTab={currentPage === PageName.AvatarIntelligence ? 'Intelligence' : currentPage === PageName.AvatarCompetition ? 'Competition' : 'Core'} />;
            default:
                // Fallback to dashboard for implemented views, placeholder for others
                if (currentPage === PageName.Dashboard) return <Dashboard onNavigate={handleNavigate as any} user={user} />;
                return (
                    <div className="flex items-center justify-center h-full text-neu-sec">
                        <p>Work in progress: {currentPage}</p>
                    </div>
                );
        }
    };

    return (
        <div className="mobile-layer-root flex items-center justify-center bg-slate-900">
            {/* Phone Frame Container */}
            <div className="relative w-full max-w-[390px] h-full max-h-[844px] overflow-hidden shadow-2xl md:rounded-[3rem] border-[8px] border-[#EFEEEE] flex flex-col font-sans bg-[#EFEEEE] neu-flat text-[#3E4E5E]">

                {/* Atmosphere Layer */}
                <Atmosphere currentPage={currentPage} />

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-[100] flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className={`px-8 pt-6 pb-1 flex justify-between items-center text-xs font-semibold z-[60] transition-colors duration-500 pointer-events-none ${currentPage === PageName.Login ? 'text-white' : 'text-slate-800'}`}>
                    <span>9:41</span>
                    <div className="flex gap-1.5 items-center">
                        <span className="material-symbols-outlined text-[16px]">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[16px]">wifi</span>
                        <span className="material-symbols-outlined text-[16px]">battery_full</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
                    <AnimatePresence mode="wait">
                        <div key={currentPage} className="h-full w-full flex flex-col">
                            {renderContent()}
                        </div>
                    </AnimatePresence>
                </div>

                {/* Navigation (Hidden on Login) */}
                {currentPage !== PageName.Login && (
                    <BottomNav currentPage={currentPage} onNavigate={handleNavigate as any} />
                )}

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/10 rounded-full z-[110] pointer-events-none"></div>
            </div>
        </div>
    );
};

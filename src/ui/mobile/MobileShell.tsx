import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import FloatingBottomNav from './components/FloatingBottomNav';
import MobileRoutes from './MobileRoutes';
import { PageName, PAGE_THEMES } from './types';
import { useLocation, useNavigate, BrowserRouter } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MobileShellContent: React.FC = () => {
    const { user, isAuthReady } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    // Authentication check: Redirect to login if not authenticated and auth is ready
    useEffect(() => {
        if (isAuthReady && !user && location.pathname !== '/login') {
            navigate('/login');
        }
    }, [isAuthReady, user, navigate, location.pathname]);

    // Determine current page from path
    const getCurrentPage = (): PageName => {
        const path = location.pathname;
        if (path === '/') return PageName.Dashboard;

        // Grimorio
        if (path.includes('/grimorio/recipes')) return PageName.GrimorioRecipes;
        if (path.includes('/grimorio/stock')) return PageName.GrimorioStock;
        if (path.includes('/grimorio/market')) return PageName.GrimorioMarket;

        // Cerebrity (Check specific sub-routes first!)
        if (path.includes('/cerebrity/critic')) return PageName.CerebrityCritic;
        if (path.includes('/cerebrity/lab')) return PageName.CerebrityLab;
        if (path.includes('/cerebrity/trend')) return PageName.CerebrityTrend;
        if (path.includes('/cerebrity/make-menu')) return PageName.CerebrityMakeMenu;
        if (path.includes('/cerebrity')) return PageName.CerebritySynthesis; // Default for /cerebrity

        // Avatar (Check specific sub-routes first!)
        if (path.includes('/avatar/intelligence')) return PageName.AvatarIntelligence;
        if (path.includes('/avatar/competition')) return PageName.AvatarCompetition;
        if (path.includes('/avatar')) return PageName.AvatarCore; // Default for /avatar

        if (path.includes('/pizarron')) return PageName.Pizarron;
        if (path.includes('/colegium')) return PageName.Colegium;
        if (path.includes('/personal')) return PageName.Personal;
        if (path.includes('/login')) return PageName.Login;

        return PageName.Dashboard; // Default
    };

    const currentPage = getCurrentPage();
    const theme = PAGE_THEMES[currentPage] || PAGE_THEMES['default'];

    // Notifications
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null);

    const notify = (msg: string, type: 'success' | 'error' | 'loading' = 'success') => {
        setToast({ msg, type });
        if (type !== 'loading') {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleNavigate = (page: PageName) => {
        navigate(getRouteForPage(page));
    };

    if (!isAuthReady) return <div className="h-[100dvh] w-full bg-slate-900 flex items-center justify-center text-white">Loading Nexus...</div>;

    // Determine background based on page - all pages use light background now
    const bgColor = 'bg-slate-100';
    const frameBg = 'bg-[#F8F9FA]';

    return (
        <div className={`h-[100dvh] w-full overflow-hidden flex items-center justify-center font-sans text-slate-900 selection:bg-indigo-500/30 ${bgColor}`}>

            {/* Phone Frame */}
            <div className={`w-full h-full max-w-md relative overflow-hidden flex flex-col phone-frame ${frameBg}`}>

                {/* Atmospheric Gradient Layer */}
                <div
                    className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none transition-opacity duration-700 ease-in-out opacity-90 gradient-mask-bottom"
                    style={{
                        background: theme.gradient,
                    }}
                />

                {/* 1. Status Bar (Visual Only + Safe Area) */}
                <div className="w-full flex justify-between items-end px-6 pb-2 z-50 select-none pointer-events-none bg-transparent pt-[env(safe-area-inset-top)] min-h-[env(safe-area-inset-top)]">
                    <span className="text-[10px] font-black text-neu-main tracking-widest mix-blend-multiply opacity-80">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex gap-1.5 opacity-80 mix-blend-multiply text-neu-main">
                        <span className="material-symbols-outlined text-[10px]">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[10px]">wifi</span>
                        <span className="material-symbols-outlined text-[10px]">battery_5_bar</span>
                    </div>
                </div>

                {/* 2. Main Content Area with Custom Scrollbar */}
                <div className="flex-1 relative z-10 overflow-y-auto custom-scroll pb-32">
                    <MobileRoutes user={user!} notify={notify} onNavigate={handleNavigate} />
                </div>

                {/* 3. Bottom Navigation - New Floating Style */}
                {currentPage !== PageName.Login && (
                    <FloatingBottomNav currentPage={currentPage} onNavigate={handleNavigate} />
                )}

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent pointer-events-none z-40"></div>

                {/* 4. Notification Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-14 left-0 right-0 z-[100] flex justify-center pointer-events-none"
                        >
                            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                                {toast.type === 'loading' ? (
                                    <span className="material-symbols-outlined animate-spin text-sm text-yellow-500">sync</span>
                                ) : toast.type === 'error' ? (
                                    <span className="material-symbols-outlined text-sm text-rose-500">error</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                                )}
                                <span className="text-xs font-bold tracking-wide">{toast.msg}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

const MobileShell: React.FC = () => {
    return (
        <BrowserRouter>
            <MobileShellContent />
        </BrowserRouter>
    );
};

// Helper for navigation
function getRouteForPage(page: PageName): string {
    switch (page) {
        case PageName.Dashboard: return '/';
        case PageName.GrimorioRecipes: return '/grimorio/recipes';
        case PageName.GrimorioStock: return '/grimorio/stock';
        case PageName.GrimorioMarket: return '/grimorio/market';
        case PageName.Pizarron: return '/pizarron';
        case PageName.CerebritySynthesis: return '/cerebrity/synthesis';
        case PageName.CerebrityCritic: return '/cerebrity/critic';
        case PageName.CerebrityLab: return '/cerebrity/lab';
        case PageName.CerebrityTrend: return '/cerebrity/trend';
        case PageName.CerebrityMakeMenu: return '/cerebrity/make-menu';
        case PageName.AvatarCore: return '/avatar/core';
        case PageName.AvatarIntelligence: return '/avatar/intelligence';
        case PageName.AvatarCompetition: return '/avatar/competition';
        case PageName.Colegium: return '/colegium';
        case PageName.Personal: return '/personal';
        case PageName.Login: return '/login';
        default: return '/';
    }
}

export default MobileShell;

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import FloatingBottomNav from './components/FloatingBottomNav';
import MobileRoutes from './MobileRoutes';
import { PageName, PAGE_THEMES } from './types';
import { useLocation, useNavigate, BrowserRouter } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MobileShellContent: React.FC = () => {
    const { user, isAuthReady } = useApp();
    const { compactMode } = useUI();
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

    // Desktop-Parity Gradients (from PremiumLayout.tsx)
    const gradients: Record<string, string> = {
        violet: "bg-[linear-gradient(to_bottom,#4c1d95_0%,#6d28d9_20%,#8b5cf600_45%)] dark:bg-[linear-gradient(to_bottom,#4c1d95_0%,#6d28d9_20%,#8b5cf600_45%)]",
        cyan: "bg-[linear-gradient(to_bottom,rgb(6,182,212)_0%,rgba(6,182,212,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(6,182,212,0.7)_0%,rgba(6,182,212,0.5)_20%,transparent_45%)]",
        emerald: "bg-[linear-gradient(to_bottom,#064e3b_0%,#059669_20%,#10b98100_45%)] dark:bg-[linear-gradient(to_bottom,#064e3b_0%,#059669_20%,#10b98100_45%)]",
        amber: "bg-[linear-gradient(to_bottom,rgb(180,83,9)_0%,rgba(245,158,11,0.8)_35%,rgba(245,158,11,0)_85%)] dark:bg-[linear-gradient(to_bottom,rgb(180,83,9)_0%,rgba(245,158,11,0.8)_35%,rgba(245,158,11,0)_85%)]",
        rose: "bg-[linear-gradient(to_bottom,rgb(244,63,94)_0%,rgba(244,63,94,0.8)_20%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,rgba(244,63,94,0.7)_0%,rgba(244,63,94,0.5)_20%,transparent_40%)]",
        indigo: "bg-[linear-gradient(to_bottom,rgb(99,102,241)_0%,rgba(99,102,241,0.8)_20%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,rgba(99,102,241,0.7)_0%,rgba(99,102,241,0.5)_20%,transparent_40%)]",
        slate: "bg-[linear-gradient(to_bottom,rgb(100,116,139)_0%,rgba(100,116,139,0.8)_20%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,rgba(100,116,139,0.7)_0%,rgba(100,116,139,0.5)_20%,transparent_40%)]",
        blue: "bg-[linear-gradient(to_bottom,#1e3a8a_0%,#2563eb_20%,#3b82f600_45%)] dark:bg-[linear-gradient(to_bottom,#1e3a8a_0%,#2563eb_20%,#3b82f600_45%)]",
        colegium: "bg-[linear-gradient(to_bottom,rgb(147,51,234)_0%,rgba(147,51,234,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(147,51,234,0.7)_0%,rgba(147,51,234,0.5)_20%,transparent_45%)]",
        red: "bg-[linear-gradient(to_bottom,rgb(239,68,68)_0%,rgba(239,68,68,0.8)_20%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,rgba(239,68,68,0.7)_0%,rgba(239,68,68,0.5)_20%,transparent_40%)]",
        yellow: "bg-[linear-gradient(to_bottom,rgb(234,179,8)_0%,rgba(234,179,8,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(234,179,8,0.7)_0%,rgba(234,179,8,0.5)_20%,transparent_45%)]",
        ice: "bg-[linear-gradient(to_bottom,rgb(14,165,233)_0%,rgba(14,165,233,0.8)_20%,transparent_40%)] dark:bg-[linear-gradient(to_bottom,rgba(14,165,233,0.7)_0%,rgba(14,165,233,0.5)_20%,transparent_40%)]",
        lime: "bg-[linear-gradient(to_bottom,rgb(132,204,22)_0%,rgba(132,204,22,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(132,204,22,0.7)_0%,rgba(132,204,22,0.5)_20%,transparent_45%)]",
        fuchsia: "bg-[linear-gradient(to_bottom,rgb(255,0,204)_0%,rgba(255,0,204,0.8)_20%,transparent_45%)] dark:bg-[linear-gradient(to_bottom,rgba(255,0,204,0.7)_0%,rgba(255,0,204,0.5)_20%,transparent_45%)]"
    };

    // Map Pages to Theme Keys
    const getPageThemeKey = (page: PageName): string => {
        switch (page) {
            case PageName.Dashboard: return 'blue'; // Dashboard -> Blue (Nexus Standard)
            case PageName.GrimorioRecipes: return 'violet'; // Recipes -> Purple
            case PageName.GrimorioStock: return 'blue'; // Stock -> Blue
            case PageName.GrimorioMarket: return 'emerald'; // Market -> Emerald (Matched to screenshot)
            case PageName.Pizarron: return 'ice'; // Pizarron -> Ice
            case PageName.CerebritySynthesis: return 'fuchsia'; // Synthesis -> Fuchsia/Pink
            case PageName.CerebrityCritic: return 'cyan'; // Critic -> Cyan
            case PageName.CerebrityLab: return 'colegium'; // Lab -> Violet
            case PageName.CerebrityTrend: return 'yellow'; // Trend -> Yellow
            case PageName.CerebrityMakeMenu: return 'lime'; // Menu -> Lime
            case PageName.AvatarCore: return 'indigo'; // Avatar -> Indigo
            case PageName.AvatarIntelligence: return 'rose'; // Intelligence -> Rose
            case PageName.AvatarCompetition: return 'emerald'; // Competition -> Emerald
            case PageName.AvatarCompetition: return 'emerald'; // Competition -> Emerald
            case PageName.Colegium: return 'colegium'; // Colegium -> Colegium
            case PageName.Personal: return 'slate'; // Personal -> Slate
            case PageName.Login: return 'indigo'; // Login -> Indigo
            default: return 'indigo';
        }
    };

    const currentPage = getCurrentPage();
    // Use the class mapping instead of pageTheme object
    // FIX: Re-enable global gradient for Grimorio pages with updated fade
    const gradientClass = gradients[getPageThemeKey(currentPage)] || gradients['indigo'];

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

    // Compact Mode Logic: Scale down but compensate width to fill screen
    const contentStyle = compactMode ? {
        transform: 'scale(0.95)',
        transformOrigin: 'top center',
        width: '105.26%', // 100 / 0.95
        height: '105.26%'
    } : {};

    return (
        <div className="h-[100dvh] w-full overflow-hidden flex items-center justify-center font-sans selection:bg-indigo-500/30 transition-colors duration-500 bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">

            {/* Phone Frame */}
            <div className="w-full h-full max-w-md relative overflow-hidden flex flex-col phone-frame transition-all duration-500 bg-[#F8F9FA] dark:bg-slate-900">

                {/* Atmospheric Gradient Layer - Remove opacity-90 to ensure true colors */}
                <div
                    className={`absolute top-0 left-0 w-full h-full z-0 pointer-events-none transition-all duration-700 ease-in-out ${gradientClass}`}
                />



                {/* 2. Main Content Area with Custom Scrollbar */}
                {/* FIX: Grimorio Pages (Recipes, Stock, Market) handle their own scrolling internally to support Fixed Headers. */}
                {/* Therefore, we switched from 'overflow-y-auto' to 'overflow-hidden' for these specific pages within the shell. */}
                {/* DOUBLE FIX: Added 'min-h-0' to prevent flex item from growing beyond parent, which was causing the component to expand fully and break internal scroll. */}
                <div className={`flex-1 min-h-0 relative z-10 flex flex-col items-center pt-[env(safe-area-inset-top)] ${(currentPage === PageName.GrimorioRecipes || currentPage === PageName.GrimorioStock || currentPage === PageName.GrimorioMarket || currentPage === PageName.AvatarCore || currentPage === PageName.AvatarIntelligence || currentPage === PageName.AvatarCompetition)
                        ? 'overflow-hidden'
                        : 'overflow-y-auto custom-scroll'
                    } overflow-x-hidden`}>
                    <div
                        className={`w-full h-full flex flex-col ${currentPage === PageName.Login ? '' : 'pb-32'}`}
                        style={contentStyle}
                    >
                        {/* Wrapper for routes needs to be flex-1 to verify h-full inside routes works? 
                            Actually if we use h-full on this div, we are good.
                            Changed flex-1 to h-full flex flex-col to be explicit about filling the parent.
                        */}
                        <div className="flex-1 min-h-0 w-full">
                            <MobileRoutes user={user!} notify={notify} onNavigate={handleNavigate} />
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Navigation - New Floating Style */}
                {currentPage !== PageName.Login && (
                    <FloatingBottomNav currentPage={currentPage} onNavigate={handleNavigate} />
                )}

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#F8F9FA] dark:from-[#1e293b] via-[#F8F9FA]/80 dark:via-[#1e293b]/80 to-transparent pointer-events-none z-40"></div>

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

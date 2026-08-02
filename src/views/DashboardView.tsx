import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useUI } from '../context/UIContext';
import { useDashboardMetrics } from '../features/dashboard/useDashboardMetrics';

// New Components
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { DashboardHeader } from '../features/dashboard/components/DashboardHeader';
import { ContextSnapshot } from '../features/dashboard/components/ContextSnapshot';
import { TodayBoard } from '../features/dashboard/components/TodayBoard';
import { ActionCenter } from '../features/dashboard/components/ActionCenter';
import { MomentumChart } from '../features/dashboard/components/MomentumChart';
import { IntelligenceWidget } from '../features/dashboard/components/IntelligenceWidget';
import { GlobalSuggestionsWidget } from '../components/common/GlobalSuggestionsWidget';
import { AvatarIntelligencePanel } from '../features/dashboard/components/AvatarIntelligencePanel';
import { QuickActions } from '../features/dashboard/components/QuickActions';
import { DeepOps } from '../features/dashboard/components/DeepOps';
import { BusinessPulse } from '../features/dashboard/components/BusinessPulse';

// Legacy hooks
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { usePizarronData } from '../hooks/usePizarronData';
import { usePurchaseIngredient } from '../hooks/usePurchaseIngredient';
import { calculateLevelInfo } from '../services/progression/xpService';





const DashboardView: React.FC = () => {
    const { userProfile, auth } = useApp();
    const { compactMode } = useUI();
    const navigate = useNavigate();

    // Data Hooks
    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();
    const { tasks: allPizarronTasks } = usePizarronData();
    const { purchaseHistory } = usePurchaseIngredient();

    // Safe user access
    const safeUser = auth?.currentUser;

    // Real XP / level from the user's profile (progression system)
    const totalXP = Number(userProfile?.experience) || 0;
    const levelInfo = calculateLevelInfo(totalXP);

    // --- 1. Metrics & Data Processing ---

    // --- Metrics Hook ---
    const {
        kpis,
        deepOps,
        business,
        creativeTrendData,
        todayMetrics: { ideas, inProgress, urgent },
        nba: { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA },
        creativeWeek: { summary, insights, recommendation, stats }
    } = useDashboardMetrics({
        allRecipes,
        allPizarronTasks,
        allIngredients,
        purchaseHistory,
        userProfile
    });



    // DEBUG: NBA


    // --- Components ---



    return (
        <>
            <DashboardLayout
                header={
                    <DashboardHeader
                        xp={levelInfo.currentXP}
                        level={levelInfo.level}
                        nextLevelXp={levelInfo.nextLevelXP}
                    />
                }
                leftColumn={
                    <>
                        <ContextSnapshot stats={kpis} />
                        <BusinessPulse metrics={business} />
                        <TodayBoard
                            ideas={ideas}
                            inProgress={inProgress}
                            urgent={urgent}
                        />
                    </>
                }
                centerColumn={
                    <>
                        <ActionCenter
                            nbaData={nbaData}
                            loading={isNBALoading}
                            onRefresh={refreshNBA}
                        />
                        <MomentumChart data={creativeTrendData} />
                    </>
                }
                rightColumn={
                    <div className="space-y-6">
                        {/* #19 · Grimorio suggestions, executable without leaving the Dashboard */}
                        <GlobalSuggestionsWidget limit={2} />
                        <AvatarIntelligencePanel />
                        <QuickActions />
                        <IntelligenceWidget insights={insights} />
                    </div>
                }
            />
            <div className="mt-10">
                <div className="flex items-center gap-3 mb-5 px-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Operación Profunda</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                </div>
                <DeepOps metrics={deepOps} />
            </div>
        </>
    );
};

export default DashboardView;

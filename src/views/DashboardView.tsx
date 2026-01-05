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
import { AvatarIntelligencePanel } from '../features/dashboard/components/AvatarIntelligencePanel';
import { QuickActions } from '../features/dashboard/components/QuickActions';
import { DeepOps } from '../features/dashboard/components/DeepOps';

// Legacy hooks
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { usePizarronData } from '../hooks/usePizarronData';





const DashboardView: React.FC = () => {
    const { userProfile, auth } = useApp();
    const { compactMode } = useUI();
    const navigate = useNavigate();

    // Data Hooks
    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();
    const { tasks: allPizarronTasks } = usePizarronData();

    // Safe user access
    const safeUser = auth?.currentUser;

    // --- 1. Metrics & Data Processing ---

    // --- Metrics Hook ---
    const {
        kpis,
        creativeTrendData,
        balanceData,
        todayMetrics: { ideas, inProgress, urgent },
        nba: { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA },
        creativeWeek: { summary, insights, recommendation, stats }
    } = useDashboardMetrics({
        allRecipes,
        allPizarronTasks,
        allIngredients,
        userProfile
    });



    // DEBUG: NBA


    // --- Components ---



    return (
        <>
            <DashboardLayout
                header={
                    <DashboardHeader
                        xp={300} // Placeholder until XP system is global
                        level={7}
                        nextLevelXp={1000}
                    />
                }
                leftColumn={
                    <>
                        <ContextSnapshot stats={kpis} />
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
                        <AvatarIntelligencePanel />
                        <QuickActions />
                        <IntelligenceWidget insights={insights} />
                    </div>
                }
            />
            <div className="mt-8">
                <DeepOps />
            </div>
        </>
    );
};

export default DashboardView;

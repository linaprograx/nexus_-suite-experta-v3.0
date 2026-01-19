import React from 'react';
import { PageName, UserProfile } from '../types';
import { useApp } from '../../../context/AppContext';
import { useDashboardMetrics } from '../../../features/dashboard/useDashboardMetrics';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { usePizarronData } from '../../../hooks/usePizarronData';

// Official Desktop Components
import { DashboardHeader } from '../../../features/dashboard/components/DashboardHeader';
import { ContextSnapshot } from '../../../features/dashboard/components/ContextSnapshot';
import { ActionCenter } from '../../../features/dashboard/components/ActionCenter';
import { TodayBoard } from '../../../features/dashboard/components/TodayBoard';
import { AvatarIntelligencePanel } from '../../../features/dashboard/components/AvatarIntelligencePanel';
import { QuickActions } from '../../../features/dashboard/components/QuickActions';
import { DeepOps } from '../../../features/dashboard/components/DeepOps';
import { MomentumChart } from '../../../features/dashboard/components/MomentumChart';
import { IntelligenceWidget } from '../../../features/dashboard/components/IntelligenceWidget';

interface DashboardProps {
    onNavigate: (page: PageName) => void;
    user: UserProfile;
    notify?: (message: string, type?: 'success' | 'error' | 'loading') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
    // 1. Data Hooks
    const { userProfile: globalUserProfile } = useApp();

    // XP / Level Mock (Should be in a hook but keeping it simple for parity reflow)
    const xp = 300;
    const level = 7;
    const nextLevelXp = 1000;

    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();
    const { tasks: allPizarronTasks } = usePizarronData();

    // 2. Intelligence Hook
    const {
        kpis,
        creativeTrendData,
        todayMetrics: { ideas, inProgress, urgent },
        nba: { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA },
        creativeWeek: { insights }
    } = useDashboardMetrics({
        allRecipes,
        allPizarronTasks,
        allIngredients,
        userProfile: user
    });

    return (
        <div className="min-h-full bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500">
            {/* 
                Mobile Reflow Strategy: 
                Vertical Stack of Desktop Components with generous spacing.
                No custom mobile styles unless absolutely necessary for fit.
            */}
            <div className="flex flex-col gap-6 px-5 pt-8 pb-32">

                {/* 1. Header (Identity & Greeting) */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <DashboardHeader
                        xp={xp}
                        level={level}
                        nextLevelXp={nextLevelXp}
                    />
                </div>

                {/* 2. Context Snapshot (KPI Grid) */}
                <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                    <ContextSnapshot stats={kpis} />
                </div>

                {/* 3. Action Center (Hero AI Card) */}
                <div className="animate-in fade-in zoom-in-95 duration-700 delay-200">
                    <ActionCenter
                        nbaData={nbaData}
                        loading={isNBALoading}
                        onRefresh={refreshNBA}
                    />
                </div>

                {/* 4. Creative Momentum (Chart) */}
                <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <MomentumChart data={creativeTrendData} />
                </div>

                {/* 5. Today Board (Pizarron Preview) */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <TodayBoard
                        ideas={ideas}
                        inProgress={inProgress}
                        urgent={urgent}
                    />
                </div>

                {/* 6. Intelligence & Actions Stack */}
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                    <AvatarIntelligencePanel />
                    <QuickActions />
                    <IntelligenceWidget insights={insights} />
                </div>

                {/* 7. Deep Ops (Footer Actions) */}
                <div className="mt-4 opacity-80 animate-in fade-in duration-1000 delay-500">
                    <DeepOps />
                </div>

                {/* Footer Brand */}
                <div className="flex justify-center mt-4 pb-4 opacity-30">
                    <span className="text-[9px] font-serif text-slate-400 tracking-widest">NEXUS SUITE v3.0 // MOBILE REFLOW</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

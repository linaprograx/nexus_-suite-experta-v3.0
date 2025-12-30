import { useMemo } from 'react';
import { Recipe, PizarronTask, Ingredient, UserProfile } from '../../types';
import { useToday } from '../today';
import { useCreativeWeekPro } from '../creative-week-pro';
import { useNextBestAction } from '../next-best-action';

interface DashboardMetricsProps {
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
    allIngredients: Ingredient[];
    userProfile?: Partial<UserProfile>;
}

export const useDashboardMetrics = ({
    allRecipes,
    allPizarronTasks,
    allIngredients,
    userProfile
}: DashboardMetricsProps) => {

    // 1. Basic KPIs
    const kpis = useMemo(() => {
        const totalRecipes = allRecipes.length;
        const totalTasks = allPizarronTasks.length;
        const tiempoAhorrado = (totalRecipes * 0.5) + (totalTasks * 0.25);
        const creativeRate = 85; // Placeholder
        return { totalRecipes, totalTasks, tiempoAhorrado, creativeRate };
    }, [allRecipes, allPizarronTasks]);

    // 2. Trend Data
    const creativeTrendData = useMemo(() => {
        const activityByDate: { [key: string]: { recipes: number, tasks: number } } = {};

        allPizarronTasks.forEach(item => {
            if (item.createdAt?.toDate) {
                const date = item.createdAt.toDate().toISOString().split('T')[0];
                if (!activityByDate[date]) {
                    activityByDate[date] = { recipes: 0, tasks: 0 };
                }
                activityByDate[date].tasks++;
            }
        });

        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (!activityByDate[dateStr]) {
                activityByDate[dateStr] = { recipes: 0, tasks: 0 };
            }
        }

        return Object.entries(activityByDate)
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7);
    }, [allPizarronTasks]);

    // 3. Balance Data (Placeholder for now)
    const balanceData = [
        { subject: 'Dulce', A: 8, fullMark: 10 },
        { subject: 'Cítrico', A: 9, fullMark: 10 },
        { subject: 'Amargo', A: 6, fullMark: 10 },
        { subject: 'Alcohol', A: 7, fullMark: 10 },
        { subject: 'Herbal', A: 5, fullMark: 10 },
        { subject: 'Especiado', A: 4, fullMark: 10 },
    ];

    // 4. Integrated Features
    const { ideas, inProgress, urgent } = useToday(allPizarronTasks, userProfile);

    const { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA } = useNextBestAction(
        allRecipes,
        allPizarronTasks,
        userProfile?.displayName || 'Usuario'
    );

    const { summary, insights, recommendation, stats } = useCreativeWeekPro(
        allPizarronTasks,
        userProfile?.displayName || 'Usuario'
    );

    return {
        kpis,
        creativeTrendData,
        balanceData,
        todayMetrics: { ideas, inProgress, urgent },
        nba: { data: nbaData, isLoading: isNBALoading, refresh: refreshNBA },
        creativeWeek: { summary, insights, recommendation, stats }
    };
};

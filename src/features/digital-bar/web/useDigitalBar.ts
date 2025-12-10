import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '../../../context/AppContext';
import { DigitalBarService, BarSnapshot } from './DigitalBarService';

export const useDigitalBar = () => {
    const { db, userId } = useApp();
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    const metricsQuery = useQuery({
        queryKey: ['digital-bar-metrics', userId, period],
        queryFn: () => DigitalBarService.fetchDailyMetrics(db, userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5 // 5 min
    });

    const insights = useMemo(() => {
        if (!metricsQuery.data) return null;
        return DigitalBarService.getDailyInsights(metricsQuery.data);
    }, [metricsQuery.data]);

    const activeData = metricsQuery.data || [];

    return {
        metrics: activeData,
        insights,
        period,
        setPeriod,
        isLoading: metricsQuery.isLoading,
        error: metricsQuery.error
    };
};

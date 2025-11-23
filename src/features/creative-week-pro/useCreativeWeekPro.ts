import { useState, useEffect } from 'react';
import { getCreativeWeekInsights, CreativeWeekData } from './creativeWeekProService';
import { PizarronTask } from '../../../types';

export const useCreativeWeekPro = (tasks: PizarronTask[], userName: string) => {
  const [data, setData] = useState<CreativeWeekData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!tasks || tasks.length === 0) return;

      setLoading(true);
      setError(null);
      try {
        const insights = await getCreativeWeekInsights(tasks, userName);
        setData(insights);
      } catch (err) {
        setError('Error al cargar los insights de la semana creativa.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [tasks, userName]);

  return {
    summary: data?.summary || '',
    insights: data?.insights || [],
    recommendation: data?.recommendation,
    stats: data?.stats,
    loading,
    error,
    // Provide explicit fallback values for safety in UI
    impact: data?.recommendation?.impact || 'bajo',
    difficulty: data?.recommendation?.difficulty || 'baja',
  };
};

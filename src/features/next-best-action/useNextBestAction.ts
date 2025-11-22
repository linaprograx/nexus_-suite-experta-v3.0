import { useState, useEffect } from 'react';
import { useCreativeWeek } from '../creative-week';
import { getNextBestAction, NextBestActionData } from './nextBestActionService';
import { Recipe, PizarronTask } from '../../../types';

const CACHE_KEY = 'nexus_nba_data';
const CACHE_TIMESTAMP = 'nexus_nba_timestamp';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas

export function useNextBestAction(recipes: Recipe[], tasks: PizarronTask[], userName: string) {
  const { summary } = useCreativeWeek(tasks);
  const [data, setData] = useState<NextBestActionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNBA = async (force = false) => {
    setIsLoading(true);

    try {
      // 1. Revisar caché
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP);

      if (!force && cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          setData(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      }

      // 2. Si no hay caché o expiró, llamar a Gemini
      const newData = await getNextBestAction(
        recipes,
        tasks,
        summary,
        userName || 'Usuario'
      );

      // 3. Guardar en caché
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
      localStorage.setItem(CACHE_TIMESTAMP, Date.now().toString());

      setData(newData);
    } catch (error) {
      console.error('Error fetching Next Best Action:', error);
      setData({
        action: "Revisar tus tareas del día",
        reason: "No pudimos conectar con el asistente. Usando reglas internas.",
        impact: "medium",
        time: 10
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNBA();
  }, [recipes.length, tasks.length]); // Recargar si cambian datos clave

  return {
    data,
    isLoading,
    refresh: () => fetchNBA(true)
  };
}

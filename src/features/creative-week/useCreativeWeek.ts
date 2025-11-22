import { useMemo } from 'react';
import { PizarronTask } from '../../../types';
import { computeCreativeWeek, CreativeWeekResult } from './creativeWeekService';

/**
 * Hook que encapsula la lógica de "Semana Creativa".
 * Recibe todas las tareas, y retorna la estructura de datos para el gráfico y resumen.
 */
export function useCreativeWeek(tasks: PizarronTask[]): CreativeWeekResult {
  return useMemo(() => {
    return computeCreativeWeek(tasks);
  }, [tasks]);
}

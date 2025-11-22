import { PizarronTask } from '../../../types';

export interface CreativeDayData {
  dateLabel: string;
  isoDate: string;
  tasksCount: number;
}

export interface CreativeWeekSummary {
  totalWeekTasks: number;
  avgPerDay: number;
  bestDay?: CreativeDayData;
  worstDay?: CreativeDayData;
}

export interface CreativeWeekResult {
  days: CreativeDayData[];
  summary: CreativeWeekSummary;
}

/**
 * Dado un array de tareas del Pizarrón, genera la actividad de los últimos 7 días.
 */
export function computeCreativeWeek(tasks: PizarronTask[]): CreativeWeekResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generar mapa de los últimos 7 días (de más antiguo a más reciente)
  const days: CreativeDayData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const isoDate = d.toISOString().split('T')[0];
    const dateLabel = d.toLocaleDateString('es-ES', { weekday: 'short' }); // lun, mar, etc.

    days.push({
      dateLabel,
      isoDate,
      tasksCount: 0,
    });
  }

  const byIso: Record<string, CreativeDayData> = {};
  for (const d of days) {
    byIso[d.isoDate] = d;
  }

  // Contar tareas por día según createdAt
  for (const t of tasks) {
    if (!t.createdAt || !t.createdAt.toDate) continue;
    const d = t.createdAt.toDate() as Date;
    d.setHours(0, 0, 0, 0);
    const iso = d.toISOString().split('T')[0];
    if (byIso[iso]) {
      byIso[iso].tasksCount += 1;
    }
  }

  // Calcular resumen
  let totalWeekTasks = 0;
  let bestDay: CreativeDayData | undefined;
  let worstDay: CreativeDayData | undefined;

  for (const d of days) {
    totalWeekTasks += d.tasksCount;
    if (!bestDay || d.tasksCount > bestDay.tasksCount) bestDay = d;
    if (!worstDay || d.tasksCount < worstDay.tasksCount) worstDay = d;
  }

  const avgPerDay = days.length ? totalWeekTasks / days.length : 0;

  return {
    days,
    summary: {
      totalWeekTasks,
      avgPerDay,
      bestDay,
      worstDay,
    },
  };
}

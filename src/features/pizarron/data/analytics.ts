import { PizarronTask } from '../../../../types';

export interface BoardAnalytics {
  totalTasks: number;
  tasksByStatus: { name: string; value: number }[];
  tasksByCategory: { name: string; value: number }[];
  tasksByPriority: { name: string; value: number }[];
  topColumns: { name: string; count: number }[];
  creativeBalance: number; // 0 to 100
  tasksPerDay: { date: string; count: number }[]; // Last 7 days maybe?
}

export const getBoardAnalytics = (
  tasks: PizarronTask[],
  columns: string[]
): BoardAnalytics => {
  const totalTasks = tasks.length;

  // By Status
  const tasksByStatus = columns.map(col => {
    // Normalize logic matching PizarronView logic if needed, but here exact match is safer
    // The previous logic had fallbacks: (col === 'Ideas' && t.status === 'ideas') etc.
    const count = tasks.filter(t => 
        t.status === col || 
        (col === 'Ideas' && t.status === 'ideas') || 
        (col === 'Pruebas' && t.status === 'pruebas') || 
        (col === 'Aprobado' && t.status === 'aprobado')
    ).length;
    return { name: col, value: count };
  });

  // By Category
  const categoryMap: Record<string, number> = {};
  tasks.forEach(t => {
    const cat = t.category || 'Sin Categoría';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const tasksByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // By Priority
  const priorityMap: Record<string, number> = {};
  tasks.forEach(t => {
    const p = t.priority || 'media';
    priorityMap[p] = (priorityMap[p] || 0) + 1;
  });
  const tasksByPriority = Object.entries(priorityMap).map(([name, value]) => ({ name, value }));

  // Top Columns
  const topColumns = [...tasksByStatus]
    .sort((a, b) => b.value - a.value)
    .map(item => ({ name: item.name, count: item.value }));

  // Creative Balance
  // Assuming 'Ideas' column represents creative tasks, others represent operational.
  // Or maybe based on category? Instructions said: "ideas/(ideas+tareas operativas)"
  // Let's use status 'Ideas' (case insensitive) count vs total count.
  const ideasCount = tasksByStatus.find(s => s.name.toLowerCase().includes('idea'))?.value || 0;
  const operationalCount = totalTasks - ideasCount;
  const creativeBalance = totalTasks > 0 ? Math.round((ideasCount / totalTasks) * 100) : 0;

  // Tasks Per Day (based on createdAt) - mocked or real if createdAt is available
  // PizarronTask has createdAt which is usually a Firestore timestamp or Date.
  // We'll group by date string YYYY-MM-DD
  const tasksPerDayMap: Record<string, number> = {};
  tasks.forEach(t => {
      let dateStr = 'Unknown';
      if (t.createdAt) {
          // Handle Firestore Timestamp or Date object
          const date = (t.createdAt as any).toDate ? (t.createdAt as any).toDate() : new Date(t.createdAt);
          dateStr = date.toISOString().split('T')[0];
      }
      tasksPerDayMap[dateStr] = (tasksPerDayMap[dateStr] || 0) + 1;
  });
  // Sort by date and maybe take last 7 entries
  const tasksPerDay = Object.entries(tasksPerDayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));


  return {
    totalTasks,
    tasksByStatus,
    tasksByCategory,
    tasksByPriority,
    topColumns,
    creativeBalance,
    tasksPerDay
  };
};

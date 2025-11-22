import { PizarronTask } from '../../../types';

export const getIdeas = (tasks: PizarronTask[]): PizarronTask[] => {
  return tasks.filter(t => t.status === 'ideas' || t.category === 'Ideas');
};

export const getInProgress = (tasks: PizarronTask[]): PizarronTask[] => {
  return tasks.filter(t => t.status === 'pruebas' || t.category === 'Desarrollo');
};

export const getUrgent = (tasks: PizarronTask[]): PizarronTask[] => {
  return tasks.filter(t => t.category === 'Urgente');
};

export const computeProgress = (task: PizarronTask): number => {
  // If task has explicit progress property (not in current PizarronTask interface but good for future proofing or if extended)
  // leveraging category based estimation as requested
  
  if (task.category === 'Ideas') return 20;
  if (task.category === 'Desarrollo') return 60;
  if (task.category === 'Urgente') return 95;
  if (task.status === 'pruebas') return 60;
  if (task.status === 'aprobado') return 100;
  
  return 0;
};

export interface FormattedTask {
  id: string;
  title: string;
  category: string;
  progress: number;
  author: string;
  createdAt: any;
}

export const formatTaskForUI = (task: PizarronTask): FormattedTask => {
  return {
    id: task.id,
    title: task.texto,
    category: task.category,
    progress: computeProgress(task),
    author: task.authorName || 'Desconocido',
    createdAt: task.createdAt,
  };
};

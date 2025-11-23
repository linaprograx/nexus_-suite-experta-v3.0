import { PizarronTask } from '../../types';

export const safeNormalizeTask = (task: any): PizarronTask => {
  return {
    ...task,
    id: task.id,
    texto: task.texto || task.title || 'Sin título',
    description: task.description || '',
    status: task.status || 'ideas',
    priority: task.priority || 'media',
    category: task.category || 'General',
    createdAt: task.createdAt || Date.now(),
    updatedAt: task.updatedAt || Date.now(),
    attachments: task.attachments || [],
    history: task.history || [],
    boardId: task.boardId || 'general',
    labels: task.labels || [],
    tags: task.tags || [],
    upvotes: task.upvotes || [],
    starRating: task.starRating || {},
    assignees: task.assignees || [],
    dueDate: task.dueDate || null
  };
};

import { PizarronTask, UserProfile } from '../../../types';
import * as todayService from './todayService';

export const useToday = (allTasks: PizarronTask[], userProfile?: Partial<UserProfile>) => {
  
  const ideasRaw = todayService.getIdeas(allTasks);
  const inProgressRaw = todayService.getInProgress(allTasks);
  const urgentRaw = todayService.getUrgent(allTasks);

  const ideas = ideasRaw.map(todayService.formatTaskForUI);
  const inProgress = inProgressRaw.map(todayService.formatTaskForUI);
  const urgent = urgentRaw.map(todayService.formatTaskForUI);

  return {
    ideas,
    inProgress,
    urgent
  };
};

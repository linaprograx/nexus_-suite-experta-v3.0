import React from 'react';
import { Firestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { PizarronActivity } from '../../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface TaskActivityProps {
  taskId: string;
  db: Firestore;
  appId: string;
}

export const TaskActivity: React.FC<TaskActivityProps> = ({ taskId, db, appId }) => {
  const [activities, setActivities] = React.useState<PizarronActivity[]>([]);

  const activityPath = `artifacts/${appId}/public/data/pizarron-tasks/${taskId}/activity`;

  React.useEffect(() => {
    const q = query(collection(db, activityPath), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setActivities(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PizarronActivity)));
    });
    return () => unsubscribe();
  }, [db, activityPath]);

  const getActivityIcon = (type: string) => {
    switch (type) {
        case 'creation': return ICONS.plusCircle;
        case 'status_change': return ICONS.refresh;
        case 'edit': return ICONS.edit;
        case 'priority_change': return ICONS.trendingUp;
        case 'comment': return ICONS.chat;
        case 'mention': return ICONS.user;
        default: return ICONS.list;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
        case 'creation': return 'text-green-500 bg-green-100 dark:bg-green-900/50';
        case 'status_change': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/50';
        case 'edit': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/50';
        case 'priority_change': return 'text-red-500 bg-red-100 dark:bg-red-900/50';
        case 'comment': return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50';
        case 'mention': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/50';
        default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
    }
  };

  if (activities.length === 0) return null;

  return (
    <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase text-slate-500 dark:text-slate-400">Actividad Reciente</h3>
        <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
            {activities.map(activity => (
                <div key={activity.id} className="relative pl-6">
                    <span className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center border border-white dark:border-slate-900 ${getActivityColor(activity.type)}`}>
                        <Icon svg={getActivityIcon(activity.type)} className="w-3 h-3" />
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {activity.userName} <span className="font-normal text-slate-500 dark:text-slate-400">{activity.details}</span>
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">
                            {activity.timestamp?.toDate().toLocaleString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

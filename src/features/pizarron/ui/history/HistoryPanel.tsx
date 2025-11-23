import React, { useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { TaskHistoryItem } from '../../../../../types';
import { listenTaskHistory } from '../../services/historyService';
import { Spinner } from '../../../../components/ui/Spinner';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

interface HistoryPanelProps {
  taskId: string;
  db: Firestore;
  appId: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  taskId, 
  db, 
  appId 
}) => {
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenTaskHistory(db, appId, taskId, (data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId, taskId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'created': return ICONS.plus;
      case 'moved': return ICONS.layout; // or specific icon for move
      case 'updated': return ICONS.edit;
      case 'completed': return ICONS.check;
      case 'priority_changed': return ICONS.star;
      case 'category_changed': return ICONS.tag;
      case 'attachment_added': return ICONS.paperclip;
      case 'comment_added': return ICONS.chat;
      default: return ICONS.activity;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-4 max-h-[60vh] custom-scrollbar">
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm italic">
          No hay historial de actividades.
        </div>
      ) : (
        <div className="border-l border-slate-300 dark:border-slate-700 ml-4 pl-4 space-y-6">
          {history.map(item => (
            <div key={item.id} className="relative">
              <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                 {/* Dot */}
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.authorName}</span>
                    <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                 </div>
                 <div className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Icon svg={getIconForType(item.type)} className="w-4 h-4 mt-0.5 text-slate-400" />
                    <span>{item.description}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

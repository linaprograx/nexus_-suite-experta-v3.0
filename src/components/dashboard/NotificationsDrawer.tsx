import React from 'react';
import { Firestore, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { AppNotification } from '../../../types';
import { Button } from '../ui/Button';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  db: Firestore;
  userId: string;
  appId: string;
  onTaskClick: (taskId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose, notifications, db, userId, appId, onTaskClick }) => {

  const handleMarkAsRead = async (id: string) => {
    const notifPath = `artifacts/${appId}/users/${userId}/notifications/${id}`;
    await updateDoc(doc(db, notifPath), { read: true });
  };

  const handleClearAll = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (n.id) {
        const notifPath = `artifacts/${appId}/users/${userId}/notifications/${n.id}`;
        batch.update(doc(db, notifPath), { read: true });
      }
    });
    await batch.commit();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-card p-4 z-50 flex flex-col border-l border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>Marcar todas como leídas</Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes notificaciones nuevas.</p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 rounded-md cursor-pointer ${!n.read ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-secondary'}`}
                onClick={() => {
                  if (!n.read && n.id) handleMarkAsRead(n.id);
                  onTaskClick(n.taskId);
                  onClose();
                }}
              >
                <p className="text-sm">{n.text}</p>
                <p className="text-xs text-muted-foreground truncate">{n.taskText}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

import React from 'react';
import { Firestore, collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { Auth } from 'firebase/auth'; // Keep signature
import { FirebaseStorage } from 'firebase/storage'; // Keep signature
import { PremiumLayout } from '../components/layout/PremiumLayout';
import { PizarronRoot } from '../features/pizarron2/ui/PizarronRoot';
import { PizarronBoard, UserProfile } from '../types';

interface PizarronViewProps {
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  taskToOpen: string | null;
  onTaskOpened: () => void;
  draggingRecipe: any | null;
  draggingTask: string | null;
  onDropEnd: () => void;
  onDragTaskStart: (taskId: string) => void;
  onAnalyze: (text: string) => void;
  userProfile: Partial<UserProfile>;
}

export default function PizarronView(props: PizarronViewProps) {
  const { db, userId, appId } = props;
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);

  // Minimal Board Loading to bootstrap the Engine
  React.useEffect(() => {
    const boardsColPath = `artifacts/${appId}/public/data/pizarron-boards`;
    const unsub = onSnapshot(collection(db, boardsColPath), async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PizarronBoard));
      if (data.length === 0) {
        // Create default if none
        const defaultId = 'general';
        await setDoc(doc(db, boardsColPath, defaultId), {
          name: 'General',
          columns: ['Ideas', 'Pruebas', 'Aprobado'],
          createdAt: Date.now()
        });
        setActiveBoardId(defaultId);
        return;
      }
      // logic to keep current or default to first
      if (!activeBoardId) {
        setActiveBoardId(data[0].id);
      }
    });
    return () => unsub();
  }, [db, appId, activeBoardId]);

  // Force full screen layout without PremiumLayout constraints for now
  // to solve the "split screen" issue.
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-50 z-[100]">
      {/* PizarronRoot takes over */}
      {activeBoardId ? (
        <PizarronRoot
          appId={appId}
          boardId={activeBoardId}
          userId={userId}
          db={db}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400">
          Loading Pizarrón Engine...
        </div>
      )}
    </div>
  );
}

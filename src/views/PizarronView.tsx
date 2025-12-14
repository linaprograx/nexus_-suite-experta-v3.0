import React, { useEffect, useState, useRef } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { PizarronRoot } from '../features/pizarron2/ui/PizarronRoot';
import { UserProfile } from '../types';
import { useUI } from '../context/UIContext';

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

  // UX Pro: Instant Load. 
  // We skip the legacy board lookup and default to "general".
  // The internal PizarronRoot sync adapter handles the real data connection.
  const [activeBoardId] = useState<string>('general');

  const { toggleSidebar, isSidebarCollapsed } = useUI();
  const didCollapseRef = useRef(false);

  // Layout: Force Sidebar Collapse on Entry
  useEffect(() => {
    // Only collapse if it's currently open
    if (!isSidebarCollapsed) {
      toggleSidebar();
      didCollapseRef.current = true;
    }

    return () => {
      // Restore: If WE collapsed it, we should expand it back (toggle again).
      // Note: If user manually interacted in between, this might act weird, 
      // but without specific 'setSidebar(bool)', this is the standard pattern.
      if (didCollapseRef.current) {
        toggleSidebar();
      }
    };
  }, []); // Run once on mount

  return (
    // Layout Strategy "UX Pro":
    // 1. Sidebar (z-40) is fixed at left-0. When collapsed it is w-20.
    // 2. We position Pizarron fixed at left-0 (mobile) or left-20 (desktop).
    // 3. We use z-30 to ensure we are above page backgrounds but BELOW the Sidebar (so it remains visible).
    <div className="fixed inset-0 md:left-20 z-30 bg-slate-50 overflow-hidden">
      <PizarronRoot
        appId={appId}
        boardId={activeBoardId}
        userId={userId}
        db={db}
      />
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { PizarronRoot } from '../features/pizarron2/ui/PizarronRoot';
import { UserProfile, Recipe } from '../types';
import { useUI } from '../context/UIContext';
import { useNavigate } from 'react-router-dom';

interface PizarronViewProps {
  db: Firestore;
  userId: string;
  appId: string;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

export default function PizarronView(props: PizarronViewProps) {
  const { db, userId, appId } = props;
  const navigate = useNavigate();

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
    <div className="fixed inset-0 lg:left-20 z-30 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* The canvas covers the whole viewport on phones, so it needs its own way out.
          Bottom-left, not top-left: the top strip belongs to the canvas' own zoom and
          alignment controls, and the two were landing on top of each other. Sits just
          above the app's bottom nav, which is empty space on this screen. */}
      <button
        onClick={() => navigate('/')}
        aria-label="Salir del Pizarrón"
        className="lg:hidden fixed z-50 h-11 pl-3 pr-4 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
        style={{ bottom: 'calc(60px + env(safe-area-inset-bottom) + 0.75rem)', left: '0.75rem' }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        Salir
      </button>
      <PizarronRoot
        appId={appId}
        boardId={activeBoardId}
        userId={userId}
        db={db}
      />
    </div>
  );
}

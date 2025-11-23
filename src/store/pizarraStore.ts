import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PizarraState {
  focusMode: boolean;
  automationsEnabled: boolean;
  toggleFocusMode: () => void;
  toggleAutomationsEnabled: () => void;
  setFocusMode: (enabled: boolean) => void;
  setAutomationsEnabled: (enabled: boolean) => void;
}

export const usePizarraStore = create<PizarraState>()(
  persist(
    (set) => ({
      focusMode: false,
      automationsEnabled: false,
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      toggleAutomationsEnabled: () => set((state) => ({ automationsEnabled: !state.automationsEnabled })),
      setFocusMode: (enabled) => set({ focusMode: enabled }),
      setAutomationsEnabled: (enabled) => set({ automationsEnabled: enabled }),
    }),
    {
      name: 'nexus_pizarra_store', // unique name for localStorage
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';


// UX Labs Experiments

/**
 * Graduated:
 *  - Persona YT Creator: still under a 'true' flag, to disable it if needed
 *  - Text Tools: dinamically shown where applicable
 *  - Chat Mode: follow-ups; moved to Chat Advanced UI, itemized (Auto-title, Auto-diagram)
 */
interface UXLabsStore {

  labsEnhancedUI: boolean;
  setLabsEnhancedUI: (labsEnhancedUI: boolean) => void;

  labsMagicDraw: boolean;
  setLabsMagicDraw: (labsMagicDraw: boolean) => void;

  labsPersonaYTCreator: boolean;
  setLabsPersonaYTCreator: (labsPersonaYTCreator: boolean) => void;

  labsSplitBranching: boolean;
  setLabsSplitBranching: (labsSplitBranching: boolean) => void;

}

export const useUXLabsStore = create<UXLabsStore>()(
  persist(
    (set) => ({

      labsEnhancedUI: false,
      setLabsEnhancedUI: (labsEnhancedUI: boolean) => set({ labsEnhancedUI }),

      labsMagicDraw: false,
      setLabsMagicDraw: (labsMagicDraw: boolean) => set({ labsMagicDraw }),

      labsPersonaYTCreator: true, // NOTE: default to true, as it is a graduated experiment
      setLabsPersonaYTCreator: (labsPersonaYTCreator: boolean) => set({ labsPersonaYTCreator }),

      labsSplitBranching: false,
      setLabsSplitBranching: (labsSplitBranching: boolean) => set({ labsSplitBranching }),

    }),
    {
      name: 'app-ux-labs',
    },
  ),
);
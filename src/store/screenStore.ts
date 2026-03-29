/**
 * Navigation state — manages which screen is visible.
 * No URL routing; screens transition like a video game menu.
 */

import { create } from 'zustand';

export type Screen =
  | 'home'
  | 'teamBuilder'
  | 'quickPlaySelect'
  | 'game'
  | 'result'
  | 'franchiseHub'
  | 'playoffBracket'
  | 'packDraft'
  | 'seasonAwards'
  | 'settings';

interface ScreenState {
  currentScreen: Screen;
  previousScreen: Screen | null;
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

export const useScreenStore = create<ScreenState>((set, get) => ({
  currentScreen: 'home',
  previousScreen: null,

  navigate: (screen) =>
    set({ currentScreen: screen, previousScreen: get().currentScreen }),

  goBack: () => {
    const prev = get().previousScreen;
    if (prev) {
      set({ currentScreen: prev, previousScreen: null });
    }
  },
}));

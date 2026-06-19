import { create } from 'zustand';
import type { SectionKey } from '../types';

type UiState = {
  sidebarOpen: boolean;
  activeSection: SectionKey;
  searchQuery: string;
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;
  setSidebarOpen: (open: boolean) => void;
  setActiveSection: (section: SectionKey) => void;
  setSearchQuery: (query: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setCommandPaletteQuery: (query: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  activeSection: 'dashboard',
  searchQuery: '',
  commandPaletteOpen: false,
  commandPaletteQuery: '',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setCommandPaletteQuery: (commandPaletteQuery) => set({ commandPaletteQuery }),
}));

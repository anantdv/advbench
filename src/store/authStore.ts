import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  username: string;
  displayName: string;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'advbench-auth',
    },
  ),
);

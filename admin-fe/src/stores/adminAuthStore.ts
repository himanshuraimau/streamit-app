import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin.types';

interface AdminAuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionInitialized: boolean;
  setUser: (user: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      sessionInitialized: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          sessionInitialized: true,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSessionInitialized: (initialized) => set({ sessionInitialized: initialized }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionInitialized: true,
        }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

import { useCallback } from 'react';
import { adminClient } from '@/lib/api/client';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import type { AdminUser } from '@/types/admin.types';
import { toast } from 'sonner';

interface SignInData {
  email: string;
  password: string;
}

interface SessionResponse {
  user: AdminUser;
}

// Global flag to prevent multiple simultaneous session checks
let isCheckingSession = false;
let sessionCheckCount = 0;

export function useAdminAuth() {
  const initSession = useCallback(async () => {
    sessionCheckCount++;
    console.log(`[Auth] initSession called (count: ${sessionCheckCount})`);
    
    // Prevent multiple simultaneous session checks
    if (isCheckingSession) {
      console.log('[Auth] Already checking session, skipping');
      return;
    }

    try {
      isCheckingSession = true;
      console.log('[Auth] Starting session check');
      useAdminAuthStore.setState({ isLoading: true });
      const response = await adminClient.get<SessionResponse>('/api/admin/auth/session');
      console.log('[Auth] Session check successful');
      useAdminAuthStore.getState().setUser(response.data.user);
    } catch (error) {
      console.log('[Auth] Session check failed (no session)');
      // Session doesn't exist or is invalid
      useAdminAuthStore.getState().setUser(null);
    } finally {
      useAdminAuthStore.setState({ isLoading: false });
      isCheckingSession = false;
      console.log('[Auth] Session check complete');
    }
  }, []); // No dependencies - use store directly

  const signIn = useCallback(
    async (data: SignInData) => {
      try {
        useAdminAuthStore.setState({ isLoading: true });
        const response = await adminClient.post<SessionResponse>('/api/admin/auth/sign-in', data);
        useAdminAuthStore.getState().setUser(response.data.user);
        toast.success('Signed in successfully');
        return true;
      } catch (error) {
        toast.error('Invalid credentials');
        return false;
      } finally {
        useAdminAuthStore.setState({ isLoading: false });
      }
    },
    [] // No dependencies - use store directly
  );

  const signOut = useCallback(async () => {
    try {
      await adminClient.post('/api/admin/auth/sign-out');
      useAdminAuthStore.getState().logout();
      toast.success('Signed out successfully');
    } catch (error) {
      // Still logout locally even if API call fails
      useAdminAuthStore.getState().logout();
    }
  }, []); // No dependencies - use store directly

  return {
    initSession,
    signIn,
    signOut,
  };
}

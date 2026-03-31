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

export function useAdminAuth() {
  const { setUser, setLoading, logout } = useAdminAuthStore();

  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminClient.get<SessionResponse>('/api/admin/auth/session');
      setUser(response.data.user);
    } catch (error) {
      // Session doesn't exist or is invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const signIn = useCallback(
    async (data: SignInData) => {
      try {
        setLoading(true);
        const response = await adminClient.post<SessionResponse>('/api/admin/auth/sign-in', data);
        setUser(response.data.user);
        toast.success('Signed in successfully');
        return true;
      } catch (error) {
        toast.error('Invalid credentials');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const signOut = useCallback(async () => {
    try {
      await adminClient.post('/api/admin/auth/sign-out');
      logout();
      toast.success('Signed out successfully');
    } catch (error) {
      // Still logout locally even if API call fails
      logout();
    }
  }, [logout]);

  return {
    initSession,
    signIn,
    signOut,
  };
}

import { useSession as useBetterAuthSession } from '@/lib/auth-client';
import type { User } from '@/types/auth';

// Custom hook that properly types the session with username
export function useAuthSession() {
  const session = useBetterAuthSession();
  
  return {
    ...session,
    data: session.data ? {
      ...session.data,
      user: session.data.user as User,
    } : null,
  };
}
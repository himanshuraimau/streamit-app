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

// Helper function to get username from session
export function getUsernameFromSession(user: any): string {
  // First try to get the username field
  if (user?.username) {
    return user.username;
  }
  
  // Fallback to email prefix if username is not available
  if (user?.email) {
    return user.email.split('@')[0];
  }
  
  // Final fallback
  return 'user';
}
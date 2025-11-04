import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;
  age: number | null;
  phone: string | null;
  createdAt: string;
}

/**
 * Hook to fetch the current authenticated user's complete profile
 * This includes avatar URL, bio, and other fields not in the session
 * Now uses Bearer token authentication for Safari compatibility
 */
export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiFetch('/api/viewer/me');

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}

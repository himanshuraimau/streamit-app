import { useQuery } from '@tanstack/react-query';

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
 */
export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/viewer/me`, {
        credentials: 'include',
      });

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

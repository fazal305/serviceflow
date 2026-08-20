import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER';

export interface AppUser {
  id: string;
  clerkUserId: string;
  role: UserRole;
  email: string;
  fullName: string | null;
  phone: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export function useMe() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['me'],
    enabled: isSignedIn,
    queryFn: async (): Promise<AppUser> => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Failed to load current user (${res.status})`);
      return res.json();
    },
  });
}

export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: { fullName: string | null; phone: string | null; address: string | null }) =>
      api<AppUser>('/me', { method: 'PATCH', body: JSON.stringify(profile) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

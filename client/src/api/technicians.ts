import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface Technician {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  serviceCategoryId: string | null;
  serviceCategoryName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTechnicianInput {
  email: string;
  firstName: string;
  lastName: string;
  serviceCategoryId: string | null;
}

export function useTechnicians() {
  const api = useApi();
  return useQuery({
    queryKey: ['technicians'],
    queryFn: () => api<Technician[]>('/technicians'),
  });
}

export function useCreateTechnician() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTechnicianInput) =>
      api<{ technician: Technician; tempPassword: string }>('/technicians', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

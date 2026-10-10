import { useQuery } from '@tanstack/react-query';
import type { ClientHomeResponse, PracticeDto } from '@psydog/shared';
import { api } from './api';

export function useClientHome() {
  return useQuery({
    queryKey: ['client', 'home'],
    queryFn: () => api<ClientHomeResponse>('/client/home'),
  });
}

export function usePractice(id: string) {
  return useQuery({
    queryKey: ['practice', id],
    queryFn: () => api<PracticeDto>(`/practices/${id}`),
  });
}

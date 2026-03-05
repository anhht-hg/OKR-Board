import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/types';

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
  });
}

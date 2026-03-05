import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OkrItem } from '@/types';

export function useObjectives() {
  return useQuery<OkrItem[]>({
    queryKey: ['objectives'],
    queryFn: () => fetch('/api/objectives').then((r) => r.json()),
  });
}

export function useItem(id: string) {
  return useQuery<OkrItem>({
    queryKey: ['item', id],
    queryFn: () => fetch(`/api/items/${id}`).then((r) => r.json()),
    enabled: !!id,
  });
}

export function useItems(params?: {
  type?: string;
  project?: string;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.project) query.set('project', params.project);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  return useQuery<OkrItem[]>({
    queryKey: ['items', params],
    queryFn: () => fetch(`/api/items?${query}`).then((r) => r.json()),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OkrItem> }) =>
      fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OkrItem>) =>
      fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/items/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
